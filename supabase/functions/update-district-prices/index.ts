// ============================================================================
// update-district-prices — Supabase Edge Function (Deno)
// ============================================================================
// تُستدعى أسبوعياً عبر pg_cron + pg_net (انظر نهاية supabase/schema.sql)، أو
// يدوياً من لوحة Supabase أثناء الاختبار. تجلب متوسط سعر المتر لكل حي عندنا
// (جدول districts) من صفحة الحي المخصصة على منصة رغدان (raghdan.sa)، وتحدّث
// جدول district_prices — الذي يقرأ منه الموقع مباشرة بدل الأرقام الثابتة
// اللي كانت مكتوبة يدوياً بالكود (DISTRICT_PRICES بملف index.html سابقاً).
//
// ⚠️ ملاحظة مهمة (لازم تختبرها بنفسك وترجع لي بالنتيجة):
// منطق استخراج السعر من صفحة رغدان مبني على النص اللي شفته فعلياً بصفحات
// عيّنة (حي العزيزية بالمدينة المنورة، حي الشاطئ بجدة، حي العزيزية بمكة) —
// ما قدرت أتحقق من الـ HTML الخام لكل الـ 255 حي عندنا لأن أدواتي ممنوعة من
// الوصول لـ raghdan.sa مباشرة (نفس القيد المذكور بملخص التسليم). الدالة
// مكتوبة لتكون "متسامحة": أي حي يفشل استخراج سعره يُسجَّل بالـ logs ويُتجاوز
// (يبقى سعره القديم بدون تغيير) بدل ما تتوقف الدالة كلها. بعد أول تشغيل،
// افتح Logs بلوحة Supabase وابعتلي كم حي نجح وكم فشل، عشان نظبط الأنماط
// الناقصة سوا لو احتجنا.
//
// نشر الدالة:
//   supabase functions deploy update-district-prices
//   (تستخدم نفس secrets الموجودة أصلاً لـ send-reminders: SUPABASE_URL و
//    SUPABASE_SERVICE_ROLE_KEY — ما تحتاج أي مفتاح إضافي)
//
// اختبار يدوي فوري (بدل انتظار الأحد المجدول):
//   من لوحة Supabase → Edge Functions → update-district-prices → Invoke
//   أو: curl -X POST https://<project-ref>.supabase.co/functions/v1/update-district-prices \
//         -H "Authorization: Bearer <service_role_key>"
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// خريطة اسم المدينة عندنا → الاسم (slug) المستخدم فعلياً بروابط رغدان.
// تحقّقنا يدوياً من الأربعة: المدينة المنورة تحديداً تحتاج بادئة "مدينة"
// (على الأغلب لتفادي تعارض بمسارات رغدان الداخلية)، البقية بالاسم مباشرة.
const RAGHDAN_CITY_SLUG: Record<string, string> = {
  "المدينة المنورة": "مدينة المدينة المنورة",
  "مكة المكرمة": "مكة المكرمة",
  "جدة": "جدة",
  "الرياض": "الرياض",
};

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** يحوّل الأرقام العربية-الهندية (١٢٣) لأرقام لاتينية عادية (123) — رغدان
 *  يعرض الأرقام أحياناً بالصيغتين حسب الصفحة. */
function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)));
}

/** يشيل وسوم HTML ويرجّع نص عادي، عشان الأنماط النصية تشتغل بغض النظر عن
 *  بنية الوسوم بالضبط (نفس الفكرة اللي أدواتي استخدمتها وقت الفحص اليدوي). */
function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface ParsedPrice {
  price: number;
  count: number | null;
}

/** يجرّب أكثر من نمط نصي بالترتيب (الأكثر ثقة أولاً) — أي نمط يطابق يكفي.
 *  الأنماط مبنية على نصوص شفتها فعلياً بصفحات حقيقية من رغدان. */
