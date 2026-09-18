#!/usr/bin/env node
/**
 * scripts/generate-snapshot.js
 * ============================================================================
 * يجيب بيانات حقيقية من Supabase (مفتاح anon العام، للقراءة فقط — نفس المفتاح
 * المستخدم أصلاً بكود الموقع العام، صفر صلاحية كتابة أو تعديل)، ويبني محتوى
 * HTML نصي حقيقي، ثم يحقنه داخل index.html بين علامتي SNAPSHOT_START/END.
 *
 * يشتغل تلقائياً عبر GitHub Action (.github/workflows/generate-snapshot.yml)
 * — لا يحتاج أي سرّ إضافي، ولا صلاحية كتابة على قاعدة البيانات، فقط قراءة
 * علنية لبيانات معروضة أصلاً للجميع بالموقع نفسه.
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://wlebcvwsleoieodjtrcf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_KhUpsOF0OxVQWyWLakXx2g_yDsUlnxV";

async function supaSelect(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    console.error(`فشل جلب ${table}:`, res.status, await res.text().catch(() => ""));
    return [];
  }
  return res.json();
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// النصوص (خصوصاً وصف العروض) أحياناً فيها رموز تنسيق Markdown (**عريض**)
// كانت مقصودة لمكان عرض آخر — هنا محتوى نصي خام بس، فنشيلها قبل الحقن
// عشان ما تظهر نجمتين حرفياً بالنص للزواحف الآلية.
function stripMarkdown(s) {
  return String(s ?? "").replace(/\*\*/g, "").replace(/[*_`#]/g, "");
}

function money(n) {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString("ar-SA") : "-";
}

async function buildSnapshotHtml() {
  const [properties, offers, cities] = await Promise.all([
    supaSelect("properties", "select=property_type,city,district,price,area_sqm&status=eq.approved&order=created_at.desc&limit=40"),
    supaSelect("offers", "select=title,description,price_final,price_original,city,district&is_published=eq.true&order=created_at.desc&limit=30"),
    supaSelect("cities", "select=name,price_per_sqm"),
  ]);

  const citiesRows = cities
    .map((c) => `<li>${escapeHtml(c.name)}: ${c.price_per_sqm ? money(c.price_per_sqm) + " ريال سعودي للمتر المربع (متوسط السوق، مصدره منصة رغدان العقارية، محدَّث أسبوعياً)" : "بيانات قيد التحديث"}</li>`)
    .join("\n");

  const propertiesRows = properties
    .map((p) => `<li>${escapeHtml(p.property_type)} في حي ${escapeHtml(p.district)}، ${escapeHtml(p.city)} — المساحة ${escapeHtml(p.area_sqm)} متر مربع، السعر ${money(p.price)} ريال سعودي.</li>`)
    .join("\n");

  const offersRows = offers
    .map((o) => `<li><b>${escapeHtml(o.title)}</b>: ${escapeHtml(stripMarkdown(o.description || ""))} — ${escapeHtml(o.city)}، حي ${escapeHtml(o.district)}، السعر ${money(o.price_final || o.price_original)} ريال سعودي.</li>`)
    .join("\n");

  return `
<h1>همة المدينة العقارية</h1>
<p>منصة عقارية مرخّصة من الهيئة العامة للعقار (رخصة فال: 1200030428) تقدم خدمات بيع وشراء وتأجير العقارات، مع مؤشر أسعار محدَّث أسبوعياً لأحياء عدة مدن سعودية، وخدمة كتابة عقود سكنية وتجارية.</p>

<h2>متوسط سعر المتر المربع حسب المدينة</h2>
<ul>
${citiesRows || "<li>البيانات قيد التحديث.</li>"}
</ul>

<h2>عقارات معتمدة مسجَّلة فعلياً بالمنصة (${properties.length})</h2>
<ul>
${propertiesRows || "<li>لا توجد عقارات معتمدة بعد.</li>"}
</ul>

<h2>عروض عقارية منشورة (${offers.length})</h2>
<ul>
${offersRows || "<li>لا توجد عروض منشورة حالياً.</li>"}
</ul>

<h2>خدمات المنصة</h2>
<ul>
<li>مؤشر أسعار استرشادي فوري لتقدير سعر أي عقار.</li>
<li>توليد عقود سكنية وتجارية مع جدول دفعات تلقائي.</li>
<li>تسجيل عقار جديد للبيع أو الإيجار بدون تسجيل دخول، يظهر بعد مراجعة سريعة.</li>
<li>تواصل مباشر عبر واتساب أو نموذج استفسار بالموقع.</li>
</ul>
`.trim();
}

async function main() {
  const indexPath = path.join(__dirname, "..", "index.html");
  let html = fs.readFileSync(indexPath, "utf8");

  const snapshot = await buildSnapshotHtml();
  const startMarker = "<!-- SNAPSHOT_START -->";
  const endMarker = "<!-- SNAPSHOT_END -->";
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.error("تعذّر إيجاد علامتي SNAPSHOT_START/END بملف index.html — لم يتم تعديل أي شيء.");
    process.exit(1);
  }

  const before = html.slice(0, startIdx + startMarker.length);
  const after = html.slice(endIdx);
  html = `${before}\n${snapshot}\n${after}`;

  fs.writeFileSync(indexPath, html, "utf8");
  console.log("تم تحديث اللقطة الجاهزة بنجاح داخل index.html");
}

main().catch((err) => {
  console.error("فشل توليد اللقطة الجاهزة:", err);
  process.exit(1);
});
