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
// نشر الدالة:
//   supabase functions deploy send-reminders
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_URL=...
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

type ReminderType = "reminder_15d" | "reminder_3d" | "eviction_60d";

/**
 * نقطة الوصل الفعلية لإرسال الرسالة. حالياً تسجّل الرسالة فقط (stub) لأن
 * الإرسال الفعلي يحتاج بيانات اعتماد خاصة بك:
 *   - WhatsApp Cloud API (Meta) لرسائل واتساب
 *   - أو مزود بريد مثل Resend / SendGrid للبريد الإلكتروني
 * أضف مفاتيحك كـ secrets وفعّل الاستدعاء الحقيقي هنا عندما تكون جاهزاً.
 */
async function sendNotification(params: {
  to: string | null;
  type: ReminderType;
  context: Record<string, unknown>;
}) {
  console.log("[reminder]", params.type, "->", params.to ?? "(لا يوجد رقم تواصل)", params.context);
  // مثال جاهز للتفعيل لاحقاً عبر WhatsApp Cloud API:
  //
  // await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${Deno.env.get("WHATSAPP_TOKEN")}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     messaging_product: "whatsapp",
  //     to: params.to,
  //     type: "text",
  //     text: { body: buildMessageText(params.type, params.context) },
  //   }),
  // });
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
      .select("id, contract_id, due_date, total_installment, contracts(contract_number, lessee_id, parties!contracts_lessee_id_fkey(full_name, phone))")
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

      await sendNotification({
        to: (inst as any).contracts?.parties?.phone ?? null,
        type: target.type,
        context: { installment_id: inst.id, due_date: inst.due_date, amount: inst.total_installment },
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
    .select("id, contract_number, end_date, lessee_id, parties!contracts_lessee_id_fkey(full_name, phone)")
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

    await sendNotification({
      to: (contract as any).parties?.phone ?? null,
      type: "eviction_60d",
      context: { contract_number: contract.contract_number, end_date: contract.end_date },
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