function parsePriceAndCount(rawHtml: string): ParsedPrice | null {
  const text = normalizeDigits(stripTags(rawHtml));
  const num = "[\\d]{1,3}(?:[,٬][\\d]{3})*|[\\d]+"; // 8,601 أو 8601

  // النمط 1: "سعر المتر في X بمدينة Y | 8,601 ريال/م² | 1,033 صفقة"
  let m = text.match(new RegExp(`سعر المتر في[^|]*?\\|\\s*(${num})\\s*ريال\\s*/?\\s*م²\\s*\\|\\s*(${num})\\s*صفقة`));
  if (m) {
    const price = parseInt(m[1].replace(/[,٬]/g, ""), 10);
    const count = parseInt(m[2].replace(/[,٬]/g, ""), 10);
    if (Number.isFinite(price) && price > 0) return { price, count: Number.isFinite(count) ? count : null };
  }

  // النمط 2: "وسيط سعر المتر المربع السكني ... 7,101 / م²" (الصياغة الفعلية
  // على رغدان — تحقّقنا منها يدوياً بحي الياسمين بالرياض). "وسيط" هو
  // المصطلح الفعلي (يعني: القيمة الوسطى)، مو "متوسط" كما افترضنا أول مرة؛
  // نقبل الاثنين احتياطاً، ونسمح بكلمة بينية زي "السكني"/"التجاري".
  m = text.match(new RegExp(`(?:متوسط|وسيط)\\s+سعر\\s+المتر\\s+المربع[\\s\\S]{0,15}?(${num})\\s*/?\\s*م²`));
  if (m) {
    const price = parseInt(m[1].replace(/[,٬]/g, ""), 10);
    if (Number.isFinite(price) && price > 0) {
      const countMatch = text.match(new RegExp(`(${num})\\s*صفقة`));
      const count = countMatch ? parseInt(countMatch[1].replace(/[,٬]/g, ""), 10) : null;
      return { price, count: Number.isFinite(count as number) ? (count as number) : null };
    }
  }

  return null;
}

async function fetchDistrictPrice(citySlug: string, districtName: string) {
  const url = `https://raghdan.sa/ar/market/${encodeURIComponent(citySlug)}/${encodeURIComponent(districtName)}/`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HimmatAlmadinahBot/1.0)" },
    });
    if (!res.ok) return { ok: false as const, reason: `HTTP ${res.status}`, url };
    const html = await res.text();
    const parsed = parsePriceAndCount(html);
    if (!parsed) return { ok: false as const, reason: "لم يُعثر على نمط السعر بالصفحة", url };
    return { ok: true as const, ...parsed, url };
  } catch (e) {
    return { ok: false as const, reason: String(e), url };
  }
}

/** تشغيل الطلبات على دفعات متوازية محدودة — 255 حي متسلسل قد يتجاوز حد وقت
 *  تنفيذ الدالة، فنشغّل عدة طلبات بنفس اللحظة بدل واحد تلو الآخر. */
async function runBatched<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map(fn))));
  }
  return results;
}

Deno.serve(async () => {
  const startedAt = Date.now();
  const summary = {
    updated: 0,
    failed: 0,
    failures: [] as { city: string; district: string; reason: string }[],
  };

  const { data: districts, error } = await supabase
    .from("districts")
    .select("id, name, cities(name)");

  if (error) {
    console.error("[update-district-prices] تعذّر جلب قائمة الأحياء:", error.message);
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  interface DistrictTarget {
    id: string;
    name: string;
    cityName: string;
  }

  const targets: DistrictTarget[] = (districts ?? [])
    .map((d: any) => ({ id: d.id, name: d.name, cityName: d.cities?.name }))
    .filter((d: { cityName?: string }): d is DistrictTarget => !!d.cityName && !!RAGHDAN_CITY_SLUG[d.cityName]);

  console.log(`[update-district-prices] بدء التحديث لـ ${targets.length} حي...`);

  await runBatched(targets, 10, async (d: DistrictTarget) => {
    const slug = RAGHDAN_CITY_SLUG[d.cityName];
    const result = await fetchDistrictPrice(slug, d.name);

    if (!result.ok) {
      summary.failed++;
      summary.failures.push({ city: d.cityName!, district: d.name, reason: result.reason });
      console.warn(`[update-district-prices] فشل: ${d.cityName} / ${d.name} — ${result.reason}`);
      return;
    }

    const { error: upsertError } = await supabase.from("district_prices").upsert(
      {
        district_id: d.id,
        price_per_sqm: result.price,
        transaction_count: result.count,
        period_note: "وسيط آخر 12 شهراً (رغدان)",
        source: "raghdan.sa",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "district_id" }
    );

    if (upsertError) {
      summary.failed++;
      summary.failures.push({ city: d.cityName!, district: d.name, reason: `DB: ${upsertError.message}` });
      console.error(`[update-district-prices] فشل حفظ: ${d.cityName} / ${d.name} — ${upsertError.message}`);
    } else {
      summary.updated++;
    }
  });

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `[update-district-prices] انتهى خلال ${seconds}ث — نجح: ${summary.updated} — فشل: ${summary.failed} من أصل ${targets.length}`
  );

  return new Response(JSON.stringify({ status: "ok", seconds, total: targets.length, ...summary }), {
    headers: { "Content-Type": "application/json" },
  });
});
