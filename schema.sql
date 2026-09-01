-- ============================================================================
-- همة المدينة العقارية — Supabase Schema (PostgreSQL)
-- ============================================================================
-- يحل هذا الملف الثغرات المحددة في مراجعة الموقع السابقة:
--   1) استبدال localStorage بقاعدة بيانات فعلية تُشارك بين كل الزوار
--   2) صلاحيات وصول صارمة (RLS) بدل وصول مفتوح للجميع
--   3) جدول أطراف موحّد بدل نص حر (lessor_name / lessee_name)
--   4) سجل إشعارات يمنع تكرار التنبيه لنفس الدفعة
--   5) توليد الدفعات ومزامنة الإجمالي داخل قاعدة البيانات نفسها (Trigger)
--      بدل الاعتماد على كود خارجي (Python) قد يخرج عن التزامن
--   6) دالة RPC آمنة (SECURITY DEFINER) تسمح للزائر بإنشاء عقد وجدول دفعاته
--      دفعة واحدة، دون الحاجة لكشف مفتاح service_role في المتصفح إطلاقاً
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 1) الأطراف (مؤجر / مستأجر) — بدل نص حر يمنع البحث والربط
-- ============================================================================
create table if not exists parties (
    id            uuid primary key default gen_random_uuid(),
    full_name     varchar(255) not null,
    national_id   varchar(20),
    phone         varchar(20),
    email         varchar(255),
    created_at    timestamptz not null default now()
);

-- ============================================================================
-- 2) العقارات المعروضة على الموقع (قسم "إضافة عقار" + "التحليلات")
--    كانت تُخزَّن محلياً بالمتصفح فقط؛ الآن تُخزَّن مركزياً ومرئية للجميع
-- ============================================================================
create table if not exists properties (
    id              uuid primary key default gen_random_uuid(),
    city            varchar(100) not null,
    district        varchar(100) not null,
    property_type   varchar(50)  not null,
    price           numeric(14,2) not null check (price >= 0),
    area_sqm        numeric(10,2) not null check (area_sqm > 0),
    rooms           int,
    age_years       int,
    facade          varchar(20),
    street_width    numeric(6,2),
    district_grade  varchar(20),
    ai_estimate     numeric(14,2),          -- ناتج التقدير الاسترشادي وقت الإدخال
    status          varchar(20) not null default 'pending'
                        check (status in ('pending','approved','rejected')),
    submitted_by_contact varchar(255),        -- رقم/بريد اختياري للتواصل مع المُدخِل
    created_at      timestamptz not null default now()
);

create index if not exists idx_properties_status on properties(status);
create index if not exists idx_properties_city_district on properties(city, district);

-- يمنع أي زائر من إدخال حالة "approved" مباشرة عبر الإدخال العام
create or replace function force_pending_on_insert()
returns trigger as $$
begin
    new.status := 'pending';
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_force_pending on properties;
create trigger trg_force_pending
    before insert on properties
    for each row execute function force_pending_on_insert();

-- ============================================================================
-- 3) العروض المميزة في الصفحة الرئيسية — يديرها الفريق فقط، القراءة عامة
-- ============================================================================
create table if not exists offers (
    id              uuid primary key default gen_random_uuid(),
    title           varchar(255) not null,
    city            varchar(100) not null,
    district        varchar(100) not null,
    property_type   varchar(50)  not null,
    area_sqm        numeric(10,2),
    rooms           int,
    price_original  numeric(14,2),
    discount_pct    int check (discount_pct between 0 and 100),
    price_final     numeric(14,2),
    description     text,
    map_url         text,
    is_published    boolean not null default true,
    created_at      timestamptz not null default now()
);

create index if not exists idx_offers_published on offers(is_published);

-- ============================================================================
-- 4) العقود
-- ============================================================================
create table if not exists contracts (
    id               uuid primary key default gen_random_uuid(),
    contract_number  varchar(100) unique not null,
    contract_type    varchar(50) not null,           -- تجاري / سكني
    lessor_id        uuid references parties(id),
    lessee_id        uuid references parties(id),
    property_id      uuid references properties(id),
    city             varchar(100),
    district         varchar(100),
    unit_type        varchar(50),
    area_sqm         numeric(10,2),
    security_deposit numeric(12,2) default 0,
    start_date       date not null,
    end_date         date not null,
    annual_rent      numeric(12,2) not null,
    total_amount     numeric(12,2) not null default 0,   -- تُحسب تلقائياً من الدفعات
    vat_amount       numeric(12,2) not null default 0,   -- تُحسب تلقائياً من الدفعات
    status           varchar(50) not null default 'ACTIVE'
                         check (status in ('ACTIVE','EXPIRED','CANCELLED')),
    created_at       timestamptz not null default now(),
    constraint chk_dates check (end_date > start_date)
);

