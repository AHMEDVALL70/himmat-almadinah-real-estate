// ============================================================================
// send-reminders — Supabase Edge Function (Deno)
// ============================================================================
// يستبدل هذا الملف فكرة "خادم Python يعمل بشكل دائم" من التصميم المبدئي.
// يُستدعى يومياً عبر pg_cron + pg_net (انظر نهاية supabase/schema.sql)، أو
// يدوياً من لوحة Supabase أثناء الاختبار.
//
// المفتاح الآمن (service_role) يُقرأ من متغيرات البيئة الخاصة بمنصة Supabase
// نفسها — لا يمر أبداً عبر كود الموقع الأمامي (index.html) ولا يظهر للزوار.
//
// نشر الدالة (البنية الصحيحة كما تتوقعها أداة Supabase CLI):
//   supabase/functions/send-reminders/index.ts
//
//   supabase functions deploy send-reminders
//   supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
//
// لتفعيل البريد الفعلي (Resend — https://resend.com، باقة مجانية تكفي للبداية):
//   1. أنشئ حساباً مجانياً على resend.com
//   2. وثّق نطاقك البريدي (أو استخدم onboarding@resend.dev مؤقتاً للاختبار بدون توثيق)
//   3. supabase secrets set RESEND_API_KEY=re_xxxxxxxx
//   4. (اختياري) supabase secrets set NOTIFICATIONS_FROM_EMAIL=notify@yourdomain.com
// بدون هذا المفتاح، الدالة تسجّل الرسالة بالسجلات فقط (Logs) ولا ترسل شيئاً —
// لا تتعطّل ولا تُنشئ خطأ، فقط لا يصل بريد فعلي حتى تضيف المفتاح.
//
// واتساب: يحتاج حساب Meta Business موثّق + رقم واتساب أعمال + قالب رسالة
// معتمد مسبقاً من Meta (رسائل تلقائية خارج نافذة المحادثة الحية لا تُقبل كنص
// حر). الكود جاهز وموجود أسفل بصيغة معلَّقة — فعّله بمجرد ما يوصلك API Meta.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY"); // اختياري — بدونه يسجّل بس
const FROM_EMAIL = Deno.env.get("NOTIFICATIONS_FROM_EMAIL") || "onboarding@resend.dev";
// const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
// const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

type ReminderType = "reminder_15d" | "reminder_3d" | "eviction_60d";

interface NotificationContext {
  contract_number?: string;
  tenant_name?: string;
  due_date?: string;
  end_date?: string;
  amount?: number;
}

function money(n?: number) {
  return n ? Math.round(n).toLocaleString("en-US") : "—";
}

/**
 * يبني عنوان ونص رسالة البريد بالعربي حسب نوع التنبيه — نفس نبرة الموقع
 * (واضحة ومباشرة، بدون مبالغة).
 */
function buildEmailContent(type: ReminderType, ctx: NotificationContext) {
  const name = ctx.tenant_name || "عميلنا الكريم";
  const contractLine = ctx.contract_number ? `رقم العقد: ${ctx.contract_number}<br>` : "";

  const templates: Record<ReminderType, { subject: string; html: string }> = {
    reminder_15d: {
      subject: "تذكير: دفعة مستحقة خلال 15 يوماً — همة المدينة العقارية",
      html: `
        <div style="font-family:Tahoma,Arial,sans-serif;line-height:1.8;color:#152435">
          <p>مرحباً ${name}،</p>
          <p>هذا تذكير ودّي بأن لديك دفعة إيجار مستحقة خلال <b>15 يوماً</b> من اليوم.</p>
          ${contractLine}
          تاريخ الاستحقاق: <b>${ctx.due_date || "—"}</b><br>
          المبلغ: <b>${money(ctx.amount)} ر.س</b>
          <p>نرجو تجهيز المبلغ قبل الموعد لتفادي أي تأخير. لأي استفسار، تواصل معنا مباشرة.</p>
          <p style="color:#546678;font-size:13px;margin-top:24px">همة المدينة العقارية — رخصة فال: 1200030428</p>
        </div>`,
    },
    reminder_3d: {
      subject: "تنبيه عاجل: دفعة مستحقة خلال 3 أيام — همة المدينة العقارية",
      html: `
        <div style="font-family:Tahoma,Arial,sans-serif;line-height:1.8;color:#152435">
          <p>مرحباً ${name}،</p>
          <p>تنبيه بأن دفعة الإيجار مستحقة خلال <b>3 أيام فقط</b>.</p>
          ${contractLine}
          تاريخ الاستحقاق: <b>${ctx.due_date || "—"}</b><br>
          المبلغ: <b>${money(ctx.amount)} ر.س</b>
          <p>نرجو سرعة السداد لتفادي أي رسوم أو إجراءات تأخير. لأي استفسار، تواصل معنا مباشرة.</p>
          <p style="color:#546678;font-size:13px;margin-top:24px">همة المدينة العقارية — رخصة فال: 1200030428</p>
        </div>`,
    },
    eviction_60d: {
      subject: "إشعار: اقتراب انتهاء مدة العقد — همة المدينة العقارية",
      html: `
        <div style="font-family:Tahoma,Arial,sans-serif;line-height:1.8;color:#152435">
          <p>مرحباً ${name}،</p>
          <p>نود إعلامك بأن مدة عقد الإيجار الخاص بك ستنتهي خلال <b>60 يوماً</b>.</p>
          ${contractLine}
          تاريخ انتهاء العقد: <b>${ctx.end_date || "—"}</b>
          <p>إذا كنت ترغب بالتجديد، يرجى التواصل معنا مبكراً لترتيب الإجراءات. إذا لم نتلقَّ رداً، سنعتبر العقد منتهياً بتاريخه المحدد.</p>
          <p style="color:#546678;font-size:13px;margin-top:24px">همة المدينة العقارية — رخصة فال: 1200030428</p>
        </div>`,
    },
  };

  return templates[type];
}

