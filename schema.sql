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
    has_elevator    boolean not null default false,
    has_maid_room   boolean not null default false,
    has_driver_room boolean not null default false,
    has_central_ac  boolean not null default false,
    is_furnished    boolean not null default false,
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
-- 3.1) تفاصيل موسّعة للعقارات والعروض — وصف حر + معلومات نظامية (رخصة عقارية،
--      رخصة إعلانية، بيانات المسوّق) لعرض صفحة تفاصيل كاملة لكل عقار/عرض.
--      ALTER TABLE ... ADD COLUMN IF NOT EXISTS آمن يتكرر ولا يمسح بيانات موجودة.
-- ============================================================================
alter table offers add column if not exists marketer_name varchar(255);
alter table offers add column if not exists marketer_phone varchar(20);
alter table offers add column if not exists real_estate_license varchar(50);
alter table offers add column if not exists ad_license varchar(50);

alter table properties add column if not exists description text;
alter table properties add column if not exists map_url text;
alter table properties add column if not exists real_estate_license varchar(50);
alter table properties add column if not exists ad_license varchar(50);
alter table offers add column if not exists image_url text;
alter table properties add column if not exists image_url text;

-- ============================================================================
-- 3.5) المدن والأحياء — مرجع مركزي يغذي كل قوائم المدينة/الحي في الموقع
--      (التقييم، إضافة عقار، العقود). قابل للتوسعة: أي زائر يقدر يضيف مدينة
--      أو حياً غير موجود من واجهة الموقع، فتُحفظ ويستفيد منها كل الزوار لاحقاً.
-- ============================================================================
create table if not exists cities (
    id             uuid primary key default gen_random_uuid(),
    name           varchar(100) unique not null,
    price_per_sqm  numeric(10,2),           -- متوسط استرشادي يستخدمه التقييم
    created_at     timestamptz not null default now()
);

create table if not exists districts (
    id         uuid primary key default gen_random_uuid(),
    city_id    uuid not null references cities(id) on delete cascade,
    name       varchar(100) not null,
    created_at timestamptz not null default now(),
    unique (city_id, name)
);

create index if not exists idx_districts_city on districts(city_id);

-- المدن الأساسية (لا تشمل الدمام بناءً على النطاق الحالي: المنطقة الغربية)
insert into cities (name, price_per_sqm) values
    ('المدينة المنورة', 4200),
    ('مكة المكرمة',     6100),
    ('جدة',             5800),
    ('الرياض',          6500)
on conflict (name) do nothing;

-- بذر الأحياء لكل مدينة
do $$
declare
    v_city_id uuid;