create index if not exists idx_contracts_status on contracts(status);

-- ============================================================================
-- 5) دفعات العقد
-- ============================================================================
create table if not exists contract_installments (
    id                  uuid primary key default gen_random_uuid(),
    contract_id         uuid not null references contracts(id) on delete cascade,
    installment_number  int not null,
    due_date            date not null,
    base_amount         numeric(12,2) not null,
    vat_amount          numeric(12,2) not null,
    total_installment   numeric(12,2) not null,
    payment_status      varchar(20) not null default 'PENDING'
                             check (payment_status in ('PENDING','PAID','OVERDUE')),
    paid_at             timestamptz,
    created_at          timestamptz not null default now(),
    unique (contract_id, installment_number)
);

create index if not exists idx_installments_due_date on contract_installments(due_date);
create index if not exists idx_installments_contract on contract_installments(contract_id);

-- إجمالي العقد يُشتق دائماً من مجموع دفعاته الفعلي — يمنع تضارب البيانات
-- الذي كان ممكناً عندما كان total_amount يُدخل يدوياً من كود Python منفصل
create or replace function recalc_contract_total()
returns trigger as $$
declare
    target_contract uuid;
begin
    target_contract := coalesce(new.contract_id, old.contract_id);

    update contracts c
    set total_amount = coalesce(s.total, 0),
        vat_amount    = coalesce(s.vat, 0)
    from (
        select
            sum(total_installment) as total,
            sum(vat_amount) as vat
        from contract_installments
        where contract_id = target_contract
    ) s
    where c.id = target_contract;

    return null;
end;
$$ language plpgsql;

drop trigger if exists trg_recalc_total on contract_installments;
create trigger trg_recalc_total
    after insert or update or delete on contract_installments
    for each row execute function recalc_contract_total();

-- ============================================================================
-- 6) سجل الإشعارات — يمنع إرسال نفس التذكير أكثر من مرة لنفس الدفعة/العقد
-- ============================================================================
create table if not exists notification_log (
    id                  uuid primary key default gen_random_uuid(),
    installment_id      uuid references contract_installments(id) on delete cascade,
    contract_id         uuid references contracts(id) on delete cascade,
    notification_type   varchar(50) not null,  -- reminder_15d | reminder_3d | eviction_60d
    sent_at             timestamptz not null default now(),
    unique (installment_id, notification_type),
    unique (contract_id, notification_type)
);

-- ============================================================================
-- 7) توليد جدول الدفعات تلقائياً داخل قاعدة البيانات
--    بدل حسابها في كود خارجي (نقطة ضعف في التصميم الأصلي المقترح بـ Python)
-- ============================================================================
create or replace function generate_installments(
    p_contract_id   uuid,
    p_annual_rent   numeric,
    p_start_date    date,
    p_end_date      date,
    p_frequency     int default 1,        -- عدد الدفعات في السنة (1=سنوي, 2=نصف سنوي, 12=شهري)
    p_vat_rate      numeric default 0.15
) returns void as $$
declare
    months_total   int;
    installments_n int;
    period_months  int;
    base_per_inst  numeric(12,2);
    vat_per_inst   numeric(12,2);
    cur_date       date;
    i              int;
begin
    months_total   := (extract(year from age(p_end_date, p_start_date)) * 12
                        + extract(month from age(p_end_date, p_start_date)))::int;
    period_months  := greatest(1, 12 / greatest(p_frequency, 1));
    installments_n := greatest(1, ceil(months_total::numeric / period_months));

    base_per_inst := round(p_annual_rent / p_frequency, 2);
    vat_per_inst  := round(base_per_inst * p_vat_rate, 2);
    cur_date      := p_start_date;

    for i in 1..installments_n loop
        insert into contract_installments (
            contract_id, installment_number, due_date,
            base_amount, vat_amount, total_installment
        ) values (
            p_contract_id, i, cur_date,
            base_per_inst, vat_per_inst, base_per_inst + vat_per_inst
        );
        cur_date := cur_date + (period_months || ' months')::interval;
    end loop;