/**
 * نقطة الوصل الفعلية لإرسال الرسالة. البريد يُرسل فعلياً عبر Resend لو
 * RESEND_API_KEY مضبوط؛ غير ذلك تُسجَّل الرسالة بالسجلات فقط بدون إرسال.
 */
async function sendNotification(params: {
  email: string | null;
  phone: string | null;
  type: ReminderType;
  context: NotificationContext;
}) {
  const { subject, html } = buildEmailContent(params.type, params.context);

  if (!params.email) {
    console.log("[reminder] لا يوجد بريد إلكتروني لهذا الطرف —", params.type, params.context);
  } else if (!RESEND_API_KEY) {
    console.log("[email skipped — RESEND_API_KEY غير مضبوط بعد]", params.email, subject);
  } else {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `همة المدينة العقارية <${FROM_EMAIL}>`,
          to: [params.email],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        console.error("فشل إرسال البريد عبر Resend:", res.status, await res.text());
      } else {
        console.log("[email sent]", params.email, subject);
      }
    } catch (e) {
      console.error("خطأ أثناء إرسال البريد:", e);
    }
  }

  // ============================================================================
  // واتساب — معلَّق حتى يتوفر حساب Meta Business + رقم أعمال + قالب معتمد.
  // فعّله بحذف التعليق بعد ضبط WHATSAPP_TOKEN و WHATSAPP_PHONE_NUMBER_ID كـ secrets،
  // واستبدال اسم القالب "reminder_template" باسم القالب المعتمد فعلياً من Meta.
  // ============================================================================
  // if (params.phone && WHATSAPP_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
  //   await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
  //     method: "POST",
  //     headers: {
  //       Authorization: `Bearer ${WHATSAPP_TOKEN}`,
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       messaging_product: "whatsapp",
  //       to: params.phone,
  //       type: "template",
  //       template: { name: "reminder_template", language: { code: "ar" } },
  //     }),
  //   });
  // }
}

async function handlePaymentReminders() {
  const targets: { days: number; type: ReminderType }[] = [
    { days: 15, type: "reminder_15d" },
    { days: 3, type: "reminder_3d" },
  ];

  for (const target of targets) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + target.days);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    const { data: installments, error } = await supabase
      .from("contract_installments")
      .select("id, contract_id, due_date, total_installment, contracts(contract_number, lessee_id, parties!contracts_lessee_id_fkey(full_name, phone, email))")
      .eq("due_date", dueDateStr)
      .eq("payment_status", "PENDING");

    if (error) {
      console.error("خطأ في جلب الدفعات:", error.message);
      continue;
    }

    for (const inst of installments ?? []) {
      // تحقق أولاً هل أُرسل هذا التنبيه من قبل لنفس الدفعة (يمنع التكرار)
      const { data: existing } = await supabase
        .from("notification_log")
        .select("id")
        .eq("installment_id", inst.id)
        .eq("notification_type", target.type)
        .maybeSingle();

      if (existing) continue;

      const party = (inst as any).contracts?.parties;
      await sendNotification({
        email: party?.email ?? null,
        phone: party?.phone ?? null,
        type: target.type,
        context: {
          contract_number: (inst as any).contracts?.contract_number,
          tenant_name: party?.full_name,
          due_date: inst.due_date,
          amount: inst.total_installment,
        },
      });

      await supabase.from("notification_log").insert({
        installment_id: inst.id,
        contract_id: inst.contract_id,
        notification_type: target.type,
      });
    }
  }
}

async function handleEvictionNotices() {
  const target = new Date();
  target.setDate(target.getDate() + 60);
  const targetStr = target.toISOString().slice(0, 10);

  const { data: contracts, error } = await supabase
    .from("contracts")
    .select("id, contract_number, end_date, lessee_id, parties!contracts_lessee_id_fkey(full_name, phone, email)")
    .eq("end_date", targetStr)
    .eq("status", "ACTIVE");

  if (error) {
    console.error("خطأ في جلب العقود المنتهية قريباً:", error.message);
    return;
  }

  for (const contract of contracts ?? []) {
    const { data: existing } = await supabase
      .from("notification_log")
      .select("id")
      .eq("contract_id", contract.id)
      .eq("notification_type", "eviction_60d")
      .maybeSingle();

    if (existing) continue;

    const party = (contract as any).parties;
    await sendNotification({
      email: party?.email ?? null,
      phone: party?.phone ?? null,
      type: "eviction_60d",
      context: {
        contract_number: contract.contract_number,
        tenant_name: party?.full_name,
        end_date: contract.end_date,
      },
    });

    await supabase.from("notification_log").insert({
      contract_id: contract.id,
      notification_type: "eviction_60d",
    });
  }
}

Deno.serve(async (req) => {
  try {
    await Promise.all([handlePaymentReminders(), handleEvictionNotices()]);
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ status: "error", message: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