begin
    select id into v_city_id from cities where name = 'المدينة المنورة';
    insert into districts (city_id, name)
    select v_city_id, d from unnest(array[
        'العزيزية','العاقول','العريض','الخالدية','الزهرة','شظاة','الملك فهد','المبعوث',
        'الروابي','الربوة','الإسكان','الدويمة','قربان','العوالي','الهجرة','العصبة',
        'قباء','القصواء','الرانوناء','شوران','مهزور','مذينب','بني حارثة','بني معاوية',
        'بني ظفر','بني خدرة','بني بياضة','السيح','الفتح','القبلتين','الجامعة','أبو كبير',
        'الجرف','البركة','السلام','الدفاع','طيبة','أحد','سيد الشهداء','المصانع','العيون',
        'النصر','الراية','المناخة','المغيسلة','الوبرة','السكب','الخاتم','أبو بريقاء',
        'وادي البطان','الحرة الشرقية'
    ]) as d
    on conflict do nothing;

    select id into v_city_id from cities where name = 'مكة المكرمة';
    insert into districts (city_id, name)
    select v_city_id, d from unnest(array[
        'العوالي','الشوقية','الشرائع','النسيم','الزاهر','العتيبية','العمرة','النوارية',
        'التنعيم','الراشدية','بطحاء قريش','الكعكية','ولي العهد','الحمراء وأم الجود',
        'الزهراء','الضيافة','النزهة','الرصيفة','المسفلة','الهجرة','كدي','جرهم','الروابي',
        'الخالدية','الهنداوية','المنصور','الشبيكة','الشامية','جرول','ريع ذاخر','الحجون',
        'المعابدة','العزيزية الشمالية','الملاوي','العدل','العسيلة','وادي جليل',
        'العمرة الجديدة','البحيرات','الشرائع الشمالية','الشرائع الجنوبية','الصفوة',
        'الملك فهد','الحسينية','العكيشية','الليث الجديد'
    ]) as d
    on conflict do nothing;

    select id into v_city_id from cities where name = 'جدة';
    insert into districts (city_id, name)
    select v_city_id, d from unnest(array[
        'الروضة','الزهراء','السلامة','النهضة','الشاطئ','المحمدية','الخالدية','النعيم',
        'النزهة','البوادي','الربوة','الصفا','الفيصلية','الرحاب','مشرفة','العزيزية',
        'الورود','بني مالك','النسيم','الواحة','السامر','المنار','الأجواد','الريان',
        'مريخ','بريمان','المنطقة الصناعية','الجامعة','الفيحاء','السليمانية','الثغر',
        'الروابي','الوزيرية','غليل','مدائن الفهد','البلد','الهنداوية',
        'البغدادية الشرقية','البغدادية الغربية','الكندرة','الصحيفة','السبيل',
        'النزلة الشرقية','النزلة اليمانية','الثعالبة','المحجر','الكرنتينا',
        'الأمير فواز الشمالي','الأمير فواز الجنوبي','السنابل','الهدى','الأجاويد',
        'الفضيلة','الخمرة','القرينية','الحمدانية','الصالحية','الفلاح','الرحمانية',
        'طيبة','الرياض','الكوثر','الياقوت','الزمرد','اللؤلؤ','الأمواج','الشراع',
        'الفردوس','الأصالة','البساتين','أبحر الجنوبية','أبحر الشمالية','المرجان',
        'الشفا','المنتزهات','أم السلم','الحرازات'
    ]) as d
    on conflict do nothing;

    select id into v_city_id from cities where name = 'الرياض';
    insert into districts (city_id, name)
    select v_city_id, d from unnest(array[
        'العليا','السليمانية','الملز','الوزارات','الضباط','الورود','الرحمانية',
        'المحمدية','الرائد','النخيل','أم الحمام الشرقي','أم الحمام الغربي','المعذر',
        'المعذر الشمالي','الهدا','الشفا','بدر','المروة','عكاظ','الحزم','ديراب','نمار',
        'ظهرة نمار','العريجاء','العريجاء الغربية','العريجاء الوسطى','ظهرة البديعة',
        'البديعة','السويدي','السويدي الغربي','شبرا','سلطانة','الجرادية','منفوحة',
        'منفوحة الجديدة','الديرة','الشميسي','الفاخرية','العود','المرقب','الصالحية',
        'الخالدية','غبيراء','اليمامة','الربوة','الريان','الروابي','النسيم الشرقي',
        'النسيم الغربي','السلام','المنار','النهضة','الخليج','القدس','الحمراء',
        'غرناطة','الشهداء','قرطبة','اليرموك','المونسية','الرمال','الجنادرية',
        'القادسية','اشبيلية','الملك فيصل','الروضة','الملقا','حطين','العقيق',
        'الصحافة','الياسمين','النرجس','العارض','القيروان','الربيع','الغدير','النفل',
        'الوادي','التعاون','الازدهار','المصيف','المرسلات','الفلاح','الندى','الواحة',
        'صلاح الدين','الملك فهد','الملك عبدالله','الملك عبدالعزيز','المغرزات','النور'
    ]) as d
    on conflict do nothing;
end $$;

-- ============================================================================
-- 3.6) طلبات التواصل — يغذّي نموذج "تواصل معنا" الحقيقي بدل واتساب فقط
-- ============================================================================
create table if not exists inquiries (
    id              uuid primary key default gen_random_uuid(),
    full_name       varchar(255) not null,
    phone           varchar(20),
    email           varchar(255),
    inquiry_type    varchar(50),
    message         text,
    status          varchar(20) not null default 'new'
                        check (status in ('new','contacted','closed')),
    created_at      timestamptz not null default now()
);
create index if not exists idx_inquiries_status on inquiries(status);