end;
$$ language plpgsql;

-- ============================================================================
-- 8) دالة RPC آمنة تُنشئ العقد + الأطراف + جدول الدفعات في عملية واحدة
--    الزائر ينادي هذه الدالة فقط عبر anon key — لا يحتاج ولا يرى أبداً أي
--    صلاحية كتابة مباشرة على جداول contracts / installments / parties
-- ============================================================================
create or replace function create_contract_with_schedule(
    p_contract_number  varchar,
    p_contract_type    varchar,
    p_lessor_name      varchar,
    p_lessor_id_number varchar,
    p_lessor_phone     varchar,
    p_lessee_name      varchar,
    p_lessee_id_number varchar,
    p_lessee_phone     varchar,
    p_city             varchar,
    p_district         varchar,
    p_unit_type        varchar,
    p_area_sqm         numeric,
    p_security_deposit numeric,
    p_start_date       date,
    p_end_date         date,
    p_annual_rent      numeric,
    p_frequency         int default 1
) returns uuid
security definer
set search_path = public
as $$
declare
    v_lessor_id  uuid;
    v_lessee_id  uuid;
    v_contract_id uuid;
begin
    insert into parties (full_name, national_id, phone)
        values (p_lessor_name, p_lessor_id_number, p_lessor_phone)
        returning id into v_lessor_id;

    insert into parties (full_name, national_id, phone)
        values (p_lessee_name, p_lessee_id_number, p_lessee_phone)
        returning id into v_lessee_id;

    insert into contracts (
        contract_number, contract_type, lessor_id, lessee_id,
        city, district, unit_type, area_sqm, security_deposit,
        start_date, end_date, annual_rent
    ) values (
        p_contract_number, p_contract_type, v_lessor_id, v_lessee_id,
        p_city, p_district, p_unit_type, p_area_sqm, coalesce(p_security_deposit,0),
        p_start_date, p_end_date, p_annual_rent
    ) returning id into v_contract_id;

    perform generate_installments(v_contract_id, p_annual_rent, p_start_date, p_end_date, p_frequency);

    return v_contract_id;
end;
$$ language plpgsql;

-- ============================================================================
-- 9) تفعيل RLS وسياسات الوصول
-- ============================================================================
alter table properties            enable row level security;
alter table offers                enable row level security;
alter table parties               enable row level security;
alter table contracts             enable row level security;
alter table contract_installments enable row level security;
alter table notification_log      enable row level security;

-- العروض: قراءة عامة للمنشور فقط، لا كتابة من الزوار إطلاقاً
create policy offers_public_read on offers
    for select using (is_published = true);

-- العقارات: قراءة عامة للمعتمد فقط + إدخال عام (يُجبر على pending بالـ trigger)
create policy properties_public_read on properties
    for select using (status = 'approved');
create policy properties_public_insert on properties
    for insert with check (true);

-- الأطراف / العقود / الدفعات / سجل الإشعارات: لا وصول مباشر للزوار أبداً.
-- كل الكتابة تمر حصراً عبر create_contract_with_schedule (SECURITY DEFINER).
-- أي قراءة إدارية تتم لاحقاً عبر service_role من لوحة تحكم داخلية، وليس
-- من كود الموقع العام — هذا يحل الثغرة الأمنية الأساسية في التصميم المبدئي.
-- (لا سياسات select/insert تُضاف هنا عمداً؛ RLS بدون سياسات = رفض كل شيء)

-- ============================================================================
-- 10) جدولة فحص التنبيهات يومياً عبر pg_cron (بديل خادم Python الدائم)
--     يستدعي Edge Function عبر pg_net، فتبقى منطق الإرسال في مكان واحد آمن
-- ============================================================================
-- ملاحظة: يتطلب تفعيل إضافتي pg_cron و pg_net من لوحة Supabase أولاً.
-- select cron.schedule(
--     'daily-payment-reminders',
--     '0 6 * * *',  -- 6 صباحاً بتوقيت السيرفر يومياً
--     $$
--     select net.http_post(
--         url := 'https://<project-ref>.supabase.co/functions/v1/send-reminders',
--         headers := jsonb_build_object('Authorization', 'Bearer <service_role_key>')
--     );
--     $$
-- );