-- ============================================================================
-- 3.7) بيانات أولية (Seed) — عروض وعقارات واقعية حتى لا يبدو الموقع فارغاً
--      عند الإطلاق. آمن التكرار (on conflict do nothing عبر تحقق مسبق) —
--      شغّل هذا القسم مرة واحدة؛ عدّل الأسعار والصور لاحقاً من لوحتكم.
-- ============================================================================
insert into offers (title, city, district, property_type, area_sqm, rooms, price_original, discount_pct, price_final, description, image_url, is_published)
select * from (values
    ('فيلا فاخرة بتشطيب راقٍ', 'الرياض', 'العليا', 'فيلا', 410, 6, 3850000, 8, 3542000, 'فيلا حديثة بتصميم عصري في أحد أرقى أحياء الرياض.', 'https://images.pexels.com/photos/16573669/pexels-photo-16573669.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true),
    ('شقة بإطلالة بحرية', 'جدة', 'الشاطئ', 'شقة في برج', 165, 3, 980000, 12, 862400, 'شقة عصرية بإطلالة مباشرة على البحر الأحمر.', 'https://images.pexels.com/photos/11631278/pexels-photo-11631278.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true),
    ('أرض تجارية قريبة من الحرم', 'المدينة المنورة', 'قباء', 'أرض', 500, null, 1500000, 5, 1425000, 'أرض بموقع استراتيجي قريبة من المسجد النبوي.', 'https://images.pexels.com/photos/4525178/pexels-photo-4525178.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true),
    ('دبلكس عائلي واسع', 'الرياض', 'النرجس', 'دبلكس', 320, 5, 2100000, 10, 1890000, 'دبلكس بتصميم عائلي في حي النرجس الحيوي.', 'https://images.pexels.com/photos/10647324/pexels-photo-10647324.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true),
    ('شقة اقتصادية جاهزة للسكن', 'مكة المكرمة', 'العزيزية الشمالية', 'شقة في عمارة', 140, 3, 720000, 7, 669600, 'شقة نظيفة وجاهزة للسكن الفوري قرب الحرم المكي.', 'https://images.pexels.com/photos/38000582/pexels-photo-38000582.png?auto=compress&cs=tinysrgb&h=650&w=940', true),
    ('استراحة بمساحات خضراء', 'المدينة المنورة', 'أحد', 'استراحة', 800, null, 950000, 15, 807500, 'استراحة عائلية بمساحة واسعة ومرافق ترفيهية.', 'https://images.pexels.com/photos/8134745/pexels-photo-8134745.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true)
) as v(title, city, district, property_type, area_sqm, rooms, price_original, discount_pct, price_final, description, image_url, is_published)
where not exists (
    select 1 from offers where title = 'فيلا فاخرة بتشطيب راقٍ' and city = 'الرياض'
);

-- تحديث الصور على العروض الست حتى لو كانت موجودة مسبقاً من تشغيل سابق
-- لهذا الملف (الإدراج فوق يتجاوزها وقتها بسبب الحارس، فهذا يضمن وصول
-- الصور لها بأي الحالتين). آمن يتكرر تشغيله بلا أي أثر جانبي.
update offers set image_url = 'https://images.pexels.com/photos/16573669/pexels-photo-16573669.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' where title = 'فيلا فاخرة بتشطيب راقٍ' and image_url is null;
update offers set image_url = 'https://images.pexels.com/photos/11631278/pexels-photo-11631278.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' where title = 'شقة بإطلالة بحرية' and image_url is null;
update offers set image_url = 'https://images.pexels.com/photos/4525178/pexels-photo-4525178.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' where title = 'أرض تجارية قريبة من الحرم' and image_url is null;
update offers set image_url = 'https://images.pexels.com/photos/10647324/pexels-photo-10647324.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' where title = 'دبلكس عائلي واسع' and image_url is null;
update offers set image_url = 'https://images.pexels.com/photos/38000582/pexels-photo-38000582.png?auto=compress&cs=tinysrgb&h=650&w=940' where title = 'شقة اقتصادية جاهزة للسكن' and image_url is null;
update offers set image_url = 'https://images.pexels.com/photos/8134745/pexels-photo-8134745.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' where title = 'استراحة بمساحات خضراء' and image_url is null;

with seeded_properties as (
    insert into properties (city, district, property_type, price, area_sqm, rooms, age_years, facade, district_grade)
    select * from (values
        ('المدينة المنورة', 'الروابي', 'شقة في عمارة', 620000, 145, 3, 2, 'شرقية', 'متوسط'),
        ('مكة المكرمة', 'النسيم', 'فيلا', 2300000, 380, 5, 4, 'شمالية', 'راقي'),
        ('جدة', 'الصفا', 'شقة في برج', 890000, 160, 3, 1, 'غربية', 'استثماري'),
        ('الرياض', 'الياسمين', 'دبلكس', 1750000, 300, 4, 3, 'جنوبية', 'راقي'),
        ('المدينة المنورة', 'العوالي', 'أرض', 480000, 400, null, null, 'شرقية', 'متوسط'),
        ('جدة', 'أبحر الشمالية', 'شقة في برج', 1050000, 190, 4, 0, 'شمالية', 'راقي')
    ) as v(city, district, property_type, price, area_sqm, rooms, age_years, facade, district_grade)
    -- يتحقق تحديداً من عدم وجود هذه الدفعة بالذات (وليس "أي صف بالجدول")، حتى
    -- لو كان الجدول يحتوي عقاراً حقيقياً مُدخلاً من زائر (حالة pending) مسبقاً —
    -- هذا هو إصلاح الثغرة التي منعت بذر العقارات في المحاولة السابقة.
    where not exists (
        select 1 from properties
        where district = 'الروابي' and price = 620000 and city = 'المدينة المنورة'
    )
    returning id
)
update properties set status = 'approved' where id in (select id from seeded_properties);

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
alter table inquiries             enable row level security;
alter table cities                enable row level security;
alter table districts             enable row level security;
alter table parties               enable row level security;
alter table contracts             enable row level security;
alter table contract_installments enable row level security;
alter table notification_log      enable row level security;

-- العروض: قراءة عامة للمنشور فقط، لا كتابة من الزوار إطلاقاً
drop policy if exists offers_public_read on offers;
create policy offers_public_read on offers
    for select using (is_published = true);

-- العقارات: قراءة عامة للمعتمد فقط + إدخال عام (يُجبر على pending بالـ trigger)
drop policy if exists properties_public_read on properties;
create policy properties_public_read on properties
    for select using (status = 'approved');
drop policy if exists properties_public_insert on properties;
create policy properties_public_insert on properties
    for insert with check (true);

-- طلبات التواصل: إدخال عام (أي زائر يقدر يرسل استفساراً)، بلا قراءة عامة —
-- فريق الدعم يراجعها لاحقاً عبر service_role، مو من كود الموقع العام.
drop policy if exists inquiries_public_insert on inquiries;
create policy inquiries_public_insert on inquiries
    for insert with check (true);

-- المدن والأحياء: بيانات مرجعية عامة القراءة فقط. إضافة مدينة/حي جديد مهمة
-- إدارية تتم مباشرة من لوحة Supabase (أو لوحة تحكم داخلية لاحقاً) وليس من
-- واجهة الموقع العامة — كانت النسخة السابقة تسمح لأي زائر بالإضافة مباشرة،
-- وهذا عُدَّ ثغرة تصميمية (يمكن لأي شخص حقن بيانات وهمية)، فأُغلقت هنا.
drop policy if exists cities_public_read on cities;
create policy cities_public_read on cities
    for select using (true);
drop policy if exists districts_public_read on districts;
create policy districts_public_read on districts
    for select using (true);

-- الأطراف / العقود / الدفعات / سجل الإشعارات: لا وصول مباشر للزوار أبداً.
-- كل الكتابة تمر حصراً عبر create_contract_with_schedule (SECURITY DEFINER).
-- أي قراءة إدارية تتم لاحقاً عبر service_role من لوحة تحكم داخلية، وليس
-- من كود الموقع العام — هذا يحل الثغرة الأمنية الأساسية في التصميم المبدئي.
-- (لا سياسات select/insert تُضاف هنا عمداً؛ RLS بدون سياسات = رفض كل شيء)

-- ============================================================================
-- 9.5) لوحة التحكم الإدارية (admin.html) — صلاحيات authenticated فقط
-- ============================================================================
-- هذه الصلاحيات تُمنح فقط لمستخدم مسجَّل دخول عبر Supabase Auth (auth.role() =
-- 'authenticated')، وليس لمفتاح anon العام المستخدم بموقعك الرئيسي. أنشئ حساب
-- المدير الوحيد من: Supabase Dashboard → Authentication → Users → Add user
-- (بريد إلكتروني + كلمة مرور)، ثم سجّل الدخول منه فقط داخل admin.html.
-- هذا أبسط بكثير من نظام أدوار/جدول مستخدمين مخصّص، لكنه حماية حقيقية على
-- مستوى قاعدة البيانات نفسها — مو مجرد إخفاء رابط الصفحة.

drop policy if exists properties_admin_update on properties;
create policy properties_admin_update on properties
    for update using (auth.role() = 'authenticated');
drop policy if exists properties_admin_delete on properties;
create policy properties_admin_delete on properties
    for delete using (auth.role() = 'authenticated');

drop policy if exists inquiries_admin_read on inquiries;
create policy inquiries_admin_read on inquiries
    for select using (auth.role() = 'authenticated');
drop policy if exists inquiries_admin_update on inquiries;
create policy inquiries_admin_update on inquiries
    for update using (auth.role() = 'authenticated');

drop policy if exists offers_admin_write on offers;
create policy offers_admin_write on offers
    for all using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

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
