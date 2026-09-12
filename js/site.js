
/* ============================================================================
   0) Supabase connection
     ========================================================================== */
const SUPABASE_URL = "https://wlebcvwsleoieodjtrcf.supabase.co";       // مثال: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "sb_publishable_KhUpsOF0OxVQWyWLakXx2g_yDsUlnxV";

let supa = null;
let dbReady = false;
let analyticsLoaded = false; // تُحمَّل مرة وحدة، أول ما الزائر يدخل قسم التحليلات فعلياً

function initSupabase(){
  if (SUPABASE_URL.startsWith("YOUR_") || !window.supabase) return false;
  supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

function renderConfigBanner(){
  const wrap = document.getElementById('config-banner-wrap');
  if (dbReady){ wrap.innerHTML = ''; return; }
  wrap.innerHTML = `<div class="notice notice-warn">
    ⚠️ لم يتم ربط قاعدة البيانات بعد. عدّل SUPABASE_URL و SUPABASE_ANON_KEY في
    أعلى الكود (بعد تشغيل supabase/schema.sql على مشروعك) لتفعيل العروض
    والتحليلات والعقود الحقيقية. الموقع يعمل حالياً ببيانات توضيحية فقط.
  </div>`;
}

/* ============================================================================
   1) i18n — قابل للتوسعة؛ يغطي هذا العرض العناصر الأساسية للتنقل والواجهة
   ========================================================================== */
const I18N = {
  ar: {
    brand:"همة المدينة العقارية", nav_home:"الرئيسية", nav_valuation:"المؤشر", nav_offers:"العروض",
    nav_contracts:"العقود", nav_add:"أضف عقارك", nav_analytics:"التحليلات", nav_services:"الخدمات",
    nav_faq:"الأسئلة", nav_about:"عنّا", nav_contact:"تواصل", nav_more:"المزيد ▾", nav_admin:"🔐 لوحة التحكم",
    admin_login_label:"تسجيل الدخول",
    hero_eyebrow:"🇸🇦 المدينة المنورة", hero_title:"همة المدينة العقارية", hero_sub:"Himmat Al Madinah Real Estate",
    hero_tagline:"خبرة محلية… لقرار عقاري أكثر ثقة",
    hero_desc:"نقدم في همة المدينة العقارية خدمات عقارية مبنية على معرفة السوق، ودقة المعلومات، والوضوح في التعامل. نرافق عملاءنا في رحلة البيع والشراء والتسويق والاستثمار العقاري، ونسعى لأن تكون كل خطوة واضحة ومدروسة.",
    hero_cta1:"احسب المؤشر الآن", hero_cta_browse:"تصفح العقارات", hero_cta_list:"أضف عقارك",
    license_badge:"مرخّصة من الهيئة العامة للعقار — رخصة فال: 1200030428 — سجل تجاري: 7042103650",
    stat1:"مدن مدعومة", stat2:"عوامل تسعير", stat3:"عقار مسجَّل فعلياً", stat4:"حي مدعوم",
    hero_panel_title:"قاعدة بيانات مشتركة وحقيقية",
    hero_panel_desc:"كل عقار وعقد تضيفه يُخزَّن مركزياً ويبقى محفوظاً — وليس فقط على متصفحك.",
    offers_eyebrow:"فرص لا تفوّت", offers_title:"عروض وخصومات",
    featured_eyebrow:"مختارات لك", featured_title:"عقارات مميزة", featured_see_all:"شاهد كل العروض ←",
    offers_desc:"عروض تتحدّث فور ما يضيفها فريقنا — بدون تحديث يدوي ولا صفحات قديمة.",
    quiz_title:"دوّر عليه", quiz_desc:"4 أسئلة سريعة، ونطلع لك أفضل العروض المطابقة لك فعلياً — بدل ما تدوّر يدوياً.", quiz_start:"ابدأ الآن",
    services_eyebrow:"خدماتنا", services_title:"ماذا نقدّم", map_title:"الخريطة العقارية",
    val_eyebrow:"مؤشر فوري", val_title:"استشارات ودراسات عقارية استرشادية",
    val_desc:"خمس معلومات بسيطة، ومؤشر سعري شفاف خلال ثوانٍ.",
    val_honesty_label:"ملاحظة مهمة حول الدقة: ",
    val_honesty_text:"هذا المؤشر ناتج عن معادلة حسابية شفافة (سعر المتر × المساحة مع معاملات تعديل) — مع نموذج ذكاء اصطناعي يخمّن، سعر المتر نفسه إما من صفقات حقيقية موثّقة (وزارة العدل عبر رغدان) لو متوفرة لهذا الحي تحديداً، أو متوسط عام للمدينة — النتيجة أدناه توضح أي الحالتين تنطبق. اعتبره نقطة انطلاق للنقاش، لا تقييماً معتمداً رسمياً.",
    val_run:"احسب المؤشر", res_low:"أدنى النطاق (ر.س)", res_high:"أعلى النطاق (ر.س)",
    val_breakdown_hint:"ستظهر تفاصيل حساب المعادلة هنا بعد الضغط على \"احسب المؤشر\".",
    finance_title:"حاسبة التمويل العقاري", finance_result_label:"القسط الشهري التقريبي",
    finance_note:"حساب إرشادي، يختلف حسب جهة التمويل",
    f_city:"المدينة", f_district:"الحي", f_type:"نوع العقار", f_area:"المساحة (م²)", f_rooms:"عدد الغرف",
    f_age:"عمر العقار (سنوات)", f_floors:"عدد الأدوار", f_units_per_floor:"عدد الشقق بكل دور", f_facade:"الواجهة", f_grade:"تصنيف الحي", f_price:"قيمة العقار (ر.س)",
    f_down:"الدفعة المقدمة (ر.س)", f_rate:"النسبة السنوية %", f_years:"المدة (سنوات)", f_contact:"وسيلة تواصل (اختياري)",
    f_amenities:"إضافات تؤثر على السعر", am_maid_room:"غرفة خادمة", am_central_ac:"تكييف مركزي",
    f_description:"وصف تفصيلي (اختياري)", f_description_ph:"اكتب تفاصيل الغرف، المرافق، القرب من المعالم...",
    f_map_url:"رابط الموقع على الخريطة (اختياري)",
    license_optional_note:"الحقلين التاليين للمسوّقين والمكاتب العقارية المرخّصة فقط — اتركهما فارغين إن كنت مالكاً فردياً.",
    f_re_license:"رقم الرخصة العقارية (اختياري)", f_ad_license:"رقم الترخيص الإعلاني (اختياري)",
    am_furnished:"مفروش", am_driver_room:"غرفة سائق", am_elevator:"مصعد",
    f_min_price:"أقل سعر (ر.س)", f_max_price:"أعلى سعر (ر.س)", f_min_rooms:"أقل عدد غرف",
    filter_apply:"بحث", filter_reset:"إعادة تعيين", filter_all:"الكل", offers_no_match:"لا توجد نتائج مطابقة لبحثك.",
    match_badge_label:"مطابقة", match_badge_hint:"نسبة توافق العرض مع تفضيلاتك — نظام ترجيح شفاف بسيط، وليس نموذج ذكاء اصطناعي",
    add_eyebrow:"إضافة عقار جديد", add_title:"اعرض عقارك أمام الباحثين الجادين",
    add_desc:"يراجع فريقنا عقارك بسرعة، ثم يظهر مباشرة لكل زوار الموقع.",
    add_submit:"إدراج للمراجعة",
    analytics_eyebrow:"نبض السوق العقاري", analytics_title:"العقارات المسجَّلة فعلياً",
    analytics_desc:"أرقام حقيقية من عقارات حقيقية — تتحدّث كل ما أُضيف عقار جديد.",
    t_city:"المدينة", t_district:"الحي", t_type:"النوع", t_price:"السعر", t_area:"المساحة",
    analytics_empty:"لا توجد عقارات معتمدة بعد — كن أول من يضيف عقاراً.",
    analytics_chart_title:"متوسط سعر المتر حسب المدينة",
    contracts_eyebrow:"كتابة العقود", contracts_title:"العقود",
    contracts_desc:"عبّئ البيانات، واحصل على عقد متكامل بجدول دفعات جاهز للطباعة والتوقيع.",
    tab_residential:"عقد سكني", tab_commercial:"عقد تجاري",
    f_lessor_name:"اسم المؤجر", f_lessor_id:"هوية المؤجر", f_lessor_phone:"جوال المؤجر",
    f_lessee_name:"اسم المستأجر", f_lessee_id:"هوية المستأجر", f_lessee_phone:"جوال المستأجر",
    f_unit_type:"نوع الوحدة", f_deposit:"الضمان (ر.س)", f_start:"تاريخ البداية", f_end:"تاريخ النهاية",
    f_rent:"الإيجار السنوي (ر.س)", f_frequency:"عدد الدفعات سنوياً", contract_generate:"إرسال العقد للتوثيق",
    f_lessor_dob:"تاريخ ميلاد المؤجر", f_lessee_dob:"تاريخ ميلاد المستأجر", contract_dob_label:"تاريخ الميلاد",
    f_lessor_id_type:"نوع هوية المؤجر", f_lessee_id_type:"نوع هوية المستأجر",
    f_lessor_nationality:"جنسية المؤجر", f_lessee_nationality:"جنسية المستأجر",
    id_type_national:"هوية وطنية", id_type_iqama:"إقامة", id_type_other:"أخرى",
    f_deed_number:"رقم الصك", f_deed_date:"تاريخ الصك", f_floor_number:"رقم الدور (اختياري)",
    faq_eyebrow:"مركز المساعدة", faq_title:"الأسئلة الشائعة",
    journey_eyebrow:"بساطة من البداية للنهاية", journey_title:"رحلتك معنا",
    journey1_title:"تصفّح", journey1_text:"عقارات حقيقية بأسعار شفافة، محدَّثة أولاً بأول.",
    journey2_title:"تواصل بثقة", journey2_text:"فريق محلي يجاوبك بوضوح، بدون ضغط أو تسرّع.",
    journey3_title:"عقد موثّق", journey3_text:"كل بند واضح ومكتوب قبل ما توقّع — بدون تعقيد.",
    journey4_title:"مفتاحك بيدك", journey4_text:"نرافقك للخطوة الأخيرة، بثقة من البداية للنهاية.",
    promise1:"مرخّصون رسمياً — فال + سجل تجاري", promise2:"بياناتنا من مصادر رسمية (وزارة العدل)",
    promise3:"بدون عمولات خفية", promise4:"عقودك محفوظة بأمان",
    about_title:"عنّا", mission_title:"رسالتنا",
    mission_text:"أن نجعل التعامل العقاري أوضح وأسهل وأكثر ثقة.",
    vision_title:"رؤيتنا", vision_text:"أن نكون مرجعاً عقارياً موثوقاً في المدينة المنورة.",
    goal_title:"هدفنا", goal_text:"هدفنا ليس إتمام صفقة فحسب، بل بناء علاقة تبدأ بالثقة.",
    license_title:"الترخيص والاعتماد", license_text:"همة المدينة العقارية مرخّصة رسمياً من الهيئة العامة للعقار بالمملكة العربية السعودية — رقم رخصة فال العقارية: 1200030428، وسجل تجاري رقم: 7042103650.",
    contact_title:"تواصل معنا", contact_desc:"سؤال أو استفسار أو عقار تبي تناقشه؟ فريقنا يرد خلال ساعات العمل.",
    contact_location_label:"الموقع: ", contact_location:"المدينة المنورة، المملكة العربية السعودية",
    contact_phone_label:"الهاتف: ", f_name:"الاسم", f_inquiry_type:"نوع الاستفسار", f_message:"الرسالة",
    contact_send_form:"إرسال الطلب", contact_send_note:"يُحفظ طلبك في نظامنا ويفتح واتساب أيضاً لتواصل أسرع.",
    f_reach:"جوالك أو بريدك الإلكتروني", hours_label:"ساعات العمل: ", hours_value:"الأحد – الخميس: 9ص – 6م · الجمعة والسبت: مغلق",
    whatsapp_word:"واتساب",
    footer_legal:"قانوني", footer_privacy:"سياسة الخصوصية", footer_terms:"شروط الاستخدام",
    footer_quicklinks_title:"روابط سريعة", footer_services_title:"الخدمات",
    footer_svc_1:"البيع والشراء", footer_svc_2:"مؤشر الأسعار العقارية", footer_svc_3:"كتابة العقود", footer_svc_4:"إدارة الأملاك",
    privacy_title:"سياسة الخصوصية", terms_title:"شروط الاستخدام",
    legal_disclaimer:"محتوى عام كنقطة انطلاق وليس استشارة قانونية متخصصة؛ يُنصح بمراجعة مستشار قانوني مرخّص لتخصيصه لنشاطكم.",
    footer_contact_title:"تواصل سريع", footer_rights:"جميع الحقوق محفوظة", footer_license:"رخصة فال العقارية: 1200030428 — سجل تجاري: 7042103650",
    footer_tag:"🕌 شريكك العقاري الموثوق في المدينة المنورة",
    assist_title:"المساعد الذكي", assist_sub:"ذكاء اصطناعي حقيقي للأسئلة العامة، وبحث دقيق مباشر بقاعدة بياناتنا للعروض",
    assist_placeholder:"اكتب سؤالك...", assist_send:"إرسال", assist_online:"متصل الآن",
    assistant_toggle_text:"اسأل المساعد الذكي",
    social_title:"تابعنا عبر منصات التواصل",
    price_on_request:"السعر عند التواصل", rooms_suffix:"غرف",
    detail_map:"عرض على الخريطة", detail_whatsapp:"تواصل عبر واتساب",
    detail_marketer:"المسوّق", detail_license:"رقم الرخصة العقارية", detail_ad_license:"رقم الترخيص الإعلاني",
    detail_no_desc:"لا يوجد وصف تفصيلي لهذا العقار بعد.", detail_view_btn:"عرض التفاصيل الكاملة ←",
    favorite_toggle_label:"أضف للمفضلة", sold_ribbon_label:"تم البيع",
    sort_newest:"الأحدث", sort_discount:"الأعلى خصماً", sort_luxury:"الأعلى سعراً", sort_affordable:"الأقل سعراً",
    hero_search_budget:"الميزانية القصوى (ر.س)", hero_search_btn:"ابحث",
    hero_search_count_some:"{n} عرض متاح يطابق بحثك", hero_search_count_none:"لا عروض مطابقة الآن — جرّب توسيع البحث",
    contract_header:"عقد إيجار", contract_number_label:"رقم العقد",
    contract_lessor_label:"المؤجر", contract_lessee_label:"المستأجر",
    contract_id_label:"هوية", contract_phone_label2:"جوال",
    contract_property_label:"العقار", contract_term_label:"مدة العقد",
    contract_term_from:"من", contract_term_to:"إلى",
    contract_rent_label:"الإيجار السنوي", contract_deposit_label:"الضمان", contract_frequency_label:"عدد الدفعات سنوياً",
    contract_print_btn:"🖨️ طباعة العقد / حفظ PDF",
    type_residential:"سكني", type_commercial:"تجاري",
    opt_east:"شرقية (+5%)", opt_north:"شمالية (+4%)", opt_south:"جنوبية", opt_west:"غربية (-2%)",
    opt_upscale:"حي راقي (+25%)", opt_investment:"حي استثماري (+15%)", opt_mid:"حي متوسط",
    opt_buy:"شراء عقار", opt_sell:"بيع عقار", opt_valuation_inq:"مؤشر سعر عقار",
    opt_contract_inq:"كتابة عقد", opt_general:"استفسار عام"
  },
  en: {
    brand:"Himmat Al Madinah Real Estate", nav_home:"Home", nav_valuation:"Index", nav_offers:"Offers",
    nav_contracts:"Contracts", nav_add:"List Property", nav_analytics:"Analytics", nav_services:"Services",
    nav_faq:"FAQ", nav_about:"About", nav_contact:"Contact", nav_more:"More ▾", nav_admin:"🔐 Admin",
    admin_login_label:"Login",
    hero_eyebrow:"🇸🇦 Madinah", hero_title:"Himmat Al Madinah Real Estate", hero_sub:"همة المدينة العقارية",
    hero_tagline:"Local expertise… for a more confident real estate decision",
    hero_desc:"At Himmat Al Madinah Real Estate, we provide real estate services built on market knowledge, accurate information, and clear dealings. We accompany our clients through buying, selling, marketing, and real estate investment, striving to make every step clear and well-considered.",
    hero_cta1:"Calculate Index Now", hero_cta_browse:"Browse Properties", hero_cta_list:"List Your Property",
    license_badge:"Licensed by the General Real Estate Authority — Fal License: 1200030428 — CR: 7042103650",
    stat1:"Cities covered", stat2:"Pricing factors", stat3:"Properties actually listed", stat4:"Districts covered",
    hero_panel_title:"A real, shared database",
    hero_panel_desc:"Every property and contract you add is stored centrally — not just in your browser.",
    offers_eyebrow:"Don't miss out", offers_title:"Offers & Discounts",
    featured_eyebrow:"Picked for you", featured_title:"Featured Properties", featured_see_all:"See all offers →",
    offers_desc:"Offers update the moment our team adds them — no manual refresh, no stale pages.",
    quiz_title:"Find Your Match", quiz_desc:"4 quick questions, and we'll show you the best-matching listings — instead of manual searching.", quiz_start:"Start Now",
    services_eyebrow:"Our Services", services_title:"What We Offer", map_title:"Property Map",
    val_eyebrow:"Instant indicator", val_title:"Guided Real Estate Consulting & Studies",
    val_desc:"Five simple details, and a transparent price indicator in seconds.",
    val_honesty_label:"Accuracy note: ",
    val_honesty_text:"This indicator comes from a transparent formula (price per sqm × area with adjustment factors) — not an AI model guessing. The per-sqm price itself is either based on real documented transactions (Ministry of Justice via Raghdan) when available for that specific district, or a general citywide average otherwise — the result below shows which applies. Consider it a starting point for discussion, not an officially certified valuation.",
    val_run:"Calculate Estimate", res_low:"Low range (SAR)", res_high:"High range (SAR)",
    val_breakdown_hint:"The formula breakdown will appear here after you click \"Calculate Estimate\".",
    finance_title:"Mortgage Calculator", finance_result_label:"Approx. monthly payment",
    finance_note:"Indicative only, varies by lender",
    f_city:"City", f_district:"District", f_type:"Property type", f_area:"Area (sqm)", f_rooms:"Rooms",
    f_age:"Property age (yrs)", f_floors:"Number of floors", f_units_per_floor:"Apartments per floor", f_facade:"Facade", f_grade:"District grade", f_price:"Property value (SAR)",
    f_down:"Down payment (SAR)", f_rate:"Annual rate %", f_years:"Term (years)", f_contact:"Contact (optional)",
    f_amenities:"Amenities that affect the price", am_maid_room:"Maid's room", am_central_ac:"Central A/C",
    f_description:"Detailed description (optional)", f_description_ph:"Describe the rooms, amenities, nearby landmarks...",
    f_map_url:"Map location link (optional)",
    license_optional_note:"The next two fields are for licensed marketers and real estate offices only — leave blank if you're a private owner.",
    f_re_license:"Real estate license no. (optional)", f_ad_license:"Ad license no. (optional)",
    am_furnished:"Furnished", am_driver_room:"Driver's room", am_elevator:"Elevator",
    f_min_price:"Min price (SAR)", f_max_price:"Max price (SAR)", f_min_rooms:"Min rooms",
    filter_apply:"Search", filter_reset:"Reset", filter_all:"All", offers_no_match:"No results match your search.",
    match_badge_label:"match", match_badge_hint:"How well this listing fits your preferences — a simple transparent weighting, not an AI model",
    add_eyebrow:"List a new property", add_title:"Put Your Property in Front of Serious Buyers",
    add_desc:"Our team reviews your listing quickly, then it goes live to every visitor.",
    add_submit:"Submit for review",
    analytics_eyebrow:"The Market's Pulse", analytics_title:"Actually Listed Properties",
    analytics_desc:"Real numbers from real properties — updated every time a new one is added.",
    t_city:"City", t_district:"District", t_type:"Type", t_price:"Price", t_area:"Area",
    analytics_empty:"No approved properties yet — be the first to add one.",
    analytics_chart_title:"Average price per sqm by city",
    contracts_eyebrow:"Contract Drafting", contracts_title:"Contracts",
    contracts_desc:"Fill in the details and get a complete contract with a print-ready payment schedule.",
    tab_residential:"Residential", tab_commercial:"Commercial",
    f_lessor_name:"Lessor name", f_lessor_id:"Lessor ID", f_lessor_phone:"Lessor phone",
    f_lessee_name:"Lessee name", f_lessee_id:"Lessee ID", f_lessee_phone:"Lessee phone",
    f_unit_type:"Unit type", f_deposit:"Deposit (SAR)", f_start:"Start date", f_end:"End date",
    f_rent:"Annual rent (SAR)", f_frequency:"Installments per year", contract_generate:"Send Contract for Documentation",
    f_lessor_dob:"Lessor's date of birth", f_lessee_dob:"Lessee's date of birth", contract_dob_label:"Date of birth",
    f_lessor_id_type:"Lessor's ID type", f_lessee_id_type:"Lessee's ID type",
    f_lessor_nationality:"Lessor's nationality", f_lessee_nationality:"Lessee's nationality",
    id_type_national:"National ID", id_type_iqama:"Iqama (residency)", id_type_other:"Other",
    f_deed_number:"Deed number", f_deed_date:"Deed date", f_floor_number:"Floor number (optional)",
    faq_eyebrow:"Help Center", faq_title:"Frequently Asked Questions",
    journey_eyebrow:"Simple from start to finish", journey_title:"Your Journey With Us",
    journey1_title:"Browse", journey1_text:"Real listings, transparent pricing, updated as it happens.",
    journey2_title:"Talk with confidence", journey2_text:"A local team that answers clearly, no pressure or rush.",
    journey3_title:"A verified contract", journey3_text:"Every clause is clear and written before you sign.",
    journey4_title:"Your key in hand", journey4_text:"We stay with you to the very last step, with confidence.",
    promise1:"Officially licensed — FAL + commercial registry", promise2:"Our data comes from official sources (Ministry of Justice)",
    promise3:"No hidden commissions", promise4:"Your contracts are safely stored",
    about_title:"About Us", mission_title:"Our Mission",
    mission_text:"To make real estate dealings clearer, easier, and more trustworthy.",
    vision_title:"Our Vision", vision_text:"To be the trusted real estate reference in Madinah.",
    goal_title:"Our Goal", goal_text:"Not just closing a deal, but building trust that lasts.",
    license_title:"License & Accreditation", license_text:"Himmat Al Madinah Real Estate is officially licensed by Saudi Arabia's General Real Estate Authority — Fal Real Estate License No. 1200030428, and Commercial Registration No. 7042103650.",
    contact_title:"Contact Us", contact_desc:"A question, an inquiry, or a property you'd like to discuss? Our team replies during working hours.",
    contact_location_label:"Location: ", contact_location:"Madinah, Saudi Arabia",
    contact_phone_label:"Phone: ", f_name:"Name", f_inquiry_type:"Inquiry type", f_message:"Message",
    contact_send_form:"Send Request", contact_send_note:"Your request is saved in our system and WhatsApp also opens for faster contact.",
    f_reach:"Your phone or email", hours_label:"Working hours: ", hours_value:"Sun – Thu: 9am – 6pm · Fri & Sat: Closed",
    whatsapp_word:"WhatsApp",
    footer_legal:"Legal", footer_privacy:"Privacy Policy", footer_terms:"Terms of Use",
    footer_quicklinks_title:"Quick Links", footer_services_title:"Services",
    footer_svc_1:"Buying & Selling", footer_svc_2:"Property Price Index", footer_svc_3:"Contract Drafting", footer_svc_4:"Property Management",
    privacy_title:"Privacy Policy", terms_title:"Terms of Use",
    legal_disclaimer:"General starting-point content, not specialized legal advice; consult a licensed legal advisor to tailor it to your business.",
    footer_contact_title:"Quick Contact", footer_rights:"All rights reserved", footer_license:"Fal Real Estate License: 1200030428 — CR: 7042103650",
    footer_tag:"🕌 Your trusted real estate partner in Madinah",
    assist_title:"Smart Assistant", assist_sub:"Real AI for general questions, plus accurate live search of our listings",
    assist_placeholder:"Type your question...", assist_send:"Send", assist_online:"Online now",
    assistant_toggle_text:"Ask the AI assistant",
    social_title:"Follow us on social media",
    price_on_request:"Price on request", rooms_suffix:"rooms",
    detail_map:"View on map", detail_whatsapp:"Contact via WhatsApp",
    detail_marketer:"Marketed by", detail_license:"Real estate license no.", detail_ad_license:"Ad license no.",
    detail_no_desc:"No detailed description available for this property yet.", detail_view_btn:"View Full Details →",
    favorite_toggle_label:"Add to favorites", sold_ribbon_label:"SOLD",
    sort_newest:"Newest", sort_discount:"Best discount", sort_luxury:"Highest price", sort_affordable:"Most affordable",
    hero_search_budget:"Maximum budget (SAR)", hero_search_btn:"Search",
    hero_search_count_some:"{n} listings match your search", hero_search_count_none:"No matches yet — try widening your search",
    contract_header:"Lease contract", contract_number_label:"Contract No.",
    contract_lessor_label:"Lessor", contract_lessee_label:"Lessee",
    contract_id_label:"ID", contract_phone_label2:"Phone",
    contract_property_label:"Property", contract_term_label:"Term",
    contract_term_from:"from", contract_term_to:"to",
    contract_rent_label:"Annual rent", contract_deposit_label:"Deposit", contract_frequency_label:"Installments per year",
    contract_print_btn:"🖨️ Print Contract / Save as PDF",
    type_residential:"Residential", type_commercial:"Commercial",
    opt_east:"East (+5%)", opt_north:"North (+4%)", opt_south:"South", opt_west:"West (-2%)",
    opt_upscale:"Upscale district (+25%)", opt_investment:"Investment district (+15%)", opt_mid:"Mid-range district",
    opt_buy:"Buy property", opt_sell:"Sell property", opt_valuation_inq:"Property price index",
    opt_contract_inq:"Contract drafting", opt_general:"General inquiry"
  }
};

let currentLang = 'ar';

function applyLang(lang){
  currentLang = lang;
  heroDescTypewriterRunId++; // يوقف أي تشغيلة آلة كاتبة قديمة شغّالة بالخلفية فوراً
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if (I18N[lang][key]) el.textContent = I18N[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key = el.getAttribute('data-i18n-placeholder');
    if (I18N[lang][key]) el.placeholder = I18N[lang][key];
  });
  document.querySelectorAll('#lang-switch button').forEach(b=>b.classList.toggle('active', b.dataset.lang===lang));

  // Re-render everything that isn't a static data-i18n element, so the
  // language switch actually reaches services / FAQ / offers / dropdowns —
  // previously these stayed in Arabic regardless of the selected language.
  renderServices();
  renderFaq();
  renderLegalPages();
  populateTypeSelects();
  updateValuationFieldsForType();
  updateAddPropertyFieldsForType();
  populateCitySelects();
  populateFilterSelects();
  populateHeroSearch();
  updateHeroSearchCount();
  renderOffers();
  renderFeatured();
  renderQuickChips();
  try { runValuation(); } catch(e){}
  if (analyticsLoaded) renderAnalytics();
}
document.getElementById('lang-switch').addEventListener('click', e=>{
  const btn = e.target.closest('button[data-lang]');
  if (btn) applyLang(btn.dataset.lang);
});

/* ============================================================================
   1.4) Light/Dark theme toggle
   ========================================================================== */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-icon-moon').style.display = (theme === 'dark') ? '' : 'none';
  document.getElementById('theme-icon-sun').style.display = (theme === 'light') ? '' : 'none';
  try { localStorage.setItem('himmat-theme', theme); } catch(e) {}
}
document.getElementById('theme-toggle').addEventListener('click', ()=>{
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});
// مزامنة الأيقونة مع الوضع المطبَّق فعلياً وقت التحميل (قد يكون فُتّح مسبقاً بالسكربت المضمّن بأعلى الصفحة)
applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

/* ============================================================================
   1.5) Mobile menu (hamburger) — the desktop nav is hidden below 680px,
        this is its replacement so mobile visitors can still navigate.
   ========================================================================== */
document.getElementById('mobile-menu-toggle').addEventListener('click', ()=>{
  document.getElementById('mobile-menu').classList.toggle('open');
});
document.getElementById('mobile-menu').addEventListener('click', e=>{
  if (e.target.closest('a')) document.getElementById('mobile-menu').classList.remove('open');
});

/* "المزيد" dropdown in the desktop nav */
document.getElementById('nav-more-btn').addEventListener('click', (e)=>{
  e.stopPropagation();
  document.getElementById('nav-more').classList.toggle('open');
});
document.getElementById('nav-more-panel').addEventListener('click', e=>{
  if (e.target.closest('a')) document.getElementById('nav-more').classList.remove('open');
});
document.addEventListener('click', (e)=>{
  const navMore = document.getElementById('nav-more');
  if (navMore.classList.contains('open') && !navMore.contains(e.target)){
    navMore.classList.remove('open');
  }
});

/* ============================================================================
   2) Per-language content. Demo/reference content translates fully; district
      names (real Saudi neighbourhoods) are kept in Arabic across languages —
      translating ~250 proper nouns isn't attempted, since the values must
      stay consistent with what's actually stored in the database.
   ========================================================================== */
const SERVICES_I18N = {
  ar: [
    {ic:"🏠", h:"بيع وشراء العقارات", p:"نساعدك على البيع والشراء بثقة، من دراسة الاحتياج حتى إتمام الصفقة."},
    {ic:"📊", h:"دراسة وتحليل السوق", p:"نحلل معطيات السوق ونقارن الفرص لتتخذ قرارك على معرفة."},
    {ic:"📄", h:"كتابة عقود الإيجار", p:"عقد يضمن حق الطرفين المؤجر والمستأجر ويقلل مساحة الخلاف."},
    {ic:"🏢", h:"إدارة الأملاك", p:"نهتم بتفاصيل عقارك لتبقى مطمئناً على استثمارك."},
    {ic:"💬", h:"الاستشارات العقارية", p:"قبل أن تقرر، نضع أمامك صورة أوضح للخيارات والفرص."},
    {ic:"📢", h:"التسويق العقاري", p:"نبرز قيمة عقارك ونوصله إلى الباحث الجاد بأسلوب احترافي."},
  ],
  en: [
    {ic:"🏠", h:"Buying & Selling", p:"We help you buy and sell with confidence, from needs assessment to closing."},
    {ic:"📊", h:"Market Analysis", p:"We analyse market data and compare opportunities so you decide with knowledge."},
    {ic:"📄", h:"Lease Drafting", p:"A contract that protects both lessor and lessee and reduces disputes."},
    {ic:"🏢", h:"Property Management", p:"We handle the details so you stay confident about your investment."},
    {ic:"💬", h:"Real Estate Consulting", p:"Before you decide, we lay out a clearer picture of your options."},
    {ic:"📢", h:"Real Estate Marketing", p:"We highlight your property's value and reach serious buyers professionally."},
  ],
};

const DEMO_OFFERS_I18N = {
  ar: [
    {title:"فيلا فاخرة بتشطيب راقٍ", city:"الرياض", district:"العليا", property_type:"فيلا", area_sqm:410, rooms:6, price_original:3850000, discount_pct:8, price_final:3542000, image_url:"https://images.pexels.com/photos/16573669/pexels-photo-16573669.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", description:"فيلا مستقلة بتشطيب عصري راقٍ، دورين وملحق.\nالمساحة: 410 م² — العمر: سنتان.\n\nالمواصفات:\n٦ غرف نوم (منها غرفتان ماستر)\n٥ دورات مياه\nصالتان (رجال ونساء)\nمطبخ راكب مجهّز بالكامل\nغرفة خادمة بدورة مياه\nغرفة غسيل ومخزن\n\nالمرافق الخارجية:\nمسبح خاص\nحديقة أمامية وخلفية\nموقف سيارات مغطّى لسيارتين\n\nالمميزات:\nتكييف مركزي\nنظام أمان وكاميرات مراقبة\nمصعد داخلي\n\nمميزات الموقع:\nقريبة من طريق الملك فهد\nقرب مجمعات تجارية كبرى\nقرب مدارس ومساجد الحي", map_url:"https://www.google.com/maps/search/حي+العليا+الرياض", marketer_name:"همة المدينة العقارية", marketer_phone:"966530500906", real_estate_license:"1200030428"},
    {title:"شقة بإطلالة بحرية", city:"جدة", district:"الشاطئ", property_type:"شقة في برج", area_sqm:165, rooms:3, price_original:980000, discount_pct:12, price_final:862400, image_url:"https://images.pexels.com/photos/11631278/pexels-photo-11631278.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", description:"شقة راقية بالدور السابع، إطلالة مباشرة وكاملة على البحر الأحمر.\nالمساحة: 165 م² — العمر: سنة واحدة.\n\nالمواصفات:\n٣ غرف نوم (منها غرفة ماستر بدورة مياه خاصة)\n٣ دورات مياه\nصالة معيشة مطلة على البحر\nمطبخ راكب\nغرفة غسيل\n\nالمميزات:\nمكيّفة بالكامل (سبليت)\nمطبخ مجهز بالكامل\nموقف سيارة خاص بالقبو\nمصعدين بالبرج\n\nمميزات الموقع:\nعلى كورنيش جدة مباشرة\nقريبة من أبراج جدة الشهيرة\nقرب المطاعم والمقاهي على الواجهة البحرية", map_url:"https://www.google.com/maps/search/حي+الشاطئ+جدة", marketer_name:"همة المدينة العقارية", marketer_phone:"966530500906", real_estate_license:"1200030428"},
    {title:"أرض تجارية قريبة من الحرم", city:"المدينة المنورة", district:"قباء", property_type:"أرض", area_sqm:500, rooms:null, price_original:1500000, discount_pct:5, price_final:1425000, image_url:"https://images.pexels.com/photos/4525178/pexels-photo-4525178.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", description:"أرض تجارية بموقع استراتيجي، مخطّطة ومرخّصة للبناء التجاري.\nالمساحة: 500 م² — واجهة تقريبية 20 م.\nكروكي وصك إلكتروني جاهزان.\n\nالمواصفات:\nأرض مستطيلة الشكل، تصلح لمبنى تجاري أو سكني استثماري\nعلى شارعين (رئيسي وفرعي)\nجميع الخدمات متوفرة (كهرباء، مياه، صرف صحي)\n\nمميزات الموقع:\nعلى بعد دقائق من المسجد النبوي الشريف\nقريبة من حي قباء التاريخي\nقرب محطات نقل عام ومواقف زوار", map_url:"https://www.google.com/maps/search/حي+قباء+المدينة+المنورة", marketer_name:"همة المدينة العقارية", marketer_phone:"966530500906", real_estate_license:"1200030428"},
    {title:"دبلكس عائلي واسع", city:"الرياض", district:"النرجس", property_type:"دبلكس", area_sqm:320, rooms:5, price_original:2100000, discount_pct:10, price_final:1890000, image_url:"https://images.pexels.com/photos/10647324/pexels-photo-10647324.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", description:"دبلكس عائلي بتصميم داخلي عصري، دورين مستقلين.\nالمساحة: 320 م² — العمر: 3 سنوات.\n\nالمواصفات:\n٥ غرف نوم (٢ بالدور الأرضي، ٣ بالدور العلوي)\n٤ دورات مياه\nصالتان (استقبال رجال ونساء)\nمطبخ راكب\nغرفة خادمة وغرفة سائق\n\nالمرافق:\nدرج داخلي بين الدورين\nفناء خلفي صغير\nموقفان مغطّيان\n\nمميزات الموقع:\nحي النرجس الحيوي شمال الرياض\nقرب مدارس عالمية ومجمعات تسوق\nسهولة الوصول لطريق الملك سلمان", map_url:"https://www.google.com/maps/search/حي+النرجس+الرياض", marketer_name:"همة المدينة العقارية", marketer_phone:"966530500906", real_estate_license:"1200030428"},
    {title:"شقة اقتصادية جاهزة للسكن", city:"مكة المكرمة", district:"العزيزية الشمالية", property_type:"شقة في عمارة", area_sqm:140, rooms:3, price_original:720000, discount_pct:7, price_final:669600, image_url:"https://images.pexels.com/photos/38000582/pexels-photo-38000582.png?auto=compress&cs=tinysrgb&h=650&w=940", description:"شقة نظيفة وجاهزة للسكن الفوري، بالدور الثالث بعمارة سكنية هادئة.\nالمساحة: 140 م² — العمر: 5 سنوات.\n\nالمواصفات:\n٣ غرف نوم\n٢ دورة مياه\nصالة واحدة\nمطبخ (غير راكب)\n\nالمميزات:\nتكييف سبليت بكل الغرف\nخزانات حائط بالغرف الرئيسية\nموقف سيارة بالشارع\n\nمميزات الموقع:\nقرب الحرم المكي (خدمة نقل من الحي)\nقريبة من أسواق العزيزية الشعبية\nمحطات نقل عام قريبة", map_url:"https://www.google.com/maps/search/العزيزية+الشمالية+مكة", marketer_name:"همة المدينة العقارية", marketer_phone:"966530500906", real_estate_license:"1200030428"},
    {title:"استراحة بمساحات خضراء", city:"المدينة المنورة", district:"أحد", property_type:"استراحة", area_sqm:800, rooms:null, price_original:950000, discount_pct:15, price_final:807500, image_url:"https://images.pexels.com/photos/8134745/pexels-photo-8134745.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", description:"استراحة عائلية بمساحة واسعة، مناسبة للتجمعات العائلية والمناسبات الصغيرة.\nالمساحة الكلية: 800 م² (مبنى + حديقة) — العمر: 4 سنوات.\n\nالمواصفات:\nصالة استقبال كبيرة\n٢ دورة مياه\nمطبخ خارجي ومجلس شاي\nغرفة نوم واحدة للضيافة\n\nالمرافق الخارجية:\nحديقة خضراء واسعة\nمسبح صغير\nملعب أطفال\nمواقف سيارات متعددة\n\nمميزات الموقع:\nقريبة من جبل أحد\nأجواء هادئة بعيدة عن الزحام\nسهولة الوصول من طريق الأمير عبدالمجيد", map_url:"https://www.google.com/maps/search/حي+أحد+المدينة+المنورة", marketer_name:"همة المدينة العقارية", marketer_phone:"966530500906", real_estate_license:"1200030428"},
  ],
  en: [
    {title:"Upscale Luxury Villa", city:"Riyadh", district:"Al Olaya", property_type:"Villa", area_sqm:410, rooms:6, price_original:3850000, discount_pct:8, price_final:3542000, image_url:"https://images.pexels.com/photos/16573669/pexels-photo-16573669.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", description:"Detached villa with an upscale modern finish, two floors plus an annex.\nArea: 410 sqm — Age: 2 years.\n\nSpecifications:\n6 bedrooms (2 master suites)\n5 bathrooms\n2 living rooms\nFully fitted kitchen\nMaid's room with bathroom\nLaundry room and storage\n\nOutdoor:\nPrivate pool\nFront and back garden\nCovered parking for 2 cars\n\nFeatures:\nCentral A/C\nSecurity system with cameras\nIndoor elevator\n\nLocation highlights:\nNear King Fahd Road\nClose to major shopping centers\nNear schools and mosques", map_url:"https://www.google.com/maps/search/Al+Olaya+Riyadh", marketer_name:"Himmat Al Madinah Real Estate", marketer_phone:"966530500906", real_estate_license:"1200030428"},
    {title:"Apartment with Sea View", city:"Jeddah", district:"Al Shati", property_type:"Apartment in a tower", area_sqm:165, rooms:3, price_original:980000, discount_pct:12, price_final:862400, image_url:"https://images.pexels.com/photos/11631278/pexels-photo-11631278.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", description:"Upscale apartment on the 7th floor, direct and full Red Sea views.\nArea: 165 sqm — Age: 1 year.\n\nSpecifications:\n3 bedrooms (master with en-suite bathroom)\n3 bathrooms\nSea-facing living room\nFitted kitchen\nLaundry room\n\nFeatures:\nFully air-conditioned (split units)\nFully equipped kitchen\nPrivate basement parking\n2 tower elevators\n\nLocation highlights:\nDirectly on Jeddah Corniche\nNear Jeddah's famous towers\nClose to waterfront restaurants and cafes", map_url:"https://www.google.com/maps/search/Al+Shati+Jeddah", marketer_name:"Himmat Al Madinah Real Estate", marketer_phone:"966530500906", real_estate_license:"1200030428"},
    {title:"Commercial Land Near the Haram", city:"Madinah", district:"Quba", property_type:"Land", area_sqm:500, rooms:null, price_original:1500000, discount_pct:5, price_final:1425000, image_url:"https://images.pexels.com/photos/4525178/pexels-photo-4525178.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", description:"Commercial land in a strategic location, planned and licensed for commercial construction.\nArea: 500 sqm — approx. 20m frontage.\nSurvey and e-deed ready.\n\nSpecifications:\nRectangular plot, suitable for a commercial building or investment residential\nFronts two streets (main and secondary)\nAll utilities available (power, water, sewage)\n\nLocation highlights:\nMinutes from the Prophet's Mosque\nClose to the historic Quba district\nNear public transit and visitor parking", map_url:"https://www.google.com/maps/search/Quba+Madinah", marketer_name:"Himmat Al Madinah Real Estate", marketer_phone:"966530500906", real_estate_license:"1200030428"},
    {title:"Spacious Family Duplex", city:"Riyadh", district:"Al Narjis", property_type:"Duplex", area_sqm:320, rooms:5, price_original:2100000, discount_pct:10, price_final:1890000, image_url:"https://images.pexels.com/photos/10647324/pexels-photo-10647324.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", description:"Family duplex with a modern interior design, two independent floors.\nArea: 320 sqm — Age: 3 years.\n\nSpecifications:\n5 bedrooms (2 on ground floor, 3 upstairs)\n4 bathrooms\n2 living rooms\nFitted kitchen\nMaid's room and driver's room\n\nAmenities:\nInternal staircase between floors\nSmall backyard\n2 covered parking spots\n\nLocation highlights:\nIn the vibrant Al Narjis district, north Riyadh\nNear international schools and shopping malls\nEasy access to King Salman Road", map_url:"https://www.google.com/maps/search/Al+Narjis+Riyadh", marketer_name:"Himmat Al Madinah Real Estate", marketer_phone:"966530500906", real_estate_license:"1200030428"},
    {title:"Move-in Ready Apartment", city:"Makkah", district:"Al Aziziyah Al Shamaliyah", property_type:"Apartment in a building", area_sqm:140, rooms:3, price_original:720000, discount_pct:7, price_final:669600, image_url:"https://images.pexels.com/photos/38000582/pexels-photo-38000582.png?auto=compress&cs=tinysrgb&h=650&w=940", description:"Clean, move-in ready apartment on the 3rd floor of a quiet residential building.\nArea: 140 sqm — Age: 5 years.\n\nSpecifications:\n3 bedrooms\n2 bathrooms\n1 living room\nKitchen (unfitted)\n\nFeatures:\nSplit A/C in every room\nBuilt-in wall closets in main bedrooms\nStreet parking\n\nLocation highlights:\nNear the Grand Mosque (shuttle service from the district)\nClose to Al Aziziyah local markets\nNearby public transit stops", map_url:"https://www.google.com/maps/search/Al+Aziziyah+Al+Shamaliyah+Makkah", marketer_name:"Himmat Al Madinah Real Estate", marketer_phone:"966530500906", real_estate_license:"1200030428"},
    {title:"Chalet with Green Spaces", city:"Madinah", district:"Uhud", property_type:"Chalet / Resthouse", area_sqm:800, rooms:null, price_original:950000, discount_pct:15, price_final:807500, image_url:"https://images.pexels.com/photos/8134745/pexels-photo-8134745.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", description:"Family chalet with generous outdoor space, suited to family gatherings and small events.\nTotal area: 800 sqm (building + garden) — Age: 4 years.\n\nSpecifications:\nLarge reception hall\n2 bathrooms\nOutdoor kitchen and tea majlis\n1 guest bedroom\n\nOutdoor:\nSpacious green garden\nSmall pool\nKids' play area\nMultiple parking spots\n\nLocation highlights:\nNear Mount Uhud\nQuiet, away from the city bustle\nEasy access from Prince Abdulmajeed Road", map_url:"https://www.google.com/maps/search/Uhud+Madinah", marketer_name:"Himmat Al Madinah Real Estate", marketer_phone:"966530500906", real_estate_license:"1200030428"},
  ],
};

const FAQ_I18N = {
  ar: [
    {q:"كيف أضيف عقاري؟", a:"من قسم «إضافة»، أدخل بيانات العقار ثم اضغط «إدراج للمراجعة». يظهر عقارك في «التحليلات» بعد مراجعة قصيرة من فريقنا لضمان جودة البيانات."},
    {q:"هل المؤشر معتمد رسمياً؟", a:"لا. هذا مؤشر استرشادي ناتج معادلة حسابية شفافة (سعر المتر × المساحة مع معاملات تعديل)، وليس تقييماً معتمداً من هيئة رسمية ولا نموذج ذكاء اصطناعي مُدرَّب."},
    {q:"هل يمكنني توقيع العقد مباشرة؟", a:"من قسم «العقود» يمكنك تعبئة بيانات العقد وتوليده وحفظه في قاعدة بياناتنا، ثم طباعته للتوقيع. الحفظ يشمل جدول الدفعات كاملاً تلقائياً."},
    {q:"هل تغطون مدناً أخرى؟", a:"حالياً نغطي المدينة المنورة ومكة المكرمة وجدة والرياض، ويمكنك إضافة مدينة غير مدرجة مباشرة من قسم المؤشر أو إضافة عقار."},
    {q:"هل الأدوات مجانية؟", a:"نعم، أداة المؤشر الاسترشادي ومولّد العقود متاحة مجاناً."},
    {q:"كيف أتواصل مع فريق الدعم؟", a:"عبر قسم «تواصل» يمكنك مراسلتنا واتساب أو بريد إلكتروني أو الاتصال المباشر."},
    {q:"هل العروض المعروضة مخزون كامل؟", a:"العروض نماذج قابلة للتحديث وليست بالضرورة مخزوناً كاملاً؛ تواصل معنا للتأكد من توفر عقار محدد."},
    {q:"كيف يعمل المساعد الذكي؟", a:"يجاوب على الأسئلة العامة بذكاء اصطناعي حقيقي (Gemini) عبر خادم وسيط آمن — مفتاح الاتصال محفوظ على الخادم فقط، أبداً لا يظهر بكود الموقع. لو سألت عن عقار محدَّد (مدينة/سعر/نوع)، يبحث لك مباشرة بقاعدة بياناتنا الحقيقية بدل الذكاء الاصطناعي، لضمان دقة الأرقام."},
    {q:"أين تُخزَّن بياناتي؟", a:"في قاعدة بيانات Supabase مركزية محمية بصلاحيات وصول (RLS)، وليس في متصفحك فقط — فهي تبقى محفوظة ومرئية لفريقنا حتى لو غيّرت جهازك."},
  ],
  en: [
    {q:"How do I list my property?", a:"From the “List Property” section, enter the details and click “Submit for review”. It appears in Analytics after a quick review by our team to keep data quality high."},
    {q:"Is the valuation officially certified?", a:"No. It's a guided indicator from a transparent formula (price per sqm × area with adjustment factors) — not a certified valuation and not a trained AI model."},
    {q:"Can I sign a contract directly?", a:"From the Contracts section you can fill in the details, generate the contract, and save it to our database, then print it for signing. The full payment schedule is saved automatically."},
    {q:"Do you cover other cities?", a:"We currently cover Madinah, Makkah, Jeddah and Riyadh, and you can add a city that isn't listed directly from the valuation or add-property forms."},
    {q:"Are the tools free?", a:"Yes, the guided valuation tool and the contract generator are both free."},
    {q:"How do I reach support?", a:"Via the Contact section you can reach us on WhatsApp, email, or by phone."},
    {q:"Are the listed offers full inventory?", a:"Offers are updatable samples, not necessarily full inventory; contact us to confirm availability of a specific property."},
    {q:"How does the guided assistant work?", a:"An in-page assistant driven by programmed rules (keyword matching) that directs you to the right section — not an external AI model, to protect your privacy and avoid exposing any API keys."},
    {q:"Where is my data stored?", a:"In a central Supabase database protected by access policies (RLS), not just in your browser — it stays saved and visible to our team even if you switch devices."},
  ],
};

const PRIVACY_I18N = {
  ar: [
    {h:"مقدمة", p:"نحترم خصوصيتك. توضح هذه السياسة كيف نجمع بياناتك ونستخدمها ونحميها عند استخدامك موقع همة المدينة العقارية."},
    {h:"البيانات التي نجمعها", p:"بيانات التواصل (الاسم، الجوال أو البريد الإلكتروني) عند تعبئة نموذج التواصل أو المؤشر أو إضافة عقار أو كتابة عقد، بالإضافة لبيانات العقار أو العقد التي تُدخلها بنفسك."},
    {h:"كيف نستخدم بياناتك", p:"للرد على استفساراتك، لمراجعة واعتماد العقارات المُضافة قبل نشرها، لإصدار جدول دفعات العقود، ولتحسين جودة خدماتنا."},
    {h:"أين تُخزَّن بياناتك", p:"في قاعدة بيانات Supabase مركزية محمية بصلاحيات وصول محكومة (Row Level Security)، وليست في متصفحك فقط — تبقى محفوظة ومرئية لفريقنا حتى لو غيّرت جهازك."},
    {h:"مشاركة البيانات", p:"لا نبيع بياناتك لأي طرف ثالث. قد نستخدم واتساب للتواصل المباشر بناءً على اختيارك أنت عند الضغط على زر واتساب."},
    {h:"التحقق الأمني (Cloudflare Turnstile)", p:"نستخدم خدمة Cloudflare Turnstile للتحقق التلقائي والخفي من إن زوار المساعد الذكي أشخاص حقيقيون، وليس بوتات. هذي الخدمة قد تعالج بعض بيانات جهازك ومتصفحك وفق سياسة Cloudflare نفسها — راجع <a href=\"https://www.cloudflare.com/turnstile-privacy-policy/\" target=\"_blank\" rel=\"noopener\">ملحق خصوصية Turnstile</a> لمزيد من التفاصيل."},
    {h:"تحليلات الزيارات (Google Analytics)", p:"نستخدم Google Analytics لفهم كيف يتصفّح الزوار الموقع (الصفحات الأكثر زيارة، مصدر الزيارة) بشكل مجمَّع وغير شخصي، بهدف تحسين الموقع. راجع <a href=\"https://policies.google.com/privacy\" target=\"_blank\" rel=\"noopener\">سياسة خصوصية Google</a> لمزيد من التفاصيل."},
    {h:"حقوقك", p:"يحق لك طلب الاطلاع على بياناتك أو تعديلها أو حذفها بالتواصل معنا عبر البريد الإلكتروني الموضّح في صفحة «تواصل»."},
    {h:"الاحتفاظ بالبيانات", p:"نحتفظ ببياناتك طالما لزم لتقديم الخدمة أو للالتزام بالمتطلبات النظامية المعمول بها في المملكة العربية السعودية."},
    {h:"تحديثات على هذه السياسة", p:"قد نحدّث هذه السياسة من وقت لآخر، وسيُنشر أي تحديث على هذه الصفحة مباشرة."},
  ],
  en: [
    {h:"Introduction", p:"We respect your privacy. This policy explains how we collect, use, and protect your data when you use the Himmat Al Madinah Real Estate website."},
    {h:"Data we collect", p:"Contact details (name, phone, or email) when you fill in the contact, valuation, list-property, or contract forms, plus the property or contract details you enter yourself."},
    {h:"How we use your data", p:"To respond to your inquiries, review and approve listed properties before they go live, generate contract payment schedules, and improve our services."},
    {h:"Where your data is stored", p:"In a central Supabase database protected by row-level security policies — not just in your browser. It stays saved and visible to our team even if you switch devices."},
    {h:"Data sharing", p:"We do not sell your data to any third party. WhatsApp may be used for direct contact only when you choose to click the WhatsApp button."},
    {h:"Security verification (Cloudflare Turnstile)", p:"We use Cloudflare Turnstile to automatically and invisibly verify that assistant visitors are real people, not bots. This service may process some data about your device and browser under Cloudflare's own policy — see the <a href=\"https://www.cloudflare.com/turnstile-privacy-policy/\" target=\"_blank\" rel=\"noopener\">Turnstile Privacy Addendum</a> for details."},
    {h:"Visit analytics (Google Analytics)", p:"We use Google Analytics to understand how visitors browse the site (most visited pages, traffic source) in an aggregated, non-personal way, to improve the site. See <a href=\"https://policies.google.com/privacy\" target=\"_blank\" rel=\"noopener\">Google's Privacy Policy</a> for details."},
    {h:"Your rights", p:"You may request access to, correction of, or deletion of your data by contacting us via the email listed on the Contact page."},
    {h:"Data retention", p:"We keep your data as long as needed to provide the service or to comply with applicable regulations in Saudi Arabia."},
    {h:"Updates to this policy", p:"We may update this policy from time to time; any update will be published directly on this page."},
  ],
};

const TERMS_I18N = {
  ar: [
    {h:"قبول الشروط", p:"باستخدامك هذا الموقع فإنك توافق على هذه الشروط بالكامل. إن لم توافق، يرجى عدم استخدام الموقع."},
    {h:"طبيعة الخدمة", p:"يقدّم الموقع مؤشراً عقارياً استرشادياً (معادلة حسابية شفافة، وليس تقييماً معتمداً رسمياً)، ونماذج توليد عقود (نقطة انطلاق وليست بديلاً عن استشارة قانونية متخصصة)."},
    {h:"الملكية الفكرية", p:"كل محتوى هذا الموقع — التصميم والواجهات، الشيفرة البرمجية، خوارزميات حساب المؤشر السعري، قوالب العقود، النصوص، والشعار — ملكية حصرية لهمة المدينة العقارية، محمية بموجب أنظمة حماية حقوق المؤلف والملكية الفكرية المعمول بها بالمملكة العربية السعودية. يُمنع نسخ أي جزء من الموقع أو خوارزمياته أو واجهاته أو إعادة استخدامها بأي شكل (بما في ذلك النسخ، الهندسة العكسية، أو الاستخدام التجاري) دون إذن كتابي مسبق من المالك."},
    {h:"مسؤولية المستخدم", p:"أنت مسؤول عن دقة أي بيانات تُدخلها (بيانات العقار، أطراف العقد، معلومات التواصل)، وعن التحقق منها قبل الاعتماد عليها في أي قرار."},
    {h:"حدود المسؤولية", p:"لا تتحمل همة المدينة العقارية مسؤولية أي قرار مالي أو قانوني يُتخذ استناداً فقط إلى المؤشرات الاسترشادية أو نماذج العقود دون مراجعة مختص عقاري أو قانوني مرخّص."},
    {h:"التعديلات على الشروط", p:"نحتفظ بحق تعديل هذه الشروط في أي وقت، ويُعدّ استمرارك في استخدام الموقع بعد التعديل موافقة عليه."},
    {h:"القانون الحاكم", p:"تخضع هذه الشروط وتُفسَّر وفقاً لأنظمة المملكة العربية السعودية."},
    {h:"التواصل", p:"لأي استفسار بخصوص هذه الشروط، يرجى التواصل معنا عبر صفحة «تواصل»."},
  ],
  en: [
    {h:"Acceptance of terms", p:"By using this site, you agree to these terms in full. If you don't agree, please don't use the site."},
    {h:"Nature of the service", p:"The site provides a guided property indicator (a transparent formula, not a certified official valuation) and contract-drafting templates (a starting point, not a substitute for specialized legal advice)."},
    {h:"Intellectual Property", p:"All content on this website — the design and interfaces, source code, valuation-indicator calculation algorithms, contract templates, text content, and logo — is the exclusive property of Himmat Al Madinah Real Estate, protected under applicable copyright and intellectual property laws in the Kingdom of Saudi Arabia. Copying, reverse-engineering, or reusing any part of the site, its algorithms, or its interfaces in any way (including commercial use) without prior written permission from the owner is prohibited."},
    {h:"User responsibility", p:"You're responsible for the accuracy of any data you enter (property details, contract parties, contact information), and for verifying it before relying on it for any decision."},
    {h:"Limitation of liability", p:"Himmat Al Madinah Real Estate is not liable for any financial or legal decision made based solely on the guided indicators or contract templates without review by a licensed real estate or legal professional."},
    {h:"Changes to these terms", p:"We reserve the right to modify these terms at any time; continued use of the site after changes constitutes acceptance."},
    {h:"Governing law", p:"These terms are governed by and construed in accordance with the laws of Saudi Arabia."},
    {h:"Contact", p:"For any question about these terms, please reach us via the Contact page."},
  ],
};

function renderLegalPages(){
  const priv = PRIVACY_I18N[currentLang] || PRIVACY_I18N.ar;
  const terms = TERMS_I18N[currentLang] || TERMS_I18N.ar;
  document.getElementById('privacy-content').innerHTML = priv.map(s=>`<div class="card" style="padding:18px;margin-bottom:12px"><h4 style="margin:0 0 6px">${s.h}</h4><p style="color:var(--text-600);font-size:14px;margin:0">${s.p}</p></div>`).join('');
  document.getElementById('terms-content').innerHTML = terms.map(s=>`<div class="card" style="padding:18px;margin-bottom:12px"><h4 style="margin:0 0 6px">${s.h}</h4><p style="color:var(--text-600);font-size:14px;margin:0">${s.p}</p></div>`).join('');
}

/* ============================================================================
   3) Cities / districts / property types — shared reference data.
      Loaded from Supabase when connected (so new cities added by any visitor
      become available to everyone); falls back to this seed list otherwise.
      Dammam has been removed per the current scope (Western region only).
   ========================================================================== */
const CITY_LABELS = {
  "المدينة المنورة": { en:"Madinah" },
  "مكة المكرمة":     { en:"Makkah" },
  "جدة":             { en:"Jeddah" },
  "الرياض":          { en:"Riyadh" },
};
function cityLabel(name){
  if (currentLang === 'ar') return name;
  return (CITY_LABELS[name] && CITY_LABELS[name][currentLang]) || name;
}

// Formats a number as a price string (e.g. 862400 -> "862,400"). Used
// everywhere a price/amount is displayed: offer cards, valuation results,
// the finance calculator, analytics table, contract text, assistant results.
function money(n){
  return Math.round(n || 0).toLocaleString('en-US');
}

// Races a Supabase call against a short timeout. Network-level failures
// (a broken DNS resolution, a hung connection) can otherwise take the
// browser 10–30+ seconds to give up on — this makes the site fail fast
// and fall back to demo data almost immediately instead of leaving the
// visitor staring at a slow page.
function withTimeout(promise, ms = 3000){
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)),
  ]);
}

const CITY_DISTRICTS = {
  "المدينة المنورة": ["العزيزية","العاقول","العريض","الخالدية","الزهرة","شظاة","الملك فهد","المبعوث","الروابي","الربوة","الإسكان","الدويمة","قربان","العوالي","الهجرة","العصبة","قباء","القصواء","الرانوناء","شوران","مهزور","مذينب","بني حارثة","بني معاوية","بني ظفر","بني خدرة","بني بياضة","السيح","الفتح","القبلتين","الجامعة","أبو كبير","الجرف","البركة","السلام","الدفاع","طيبة","أحد","سيد الشهداء","المصانع","العيون","النصر","الراية","المناخة","المغيسلة","الوبرة","السكب","الخاتم","أبو بريقاء","وادي البطان","الحرة الشرقية"],
  "مكة المكرمة": ["العوالي","الشوقية","الشرائع","النسيم","الزاهر","العتيبية","العمرة","النوارية","التنعيم","الراشدية","بطحاء قريش","الكعكية","ولي العهد","الحمراء وأم الجود","الزهراء","الضيافة","النزهة","الرصيفة","المسفلة","الهجرة","كدي","جرهم","الروابي","الخالدية","الهنداوية","المنصور","الشبيكة","الشامية","جرول","ريع ذاخر","الحجون","المعابدة","العزيزية الشمالية","الملاوي","العدل","العسيلة","وادي جليل","العمرة الجديدة","البحيرات","الشرائع الشمالية","الشرائع الجنوبية","الصفوة","الملك فهد","الحسينية","العكيشية","الليث الجديد"],
  "جدة": ["الروضة","الزهراء","السلامة","النهضة","الشاطئ","المحمدية","الخالدية","النعيم","النزهة","البوادي","الربوة","الصفا","الفيصلية","الرحاب","مشرفة","العزيزية","الورود","بني مالك","النسيم","الواحة","السامر","المنار","الأجواد","الريان","مريخ","بريمان","المنطقة الصناعية","الجامعة","الفيحاء","السليمانية","الثغر","الروابي","الوزيرية","غليل","مدائن الفهد","البلد","الهنداوية","البغدادية الشرقية","البغدادية الغربية","الكندرة","الصحيفة","السبيل","النزلة الشرقية","النزلة اليمانية","الثعالبة","المحجر","الكرنتينا","الأمير فواز الشمالي","الأمير فواز الجنوبي","السنابل","الهدى","الأجاويد","الفضيلة","الخمرة","القرينية","الحمدانية","الصالحية","الفلاح","الرحمانية","طيبة","الرياض","الكوثر","الياقوت","الزمرد","اللؤلؤ","الأمواج","الشراع","الفردوس","الأصالة","البساتين","أبحر الجنوبية","أبحر الشمالية","المرجان","الشفا","المنتزهات","أم السلم","الحرازات"],
  "الرياض": ["العليا","السليمانية","الملز","الوزارات","الضباط","الورود","الرحمانية","المحمدية","الرائد","النخيل","أم الحمام الشرقي","أم الحمام الغربي","المعذر","المعذر الشمالي","الهدا","الشفا","بدر","المروة","عكاظ","الحزم","ديراب","نمار","ظهرة نمار","العريجاء","العريجاء الغربية","العريجاء الوسطى","ظهرة البديعة","البديعة","السويدي","السويدي الغربي","شبرا","سلطانة","الجرادية","منفوحة","منفوحة الجديدة","الديرة","الشميسي","الفاخرية","العود","المرقب","الصالحية","الخالدية","غبيراء","اليمامة","الربوة","الريان","الروابي","النسيم الشرقي","النسيم الغربي","السلام","المنار","النهضة","الخليج","القدس","الحمراء","غرناطة","الشهداء","قرطبة","اليرموك","المونسية","الرمال","الجنادرية","القادسية","اشبيلية","الملك فيصل","الروضة","الملقا","حطين","العقيق","الصحافة","الياسمين","النرجس","العارض","القيروان","الربيع","الغدير","النفل","الوادي","التعاون","الازدهار","المصيف","المرسلات","الفلاح","الندى","الواحة","صلاح الدين","الملك فهد","الملك عبدالله","الملك عبدالعزيز","المغرزات","النور"],
};
const CITY_PRICE_PER_SQM = { "المدينة المنورة":4200, "مكة المكرمة":6100, "جدة":5800, "الرياض":6500 };

// أسعار متر حقيقية موثّقة لأحياء محددة — مصدرها صفقات فعلية موثّقة من وزارة
// العدل السعودية (عبر منصة رغدان raghdan.sa). الأرقام هنا "بذرة" احتياطية
// تُستخدم فقط لو تعذّر الاتصال بقاعدة البيانات؛ بعد الإقلاع تُستبدَل/تُحدَّث
// تلقائياً من جدول district_prices (يحدّثه Edge Function أسبوعياً). البيانات
// بطبيعتها تراكمية (كل الصفقات المسجَّلة منذ فترة، مو سنة واحدة بالضبط) —
// السبب قلة عدد الصفقات بالحي الواحد سنوياً، فما يكفي لمتوسط سنوي موثوق.
// أي حي مو موجود هنا يستخدم تقدير "متوسط المدينة × تصنيف الحي" (استرشادي).
const DISTRICT_PRICES = {
  "المدينة المنورة": {
    "العزيزية": 1522, "المبعوث": 2690, "قباء": 4839, "الرانوناء": 2186,
    "مذينب": 3593, "طيبة": 2284, "وادي البطان": 863, "أبو بريقاء": 188,
  },
  "مكة المكرمة": {
    "بطحاء قريش": 3519, "العمرة": 1726, "المعابدة": 9431, "الملك فهد": 2881,
  },
  "جدة": {
    "الشاطئ": 6870, "الخالدية": 6667, "المحمدية": 6316, "النهضة": 5930,
    "السلامة": 5361, "الفيحاء": 4138, "المنار": 3639, "الصفا": 3804,
    "الواحة": 3646, "الريان": 3132, "مريخ": 2976, "الرحمانية": 2744,
    "الياقوت": 2883, "القرينية": 2058, "الرياض": 1567,
  },
  "الرياض": {
    "الغدير": 16123, "الصحافة": 12691, "الملقا": 10285, "النرجس": 8559,
    "المغرزات": 10699, "المعذر": 10667, "الياسمين": 5954, "الرمال": 4075,
    "الجنادرية": 2874, "بدر": 2293, "نمار": 1548,
  },
};
// بيانات إضافية (عدد الصفقات ووصف الفترة) لكل حي عنده سعر حقيقي — فاضية
// بالبداية، تتعبى من district_prices بعد الاتصال بقاعدة البيانات، وتُستخدم
// بصياغة sourceNote تحت لعرض وصف دقيق للفترة بدل نص ثابت.
const DISTRICT_PRICE_META = {};
function realDistrictPrice(city, district){
  return DISTRICT_PRICES[city] && DISTRICT_PRICES[city][district];
}

// أسماء الأحياء كما تُنطق بالحروف اللاتينية، تُستخدم في وضعي EN/FR
const DISTRICT_TRANSLIT = {
  "أبحر الجنوبية":"Obhur Al Janubiyah", "أبحر الشمالية":"Obhur Al Shamaliyah", "أبو بريقاء":"Abu Buraiqa",
  "أبو كبير":"Abu Kabeer", "أحد":"Uhud", "أم الحمام الشرقي":"Umm Al Hamam Al Sharqi",
  "أم الحمام الغربي":"Umm Al Hamam Al Gharbi", "أم السلم":"Umm Al Salam", "اشبيلية":"Ishbiliyah",
  "الأجاويد":"Al Ajaweed", "الأجواد":"Al Ajwad", "الأصالة":"Al Asalah",
  "الأمواج":"Al Amwaj", "الأمير فواز الجنوبي":"Al Amir Fawaz Al Janubi", "الأمير فواز الشمالي":"Al Amir Fawaz Al Shamali",
  "الإسكان":"Al Iskan", "الازدهار":"Al Izdihar", "البحيرات":"Al Buhairat",
  "البديعة":"Al Badiah", "البركة":"Al Barakah", "البساتين":"Al Basateen",
  "البغدادية الشرقية":"Al Baghdadiyah Al Sharqiyah", "البغدادية الغربية":"Al Baghdadiyah Al Gharbiyah", "البلد":"Al Balad",
  "البوادي":"Al Bawadi", "التعاون":"Al Taawon", "التنعيم":"Al Tanaim",
  "الثعالبة":"Al Thaalibah", "الثغر":"Al Thaghr", "الجامعة":"Al Jamiah",
  "الجرادية":"Al Jaradiyah", "الجرف":"Al Jurf", "الجنادرية":"Al Janadriyah",
  "الحجون":"Al Hajoun", "الحرازات":"Al Harazat", "الحرة الشرقية":"Al Harrah Al Sharqiyah",
  "الحزم":"Al Hazm", "الحسينية":"Al Husainiyah", "الحمدانية":"Al Hamdaniyah",
  "الحمراء":"Al Hamra", "الحمراء وأم الجود":"Al Hamra wa Umm Al Joud", "الخاتم":"Al Khatim",
  "الخالدية":"Al Khalidiyah", "الخليج":"Al Khaleej", "الخمرة":"Al Khumrah",
  "الدفاع":"Al Difa", "الدويمة":"Al Duwaimah", "الديرة":"Al Dirah",
  "الرائد":"Al Raed", "الراشدية":"Al Rashidiyah", "الرانوناء":"Al Ranuna",
  "الراية":"Al Rayah", "الربوة":"Al Rabwah", "الربيع":"Al Rabee",
  "الرحاب":"Al Rihab", "الرحمانية":"Al Rahmaniyah", "الرصيفة":"Al Rusaifah",
  "الرمال":"Al Rimal", "الروابي":"Al Rawabi", "الروضة":"Al Rawdah",
  "الرياض":"Al Riyadh", "الريان":"Al Rayyan", "الزاهر":"Al Zahir",
  "الزمرد":"Al Zumurrud", "الزهراء":"Al Zahra", "الزهرة":"Al Zahrah",
  "السامر":"Al Samer", "السبيل":"Al Sabeel", "السكب":"Al Sakb",
  "السلام":"Al Salam", "السلامة":"Al Salamah", "السليمانية":"Al Sulaimaniyah",
  "السنابل":"Al Sanabil", "السويدي":"Al Suwaidi", "السويدي الغربي":"Al Suwaidi Al Gharbi",
  "السيح":"Al Sayh", "الشاطئ":"Al Shati", "الشامية":"Al Shamiyah",
  "الشبيكة":"Al Shubaikah", "الشرائع":"Al Sharai", "الشرائع الجنوبية":"Al Sharai Al Janubiyah",
  "الشرائع الشمالية":"Al Sharai Al Shamaliyah", "الشراع":"Al Shiraa", "الشفا":"Al Shifa",
  "الشميسي":"Al Shumaisi", "الشهداء":"Al Shuhada", "الشوقية":"Al Shawqiyah",
  "الصالحية":"Al Salihiyah", "الصحافة":"Al Sahafah", "الصحيفة":"Al Sahifah",
  "الصفا":"Al Safa", "الصفوة":"Al Safwah", "الضباط":"Al Dhubbat",
  "الضيافة":"Al Diyafah", "العارض":"Al Aarid", "العاقول":"Al Aaqool",
  "العتيبية":"Al Utaibiyah", "العدل":"Al Adl", "العريجاء":"Al Uraija",
  "العريجاء الغربية":"Al Uraija Al Gharbiyah", "العريجاء الوسطى":"Al Uraija Al Wusta", "العريض":"Al Areed",
  "العزيزية":"Al Aziziyah", "العزيزية الشمالية":"Al Aziziyah Al Shamaliyah", "العسيلة":"Al Usailah",
  "العصبة":"Al Usbah", "العقيق":"Al Aqeeq", "العكيشية":"Al Ukaishiyah",
  "العليا":"Al Olaya", "العمرة":"Al Umrah", "العمرة الجديدة":"Al Umrah Al Jadidah",
  "العوالي":"Al Awali", "العود":"Al Ood", "العيون":"Al Uyoon",
  "الغدير":"Al Ghadeer", "الفاخرية":"Al Fakhiriyah", "الفتح":"Al Fath",
  "الفردوس":"Al Firdaws", "الفضيلة":"Al Fadilah", "الفلاح":"Al Falah",
  "الفيحاء":"Al Faihaa", "الفيصلية":"Al Faisaliyah", "القادسية":"Al Qadisiyah",
  "القبلتين":"Al Qiblatain", "القدس":"Al Quds", "القرينية":"Al Qurainiyah",
  "القصواء":"Al Qaswa", "القيروان":"Al Qairawan", "الكرنتينا":"Al Karantina",
  "الكعكية":"Al Kakiyah", "الكندرة":"Al Kandarah", "الكوثر":"Al Kawthar",
  "اللؤلؤ":"Al Loulou", "الليث الجديد":"Al Laith Al Jadid", "المبعوث":"Al Mabouth",
  "المحجر":"Al Mahjar", "المحمدية":"Al Muhammadiyah", "المرجان":"Al Murjan",
  "المرسلات":"Al Mursalat", "المرقب":"Al Marqab", "المروة":"Al Marwah",
  "المسفلة":"Al Misfalah", "المصانع":"Al Masani", "المصيف":"Al Maseef",
  "المعابدة":"Al Maabidah", "المعذر":"Al Muather", "المعذر الشمالي":"Al Muather Al Shamali",
  "المغرزات":"Al Mughrizat", "المغيسلة":"Al Mughaysilah", "الملاوي":"Al Malawi",
  "الملز":"Al Malaz", "الملقا":"Al Malqa", "الملك عبدالعزيز":"King Abdulaziz",
  "الملك عبدالله":"King Abdullah", "الملك فهد":"King Fahd", "الملك فيصل":"King Faisal",
  "المناخة":"Al Manakhah", "المنار":"Al Manar", "المنتزهات":"Al Muntazahat",
  "المنصور":"Al Mansour", "المنطقة الصناعية":"Al Mantiqah Al Sinaiyah", "المونسية":"Al Mounisiyah",
  "النخيل":"Al Nakheel", "الندى":"Al Nada", "النرجس":"Al Narjis",
  "النزلة الشرقية":"Al Nazlah Al Sharqiyah", "النزلة اليمانية":"Al Nazlah Al Yamaniyah", "النزهة":"Al Nuzhah",
  "النسيم":"Al Naseem", "النسيم الشرقي":"Al Naseem Al Sharqi", "النسيم الغربي":"Al Naseem Al Gharbi",
  "النصر":"Al Nasr", "النعيم":"Al Naeem", "النفل":"Al Nafal",
  "النهضة":"Al Nahdah", "النوارية":"Al Nawariyah", "النور":"Al Noor",
  "الهجرة":"Al Hijrah", "الهدا":"Al Hada", "الهدى":"Al Huda",
  "الهنداوية":"Al Hindawiyah", "الواحة":"Al Wahah", "الوادي":"Al Wadi",
  "الوبرة":"Al Wabrah", "الورود":"Al Wurood", "الوزارات":"Al Wizarat",
  "الوزيرية":"Al Waziriyah", "الياسمين":"Al Yasmin", "الياقوت":"Al Yaqoot",
  "اليرموك":"Al Yarmouk", "اليمامة":"Al Yamamah", "بدر":"Badr",
  "بريمان":"Bryman", "بطحاء قريش":"Batha Quraish", "بني بياضة":"Bani Bayadah",
  "بني حارثة":"Bani Haritha", "بني خدرة":"Bani Khudrah", "بني ظفر":"Bani Zafar",
  "بني مالك":"Bani Malik", "بني معاوية":"Bani Muawiyah", "جرهم":"Jurhum",
  "جرول":"Jarwal", "حطين":"Hittin", "ديراب":"Dirab",
  "ريع ذاخر":"Rai Dhakhir", "سلطانة":"Sultanah", "سيد الشهداء":"Sayyid Al Shuhada",
  "شبرا":"Shubra", "شظاة":"Shazah", "شوران":"Shawran",
  "صلاح الدين":"Salah Al Din", "طيبة":"Taibah", "ظهرة البديعة":"Dhahrat Al Badiah",
  "ظهرة نمار":"Dhahrat Namar", "عكاظ":"Okaz", "غبيراء":"Ghubaira",
  "غرناطة":"Ghirnatah", "غليل":"Ghulail", "قباء":"Quba",
  "قربان":"Qurban", "قرطبة":"Qurtubah", "كدي":"Kudai",
  "مدائن الفهد":"Madain Al Fahd", "مذينب":"Muzainib", "مريخ":"Mareekh",
  "مشرفة":"Mishrifah", "منفوحة":"Manfouhah", "منفوحة الجديدة":"Manfouhah Al Jadidah",
  "مهزور":"Mahzoor", "نمار":"Namar", "وادي البطان":"Wadi Al Bathan",
  "وادي جليل":"Wadi Jaleel", "ولي العهد":"Waliy Al Ahd",
};

function districtLabel(name){
  if (currentLang === 'ar') return name;
  return DISTRICT_TRANSLIT[name] || name;
}

// نوع العقار قيمة محدودة معروفة (فيلا، شقة، أرض...) ولها ترجمة جاهزة أصلاً
// بمصفوفة PROPERTY_TYPES تحت — عكس اسم المدينة/الحي اللي هي أسماء أعلام
// حقيقية. نفس نمط cityLabel/districtLabel بالضبط.
function typeLabel(name){
  if (currentLang === 'ar') return name;
  return PROPERTY_TYPES.find(pt => pt.v === name)?.en || name;
}

const PROPERTY_TYPES = [
  { v:"فيلا",          mult:1.18, group:"residential", ar:"فيلا",              en:"Villa" },
  { v:"شقة في برج",     mult:1.05, group:"residential", ar:"شقة في برج",         en:"Apartment in a tower" },
  { v:"شقة في عمارة",   mult:1.00, group:"residential", ar:"شقة في عمارة",       en:"Apartment in a building" },
  { v:"أرض",           mult:0.85, group:"land",        ar:"أرض",               en:"Land" },
  { v:"دبلكس",         mult:1.10, group:"residential", ar:"دبلكس",             en:"Duplex" },
  { v:"قصر",           mult:1.50, group:"residential", ar:"قصر",               en:"Palace" },
  { v:"مزرعة",         mult:0.90, group:"land",        ar:"مزرعة",             en:"Farm" },
  { v:"استراحة",       mult:1.05, group:"residential", ar:"استراحة",           en:"Chalet / Resthouse" },
  { v:"محل تجاري",     mult:1.20, group:"commercial",  ar:"محل تجاري",         en:"Retail shop" },
  { v:"مكتب",          mult:1.05, group:"commercial",  ar:"مكتب",              en:"Office" },
  { v:"مخزن",          mult:0.75, group:"commercial",  ar:"مخزن",              en:"Warehouse" },
  { v:"منتجع",         mult:1.35, group:"residential", ar:"منتجع",             en:"Resort" },
  { v:"معرض",          mult:1.15, group:"commercial",  ar:"معرض",              en:"Showroom" },
  { v:"عمارة",         mult:1.30, group:"building",    ar:"عمارة",             en:"Building" },
  { v:"محطة",          mult:1.10, group:"commercial",  ar:"محطة",              en:"Station" },
  { v:"دور",           mult:0.95, group:"residential", ar:"دور",               en:"Floor unit" },
];
const TYPE_GROUP_MAP = Object.fromEntries(PROPERTY_TYPES.map(t => [t.v, t.group]));

/* ----------------------------------------------------------------------------
   Property-type groups — a plot of land doesn't have "rooms" or a maid's room,
   a whole building isn't described by one room count the way a single unit is,
   and a warehouse doesn't come "furnished". Forms adapt per group so only
   fields that actually make sense for the selected type are shown/counted.
   ---------------------------------------------------------------------------- */
const LAND_TYPES = new Set(["أرض", "مزرعة"]);
const BUILDING_TYPES = new Set(["عمارة"]);
const COMMERCIAL_TYPES = new Set(["محل تجاري", "مكتب", "مخزن", "معرض", "محطة"]);
function propertyGroupFor(type){
  if (LAND_TYPES.has(type)) return 'land';
  if (BUILDING_TYPES.has(type)) return 'building';
  if (COMMERCIAL_TYPES.has(type)) return 'commercial';
  return 'residential';
}

/* ============================================================================
   4) Render services / offers / FAQ (all language-aware).
      The social-row icons are static markup directly in the HTML now
      (brand icons/names don't need translation), so no JS renderer needed.
   ========================================================================== */
function renderServices(){
  const list = SERVICES_I18N[currentLang] || SERVICES_I18N.ar;
  document.getElementById('services-grid').innerHTML = list.map(s=>`
    <div class="card service-card fade-up">
      <div class="ic">${s.ic}</div>
      <h4>${s.h}</h4>
      <p>${s.p}</p>
    </div>`).join('');
  observeFadeUps();
}

let OFFER_REGISTRY = {};
let offerKeyCounter = 0;
function registerOffer(o){
  const key = o.id || ('demo-' + (offerKeyCounter++));
  OFFER_REGISTRY[key] = o;
  return key;
}

/* ============================================================================
   Favorites — محفوظة محلياً بمتصفح الزائر (localStorage)، بدون تسجيل دخول
   ولا أي جدول بقاعدة البيانات. تختفي لو الزائر مسح بيانات المتصفح.
   ========================================================================== */
const FAVORITES_KEY = 'himmat_favorites';

/* "شفته مؤخراً" — نفس مبدأ المفضلة بالضبط (localStorage بس، صفر قاعدة
   بيانات)، يخزّن آخر 6 عروض فتح تفاصيلها الزائر. */
const RECENTLY_VIEWED_KEY = 'himmat_recently_viewed';
function getRecentlyViewed(){
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]'); }
  catch (e) { return []; }
}
function trackRecentlyViewed(o){
  try {
    let list = getRecentlyViewed().filter(x => x.id !== o.id);
    list.unshift({ id: o.id, title: o.title, city: o.city, district: o.district, image_url: o.image_url, price_final: o.price_final, price_original: o.price_original });
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list.slice(0, 6)));
  } catch (e) { console.error('trackRecentlyViewed failed', e); }
}
function getFavorites(){
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
  catch(e) { return []; }
}
function isFavorite(key){ return getFavorites().includes(key); }
/* تنبيه Toast خفيف مؤقت — قابل لإعادة الاستخدام بأي مكان بالموقع. */
function showToast(message){
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--navy-900);color:#fff;padding:10px 20px;border-radius:999px;font-size:13.5px;font-weight:700;z-index:200;box-shadow:0 8px 24px rgba(0,0,0,.3);animation:toastPop .25s ease-out';
  document.body.appendChild(toast);
  setTimeout(()=>toast.remove(), 2200);
}

function toggleFavorite(key){
  let favs = getFavorites();
  const btn = document.getElementById('fav-' + key);
  if (favs.includes(key)){
    favs = favs.filter(k => k !== key);
    if (btn) btn.classList.remove('active');
    showToast(currentLang === 'ar' ? '💔 أُزيل من المفضلة' : '💔 Removed from favorites');
  } else {
    favs.push(key);
    if (btn) btn.classList.add('active');
    showToast(currentLang === 'ar' ? '❤️ أُضيف للمفضلة' : '❤️ Added to favorites');
  }
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs)); }
  catch(e) { console.error('toggleFavorite: تعذّر الحفظ بالمتصفح.', e); }
}

function offerCardHtml(o, matchScore){
  const t = I18N[currentLang];
  const key = registerOffer(o);
  const currency = currentLang === 'ar' ? 'ر.س' : 'SAR';
  const cardDisplayPrice = o.price_final ?? o.price_original;
  const cardHasRealDiscount = o.price_original && o.price_final && o.price_original !== o.price_final;
  const priceHtml = cardDisplayPrice
    ? (cardHasRealDiscount
        ? `<span class="price">${money(o.price_final)} ${currency} <s>${money(o.price_original)} ${currency}</s></span>`
        : `<span class="price">${money(cardDisplayPrice)} ${currency}</span>`)
    : `<span class="price">${t.price_on_request}</span>`;
  const imageHtml = o.image_url
    ? `<img src="${o.image_url}" alt="${escapeHtml(o.title)}" class="offer-img" loading="lazy" onerror="this.remove()">`
    : '';
  const soldRibbon = o.is_sold ? `<span class="sold-ribbon">${t.sold_ribbon_label}</span>` : '';
  const pinnedBadge = o.is_pinned ? `<span class="pinned-badge">📌 ${currentLang==='ar' ? 'مميّز' : 'Featured'}</span>` : '';
  const matchBadge = (matchScore !== null && matchScore !== undefined)
    ? `<span class="match-badge" title="${t.match_badge_hint}">🎯 ${matchScore}% ${t.match_badge_label}</span>`
    : '';
  return `<div class="card offer-card fade-up" onclick="openDetailModal('${key}')">
    <button type="button" class="favorite-btn${isFavorite(key) ? ' active' : ''}" id="fav-${key}"
            onclick="event.stopPropagation(); toggleFavorite('${key}')"
            aria-label="${t.favorite_toggle_label}" title="${t.favorite_toggle_label}">
      <svg viewBox="0 0 24 24" width="19" height="19"><path d="M12 21s-7.5-4.6-10.2-9.1C-0.1 8.4 1.6 4.5 5.4 4.5c2.1 0 3.6 1.1 4.3 2.4.7 1.3.7 1.3 0 0 .7-1.3 2.2-2.4 4.3-2.4 3.8 0 5.5 3.9 3.6 7.4C19.5 16.4 12 21 12 21z"/></svg>
    </button>
    ${imageHtml}
    ${soldRibbon}
    ${pinnedBadge}
    <div class="offer-top"><b>${o.title}</b>${o.discount_pct > 0 ? `<span class="offer-discount">-${o.discount_pct}%</span>` : ''}</div>
    <div class="offer-body">
      ${matchBadge}
      <h4>${typeLabel(o.property_type)} · ${districtLabel(o.district)}</h4>
      <div class="loc">${o.city} — ${o.area_sqm} م² · ${o.rooms} ${t.rooms_suffix}</div>
      ${priceHtml}
      <button type="button" class="offer-details-btn" data-offer-key="${key}">${t.detail_view_btn}</button>
    </div>
  </div>`;
}

/* معاينة الوصف الكامل عند تمرير الماوس على زر "عرض التفاصيل الكاملة" —
   عنصر واحد مشترك (مو نسخة داخل كل بطاقة) لأن .offer-card فيها overflow:
   hidden لازمة لقص الصورة والشريط المائل بشكل صحيح، وأي عنصر معاينة
   بداخلها بينقص. نحسب موضعه (position:fixed) بجافاسكربت بدل الاعتماد
   على تموضع CSS تابع للبطاقة. */
let offerPreviewEl = null;
let offerPreviewHideTimer = null;
function ensureOfferPreviewEl(){
  if (offerPreviewEl) return offerPreviewEl;
  offerPreviewEl = document.createElement('div');
  offerPreviewEl.id = 'offer-preview-tooltip';
  offerPreviewEl.style.display = 'none';
  offerPreviewEl.addEventListener('click', e => e.stopPropagation()); // يسمح بتحديد/نسخ النص بدون فتح نافذة التفاصيل
  document.body.appendChild(offerPreviewEl);
  return offerPreviewEl;
}
function showOfferPreview(key, anchorEl){
  const o = OFFER_REGISTRY[key];
  if (!o || !o.description) return;
  clearTimeout(offerPreviewHideTimer);
  const el = ensureOfferPreviewEl();
  el.textContent = o.description;
  const elWidth = Math.min(300, window.innerWidth - 20);
  el.style.width = elWidth + 'px';
  el.style.display = 'block';
  el.style.visibility = 'hidden'; // نقيس الارتفاع الفعلي بدون وميض بمكان خاطئ
  const rect = anchorEl.getBoundingClientRect();
  const elHeight = el.offsetHeight;
  const top = (rect.top >= elHeight + 12) ? (rect.top - elHeight - 8) : (rect.bottom + 8);
  let left = rect.left + rect.width / 2 - elWidth / 2;
  left = Math.max(10, Math.min(left, window.innerWidth - elWidth - 10));
  el.style.top = top + 'px';
  el.style.left = left + 'px';
  el.style.visibility = 'visible';
}
function scheduleHideOfferPreview(){
  clearTimeout(offerPreviewHideTimer);
  offerPreviewHideTimer = setTimeout(()=>{ if (offerPreviewEl) offerPreviewEl.style.display = 'none'; }, 150);
}
document.addEventListener('mouseover', (e)=>{
  const btn = e.target.closest('.offer-details-btn');
  if (btn){ showOfferPreview(btn.dataset.offerKey, btn); return; }
  if (e.target.closest('#offer-preview-tooltip')) clearTimeout(offerPreviewHideTimer);
});
document.addEventListener('mouseout', (e)=>{
  if (e.target.closest('.offer-details-btn') || e.target.closest('#offer-preview-tooltip')) scheduleHideOfferPreview();
});

/* ============================================================================
   Detail modal — full listing info: description, specs, marketer, licenses.
   ========================================================================== */
function galleryNav(btn, dir){
  const container = btn.closest('.detail-gallery');
  if (!container) return;
  const images = JSON.parse(container.dataset.images);
  let index = (parseInt(container.dataset.index, 10) + dir + images.length) % images.length;
  container.dataset.index = index;
  container.querySelector('img').src = images[index];
  container.querySelector('.gallery-counter').textContent = `${index + 1} / ${images.length}`;
}
function openDetailModal(key){
  const o = OFFER_REGISTRY[key];
  if (!o) return;
  logOfferView(o.id); // إحصائية خفيفة، لا تنتظر ولا تعطّل فتح النافذة
  trackRecentlyViewed(o);
  const t = I18N[currentLang];
  const currency = currentLang === 'ar' ? 'ر.س' : 'SAR';

  const modalDisplayPrice = o.price_final ?? o.price_original;
  const modalHasRealDiscount = o.price_original && o.price_final && o.price_original !== o.price_final;
  const priceHtml = modalDisplayPrice
    ? (modalHasRealDiscount
        ? `${money(o.price_final)} ${currency} <s>${money(o.price_original)} ${currency}</s>`
        : `${money(modalDisplayPrice)} ${currency}`)
    : t.price_on_request;

  const specs = [];
  if (o.area_sqm) specs.push({ v: o.area_sqm + ' م²', l: t.f_area });
  if (o.rooms) specs.push({ v: o.rooms, l: t.f_rooms });
  if (o.property_type) specs.push({ v: typeLabel(o.property_type), l: t.f_type });
  if (o.discount_pct) specs.push({ v: '-' + o.discount_pct + '%', l: currentLang==='ar' ? 'الخصم' : 'Discount' });

  const descHtml = o.description
    ? escapeHtml(o.description)
    : t.detail_no_desc;

  const metaRows = [];
  if (o.marketer_name) metaRows.push([t.detail_marketer, escapeHtml(o.marketer_name)]);
  if (o.real_estate_license) metaRows.push([t.detail_license, escapeHtml(o.real_estate_license)]);
  if (o.ad_license) metaRows.push([t.detail_ad_license, escapeHtml(o.ad_license)]);
  const metaHtml = metaRows.length
    ? `<div class="detail-meta">${metaRows.map(([l,v])=>`<div class="detail-meta-row"><span>${l}</span><b>${v}</b></div>`).join('')}</div>`
    : '';

  const contactPhone = o.marketer_phone || '966530500906';
  const waLink = `https://wa.me/${contactPhone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(o.title + ' — ' + o.city)}`;
  const mapButton = o.map_url ? `<a href="${o.map_url}" target="_blank" rel="noopener" class="btn btn-ghost">📍 ${t.detail_map}</a>` : '';
  const galleryImages = (o.image_urls && o.image_urls.length) ? o.image_urls : (o.image_url ? [o.image_url] : []);
  const imageHtml = galleryImages.length > 1
    ? `<div class="detail-gallery" data-images='${JSON.stringify(galleryImages)}' data-index="0">
         <img src="${galleryImages[0]}" alt="${escapeHtml(o.title)}" class="detail-img" onerror="this.parentElement.remove()">
         <button type="button" class="gallery-arrow gallery-prev" onclick="galleryNav(this,-1)" aria-label="prev">‹</button>
         <button type="button" class="gallery-arrow gallery-next" onclick="galleryNav(this,1)" aria-label="next">›</button>
         <span class="gallery-counter">1 / ${galleryImages.length}</span>
       </div>`
    : (galleryImages.length === 1 ? `<img src="${galleryImages[0]}" alt="${escapeHtml(o.title)}" class="detail-img" onerror="this.remove()">` : '');

  document.getElementById('detail-content').innerHTML = `
    ${imageHtml}
    <div class="detail-header">
      <b>${escapeHtml(o.title)}</b>
      ${o.discount_pct ? `<span class="discount">-${o.discount_pct}%</span>` : ''}
    </div>
    <p class="detail-loc">${districtLabel(o.district)} · ${cityLabel(o.city)}</p>
    <p class="detail-price">${priceHtml}</p>
    <div class="detail-specs">${specs.map(s=>`<div class="detail-spec"><b>${s.v}</b><span>${s.l}</span></div>`).join('')}</div>
    <div class="detail-desc">${descHtml}</div>
    ${metaHtml}
    <div class="detail-actions">
      <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-primary">${t.detail_whatsapp}</a>
      ${mapButton}
      <button type="button" class="btn btn-ghost" onclick="shareOffer('${o.id}','${escapeHtml(o.title).replace(/'/g,"\\'")}')">📤 ${currentLang==='ar' ? 'مشاركة عبر واتساب' : 'Share via WhatsApp'}</button>
    </div>
    <div id="similar-offers-section"></div>
    ${recentlyViewedHtml(o.id)}
  `;
  document.getElementById('detail-modal').classList.add('open');
  renderSimilarOffers(o);
}

/* مشاركة رابط مباشر لعرض معيّن — يفتح تفاصيل نفس العرض تلقائياً عند فتحه
   (راجع handleDeepLinkOffer بأسفل). يفتح واتساب مباشرة بنص جاهز — أوثق
   من قائمة مشاركة النظام (navigator.share)، لأنها ما تشمل واتساب دايماً
   بأجهزة الكمبيوتر (خصوصاً ماك)، بعكس الجوال. */
function shareOffer(offerId, title){
  const url = `${location.origin}${location.pathname}#offer-${offerId}`;
  const text = (currentLang === 'ar' ? 'شوف هالعرض: ' : 'Check out this listing: ') + title + '\n' + url;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

/* يجلب عرض بمعرّفه من قاعدة البيانات فعلياً ويفتح تفاصيله — يضمن بيانات
   كاملة وحديثة (مو بيانات جزئية مخزَّنة محلياً بـ"شفته مؤخراً"، اللي ممكن
   تكون قديمة أو ناقصة حقول). */
async function openOfferById(id){
  if (!dbReady) return;
  try {
    const { data, error } = await withTimeout(supa.from('offers').select('*').eq('id', id).eq('is_published', true).maybeSingle());
    if (error || !data) return;
    const key = registerOffer(data);
    openDetailModal(key);
  } catch (e) {
    console.error('openOfferById failed', e);
  }
}

/* رابط مشاركة مباشر (#offer-<id>) يفتح تفاصيل نفس العرض تلقائياً — يُفحص
   مرة عند تحميل الصفحة، بعد ما تجهز بيانات قاعدة البيانات. */
async function handleDeepLinkOffer(){
  const m = location.hash.match(/^#offer-(.+)$/);
  if (!m || !dbReady) return;
  const offerId = m[1];
  try {
    const { data, error } = await withTimeout(supa.from('offers').select('*').eq('id', offerId).eq('is_published', true).maybeSingle());
    if (error || !data) return;
    showPage('offers');
    const key = registerOffer(data);
    openDetailModal(key);
  } catch (e) {
    console.error('handleDeepLinkOffer failed', e);
  }
}

/* "شفته مؤخراً" — عرض فوري (بيانات محلية جاهزة، صفر انتظار)، يعيد استخدام
   نفس تنسيق "عقارات مشابهة" (detail-similar) للاتساق البصري. */
function recentlyViewedHtml(currentId){
  const list = getRecentlyViewed().filter(o => o.id !== currentId).slice(0, 3);
  if (!list.length) return '';
  return `
    <div class="detail-similar">
      <h4>${currentLang === 'ar' ? 'شفته مؤخراً' : 'Recently viewed'}</h4>
      <div class="detail-similar-grid">
        ${list.map(o=>{
          const price = o.price_final ?? o.price_original;
          return `<div class="detail-similar-card" onclick="openOfferById('${o.id}')">
            ${o.image_url ? `<img src="${o.image_url}" alt="${escapeHtml(o.title)}" loading="lazy" onerror="this.remove()">` : ''}
            <div class="detail-similar-info">
              <b>${escapeHtml(o.title)}</b>
              <span>${districtLabel(o.district)} · ${cityLabel(o.city)}</span>
              ${price ? `<span class="detail-similar-price">${money(price)} ${currentLang==='ar'?'ر.س':'SAR'}</span>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* عقارات مشابهة (نفس المدينة، ويُفضَّل نفس النوع لو متوفر) — تُحمَّل
   بالخلفية بعد فتح النافذة بلا أي تأخير على المحتوى الرئيسي. نجرّب أول
   شي القائمة المخزَّنة أصلاً (LAST_OFFERS_LIST، فورية بدون اتصال جديد)،
   ولو ما كانت كافية (مثلاً الزائر جاء من الرئيسية مباشرة بدون ما يزور
   صفحة العروض بعد) نرجع لاستعلام مباشر من قاعدة البيانات كخطة احتياطية. */
async function renderSimilarOffers(current){
  const section = document.getElementById('similar-offers-section');
  if (!section) return;

  const pick = (pool) => pool
    .filter(o => o.id !== current.id && o.city === current.city)
    .sort((a, b) => (b.property_type === current.property_type) - (a.property_type === current.property_type))
    .slice(0, 3);

  let similar = pick(LAST_OFFERS_LIST || []);

  if (similar.length < 2 && dbReady){
    try {
      const { data } = await withTimeout(
        supa.from('offers').select('*').eq('is_published', true).eq('city', current.city).neq('id', current.id).limit(10)
      );
      if (data && data.length) similar = pick(data.concat(similar));
    } catch (e) { console.error('renderSimilarOffers: fallback query failed', e); }
  }

  if (!similar.length){ section.innerHTML = ''; return; }

  const t = I18N[currentLang];
  section.innerHTML = `
    <div class="detail-similar">
      <h4>${currentLang === 'ar' ? 'عقارات مشابهة' : 'Similar properties'}</h4>
      <div class="detail-similar-grid">
        ${similar.map(o=>{
          const key = registerOffer(o);
          const price = o.price_final ?? o.price_original;
          return `<div class="detail-similar-card" onclick="openDetailModal('${key}')">
            ${o.image_url ? `<img src="${o.image_url}" alt="${escapeHtml(o.title)}" loading="lazy" onerror="this.remove()">` : ''}
            <div class="detail-similar-info">
              <b>${escapeHtml(o.title)}</b>
              <span>${districtLabel(o.district)} · ${cityLabel(o.city)}</span>
              ${price ? `<span class="detail-similar-price">${money(price)} ${currentLang==='ar'?'ر.س':'SAR'}</span>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}
document.getElementById('detail-close').addEventListener('click', ()=>{
  document.getElementById('detail-modal').classList.remove('open');
});
document.getElementById('detail-modal').addEventListener('click', e=>{
  if (e.target.id === 'detail-modal') document.getElementById('detail-modal').classList.remove('open');
});
document.addEventListener('keydown', e=>{
  if (e.key === 'Escape') document.getElementById('detail-modal')?.classList.remove('open');
});

function readOfferFilters(){
  return {
    city: document.getElementById('filter-city').value || null,
    type: document.getElementById('filter-type').value || null,
    minPrice: parseFloat(document.getElementById('filter-min-price').value) || null,
    maxPrice: parseFloat(document.getElementById('filter-max-price').value) || null,
    minRooms: parseFloat(document.getElementById('filter-min-rooms').value) || null,
  };
}

function matchesFilters(o, f){
  const price = o.price_final ?? o.price ?? o.price_original;
  if (f.city && o.city !== cityLabel(f.city) && o.city !== f.city) return false;
  if (f.type && o.property_type !== f.type) return false;
  if (f.minPrice && price && price < f.minPrice) return false;
  if (f.maxPrice && price && price > f.maxPrice) return false;
  if (f.minRooms && o.rooms && o.rooms < f.minRooms) return false;
  return true;
}

/**
 * محرك مطابقة بسيط وشفاف (بدون ذكاء اصطناعي) — يعطي كل عرض نسبة توافق
 * مبنية على أوزان واضحة، بدل الاستبعاد الصارم. عرض قريب من الميزانية أو
 * ناقص غرفة واحدة يبقى يظهر (بترتيب أدنى)، بدل ما يختفي كلياً.
 * يرجع null لو المستخدم ما حدد أي تفضيل (يعني ما فيه داعي لعرض نسبة).
 */
function computeMatchScore(o, f){
  const hasAnyPref = f.type || f.minPrice || f.maxPrice || f.minRooms;
  if (!hasAnyPref) return null;

  const price = o.price_final ?? o.price ?? o.price_original ?? 0;
  let score = 0, max = 0;

  // نوع العقار — وزن 25
  max += 25;
  score += f.type ? (o.property_type === f.type ? 25 : 0) : 25;

  // نطاق السعر — وزن 45 (الأهم عادة لمعظم المشترين)
  max += 45;
  if (f.minPrice || f.maxPrice){
    const lo = f.minPrice || 0, hi = f.maxPrice || Infinity;
    if (price >= lo && price <= hi){
      score += 45;
    } else {
      const ref = price < lo ? lo : hi;
      const diffRatio = ref ? Math.abs(price - ref) / ref : 1;
      score += Math.max(0, 45 * (1 - diffRatio * 1.5));
    }
  } else {
    score += 45;
  }

  // عدد الغرف — وزن 30
  max += 30;
  if (f.minRooms){
    if (o.rooms == null) score += 15; // أرض مثلاً — ما ينطبق عليها، نصف درجة محايدة
    else if (o.rooms >= f.minRooms) score += 30;
    else score += Math.max(0, 30 - (f.minRooms - o.rooms) * 8);
  } else {
    score += 30;
  }

  return Math.round((score / max) * 100);
}

/* آخر قائمة عروض جُلبت فعلياً — تُستخدم للتبديل الفوري بين التبويبات
   (الأحدث/الأعلى خصماً/الأعلى سعراً...) بدون أي استعلام جديد لقاعدة البيانات. */
let LAST_OFFERS_LIST = [];
let currentOfferSort = 'newest';

function sortOffersList(list, sortKey){
  const arr = [...list];
  const price = o => o.price_final ?? o.price ?? o.price_original ?? 0;
  const pinned = o => o.is_pinned ? 1 : 0;
  switch(sortKey){
    case 'discount': return arr.sort((a,b) => (pinned(b) - pinned(a)) || ((b.discount_pct||0) - (a.discount_pct||0)));
    case 'price_desc': return arr.sort((a,b) => (pinned(b) - pinned(a)) || (price(b) - price(a)));
    case 'price_asc': return arr.sort((a,b) => (pinned(b) - pinned(a)) || (price(a) - price(b)));
    default: return arr.sort((a,b) => (pinned(b) - pinned(a)) || (new Date(b.created_at) - new Date(a.created_at))); // newest
  }
}

function applySortTab(sortKey){
  currentOfferSort = sortKey;
  document.querySelectorAll('.offer-sort-tab').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.sort === sortKey);
  });
  const grid = document.getElementById('offers-grid');
  if (!LAST_OFFERS_LIST.length) return;
  const sorted = sortOffersList(LAST_OFFERS_LIST, sortKey);
  grid.innerHTML = sorted.map(o => offerCardHtml(o)).join('');
  observeFadeUps();
}

function skeletonCardsHtml(count){
  return Array(count).fill(0).map(()=>`
    <div class="card skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-line" style="width:70%"></div>
      <div class="skeleton-line" style="width:45%"></div>
      <div class="skeleton-line" style="width:55%"></div>
    </div>`).join('');
}

async function renderOffers(filters){
  const f = filters || readOfferFilters();
  const grid = document.getElementById('offers-grid');
  if (!grid.children.length) grid.innerHTML = skeletonCardsHtml(6);
  if (dbReady){
    try {
      // نُبقي فلترة المدينة صارمة (أغلب المشترين ما يفكرون بمدينة ثانية)،
      // وبقية التفضيلات (نوع، سعر، غرف) تُحسب كنسبة توافق بدل استبعاد صارم
      let query = supa.from('offers').select('*').eq('is_published', true).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(30);
      if (f.city) query = query.eq('city', f.city);
      const { data, error } = await withTimeout(query);
      if (!error && data && data.length){
        LAST_OFFERS_LIST = data;
        const scored = data.map(o => ({ o, score: computeMatchScore(o, f) }));
        if (scored[0].score !== null) scored.sort((a, b) => b.score - a.score);
        grid.innerHTML = scored.map(({o, score}) => offerCardHtml(o, score)).join('');
        observeFadeUps();
        return;
      }
      if (!error && data && !data.length){
        grid.innerHTML = `<div class="notice notice-info" style="grid-column:1/-1">${I18N[currentLang].offers_no_match}</div>`;
        return;
      }
    } catch (e) {
      console.error('renderOffers: Supabase call failed, falling back to demo data.', e);
    }
  }
  const demoAll = (DEMO_OFFERS_I18N[currentLang] || DEMO_OFFERS_I18N.ar)
    .filter(o => !f.city || o.city === cityLabel(f.city) || o.city === f.city);
  const demoLabel = { ar:"عروض توضيحية — اربط قاعدة البيانات لعرض العروض الفعلية.",
                       en:"Demo offers — connect the database to show real offers." }[currentLang];
  if (!demoAll.length){
    grid.innerHTML = `<div class="notice notice-info" style="grid-column:1/-1">${I18N[currentLang].offers_no_match}</div>`;
    return;
  }
  const demoScored = demoAll.map(o => ({ o, score: computeMatchScore(o, f) }));
  if (demoScored[0].score !== null) demoScored.sort((a, b) => b.score - a.score);
  LAST_OFFERS_LIST = demoAll;
  grid.innerHTML = demoScored.map(({o, score}) => offerCardHtml(o, score)).join('') +
    `<div class="notice notice-warn" style="grid-column:1/-1">${demoLabel}</div>`;
  observeFadeUps();
}

async function renderFeatured(){
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  grid.innerHTML = skeletonCardsHtml(3);
  let items = [];
  if (dbReady){
    try {
      const { data, error } = await withTimeout(supa.from('offers').select('*').eq('is_published', true).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3));
      if (!error && data && data.length) items = data;
    } catch (e) {
      console.error('renderFeatured: Supabase call failed, falling back to demo data.', e);
    }
  }
  if (!items.length){
    items = (DEMO_OFFERS_I18N[currentLang] || DEMO_OFFERS_I18N.ar).slice(0, 3);
  }
  grid.innerHTML = items.map(o => offerCardHtml(o)).join('');
  observeFadeUps();
}

function populateFilterSelects(){
  const t = I18N[currentLang];
  const citySel = document.getElementById('filter-city');
  const prevCity = citySel.value;
  citySel.innerHTML = `<option value="">${t.filter_all}</option>` +
    Object.keys(CITY_DISTRICTS).map(c=>`<option value="${c}">${cityLabel(c)}</option>`).join('');
  citySel.value = prevCity;

  const typeSel = document.getElementById('filter-type');
  const prevType = typeSel.value;
  typeSel.innerHTML = `<option value="">${t.filter_all}</option>` +
    PROPERTY_TYPES.map(pt=>`<option value="${pt.v}">${pt[currentLang] || pt.ar}</option>`).join('');
  typeSel.value = prevType;
}

document.getElementById('btn-apply-filters').addEventListener('click', ()=> renderOffers());

/* ============================================================================
   "دوّر عليه" — اختبار تفضيلات ذكي وممتع، بدل تعبئة نموذج فلترة جامد.
   يعيد استخدام حقول الفلترة ومحرك المطابقة الموجودَين أصلاً (computeMatchScore)
   — صفر منطق مطابقة جديد، بس تجربة أكثر متعة لتعبئة نفس الفلاتر.
   ========================================================================== */
const QUIZ_QUESTIONS = [
  { key:'city', type:'city', label:{ar:'وش المدينة اللي تدوّر فيها؟',en:'Which city are you looking in?'} },
  { key:'type', type:'type', label:{ar:'وش نوع العقار المفضّل؟',en:'What property type do you prefer?'} },
  { key:'maxPrice', type:'options', label:{ar:'وش أقصى ميزانية تقريباً؟',en:'What\'s your approximate max budget?'},
    options:[
      {label:{ar:'أقل من مليون',en:'Under 1M'}, value:1000000},
      {label:{ar:'1 – 2 مليون',en:'1M – 2M'}, value:2000000},
      {label:{ar:'2 – 3 مليون',en:'2M – 3M'}, value:3000000},
      {label:{ar:'أكثر من 3 مليون',en:'Over 3M'}, value:999999999},
    ]},
  { key:'minRooms', type:'options', label:{ar:'كم غرفة تحتاج على الأقل؟',en:'Minimum rooms needed?'},
    options:[
      {label:{ar:'غرفتين أو أكثر',en:'2+'}, value:2},
      {label:{ar:'3 غرف أو أكثر',en:'3+'}, value:3},
      {label:{ar:'4 غرف أو أكثر',en:'4+'}, value:4},
      {label:{ar:'ما يهمّني',en:"Doesn't matter"}, value:null},
    ]},
];
let quizAnswers = {};
let quizStepIndex = 0;

function renderQuizStep(){
  const container = document.getElementById('quiz-steps');
  const q = QUIZ_QUESTIONS[quizStepIndex];
  const progress = `${quizStepIndex + 1} / ${QUIZ_QUESTIONS.length}`;
  let inputHtml = '';

  if (q.type === 'city'){
    inputHtml = `<select id="quiz-answer-input">${Object.keys(CITY_DISTRICTS).map(c=>`<option value="${c}">${cityLabel(c)}</option>`).join('')}</select>
      <button type="button" class="btn btn-primary" id="btn-quiz-next" style="margin-top:14px">${currentLang==='ar'?'التالي':'Next'}</button>`;
  } else if (q.type === 'type'){
    inputHtml = `<div class="quiz-options">${PROPERTY_TYPES.slice(0,6).map(t=>`<button type="button" class="quiz-option-btn" data-value="${t.v}">${t[currentLang]||t.ar}</button>`).join('')}<button type="button" class="quiz-option-btn" data-value="">${currentLang==='ar'?'أي نوع':'Any type'}</button></div>`;
  } else {
    inputHtml = `<div class="quiz-options">${q.options.map(o=>`<button type="button" class="quiz-option-btn" data-value="${o.value ?? ''}">${o.label[currentLang]||o.label.ar}</button>`).join('')}</div>`;
  }

  container.innerHTML = `
    <p style="font-size:12px;color:var(--text-600);margin:0 0 6px">${progress}</p>
    <h4 style="margin:0 0 14px">${q.label[currentLang]||q.label.ar}</h4>
    ${inputHtml}
    ${quizStepIndex > 0 ? `<button type="button" class="btn btn-ghost" id="btn-quiz-back" style="margin-top:14px">${currentLang==='ar'?'رجوع':'Back'}</button>` : ''}
  `;

  if (q.type === 'city'){
    document.getElementById('btn-quiz-next').addEventListener('click', ()=>{
      quizAnswers.city = document.getElementById('quiz-answer-input').value;
      advanceQuiz();
    });
  } else {
    container.querySelectorAll('.quiz-option-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const val = btn.dataset.value;
        quizAnswers[q.key] = (val === '') ? null : (isNaN(val) ? val : Number(val));
        advanceQuiz();
      });
    });
  }
  const backBtn = document.getElementById('btn-quiz-back');
  if (backBtn) backBtn.addEventListener('click', ()=>{ quizStepIndex--; renderQuizStep(); });
}

function advanceQuiz(){
  quizStepIndex++;
  if (quizStepIndex >= QUIZ_QUESTIONS.length) finishQuiz();
  else renderQuizStep();
}

function finishQuiz(){
  document.getElementById('filter-city').value = quizAnswers.city || '';
  document.getElementById('filter-type').value = quizAnswers.type || '';
  document.getElementById('filter-max-price').value = quizAnswers.maxPrice || '';
  document.getElementById('filter-min-rooms').value = quizAnswers.minRooms || '';
  renderOffers();
  document.getElementById('match-quiz-card').style.display = 'none';
  document.getElementById('offers-grid').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
}

document.getElementById('btn-start-quiz').addEventListener('click', ()=>{
  quizAnswers = {};
  quizStepIndex = 0;
  document.getElementById('quiz-intro').style.display = 'none';
  document.getElementById('quiz-steps').style.display = 'block';
  renderQuizStep();
});
document.getElementById('btn-reset-filters').addEventListener('click', ()=>{
  document.getElementById('filter-city').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-min-price').value = '';
  document.getElementById('filter-max-price').value = '';
  document.getElementById('filter-min-rooms').value = '';
  renderOffers({});
});

/* ============================================================================
   Hero smart search — بحث سريع مباشر بالهيرو بفلترة فورية (بدون استعلام
   جديد لقاعدة البيانات؛ يستخدم نفس LAST_OFFERS_LIST المحمّلة أصلاً للعروض).
   ========================================================================== */
function populateHeroSearch(){
  const t = I18N[currentLang];
  const citySel = document.getElementById('hero-search-city');
  const prevCity = citySel.value;
  citySel.innerHTML = `<option value="">${t.filter_all}</option>` +
    Object.keys(CITY_DISTRICTS).map(c=>`<option value="${c}">${cityLabel(c)}</option>`).join('');
  citySel.value = prevCity;

  const typeSel = document.getElementById('hero-search-type');
  const prevType = typeSel.value;
  const heroTypeDatalist = document.getElementById('hero-search-type-datalist');
  if (heroTypeDatalist){
    heroTypeDatalist.innerHTML = PROPERTY_TYPES.map(pt=>`<option value="${pt.v}" label="${pt[currentLang] || pt.ar}">`).join('');
  }
  typeSel.value = prevType;
}

function readHeroSearch(){
  return {
    city: document.getElementById('hero-search-city').value || null,
    type: document.getElementById('hero-search-type').value || null,
    maxPrice: parseFloat(document.getElementById('hero-search-budget').value) || null,
  };
}

function updateHeroSearchCount(){
  const countEl = document.getElementById('hero-search-count');
  if (!countEl) return;
  const f = readHeroSearch();
  const n = LAST_OFFERS_LIST.filter(o => matchesFilters(o, { city: f.city, type: f.type, maxPrice: f.maxPrice })).length;
  const t = I18N[currentLang];
  countEl.textContent = LAST_OFFERS_LIST.length
    ? (n ? t.hero_search_count_some.replace('{n}', n) : t.hero_search_count_none)
    : '';
}
['hero-search-city','hero-search-type','hero-search-budget'].forEach(id=>{
  document.getElementById(id)?.addEventListener('input', updateHeroSearchCount);
  document.getElementById(id)?.addEventListener('change', updateHeroSearchCount);
});
document.getElementById('hero-search-btn')?.addEventListener('click', ()=>{
  const f = readHeroSearch();
  document.getElementById('filter-city').value = f.city || '';
  document.getElementById('filter-type').value = f.type || '';
  document.getElementById('filter-max-price').value = f.maxPrice || '';
  showPage('offers');
  renderOffers();
});

function renderFaq(){
  const list = FAQ_I18N[currentLang] || FAQ_I18N.ar;
  document.getElementById('faq-list').innerHTML = list.map(f=>`
    <details class="faq-item fade-up"><summary>${f.q} <span>+</span></summary><p>${f.a}</p></details>
  `).join('');
  observeFadeUps();
}

/* ============================================================================
   5) City / district / type selects — shared across valuation, add-property,
      and contracts forms. Loads from Supabase (cities/districts tables) when
      connected, so a city added by one visitor becomes available to everyone;
      otherwise falls back to the seed lists above.
   ========================================================================== */
async function loadCitiesFromDb(){
  if (!dbReady) return;
  try {
    // كانت هذه الاستعلامات تشتغل بالتتابع (واحد بعد الآخر) — لو تعطّل
    // الاتصال، تضاعف وقت الانتظار الأقصى لضعفين. تشغيلهم بالتوازي يحل
    // هذا مباشرة، بالإضافة لمهلة قصوى مشتركة أقصر (3 ثوانٍ بدل 4).
    const [citiesRes, districtsRes] = await Promise.all([
      withTimeout(supa.from('cities').select('name, price_per_sqm'), 3000),
      withTimeout(supa.from('districts').select('name, cities(name)'), 3000),
    ]);
    const { data: cities, error: e1 } = citiesRes;
    const { data: districts, error: e2 } = districtsRes;
    if (e1 || !cities || !cities.length) return;
    if (e2) return;

    // Rebuild the shared maps from live data without discarding the local seed
    // (in case the DB has fewer districts seeded than this file for some city).
    cities.forEach(c=>{
      if (!CITY_DISTRICTS[c.name]) CITY_DISTRICTS[c.name] = [];
      if (c.price_per_sqm) CITY_PRICE_PER_SQM[c.name] = c.price_per_sqm;
    });
    (districts || []).forEach(d=>{
      const cityName = d.cities?.name;
      if (!cityName) return;
      if (!CITY_DISTRICTS[cityName]) CITY_DISTRICTS[cityName] = [];
      if (!CITY_DISTRICTS[cityName].includes(d.name)) CITY_DISTRICTS[cityName].push(d.name);
    });
  } catch (e) {
    console.error('loadCitiesFromDb: Supabase call failed, keeping the built-in seed list.', e);
  }
}

/* أسعار الأحياء الحقيقية — تحدّثها Edge Function أسبوعياً من رغدان (انظر
   supabase/functions/update-district-prices). تُدمَج فوق DISTRICT_PRICES
   الثابتة (البذرة الاحتياطية)، فأي حي بقاعدة البيانات يطغى على رقمه القديم،
   وأي حي غير موجود بعد بقاعدة البيانات يبقى على رقم البذرة أو التقدير العام. */
async function loadDistrictPricesFromDb(){
  if (!dbReady) return;
  try {
    const { data, error } = await withTimeout(
      supa.from('district_prices')
        .select('price_per_sqm, transaction_count, period_note, updated_at, source, manual_price_low, manual_price_high, manual_source_note, districts(name, cities(name))'),
      3000
    );
    if (error || !data) return;

    data.forEach(row=>{
      const cityName = row.districts?.cities?.name;
      const districtName = row.districts?.name;
      if (!cityName || !districtName || !row.price_per_sqm) return;
      if (!DISTRICT_PRICES[cityName]) DISTRICT_PRICES[cityName] = {};
      DISTRICT_PRICES[cityName][districtName] = row.price_per_sqm;
      if (!DISTRICT_PRICE_META[cityName]) DISTRICT_PRICE_META[cityName] = {};
      DISTRICT_PRICE_META[cityName][districtName] = {
        count: row.transaction_count,
        periodNote: row.period_note,
        updatedAt: row.updated_at,
        source: row.source,
        manualLow: row.manual_price_low,
        manualHigh: row.manual_price_high,
        manualNote: row.manual_source_note,
      };
    });
  } catch (e) {
    console.error('loadDistrictPricesFromDb: Supabase call failed, keeping the built-in seed prices.', e);
  }
}

function populateCitySelects(){
  document.querySelectorAll('select.city-select').forEach(sel=>{
    const prev = sel.value;
    sel.innerHTML = Object.keys(CITY_DISTRICTS).map(city=>
      `<option value="${city}" data-price="${CITY_PRICE_PER_SQM[city] || ''}">${cityLabel(city)}</option>`
    ).join('');
    if (prev && CITY_DISTRICTS[prev]) sel.value = prev;
    populateDistrictSelectFor(sel.id);
  });
}

function populateDistrictSelectFor(citySelectId){
  const citySel = document.getElementById(citySelectId);
  const districtInput = document.querySelector(`.district-select[data-city-of="${citySelectId}"]`);
  if (!citySel || !districtInput) return;
  const list = CITY_DISTRICTS[citySel.value] || [];
  const prev = districtInput.value;
  const datalist = document.getElementById(districtInput.getAttribute('list'));
  if (datalist){
    datalist.innerHTML = list.map(d=>`<option value="${d}" label="${districtLabel(d)}">`).join('');
  }
  if (!list.includes(prev)) districtInput.value = '';
}

document.querySelectorAll('select.city-select').forEach(sel=>{
  sel.addEventListener('change', ()=> populateDistrictSelectFor(sel.id));
});

// يخفي "تصنيف الحي" اليدوي فقط لما يكون عندنا سعر حي حقيقي موثّق (يصير
// التصنيف اليدوي زائداً ومربكاً وقتها، لأن السعر الحقيقي أدق منه أصلاً)
function updateGradeFieldVisibility(){
  const gradeWrap = document.getElementById('v-grade-wrap');
  if (!gradeWrap) return;
  const city = document.getElementById('v-city').value;
  const district = document.getElementById('v-district').value;
  gradeWrap.style.display = realDistrictPrice(city, district) ? 'none' : '';
}
document.getElementById('v-district')?.addEventListener('change', ()=>{
  updateGradeFieldVisibility();
  try { runValuation(); } catch(e){}
});
document.getElementById('v-city')?.addEventListener('change', ()=>{
  setTimeout(updateGradeFieldVisibility, 0); // بعد ما تتحدّث قائمة الأحياء
});

function populateTypeSelects(){
  document.querySelectorAll('.type-select').forEach(sel=>{
    const prev = sel.value;
    const datalist = document.getElementById(sel.getAttribute('list'));
    if (datalist){
      datalist.innerHTML = PROPERTY_TYPES.map(t=>`<option value="${t.v}" label="${t[currentLang] || t.ar}">`).join('');
    }
    if (PROPERTY_TYPES.some(t=>t.v===prev)) sel.value = prev;
  });
}

/* Add-city modal — shared by all three forms */
document.querySelectorAll('.amenity-row').forEach(row=>{
  row.addEventListener('click', e=>{
    const btn = e.target.closest('.amenity-toggle');
    if (btn) btn.classList.toggle('active');
  });
});

/* ============================================================================
   4) Valuation (transparent formula — honestly labeled, not an AI model)
   ========================================================================== */
function getAmenityAdj(containerId){
  let adj = 0;
  const active = [];
  document.querySelectorAll(`#${containerId} .amenity-toggle.active`).forEach(btn=>{
    adj += parseFloat(btn.dataset.adj) || 0;
    active.push(btn.dataset.amenity);
  });
  return { adj, active };
}

/* ----------------------------------------------------------------------------
   Shows/hides valuation fields based on the selected property type's group,
   so a plot of land isn't asked about room count or a maid's room, and a
   whole building gets floor/unit-count fields instead of one room count.
   ---------------------------------------------------------------------------- */
function updateValuationFieldsForType(){
  const type = document.getElementById('v-type').value;
  const group = propertyGroupFor(type);

  document.getElementById('v-rooms-wrap').style.display = (group === 'residential') ? '' : 'none';
  document.getElementById('v-age-wrap').style.display = (group === 'land') ? 'none' : '';
  document.getElementById('v-floors-wrap').style.display = (group === 'building') ? '' : 'none';
  document.getElementById('v-units-wrap').style.display = (group === 'building') ? '' : 'none';
  document.getElementById('v-amenities-wrap').style.display = (group === 'land') ? 'none' : '';

  document.querySelectorAll('#v-amenities .amenity-toggle').forEach(btn=>{
    const scope = btn.dataset.scope || 'residential';
    const show = group === 'residential' || (scope === 'broad' && group !== 'land');
    btn.style.display = show ? '' : 'none';
    if (!show) btn.classList.remove('active');
  });
}
document.getElementById('v-type').addEventListener('change', updateValuationFieldsForType);

function runValuation(){
  const citySel = document.getElementById('v-city');
  const cityVal = citySel.value;
  const districtSel = document.getElementById('v-district');
  const districtVal = districtSel.value;
  const realPrice = realDistrictPrice(cityVal, districtVal);
  const usingRealPrice = !!realPrice;
  const pricePerSqm = usingRealPrice ? realPrice : parseFloat(citySel.selectedOptions[0].dataset.price);
  const typeSel = document.getElementById('v-type');
  const typeVal = typeSel.value;
  const group = propertyGroupFor(typeVal);
  const typeMult = (PROPERTY_TYPES.find(t => t.v === typeSel.value) || {}).mult || 1;
  const facadeSel = document.getElementById('v-facade');
  const facadeAdj = parseFloat(facadeSel.selectedOptions[0].dataset.adj);
  const gradeSel = document.getElementById('v-grade');
  // لو عندنا سعر حي حقيقي موثّق، ما نضيف تصنيف الحي التقديري فوقه (يكرر
  // نفس الأثر مرتين) — السعر الحقيقي أصلاً يعكس خصوصية الحي بدقة أكبر.
  const gradeAdj = usingRealPrice ? 0 : parseFloat(gradeSel.selectedOptions[0].dataset.adj);
  const area = parseFloat(document.getElementById('v-area').value) || 0;

  const base = pricePerSqm * area * typeMult;

  // العمر لا يُحسب لقطعة أرض (الأرض لا "تكبر" بنفس منطق المبنى)
  let ageAdj = 0;
  if (group !== 'land'){
    const age = parseFloat(document.getElementById('v-age').value) || 0;
    ageAdj = age > 15 ? -0.1 : age > 7 ? -0.05 : 0;
  }

  // عدد الغرف يؤثر فقط على الوحدات السكنية المفردة (فيلا، شقة...) — كان
  // الحقل موجوداً بالنموذج قبل بدون أي أثر فعلي على السعر، صار فعّالاً الآن
  let roomsAdj = 0;
  if (group === 'residential'){
    const rooms = parseFloat(document.getElementById('v-rooms').value) || 0;
    roomsAdj = Math.max(-0.10, Math.min(0.15, (rooms - 3) * 0.02));
  }

  // لمبنى كامل (عمارة): عدد الوحدات المستقلة (أدوار × شقق بكل دور) يعطي
  // زيادة طفيفة بالقيمة الاستثمارية — كل وحدة إضافية تعني دخل إيجاري مستقل إضافي
  let unitsAdj = 0;
  let totalUnits = 0;
  if (group === 'building'){
    const floors = parseFloat(document.getElementById('v-floors').value) || 0;
    const unitsPerFloor = parseFloat(document.getElementById('v-units-per-floor').value) || 0;
    totalUnits = floors * unitsPerFloor;
    unitsAdj = totalUnits > 1 ? Math.min(0.15, (totalUnits - 1) * 0.01) : 0;
  }

  // لا إضافات (مفروش/خادمة/إلخ) تُحسب لقطعة أرض؛ الأنواع الأخرى تستخدم فقط
  // الإضافات الظاهرة فعلياً لها (getAmenityAdj تقرأ من العناصر المرئية فقط
  // لأن الأزرار المخفية تُلغى تفعيلها تلقائياً في updateValuationFieldsForType)
  const amenityAdj = (group === 'land') ? 0 : getAmenityAdj('v-amenities').adj;

  const totalAdj = 1 + facadeAdj + gradeAdj + ageAdj + amenityAdj + roomsAdj + unitsAdj;
  const estimate = base * totalAdj;

  const low = estimate * 0.93;
  const high = estimate * 1.07;

  document.getElementById('res-low').textContent = money(low);
  document.getElementById('res-high').textContent = money(high);

  // بناء سطر التعديلات ديناميكياً — يعرض فقط العوامل الفعلية المطبّقة لهذا
  // النوع، بدل عرض "العمر 0% + الإضافات 0%" لعقار ما تنطبق عليه أصلاً
  const pctLabels = {
    ar: { facade:'الواجهة', grade:'الحي', age:'العمر', amenities:'الإضافات', rooms:'الغرف', units:'الوحدات' },
    en: { facade:'facade', grade:'district', age:'age', amenities:'amenities', rooms:'rooms', units:'units' },
  };
  const L = pctLabels[currentLang] || pctLabels.ar;
  const fmtPct = v => (v >= 0 ? '+' : '') + (v*100).toFixed(0) + '%';
  const adjParts = [`${L.facade} ${fmtPct(facadeAdj)}`];
  if (!usingRealPrice) adjParts.push(`${L.grade} ${fmtPct(gradeAdj)}`);
  if (group !== 'land') adjParts.push(`${L.age} ${fmtPct(ageAdj)}`);
  if (group === 'residential') adjParts.push(`${L.rooms} ${fmtPct(roomsAdj)}`);
  if (group === 'building') adjParts.push(`${L.units} ${fmtPct(unitsAdj)} (${totalUnits} ${currentLang==='ar' ? 'وحدة' : 'units'})`);
  if (group !== 'land') adjParts.push(`${L.amenities} ${fmtPct(amenityAdj)}`);
  const adjLine = adjParts.join(' + ');

  // وصف الفترة الفعلي — من قاعدة البيانات (عدد الصفقات + آخر تحديث) لو
  // متوفر، وإلا نص عام دقيق بدون الادّعاء بسنة واحدة محدَّدة (كانت المشكلة
  // السابقة: "2020–2026" ثابتة بالكود رغم إن البيانات تراكمية بطبيعتها).
  const priceMeta = DISTRICT_PRICE_META[cityVal]?.[districtVal];
  const periodDesc = {
    ar: priceMeta
      ? `بيانات تراكمية (${priceMeta.count ? money(priceMeta.count) + ' صفقة موثّقة، ' : ''}آخر تحديث ${new Date(priceMeta.updatedAt).toLocaleDateString('ar-SA')})`
      : 'بيانات تراكمية موثّقة (مو لسنة واحدة بالضبط — راجع تفاصيل المصدر)',
    en: priceMeta
      ? `cumulative data (${priceMeta.count ? money(priceMeta.count) + ' documented deals, ' : ''}last updated ${new Date(priceMeta.updatedAt).toLocaleDateString('en-GB')})`
      : 'cumulative documented data (not a single specific year — see source for details)',
  };

  const isManual = priceMeta?.source === 'manual';
  const sourceNote = {
    ar: isManual
      ? `سعر المتر (${money(pricePerSqm)} ر.س) متوسط نطاق سعري مُدخَل يدوياً لحي ${districtVal}: ${money(priceMeta.manualLow)}–${money(priceMeta.manualHigh)} ر.س/م²${priceMeta.manualNote ? ' — المصدر: ' + priceMeta.manualNote : ''}.`
      : usingRealPrice
      ? `سعر المتر (${money(pricePerSqm)} ر.س) وسيط صفقات فعلية موثّقة لحي ${districtVal} — ${periodDesc.ar} (مصدر: وزارة العدل عبر رغدان العقارية) — قد يختلف عن سعر السوق الحالي بالضبط في الأحياء سريعة الارتفاع.`
      : `سعر المتر (${money(pricePerSqm)} ر.س) هو متوسط استرشادي لمدينة ${cityVal} بالكامل (ما فيه بيانات صفقات فعلية موثّقة لحي ${districtVal} بعد)، معدَّل بتصنيف الحي اليدوي.`,
    en: isManual
      ? `The per-sqm price (${money(pricePerSqm)} SAR) is the midpoint of a manually entered range for ${districtVal}: ${money(priceMeta.manualLow)}–${money(priceMeta.manualHigh)} SAR/sqm${priceMeta.manualNote ? ' — source: ' + priceMeta.manualNote : ''}.`
      : usingRealPrice
      ? `The per-sqm price (${money(pricePerSqm)} SAR) is a median of documented transactions for ${districtVal} — ${periodDesc.en} (source: Ministry of Justice via Raghdan) — may differ from the exact current market price in fast-appreciating districts.`
      : `The per-sqm price (${money(pricePerSqm)} SAR) is a citywide indicator for ${cityVal} (no verified transaction data for ${districtVal} yet), adjusted by the manual district grade.`,
  };
  const priceSourceEl = document.getElementById('v-price-source');
  priceSourceEl.className = 'notice ' + ((usingRealPrice || isManual) ? 'notice-ok-source' : 'notice-warn');
  priceSourceEl.innerHTML = ((usingRealPrice || isManual) ? '✅ ' : '⚠️ ') + (sourceNote[currentLang] || sourceNote.ar);

  const bd = {
    ar: `السعر الأساسي = ${money(pricePerSqm)} ر.س/م² × ${area} م² × معامل النوع ${typeMult} = ${money(base)} ر.س<br>
         التعديلات: ${adjLine}<br>
         <b>هذه معادلة حسابية شفافة بالكامل، وليست تنبؤاً من نموذج تعلّم آلي.</b>`,
    en: `Base price = ${money(pricePerSqm)} SAR/sqm × ${area} sqm × type factor ${typeMult} = ${money(base)} SAR<br>
         Adjustments: ${adjLine}<br>
         <b>This is a fully transparent formula, not a machine-learning prediction.</b>`,
  };
  document.getElementById('val-breakdown').innerHTML = bd[currentLang] || bd.ar;
  return estimate;
}
document.getElementById('btn-run-valuation').addEventListener('click', runValuation);

// تحديث السعر تلقائياً فور تغيير أي عنصر — بدون حاجة لضغط زر "احسب" يدوياً
const VALUATION_LIVE_IDS = ['v-city','v-district','v-type','v-area','v-rooms','v-age',
  'v-floors','v-units-per-floor','v-facade','v-grade'];
VALUATION_LIVE_IDS.forEach(id=>{
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', ()=>{ try { runValuation(); } catch(e){} });
});
document.getElementById('v-amenities').addEventListener('click', ()=>{
  setTimeout(()=>{ try { runValuation(); } catch(e){} }, 0);
});

/* Financing calculator */
function runFinance(){
  const price = parseFloat(document.getElementById('fin-price').value) || 0;
  const down = parseFloat(document.getElementById('fin-down').value) || 0;
  const rate = (parseFloat(document.getElementById('fin-rate').value) || 0) / 100 / 12;
  const years = parseFloat(document.getElementById('fin-years').value) || 1;
  const n = years * 12;
  const principal = Math.max(price - down, 0);
  const monthly = rate === 0 ? principal / n : principal * rate * Math.pow(1+rate, n) / (Math.pow(1+rate, n) - 1);
  document.getElementById('finance-result').textContent = money(monthly) + (currentLang==='ar' ? ' ر.س' : ' SAR');
}
['fin-price','fin-down','fin-rate','fin-years'].forEach(id=>{
  document.getElementById(id).addEventListener('input', runFinance);
});

/* ============================================================================
   5) Add property → persisted in Supabase (status forced to 'pending' server-side)
   ========================================================================== */
/* ----------------------------------------------------------------------------
   Same group-aware field visibility as the valuation form, applied to the
   Add Property form.
   ---------------------------------------------------------------------------- */
function updateAddPropertyFieldsForType(){
  const type = document.getElementById('add-type').value;
  const group = propertyGroupFor(type);

  document.getElementById('add-rooms-wrap').style.display = (group === 'residential') ? '' : 'none';
  document.getElementById('add-age-wrap').style.display = (group === 'land') ? 'none' : '';
  document.getElementById('add-floors-wrap').style.display = (group === 'building') ? '' : 'none';
  document.getElementById('add-units-wrap').style.display = (group === 'building') ? '' : 'none';
  document.getElementById('add-amenities-wrap').style.display = (group === 'land') ? 'none' : '';

  document.querySelectorAll('#add-amenities .amenity-toggle').forEach(btn=>{
    const scope = btn.dataset.scope || 'residential';
    const show = group === 'residential' || (scope === 'broad' && group !== 'land');
    btn.style.display = show ? '' : 'none';
    if (!show) btn.classList.remove('active');
  });
}
document.getElementById('add-type').addEventListener('change', updateAddPropertyFieldsForType);

document.getElementById('btn-add-property').addEventListener('click', async ()=>{
  const msg = document.getElementById('add-property-msg');
  const { active: amenities } = getAmenityAdj('add-amenities');
  const group = propertyGroupFor(document.getElementById('add-type').value);
  const payload = {
    city: document.getElementById('add-city').value,
    district: document.getElementById('add-district').value,
    property_type: document.getElementById('add-type').value,
    price: parseFloat(document.getElementById('add-price').value) || 0,
    area_sqm: parseFloat(document.getElementById('add-area').value) || 0,
    rooms: group === 'residential' ? (parseInt(document.getElementById('add-rooms').value, 10) || null) : null,
    age_years: group !== 'land' ? (parseInt(document.getElementById('add-age').value, 10) || null) : null,
    floors_count: group === 'building' ? (parseInt(document.getElementById('add-floors').value, 10) || null) : null,
    units_per_floor: group === 'building' ? (parseInt(document.getElementById('add-units-per-floor').value, 10) || null) : null,
    submitted_by_contact: document.getElementById('add-contact').value || null,
    description: document.getElementById('add-description').value || null,
    map_url: document.getElementById('add-map-url').value || null,
    real_estate_license: document.getElementById('add-re-license').value || null,
    ad_license: document.getElementById('add-ad-license').value || null,
    has_elevator: group !== 'land' && amenities.includes('elevator'),
    has_maid_room: group === 'residential' && amenities.includes('maid_room'),
    has_driver_room: group === 'residential' && amenities.includes('driver_room'),
    has_central_ac: group !== 'land' && amenities.includes('central_ac'),
    is_furnished: group === 'residential' && amenities.includes('furnished'),
  };
  if (!payload.district || !payload.price || !payload.area_sqm){
    msg.textContent = '⚠️ عبّئ الحي والسعر والمساحة على الأقل.';
    msg.style.color = 'var(--danger)';
    return;
  }
  if (!dbReady){
    msg.textContent = '⚠️ قاعدة البيانات غير مربوطة بعد — لا يمكن حفظ العقار حالياً.';
    msg.style.color = 'var(--danger)';
    return;
  }
  try {
    const turnstileToken = await getTurnstileToken();
    const { data, error: fnError } = await supa.functions.invoke('public-submit', {
      body: { type: 'property', payload, turnstileToken },
    });
    const error = fnError || (data && data.error ? { message: data.error } : null);
    if (error){
      msg.textContent = '⚠️ تعذّر الحفظ: ' + error.message;
      msg.style.color = 'var(--danger)';
    } else {
      msg.textContent = '✅ تم الإرسال — سيظهر عقارك في التحليلات بعد المراجعة.';
      msg.style.color = 'var(--ok)';
    }
  } catch (e) {
    msg.textContent = '⚠️ تعذّر الاتصال بقاعدة البيانات — تحقق من اتصالك وحاول مجدداً.';
    msg.style.color = 'var(--danger)';
    console.error('btn-add-property: Supabase call failed.', e);
  }
});

/* ============================================================================
   6) Analytics — reads real approved properties, shared by everyone
   ========================================================================== */
async function renderAnalytics(){
  const tbody = document.getElementById('analytics-tbody');
  if (!dbReady) return;

  try {
    const { data, error } = await withTimeout(supa.from('properties').select('*').eq('status','approved').order('created_at', {ascending:false}).limit(50));
    if (error || !data || !data.length) return;

    document.getElementById('stat-live-count').dataset.target = data.length;
    tbody.innerHTML = data.map(p=>`<tr><td>${cityLabel(p.city)}</td><td>${districtLabel(p.district)}</td><td>${typeLabel(p.property_type)}</td><td>${money(p.price)}</td><td>${p.area_sqm}</td></tr>`).join('');

    const byCity = {};
    data.forEach(p=>{ byCity[p.city] = byCity[p.city] || []; byCity[p.city].push(p.price / p.area_sqm); });
    const rows = Object.keys(byCity)
      .map(c => ({ city: c, value: byCity[c].reduce((a,b)=>a+b,0) / byCity[c].length }))
      .sort((a,b) => b.value - a.value); // الأغلى أول — يعطي إحساس ترتيب/تصنيف واضح

    renderPriceBars(rows);
  } catch (e) {
    console.error('renderAnalytics: Supabase call failed — analytics table stays empty, but the rest of the page still loads.', e);
  }
}

/* إنفوجرافيك أفقي مخصَّص (بدون أي مكتبة رسم بياني — صفر كيلوبايت إضافية):
   أشرطة Pill-shaped بتدرج ذهبي فخم، بدل الأعمدة الرأسية التقليدية. كل صف
   "بطاقة" مستقلة (أيقونة + اسم + شريط + قيمة)، مرتّبة تنازلياً من الأغلى. */
function renderPriceBars(rows){
  const container = document.getElementById('analytics-chart');
  if (!container) return;
  if (!rows.length){ container.innerHTML = ''; return; }
  const maxVal = Math.max(...rows.map(r => r.value));
  container.innerHTML = rows.map(r=>{
    const pct = Math.max(8, Math.round((r.value / maxVal) * 100)); // حد أدنى 8% عشان أي قيمة تبقى مرئية
    return `
    <div class="price-bar-row">
      <div class="price-bar-label"><span class="price-bar-icon">🏙️</span><span>${cityLabel(r.city)}</span></div>
      <div class="price-bar-track"><div class="price-bar-fill" style="width:${pct}%"></div></div>
      <div class="price-bar-value">${money(r.value)} <small>ر.س/م²</small></div>
    </div>`;
  }).join('');
}

/* ============================================================================
   7) Contracts — persisted via the secure RPC (create_contract_with_schedule)
   ========================================================================== */
document.querySelectorAll('.tabs button[data-tab]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  });
});

/* تحقق من اكتمال ومنطقية بيانات العقد قبل أي توليد أو إرسال — يرجّع قائمة
   أخطاء (فاضية = العقد سليم) ويعلّم الحقول الناقصة بصرياً بلون أحمر. */
/* تطبيع الأرقام أثناء الكتابة — لو المستخدم يكتب بلوحة مفاتيح عربية، بعض
   المتصفحات تدخل أرقام عربية-هندية (٠١٢٣...) بدل اللاتينية، فيصير شكل الرقم
   غير ثابت بين حقل وآخر. نحوّلها فوراً للاتينية بكل حقول الهوية/الجوال. */
const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
function normalizeDigitsInput(e){
  const el = e.target;
  const normalized = el.value.replace(/[٠-٩]/g, d => String(ARABIC_INDIC_DIGITS.indexOf(d)));
  if (normalized !== el.value){
    const pos = el.selectionStart;
    el.value = normalized;
    el.setSelectionRange(pos, pos);
  }
}
// نطبّقها على كل حقول الموقع تلقائياً (تفويض حدث على document)، بدل تعداد
// حقول محددة يدوياً — يضمن أي حقل نص/رقم حالي أو مستقبلي (بأي صفحة) يشتغل
// صح تلقائياً بدون ما ننسى نضيفه للقائمة. آمنة 100% على أي نص عربي عادي
// (أسماء، أوصاف) لأن الاستبدال يستهدف فقط رموز الأرقام العربية-هندية
// (٠-٩)، مو أي حرف عربي عادي.
document.addEventListener('input', (e)=>{
  const el = e.target;
  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
  if (['checkbox','radio','file','hidden','color'].includes(el.type)) return;
  normalizeDigitsInput(e);
});

/* لو نوع الهوية "وطنية"، الجنسية سعودية دائماً (الهوية الوطنية تصدر
   للسعوديين حصراً) — نعبّيها تلقائياً بدل ما يكتبها المستخدم يدوياً كل مرة،
   وتبقى قابلة للتعديل لو احتاج. */
function autoFillNationality(idTypeSelectId, nationalityInputId){
  const idTypeEl = document.getElementById(idTypeSelectId);
  const nationalityEl = document.getElementById(nationalityInputId);
  idTypeEl?.addEventListener('change', ()=>{
    if (idTypeEl.value === 'national_id'){
      nationalityEl.value = currentLang === 'ar' ? 'سعودي' : 'Saudi';
    }
  });
}
autoFillNationality('c-lessor-id-type', 'c-lessor-nationality');
autoFillNationality('c-lessee-id-type', 'c-lessee-nationality');

function validateContractForm(){
  const v = id => document.getElementById(id).value.trim();
  document.querySelectorAll('#contracts .input-error').forEach(el => el.classList.remove('input-error'));

  const mark = id => document.getElementById(id)?.classList.add('input-error');
  const errors = [];
  const required = {
    'c-lessor-name': 'اسم المؤجر', 'c-lessor-id': 'هوية المؤجر', 'c-lessor-phone': 'جوال المؤجر',
    'c-lessor-id-type': 'نوع هوية المؤجر', 'c-lessor-nationality': 'جنسية المؤجر',
    'c-lessee-name': 'اسم المستأجر', 'c-lessee-id': 'هوية المستأجر', 'c-lessee-phone': 'جوال المستأجر',
    'c-lessee-id-type': 'نوع هوية المستأجر', 'c-lessee-nationality': 'جنسية المستأجر',
    'c-city': 'المدينة', 'c-district': 'الحي', 'c-unit-type': 'نوع الوحدة',
    'c-area': 'المساحة', 'c-start': 'تاريخ البداية', 'c-end': 'تاريخ النهاية', 'c-rent': 'الإيجار السنوي',
    'c-deed-number': 'رقم الصك', 'c-deed-date': 'تاريخ الصك', 'c-frequency': 'عدد الدفعات سنوياً',
  };
  Object.entries(required).forEach(([id, label]) => {
    if (!v(id)){ errors.push(`${label} مطلوب.`); mark(id); }
  });

  const area = parseFloat(v('c-area'));
  if (v('c-area') && (!Number.isFinite(area) || area <= 0)){ errors.push('المساحة لازم تكون رقم أكبر من صفر.'); mark('c-area'); }

  const rent = parseFloat(v('c-rent'));
  if (v('c-rent') && (!Number.isFinite(rent) || rent <= 0)){ errors.push('الإيجار السنوي لازم يكون رقم أكبر من صفر.'); mark('c-rent'); }

  if (v('c-start') && v('c-end')){
    const startD = new Date(v('c-start'));
    const endD = new Date(v('c-end'));
    if (endD <= startD){
      errors.push('تاريخ النهاية لازم يكون بعد تاريخ البداية.');
      mark('c-start'); mark('c-end');
    } else if (startD.getFullYear() < 2015 || endD.getFullYear() > 2075 || (endD - startD) > 50 * 365.25 * 24 * 3600 * 1000){
      errors.push('مدة العقد غير منطقية — تحقق من صحة السنة بتاريخي البداية والنهاية (مثال شائع: كتابة 0026 بدل 2026).');
      mark('c-start'); mark('c-end');
    }
  }

  return errors;
}

document.querySelectorAll('#contracts .field input, #contracts .field select').forEach(el=>{
  el.addEventListener('input', ()=> el.classList.remove('input-error'));
  el.addEventListener('change', ()=> el.classList.remove('input-error'));
});

// نص رسالة واتساب الجاهز لآخر عقد تولّد — يُخزَّن هنا ويُستخدم بزر "طباعة
// العقد" (مو يُفتح فوراً وقت التوليد)، عشان واتساب يفتح بنفس لحظة حفظ PDF.
let lastContractWhatsAppText = null;

document.getElementById('btn-generate-contract').addEventListener('click', async ()=>{
  const msg = document.getElementById('contract-msg');
  const pre = document.getElementById('contract-text');

  const validationErrors = validateContractForm();
  if (validationErrors.length){
    msg.innerHTML = '⚠️ ' + (currentLang==='ar' ? 'العقد ناقص، صحّح قبل الإرسال:' : 'The contract is incomplete, fix before sending:') +
      '<br>' + validationErrors.map(e => '• ' + e).join('<br>');
    msg.style.color = 'var(--danger)';
    pre.classList.add('hide');
    document.querySelector('#contracts .input-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const isResidential = document.querySelector('.tabs button.active').dataset.tab === 'residential';
  const contractType = isResidential ? 'سكني' : 'تجاري';    // canonical value stored in the DB
  const t = I18N[currentLang];
  const contractTypeLabel = isResidential ? t.type_residential : t.type_commercial;

  const v = id => document.getElementById(id).value;
  const cityDisplay = cityLabel(v('c-city'));
  const typeDisplay = PROPERTY_TYPES.find(pt=>pt.v===v('c-unit-type'))?.[currentLang] || v('c-unit-type');
  const contractNumber = 'HMD-' + Date.now();
  const rent = parseFloat(v('c-rent')) || 0;
  const currency = currentLang==='ar' ? 'ر.س' : 'SAR';
  const frequencyLabels = {
    ar: {1:'سنوي (دفعة واحدة)', 2:'نصف سنوي', 4:'ربع سنوي', 12:'شهري'},
    en: {1:'Annual (one payment)', 2:'Semi-annual', 4:'Quarterly', 12:'Monthly'},
  };
  const frequencyVal = parseInt(document.getElementById('c-frequency').value, 10);
  const frequencyDisplay = frequencyLabels[currentLang]?.[frequencyVal] || frequencyVal;

  const text = `${t.contract_header} — ${contractTypeLabel}
${t.contract_number_label}: ${contractNumber}
${t.contract_lessor_label}: ${v('c-lessor-name')} (${t.contract_id_label}: ${v('c-lessor-id')} — ${t.contract_phone_label2}: ${v('c-lessor-phone')} — ${t.contract_dob_label}: ${v('c-lessor-dob') || '—'})
${t.contract_lessee_label}: ${v('c-lessee-name')} (${t.contract_id_label}: ${v('c-lessee-id')} — ${t.contract_phone_label2}: ${v('c-lessee-phone')} — ${t.contract_dob_label}: ${v('c-lessee-dob') || '—'})
${t.contract_property_label}: ${typeDisplay} — ${districtLabel(v('c-district'))}, ${cityDisplay} — ${v('c-area')} م²${v('c-floor-number') ? ' — ' + (currentLang==='ar' ? 'الدور' : 'Floor') + ': ' + v('c-floor-number') : ''}
${t.contract_term_label}: ${t.contract_term_from} ${v('c-start')} ${t.contract_term_to} ${v('c-end')}
${t.contract_rent_label}: ${money(rent)} ${currency} — ${t.contract_deposit_label}: ${money(parseFloat(v('c-deposit'))||0)} ${currency}
${t.contract_frequency_label}: ${frequencyDisplay}`;

  pre.textContent = text;
  pre.classList.remove('hide');

  // تعبئة قالب الطباعة/PDF بنفس البيانات (بدون أي تأثير على منطق واتساب/الحفظ
  // أدناه — قسم مستقل تماماً حتى ما يخاطر بكسر التدفق الأساسي الشغّال).
  document.getElementById('pv-title').textContent = `${t.contract_header} — ${contractTypeLabel}`;
  document.getElementById('pv-number').textContent = `${t.contract_number_label}: ${contractNumber}`;
  document.getElementById('pv-lessor-h').textContent = t.contract_lessor_label;
  document.getElementById('pv-lessee-h').textContent = t.contract_lessee_label;
  document.getElementById('pv-lessor-info').innerHTML =
    `${escapeHtml(v('c-lessor-name'))}<br>${t.contract_id_label}: ${escapeHtml(v('c-lessor-id'))}<br>${t.contract_phone_label2}: ${escapeHtml(v('c-lessor-phone'))}<br>${t.contract_dob_label}: ${v('c-lessor-dob') || '—'}`;
  document.getElementById('pv-lessee-info').innerHTML =
    `${escapeHtml(v('c-lessee-name'))}<br>${t.contract_id_label}: ${escapeHtml(v('c-lessee-id'))}<br>${t.contract_phone_label2}: ${escapeHtml(v('c-lessee-phone'))}<br>${t.contract_dob_label}: ${v('c-lessee-dob') || '—'}`;
  document.getElementById('pv-property-l').textContent = t.contract_property_label;
  document.getElementById('pv-property-v').textContent =
    `${typeDisplay} — ${districtLabel(v('c-district'))}, ${cityDisplay} — ${v('c-area')} م²` +
    (v('c-floor-number') ? ' — ' + (currentLang==='ar' ? 'الدور' : 'Floor') + ': ' + v('c-floor-number') : '');
  document.getElementById('pv-term-l').textContent = t.contract_term_label;
  document.getElementById('pv-term-v').textContent = `${t.contract_term_from} ${v('c-start')} ${t.contract_term_to} ${v('c-end')}`;
  document.getElementById('pv-rent-l').textContent = t.contract_rent_label;
  document.getElementById('pv-rent-v').textContent = `${money(rent)} ${currency}`;
  document.getElementById('pv-deposit-l').textContent = t.contract_deposit_label;
  document.getElementById('pv-deposit-v').textContent = `${money(parseFloat(v('c-deposit'))||0)} ${currency}`;
  document.getElementById('pv-frequency-l').textContent = t.contract_frequency_label;
  document.getElementById('pv-frequency-v').textContent = frequencyDisplay;
  const deedRow = document.getElementById('pv-deed-row');
  if (v('c-deed-number')){
    deedRow.classList.remove('hide');
    document.getElementById('pv-deed-l').textContent = currentLang==='ar' ? 'رقم الصك' : 'Deed number';
    document.getElementById('pv-deed-v').textContent = escapeHtml(v('c-deed-number')) + (v('c-deed-date') ? ' — ' + v('c-deed-date') : '');
  } else {
    deedRow.classList.add('hide');
  }
  document.getElementById('pv-sig-lessor-l').textContent = (currentLang==='ar' ? 'توقيع' : 'Signature of') + ' ' + t.contract_lessor_label;
  document.getElementById('pv-sig-lessee-l').textContent = (currentLang==='ar' ? 'توقيع' : 'Signature of') + ' ' + t.contract_lessee_label;
  document.getElementById('pv-footer').textContent = (currentLang==='ar'
    ? `تم إصدار هذا العقد عبر منصة همة المدينة العقارية بتاريخ ${new Date().toLocaleDateString('ar-SA')}`
    : `This contract was issued via the Himmat Al Madinah Real Estate platform on ${new Date().toLocaleDateString('en-GB')}`);
  document.getElementById('btn-print-contract').classList.remove('hide');

  // نخزّن النص بدل ما نفتح واتساب فوراً — يفتح لاحقاً بالضبط لحظة ضغط زر
  // "طباعة العقد" (نفس ضغطة الزر، عشان المتصفح ما يحجبه كنافذة منبثقة)،
  // فيصير حفظ PDF وفتح واتساب متزامنين، وتقدر ترفق الملف يدوياً بنفس المحادثة.
  lastContractWhatsAppText = text;

  if (!dbReady){
    msg.textContent = '⚠️ ' + (currentLang==='ar'
      ? 'تم توليد العقد وإرساله للوسيط عبر واتساب — بس قاعدة البيانات غير مربوطة، لن يُحفظ جدول الدفعات.'
      : 'Contract generated and sent to the broker via WhatsApp — but the database isn\'t connected, so the payment schedule won\'t be saved.');
    msg.style.color = 'var(--warn)';
    return;
  }

  try {
    const { data, error } = await supa.rpc('create_contract_with_schedule', {
      p_contract_number: contractNumber,
      p_contract_type: contractType,
      p_lessor_name: v('c-lessor-name'), p_lessor_id_number: v('c-lessor-id'), p_lessor_phone: v('c-lessor-phone'),
      p_lessor_dob: v('c-lessor-dob') || null,
      p_lessee_name: v('c-lessee-name'), p_lessee_id_number: v('c-lessee-id'), p_lessee_phone: v('c-lessee-phone'),
      p_lessee_dob: v('c-lessee-dob') || null,
      p_lessor_id_type: v('c-lessor-id-type') || null,
      p_lessor_nationality: v('c-lessor-nationality') || null,
      p_lessee_id_type: v('c-lessee-id-type') || null,
      p_lessee_nationality: v('c-lessee-nationality') || null,
      p_deed_number: v('c-deed-number') || null,
      p_deed_date: v('c-deed-date') || null,
      p_floor_number: v('c-floor-number') || null,
      p_city: v('c-city'), p_district: v('c-district'), p_unit_type: v('c-unit-type'),
      p_area_sqm: parseFloat(v('c-area')) || 0, p_security_deposit: parseFloat(v('c-deposit')) || 0,
      p_start_date: v('c-start'), p_end_date: v('c-end'), p_annual_rent: rent,
      p_frequency: parseInt(document.getElementById('c-frequency').value, 10)
    });

    if (error){
      msg.textContent = '⚠️ ' + (currentLang==='ar'
        ? 'تم إرسال العقد للوسيط عبر واتساب، لكن تعذّر حفظه بقاعدة البيانات: '
        : 'The contract was sent to the broker via WhatsApp, but could not be saved to the database: ') + error.message;
      msg.style.color = 'var(--danger)';
    } else {
      msg.textContent = '✅ ' + (currentLang==='ar'
        ? 'تم توليد العقد وحفظه بجدول الدفعات كاملاً، وإرساله للوسيط عبر واتساب.'
        : 'The contract and its full payment schedule were saved, and it was sent to the broker via WhatsApp.');
      msg.style.color = 'var(--ok)';
    }
  } catch (e) {
    msg.textContent = '⚠️ ' + (currentLang==='ar'
      ? 'تم إرسال العقد للوسيط عبر واتساب، لكن تعذّر الاتصال بقاعدة البيانات لحفظه — تحقق من اتصالك وحاول مجدداً.'
      : 'The contract was sent to the broker via WhatsApp, but the database could not be reached to save it — check your connection and try again.');
    msg.style.color = 'var(--danger)';
    console.error('btn-generate-contract: Supabase call failed.', e);
  }
});

document.getElementById('btn-print-contract').addEventListener('click', ()=>{
  if (lastContractWhatsAppText){
    window.open(`https://wa.me/966530500906?text=${encodeURIComponent(lastContractWhatsAppText)}`, '_blank');
    // إشعار بريدي إضافي بنفس اللحظة (بالخلفية) — ما يأخّر فتح واتساب ولا
    // الطباعة، وما يوقف أي شي لو فشل (إشعار إضافي مو جزء أساسي من العملية)
    (async ()=>{
      try {
        const turnstileToken = await getTurnstileToken();
        await supa.functions.invoke('public-submit', {
          body: { type: 'contract', payload: { summary: lastContractWhatsAppText }, turnstileToken },
        });
      } catch (e) {
        console.error('تعذّر إرسال إشعار العقد بالبريد', e);
      }
    })();
  }
  window.print();
});

/* ============================================================================
   8) Contact form → saves to the `inquiries` table (real record the team can
      follow up on) and also opens WhatsApp for immediate contact.
   ========================================================================== */
document.getElementById('btn-send-contact').addEventListener('click', async ()=>{
  const name = document.getElementById('ct-name').value.trim();
  const reach = document.getElementById('ct-reach').value.trim();
  const type = document.getElementById('ct-type').value;
  const message = document.getElementById('ct-message').value.trim();
  const t = I18N[currentLang];
  const msg = document.getElementById('contact-form-msg');

  if (!name || !reach || !message){
    msg.style.color = 'var(--danger)';
    msg.textContent = '⚠️ ' + (currentLang==='ar' ? 'عبّئ الاسم ووسيلة التواصل والرسالة.' : 'Please fill in your name, contact info, and message.');
    return;
  }

  if (dbReady){
    try {
      const isEmail = reach.includes('@');
      const turnstileToken = await getTurnstileToken();
      const { data, error: fnError } = await supa.functions.invoke('public-submit', {
        body: {
          type: 'inquiry',
          payload: {
            full_name: name,
            email: isEmail ? reach : null,
            phone: isEmail ? null : reach,
            inquiry_type: type,
            message: message,
          },
          turnstileToken,
        },
      });
      const error = fnError || (data && data.error ? { message: data.error } : null);
      if (error){
        msg.style.color = 'var(--danger)';
        msg.textContent = '⚠️ ' + (currentLang==='ar' ? 'تعذّر الحفظ: ' : 'Could not save: ') + error.message;
      } else {
        msg.style.color = 'var(--ok)';
        msg.textContent = '✅ ' + (currentLang==='ar' ? 'تم استلام طلبك، سنتواصل معك قريباً.' : 'Your request was received — we\'ll be in touch soon.');
      }
    } catch (e) {
      msg.style.color = 'var(--danger)';
      msg.textContent = '⚠️ ' + (currentLang==='ar' ? 'تعذّر الاتصال بقاعدة البيانات — سيُفتح واتساب فقط.' : 'Could not reach the database — opening WhatsApp only.');
      console.error('btn-send-contact: Supabase call failed.', e);
    }
  } else {
    msg.style.color = 'var(--warn)';
    msg.textContent = '⚠️ ' + (currentLang==='ar' ? 'قاعدة البيانات غير مربوطة — سيُفتح واتساب فقط.' : 'Database not connected — opening WhatsApp only.');
  }

  const text = encodeURIComponent(`${t.f_name}: ${name}\n${t.f_reach}: ${reach}\n${t.f_inquiry_type}: ${type}\n${t.f_message}: ${message}`);
  window.open(`https://wa.me/966530500906?text=${text}`, '_blank');
});

/* ============================================================================
   9) Page router — turns section navigation into independent "pages".
      Clicking a nav item (or any in-page link to a known page id) hides
      every other section and shows only the target, scrolls to top, and
      keeps the URL hash + active nav link in sync with browser back/forward.
   ========================================================================== */
const PAGES = ['home','offers','services','valuation','add-property','analytics','contracts','faq','about','contact','privacy','terms'];

function prefersReducedMotion(){
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ============================================================================
   Fade-up on scroll — cards ease in as the visitor scrolls to them. Safe to
   call repeatedly (idempotent): only newly-added, unobserved elements get
   picked up each time, so it can be called after every dynamic re-render.
   ========================================================================== */
const fadeUpObserver = ('IntersectionObserver' in window) ? new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if (entry.isIntersecting){
      entry.target.classList.add('visible');
      fadeUpObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;

/* ============================================================================
   Hero image card slideshow — يعرض أحدث العروض الحقيقية المنشورة (بصورها
   الفعلية اللي ترفعها من لوحة التحكم)، فتتحرّك خلفية الصفحة الرئيسية مع أي
   عرض جديد تضيفه بدل ما تبقى ثابتة على نفس الصور دائماً. لو ما فيه عروض
   منشورة بصورة بعد، ترجع لصور احتياطية عامة (المسجد النبوي والمدينة) بدل
   ما تطلع خلفية فاضية.
   ========================================================================== */
const HERO_BG_IMAGES_FALLBACK = [
  "https://images.pexels.com/photos/4321694/pexels-photo-4321694.jpeg?auto=compress&cs=tinysrgb&h=900&w=1200",
  "https://images.pexels.com/photos/34246953/pexels-photo-34246953.jpeg?auto=compress&cs=tinysrgb&h=900&w=1200",
  "https://images.pexels.com/photos/35017416/pexels-photo-35017416.jpeg?auto=compress&cs=tinysrgb&h=900&w=1200",
  "https://images.pexels.com/photos/34246946/pexels-photo-34246946.jpeg?auto=compress&cs=tinysrgb&h=900&w=1200",
  "https://images.pexels.com/photos/34845465/pexels-photo-34845465.jpeg?auto=compress&cs=tinysrgb&h=900&w=1200",
];

async function loadHeroSlides(){
  // نعيد استخدام آخر قائمة عروض جُلبت فعلياً لصفحة "العروض" (LAST_OFFERS_LIST)
  // بدل عمل استعلام Supabase منفصل لنفس الجدول — يوفّر جولة اتصال كاملة
  // وقت الإقلاع. لو ما وصلت البيانات لأي سبب، نرجع لاستعلام مباشر احتياطي.
  const fromCache = (LAST_OFFERS_LIST || [])
    .filter(o => o.image_url)
    .slice(0, 6)
    .map(o => ({ url: o.image_url, caption: [o.title, o.district].filter(Boolean).join(' — ') }));
  if (fromCache.length) return fromCache;

  if (dbReady){
    try {
      const { data, error } = await withTimeout(
        supa.from('offers')
          .select('image_url, title, city, district')
          .eq('is_published', true)
          .not('image_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6)
      );
      if (!error && data && data.length){
        return data.map(o => ({ url: o.image_url, caption: [o.title, o.district].filter(Boolean).join(' — ') }));
      }
    } catch (e) {
      console.error('loadHeroSlides: Supabase call failed, using fallback images.', e);
    }
  }
  return HERO_BG_IMAGES_FALLBACK.map(url => ({ url, caption: null }));
}

/* تأثير آلة كاتبة لجملة الوصف الرئيسية بالهيرو — تُكتب حرف حرف مرة واحدة
   عند فتح الصفحة فقط (مو عند كل تبديل لغة، حتى ما يصير مزعج). */
let heroDescTypewriterRunId = 0; // يُستخدم لإبطال أي تشغيلة قديمة شغّالة بالخلفية
function typewriterHeroDesc(){
  const el = document.getElementById('hero-desc');
  if (!el) return;
  const fullText = el.textContent;
  if (prefersReducedMotion() || !fullText) return; // النص الكامل يبقى ظاهر فوراً لمن يفضّل تقليل الحركة
  const myRunId = ++heroDescTypewriterRunId;
  el.textContent = '';
  let i = 0;
  function typeNext(){
    if (myRunId !== heroDescTypewriterRunId) return; // صار تبديل لغة أو تشغيلة أحدث — نتوقف فوراً
    if (i < fullText.length){
      el.textContent += fullText.charAt(i);
      i++;
      setTimeout(typeNext, 18);
    }
  }
  typeNext();
}

async function initHeroSlideshow(){
  const wrap = document.getElementById('hero-bg-slides');
  if (!wrap) return;
  const slidesData = await loadHeroSlides();
  wrap.innerHTML = slidesData.map((s, i) =>
    `<div class="hero-bg-slide${i===0 ? ' active' : ''}" style="background-image:url('${s.url}')">${
      s.caption ? `<span class="hero-bg-caption">${escapeHtml(s.caption)}</span>` : ''
    }</div>`
  ).join('');

  if (prefersReducedMotion() || slidesData.length <= 1) return; // صورة واحدة ثابتة تكفي لمن يفضّل تقليل الحركة

  let current = 0;
  const slides = wrap.querySelectorAll('.hero-bg-slide');
  setInterval(()=>{
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 5000);
}

function observeFadeUps(){
  if (!fadeUpObserver){
    document.querySelectorAll('.fade-up:not(.visible)').forEach(el=>el.classList.add('visible'));
    return;
  }
  document.querySelectorAll('.fade-up:not(.fu-observed)').forEach(el=>{
    el.classList.add('fu-observed');
    fadeUpObserver.observe(el);
  });
}

function animateCounters(){
  document.querySelector('.stats-row')?.classList.add('ready');
  document.querySelectorAll('#home .counter').forEach(el=>{
    try {
      const target = parseFloat(el.dataset.target) || 0;
      const suffix = el.dataset.suffix || '';
      if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function' || typeof performance === 'undefined'){
        el.textContent = target + suffix;
        return;
      }
      const duration = 900;
      const start = performance.now();
      function tick(now){
        try {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        } catch (e) {
          el.textContent = target + suffix; // guarantee the final value lands even if the animation itself fails mid-flight
        }
      }
      requestAnimationFrame(tick);
    } catch (e) {
      console.error('animateCounters: failed for one stat, continuing with the rest.', e);
    }
  });
}

/* ============================================================================
   إحصائيات خفيفة (زيارات الأقسام + مشاهدات العروض) — بيانات مجهولة تماماً
   بدون أي معرّف شخصي للزائر، تُستخدم لاحقاً لتفعيل "الأكثر طلباً" ومتابعة
   أداء الموقع بدل التخمين. لا تنتظر ولا تعطّل الواجهة أبداً (fire-and-forget).
   ========================================================================== */
function logPageView(page){
  if (!dbReady) return;
  supa.from('page_views').insert({ page }).then(({ error }) => {
    if (error) console.error('logPageView: تعذّر التسجيل.', error.message);
  });
}
function logOfferView(offerId){
  if (!dbReady || !offerId) return; // نتجاهل عروض العرض التوضيحي (demo-N)
  supa.from('offer_views').insert({ offer_id: offerId }).then(({ error }) => {
    if (error) console.error('logOfferView: تعذّر التسجيل.', error.message);
  });
}

function showPage(id){
  if (!PAGES.includes(id)) id = 'home';
  logPageView(id);
  PAGES.forEach(p=>{
    const el = document.getElementById(p);
    if (el) el.style.display = (p === id) ? '' : 'none';
  });
  const active = document.getElementById(id);
  if (active && !prefersReducedMotion()){
    active.classList.remove('page-enter');
    void active.offsetWidth; // force reflow so the animation restarts every visit
    active.classList.add('page-enter');
  }
  document.querySelectorAll('.links a[href^="#"]').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === '#' + id);
  });
  if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (id === 'home') animateCounters();
  if (id === 'analytics' && !analyticsLoaded){
    analyticsLoaded = true;
    renderAnalytics();
  }
  observeFadeUps();
}

document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  if (PAGES.includes(id)){
    e.preventDefault();
    showPage(id);
  }
});
window.addEventListener('popstate', ()=> showPage(location.hash.slice(1) || 'home'));

/* ============================================================================
   10) Assistant — rule-based, transparently labeled, no external LLM call.
      Upgraded to a modern chat interface: avatar bubbles, a typing
      indicator, quick-reply chips, and real property search — it parses
      city / type / budget / room count from free text and queries the
      live database (or the demo data when not connected) instead of only
      pointing to a section.
   ========================================================================== */
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
function escapeHtml(s){ const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

const ROBOT_ICON_SVG = `🤖`;

const ASSIST_I18N = {
  ar: {
    greeting:"أهلاً 👋 أنا المساعد الذكي لهمة المدينة العقارية — أجاوبك بذكاء اصطناعي حقيقي على أسئلتك العامة، وأبحث لك مباشرة بقاعدة بياناتنا لو سألت عن عقار محدَّد — مثلاً «شقة في جدة تحت 900 ألف».",
    fallback:"أقدر أساعدك بالتنقل بين أقسام الموقع: المؤشر، العقود، إضافة عقار، العروض، أو التواصل معنا. أو صف لي العقار اللي تدور عليه (المدينة، النوع، الميزانية) وأبحث لك عنه.",
    noResults:"ما لقيت نتائج مطابقة تماماً، جرّب توسيع النطاق أو تصفح كل العروض.",
    resultsIntro: n => `لقيت لك ${n} نتيجة مطابقة تقريباً:`,
    rules: [
      { kw:['تقييم','تقدير','مؤشر'], reply:"يمكنك استخدام قسم «المؤشر» لحساب مؤشر استرشادي فوري.", goto:'valuation' },
      { kw:['عقد'], reply:"من قسم «العقود» تقدر تولّد عقد سكني أو تجاري ويُحفظ جدول دفعاته تلقائياً.", goto:'contracts' },
      { kw:['إضافة','اضافة','أضيف','اضيف','اضف'], reply:"من قسم «إضافة» تقدر تسجّل عقارك، وسيظهر للجميع بعد مراجعة سريعة.", goto:'add-property' },
      { kw:['عرض','عروض'], reply:"أحدث العروض موجودة في قسم «العروض».", goto:'offers' },
      { kw:['تواصل','واتساب'], reply:"تقدر تتواصل معنا مباشرة عبر قسم «تواصل» أو واتساب.", goto:'contact' },
    ],
  },
  en: {
    greeting:"Hi 👋 I'm Himmat Al Madinah's smart assistant — I answer general questions with real AI, and search our live database directly when you ask about a specific property — e.g. “apartment in Jeddah under 900k”.",
    fallback:"I can help you navigate: Valuation, Contracts, List Property, Offers, or Contact. Or describe the property you're after (city, type, budget) and I'll search for it.",
    noResults:"I couldn't find an exact match — try broadening your search or browse all offers.",
    resultsIntro: n => `Found ${n} roughly matching result(s):`,
    rules: [
      { kw:['valuation','estimate'], reply:"Use the “Valuation” section to get an instant guided indicator.", goto:'valuation' },
      { kw:['contract'], reply:"The “Contracts” section generates a residential or commercial contract with its payment schedule saved automatically.", goto:'contracts' },
      { kw:['list','add'], reply:"The “List Property” section lets you register your property — it goes live after a quick review.", goto:'add-property' },
      { kw:['offer'], reply:"The latest offers are in the “Offers” section.", goto:'offers' },
      { kw:['contact','whatsapp'], reply:"You can reach us directly via the “Contact” section or WhatsApp.", goto:'contact' },
    ],
  },
};

const QUICK_CHIPS_I18N = {
  ar: ["شقة في جدة تحت 900 ألف", "فيلا للبيع بالرياض", "كيف أضيف عقاري؟", "تواصل مع فريقنا"],
  en: ["Apartment in Jeddah under 900k", "Villa for sale in Riyadh", "How do I list my property?", "Contact our team"],
};

/* --- Lightweight entity extraction from free text (no external NLP) --- */
function detectCity(text, lower){
  for (const cname of Object.keys(CITY_DISTRICTS)){
    if (text.includes(cname)) return cname;
    const lbl = CITY_LABELS[cname];
    if (lbl && ((lbl.en && lower.includes(lbl.en.toLowerCase())) || (lbl.fr && lower.includes(lbl.fr.toLowerCase())))) return cname;
  }
  return null;
}
function detectType(text, lower){
  if (text.includes('شقة') || lower.includes('apartment') || lower.includes('appartement')){
    return (text.includes('برج') || lower.includes('tower') || lower.includes('tour')) ? 'شقة في برج' : 'شقة في عمارة';
  }
  if (text.includes('محل') || lower.includes('shop') || lower.includes('retail') || lower.includes('commerce')) return 'محل تجاري';
  const skip = new Set(['شقة في برج','شقة في عمارة','محل تجاري']);
  for (const pt of PROPERTY_TYPES){
    if (skip.has(pt.v)) continue;
    if (text.includes(pt.ar) || (pt.en && lower.includes(pt.en.toLowerCase())) || (pt.fr && lower.includes(pt.fr.toLowerCase()))) return pt.v;
  }
  return null;
}
function extractAmount(str){
  const m = str.match(/(\d+(?:[.,]\d+)?)\s*(ألف|الف|مليون|million|thousand|k|m)?/i);
  if (!m) return null;
  let n = parseFloat(m[1].replace(',', '.'));
  const unit = (m[2] || '').toLowerCase();
  if (unit === 'ألف' || unit === 'الف' || unit === 'thousand' || unit === 'k') n *= 1000;
  else if (unit === 'مليون' || unit === 'million' || unit === 'm') n *= 1000000;
  return n;
}
function detectPrice(text){
  const numMatch = text.match(/\d/);
  if (!numMatch) return { minPrice:null, maxPrice:null };
  const amount = extractAmount(text);
  if (!amount) return { minPrice:null, maxPrice:null };
  if (/تحت|أقل من|دون|under|below|less than|moins de/i.test(text)) return { minPrice:null, maxPrice:amount };
  if (/فوق|أكثر من|above|over|more than|plus de/i.test(text)) return { minPrice:amount, maxPrice:null };
  return { minPrice:null, maxPrice:amount }; // no explicit direction → treat as a budget ceiling
}
function detectRooms(text){
  const m = text.match(/(\d+)\s*(غرف|غرفة|rooms?|pi[eè]ces?)/i);
  return m ? parseInt(m[1], 10) : null;
}
function parseQuery(text){
  const lower = text.toLowerCase();
  const { minPrice, maxPrice } = detectPrice(text);
  return { city: detectCity(text, lower), type: detectType(text, lower), minPrice, maxPrice, rooms: detectRooms(text) };
}

async function searchProperties(q){
  let results = [];
  if (dbReady){
    try {
      let query = supa.from('properties').select('*').eq('status', 'approved').limit(5);
      if (q.city) query = query.eq('city', q.city);
      if (q.type) query = query.eq('property_type', q.type);
      if (q.maxPrice) query = query.lte('price', q.maxPrice);
      if (q.minPrice) query = query.gte('price', q.minPrice);
      if (q.rooms) query = query.eq('rooms', q.rooms);
      const { data, error } = await withTimeout(query);
      if (!error && data) results = data.map(p=>({ city:p.city, district:p.district, property_type:p.property_type, price:p.price, area_sqm:p.area_sqm, rooms:p.rooms }));
    } catch (e) {
      console.error('searchProperties: Supabase call failed, falling back to demo search.', e);
    }
  }
  if (!results.length){
    const demo = DEMO_OFFERS_I18N[currentLang] || DEMO_OFFERS_I18N.ar;
    results = demo.filter(o=>{
      if (q.city && o.city !== cityLabel(q.city) && o.city !== q.city) return false;
      const price = o.price_final || o.price_original;
      if (q.maxPrice && price && price > q.maxPrice) return false;
      if (q.minPrice && price && price < q.minPrice) return false;
      if (q.rooms && o.rooms !== q.rooms) return false;
      return true;
    }).map(o=>({ city:o.city, district:o.district, property_type:o.property_type, price:o.price_final || o.price_original, area_sqm:o.area_sqm, rooms:o.rooms }));
  }
  return results;
}

function addAssistMsg(text, who, extraHtml=''){
  const body = document.getElementById('assist-body');
  const row = document.createElement('div');
  row.className = 'assist-row' + (who==='user' ? ' user' : '');
  row.innerHTML = `<div class="assist-mini-avatar">${who==='user' ? '🙂' : ROBOT_ICON_SVG}</div><div class="assist-msg">${escapeHtml(text)}${extraHtml}</div>`;
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
}
function showTyping(){
  const body = document.getElementById('assist-body');
  const row = document.createElement('div');
  row.className = 'assist-row';
  row.id = 'assist-typing-row';
  row.innerHTML = `<div class="assist-mini-avatar">${ROBOT_ICON_SVG}</div><div class="assist-typing"><span></span><span></span><span></span></div>`;
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
}
function hideTyping(){ document.getElementById('assist-typing-row')?.remove(); }

function renderQuickChips(){
  const list = QUICK_CHIPS_I18N[currentLang] || QUICK_CHIPS_I18N.ar;
  const wrap = document.getElementById('assist-quick');
  wrap.innerHTML = list.map(c=>`<button class="assist-chip" type="button">${c}</button>`).join('');
  wrap.querySelectorAll('.assist-chip').forEach(btn=>{
    btn.addEventListener('click', ()=> handleAssistSend(btn.textContent, true));
  });
}

// الخادم الوسيط الآمن (Cloudflare Worker) — يتصل بـGemini بمفتاح محفوظ
// على الخادم فقط، أبداً لا يظهر بكود الموقع. لو الاتصال فشل لأي سبب،
// نرجع للردود الجاهزة الثابتة تلقائياً (تحسّن سلوكي، مو تعطّل كامل).
const AI_BACKEND_URL = 'https://himmat-ai-backend.ahmedvall.workers.dev/chat';
let assistantHistory = [];

// مفتاح عام (Site Key) — آمن يظهر بكود المتصفح، عكس المفتاح السري اللي
// يبقى فقط على الخادم. يثبت للـWorker إن الطلب جاي من متصفح حقيقي بموقعنا،
// مو سكربت/بوت يستدعي رابط الـWorker مباشرة لاستنزاف حصة/فوترة Gemini.
const TURNSTILE_SITE_KEY = '0x4AAAAAAEu3S6icGpBIUVnz';

/* يولّد توكن Turnstile جديد (خفي بالكامل، الزائر ما يشوف ولا يحس) ويرجّعه
   — نطلب توكن جديد قبل كل رسالة للمساعد الذكي (التوكن صالح لاستخدام وحيد
   وينتهي بسرعة). لو السكربت ما تحمّل لأي سبب (حجب إعلانات، مشكلة شبكة)،
   نرجّع null ونكمل عادي — الـWorker يتعامل مع هالحالة بلطف من طرفه. */
let turnstileWidgetId = null;
function getTurnstileToken(){
  return new Promise((resolve)=>{
    if (!window.turnstile){ resolve(null); return; }
    const container = document.getElementById('turnstile-container');
    if (!container){ resolve(null); return; }
    if (turnstileWidgetId !== null){
      try { turnstile.remove(turnstileWidgetId); } catch(e) { /* الودجت أصلاً انتهى، تجاهل */ }
      turnstileWidgetId = null;
    }
    container.innerHTML = '';
    let done = false;
    const finish = (token)=>{ if (done) return; done = true; resolve(token); };
    try {
      turnstileWidgetId = turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        size: 'invisible',
        callback: (token)=> finish(token),
        'error-callback': ()=> finish(null),
        'timeout-callback': ()=> finish(null),
      });
    } catch (e) {
      console.error('Turnstile render failed', e);
      finish(null);
    }
    setTimeout(()=> finish(null), 8000); // شبكة أمان لو أي callback ما انطلق
  });
}

/* بيانات أسعار الأحياء الحقيقية — نجيبها بس لما السؤال يبدو متعلق
   بالأسعار/الأحياء (توفير تكلفة، مو كل سؤال)، ونخزّنها مؤقتاً 10 دقائق
   لأنها ما تتغيّر إلا أسبوعياً. نخزّن الصفوف الخام كاملة (يتيح البحث عن حي
   معيّن بالاسم مباشرة)، ونبني منها سياق مختصر (أرخص/أغلى 10) للذكاء
   الاصطناعي لما السؤال عام/مقارن. */
let districtPriceRowsCache = null;
let districtPriceContextCacheTime = 0;

/* أسئلة "أغلى/أرخص حي" لا تحتاج ذكاء اصطناعي إطلاقاً — هي عملية فرز رقمية
   بسيطة، وعندنا البيانات جاهزة بالمتصفح أصلاً. نكتشفها ونحسبها مباشرة،
   ونستخدم Gemini بس للأسئلة اللي فعلاً تحتاج صياغة أو فهم مفتوح. */
const SUPERLATIVE_HIGH_KW = ['أغلى','اغلى','اغلا','أعلى','اعلى'];
const SUPERLATIVE_LOW_KW = ['أرخص','ارخص','أدنى','ادنى','أقل','اقل'];
function detectPriceSuperlative(text){
  const norm = normalizeArabicForMatch(text);
  const isHigh = SUPERLATIVE_HIGH_KW.some(k => norm.includes(normalizeArabicForMatch(k)));
  const isLow = SUPERLATIVE_LOW_KW.some(k => norm.includes(normalizeArabicForMatch(k)));
  if (isHigh && !isLow) return 'high';
  if (isLow && !isHigh) return 'low';
  return null; // غامض (فيه الاثنين) أو ولا وحدة — نسيب الأمر لـGemini
}

function looksLikePriceQuestion(text){
  const keywords = ['سعر','اسعار','أسعار','ارخص','أرخص','اخفض','أخفض','اعلى','أعلى','اغلى','أغلى','غالي','رخيص','حي ','أحياء','احياء','متر'];
  return keywords.some(k => text.includes(k));
}

/* تطبيع نص عربي للمطابقة فقط (ما نستخدمه للعرض) — يوحّد أشكال الهمزة
   (أ/إ/آ/ا)، الألف المقصورة/الياء (ى/ي)، التاء المربوطة/الهاء (ة/ه)،
   ويحذف التشكيل والتطويل. الهدف: مطابقة قصد الزائر بغض النظر عن دقة
   إملائه — نفس الكلمة بعشر طرق كتابة مختلفة تطابق بعد التطبيع. */
function normalizeArabicForMatch(str){
  return String(str || '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F\u0670]/g, '') // تشكيل
    .replace(/ـ/g, '')                     // تطويل
    .toLowerCase();
}

async function fetchAllDistrictPriceRows(){
  if (districtPriceRowsCache && (Date.now() - districtPriceContextCacheTime) < 600000){
    return districtPriceRowsCache;
  }
  if (!dbReady) return null;
  try {
    const { data, error } = await withTimeout(
      supa.from('district_prices').select('price_per_sqm, districts(name, cities(name))')
    );
    if (error || !data || !data.length) return null;
    const rows = data
      .filter(r => r.districts && r.price_per_sqm)
      .map(r => ({ name: r.districts.name, city: r.districts.cities?.name || '', price: Math.round(r.price_per_sqm) }))
      .sort((a, b) => a.price - b.price);
    if (!rows.length) return null;
    districtPriceRowsCache = rows;
    districtPriceContextCacheTime = Date.now();
    return rows;
  } catch (e) {
    console.error('fetchAllDistrictPriceRows failed', e);
    return null;
  }
}

function buildPriceContextText(rows){
  // نرسل كل الأحياء المتوفرة (مو بس أرخص/أغلى 10) — نخلي الذكاء الاصطناعي
  // نفسه يفهم أي حي يقصده الزائر (حتى بصياغة أو خطأ إملائي)، بدل ما نحصر
  // خياراته بقائمة قصيرة مسبقاً.
  const grouped = {};
  rows.forEach(r => { (grouped[r.city] = grouped[r.city] || []).push(r); });
  const fmt = r => `${r.name}: ${money(r.price)} ر.س/م²`;
  return Object.entries(grouped)
    .map(([city, list]) => `${city}:\n${list.map(fmt).join('\n')}`)
    .join('\n\n');
}

async function askAiAssistant(text){
  assistantHistory.push({ role: 'user', text }); // نخزّن النص الأصلي النظيف بالسجل المعروض
  if (assistantHistory.length > 20) assistantHistory = assistantHistory.slice(-20);

  // نبني نسخة للإرسال فقط — نضيف بيانات الأسعار الحقيقية للرسالة الأخيرة بس
  // لو السؤال يبدو متعلق بالأسعار، بدون ما نخزّنها بالسجل نفسه (يبقى نظيف
  // وخفيف لباقي الأسئلة بنفس المحادثة)
  window.__lastDebug = null;
  let messagesToSend = assistantHistory;
  if (looksLikePriceQuestion(text)){
    const allRows = await fetchAllDistrictPriceRows();
    if (allRows && allRows.length){
      // لو السؤال يذكر مدينة صراحة، نفلتر البيانات لهذي المدينة بس قبل ما
      // نرسلها — يضمن الإجابة تبقى بنفس المدينة المطلوبة دائماً، بدل ما
      // نعتمد على الذكاء الاصطناعي يفلتر صح من بيانات 4 مدن مختلطة.
      const mentionedCity = detectCity(text, text.toLowerCase());
      const relevantRows = mentionedCity ? allRows.filter(r => r.city === mentionedCity) : allRows;
      const rowsToSend = relevantRows.length ? relevantRows : allRows;
      window.__lastDebug = `[تشخيص مؤقت] المدينة المكتشفة: ${mentionedCity || 'لا شي'} — عدد الصفوف المُرسلة: ${rowsToSend.length} من أصل ${allRows.length}`;
      const priceContext = buildPriceContextText(rowsToSend);
      const cityNote = mentionedCity ? `\n\n[ملاحظة: الزائر يسأل تحديداً عن مدينة ${mentionedCity} — البيانات أعلاه لهذي المدينة فقط، لا تذكر مدن ثانية بالرد]` : '';
      messagesToSend = assistantHistory.slice(0, -1).concat([{
        role: 'user',
        text: `[بيانات أسعار حقيقية من قاعدة بياناتنا — ريال/م²]\n${priceContext}${cityNote}\n\n[سؤال الزائر]: ${text}`
      }]);
    }
  }

  const AI_TIMEOUT_MS = 20000; // 20 ثانية — أطول من قبل لأن سؤال الأسعار يحتاج جلب بيانات إضافية قبل الاتصال بالذكاء الاصطناعي
  const turnstileToken = await getTurnstileToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(AI_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messagesToSend, turnstileToken }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok){
      const bodyText = await res.text().catch(()=> '');
      throw new Error(`HTTP ${res.status} — ${bodyText.slice(0, 200)}`);
    }
    const data = await res.json();
    if (!data.reply) throw new Error('الرد ما فيه حقل reply: ' + JSON.stringify(data).slice(0, 200));
    assistantHistory.push({ role: 'bot', text: data.reply });
    return { ok: true, reply: data.reply };
  } catch (e) {
    clearTimeout(timeoutId);
    const detail = e.name === 'AbortError' ? `انتهت مهلة الانتظار (${AI_TIMEOUT_MS/1000} ثانية) بدون رد` : e.message;
    console.error('askAiAssistant: falling back to static replies.', e);
    return { ok: false, error: detail }; // فشل — نرجع للردود الجاهزة بدل ما نكسر تجربة المستخدم
  }
}

function assistantReply(text){
  const dict = ASSIST_I18N[currentLang] || ASSIST_I18N.ar;
  const lower = text.toLowerCase();
  const rule = dict.rules.find(r => r.kw.some(k => lower.includes(k.toLowerCase())));
  return rule || { reply: dict.fallback, goto:null };
}

let assistantOpen = false;
function setAssistantOpen(open){
  assistantOpen = open;
  const panel = document.getElementById('assistant-panel');
  panel.classList.toggle('open', open);
  if (open && !panel.dataset.greeted){
    addAssistMsg((ASSIST_I18N[currentLang] || ASSIST_I18N.ar).greeting, 'bot');
    renderQuickChips();
    panel.dataset.greeted = '1';
  }
}
document.getElementById('assistant-toggle').addEventListener('click', (e)=>{
  e.stopPropagation();
  setAssistantOpen(!assistantOpen);
});
document.getElementById('assist-close').addEventListener('click', ()=> setAssistantOpen(false));
document.addEventListener('click', (e)=>{
  if (!assistantOpen) return;
  const panel = document.getElementById('assistant-panel');
  const toggle = document.getElementById('assistant-toggle');
  if (!panel.contains(e.target) && e.target !== toggle) setAssistantOpen(false);
});
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape' && assistantOpen) setAssistantOpen(false);
});

async function handleAssistSend(textOverride, isPredefinedChip){
  const input = document.getElementById('assist-input');
  const text = (textOverride !== undefined ? textOverride : input.value).trim();
  if (!text) return;
  addAssistMsg(text, 'user');
  if (textOverride === undefined) input.value = '';
  showTyping();

  const t = ASSIST_I18N[currentLang] || ASSIST_I18N.ar;
  const q = parseQuery(text);
  // اسم المدينة وحده مو كافي لاعتبارها "بحث عقارات" — "أسعار العقار بالعزيزية،
  // المدينة المنورة" فيها اسم مدينة بس هي سؤال عام عن الأسعار، مو طلب قائمة
  // عروض. لازم نوع محدَّد أو سعر أو عدد غرف كمان عشان نعتبرها بحث فعلي.
  const isSearch = !!(q.type || q.maxPrice || q.minPrice || q.rooms);

  // لو الرسالة المكتوبة يدوياً تطابق أحد أقسام الموقع المعروفة (تقييم/عقد/
  // إضافة/عرض/تواصل) وما هي سؤال أسعار، نرجّع لها نفس الرد الثابت الدقيق
  // اللي يرجع لزر Quick Chip بالضبط — بدل ما نخاطر بمرور Gemini يختلق
  // إجراء غير مطابق للموقع الفعلي (صار فعلاً بسؤال "كيف اضيف عقار": رجّع
  // خطوات تسجيل دخول وترخيص إجباري، وكلاهما غلط — الإضافة عامة بدون تسجيل
  // دخول والترخيص اختياري).
  const lowerText = normalizeArabicForMatch(text);
  const matchedRule = t.rules.find(r => r.kw.some(k => lowerText.includes(normalizeArabicForMatch(k))));
  const useStaticRule = matchedRule && !looksLikePriceQuestion(text);

  // "أغلى/أرخص حي" — فرز رقمي بسيط، نحسبه محلياً بدون أي اتصال بالذكاء
  // الاصطناعي (فوري، مجاني، صفر احتمال تايم آوت من Gemini)
  const superlative = looksLikePriceQuestion(text) ? detectPriceSuperlative(text) : null;

  if (isSearch){
    const results = await searchProperties(q);
    await sleep(350);
    hideTyping();
    if (!results.length){
      addAssistMsg(t.noResults, 'bot');
    } else {
      const cardsHtml = results.map(r=>{
        const priceText = r.price ? `${money(r.price)} ${currentLang==='ar' ? 'ر.س' : 'SAR'}` : I18N[currentLang].price_on_request;
        return `<div class="assist-result-card">
          <b>${r.property_type} — ${districtLabel(r.district)}</b>
          <div class="meta">${cityLabel(r.city)} · ${r.area_sqm || '—'} م²${r.rooms ? (' · ' + r.rooms + ' ' + I18N[currentLang].rooms_suffix) : ''}</div>
          <span class="price">${priceText}</span>
        </div>`;
      }).join('');
      addAssistMsg(t.resultsIntro(results.length), 'bot', cardsHtml);
    }
    showPage('offers');
  } else if (superlative){
    const allRows = await fetchAllDistrictPriceRows();
    await sleep(300);
    hideTyping();
    if (!allRows || !allRows.length){
      // ما قدرنا نجيب بيانات الأسعار (قاعدة بيانات غير متاحة مثلاً) — نكمل
      // بالطريقة العادية (Gemini) كحل احتياطي بدل ما نوقف الرد كلياً
      const aiReply = await askAiAssistant(text);
      if (aiReply.ok) addAssistMsg(aiReply.reply, 'bot');
      else {
        console.error('AI assistant unavailable, using static fallback:', aiReply.error);
        const { reply, goto } = assistantReply(text);
        addAssistMsg(reply, 'bot');
        if (goto) showPage(goto);
      }
    } else {
      const mentionedCity = detectCity(text, text.toLowerCase());
      const rows = mentionedCity ? allRows.filter(r => r.city === mentionedCity) : allRows;
      if (!rows.length){
        addAssistMsg(currentLang==='ar' ? `ما لقيت بيانات أسعار كافية حالياً${mentionedCity ? ' لـ' + cityLabel(mentionedCity) : ''}.` : `Not enough price data available${mentionedCity ? ' for ' + cityLabel(mentionedCity) : ''} right now.`, 'bot');
      } else {
        // rows مرتّبة تصاعدياً أصلاً (من fetchAllDistrictPriceRows)
        const target = superlative === 'high' ? rows[rows.length - 1] : rows[0];
        const cityPhraseAr = mentionedCity ? ` في ${cityLabel(mentionedCity)}` : '';
        const cityPhraseEn = mentionedCity ? ` in ${cityLabel(mentionedCity)}` : '';
        const reply = currentLang==='ar'
          ? `${superlative==='high' ? 'أغلى حي' : 'أقل حي سعراً'}${cityPhraseAr} حسب بياناتنا هو حي ${districtLabel(target.name)} بمتوسط سعر ${money(target.price)} ريال/م².`
          : `${superlative==='high' ? 'The most expensive district' : 'The cheapest district'}${cityPhraseEn} according to our data is ${districtLabel(target.name)}, averaging ${money(target.price)} SAR/sqm.`;
        addAssistMsg(reply, 'bot');
      }
    }
  } else if (isPredefinedChip || useStaticRule){
    // الأزرار الجاهزة، أو رسالة مكتوبة يدوياً تطابق قسم معروف بدقة —
    // إجاباتها معروفة مسبقاً 100%، لا داعي لانتظار الذكاء الاصطناعي (أبطأ،
    // وأحياناً غير دقيق بإجراءات الموقع الخاصة)، نروح للرد الثابت مباشرة
    await sleep(300);
    hideTyping();
    const { reply, goto } = assistantReply(text);
    addAssistMsg(reply, 'bot');
    if (goto) showPage(goto);
  } else {
    const aiReply = await askAiAssistant(text);
    await sleep(300);
    hideTyping();
    if (aiReply.ok){
      // __lastDebug تشخيص للمطورين فقط (console) — ما يُعرض للزائر العادي
      if (window.__lastDebug) console.log(window.__lastDebug);
      // لو Gemini اكتشف إن السؤال إجرائي عن أحد الأقسام المعروفة (بأي صياغة
      // أو مرادف، مو بس كلمات محددة)، يرجّع إشارة SITE_SECTION:<goto> بدل ما
      // يحاول يشرح بنفسه — نستبدلها بالرد الثابت الدقيق دايماً، صفر مخاطرة
      // اختلاق. لو ما فيه إشارة، نعرض رد Gemini الفعلي عادي.
      const sectionMatch = /SITE_SECTION:(valuation|contracts|add-property|offers|contact)/.exec(aiReply.reply || '');
      const sectionRule = sectionMatch && t.rules.find(r => r.goto === sectionMatch[1]);
      if (sectionRule){
        addAssistMsg(sectionRule.reply, 'bot');
        showPage(sectionRule.goto);
      } else {
        addAssistMsg(aiReply.reply, 'bot');
      }
    } else {
      // الذكاء الاصطناعي غير متاح مؤقتاً (ازدحام أو انقطاع أو تجاوز مهلة) —
      // رجوع سلس للرد الثابت بدون إظهار أي تفاصيل تقنية داخلية للزائر
      // العادي (تُسجَّل بـconsole للمطورين فقط)
      console.error('AI assistant unavailable, using static fallback:', aiReply.error);
      const { reply, goto } = assistantReply(text);
      addAssistMsg(reply, 'bot');
      if (goto) showPage(goto);
    }
  }
}
document.getElementById('assist-send').addEventListener('click', ()=> handleAssistSend());
document.getElementById('assist-input').addEventListener('keydown', e=>{
  if (e.key==='Enter') handleAssistSend();
  e.stopPropagation(); // avoid the document-level Escape/outside-click handlers firing oddly while typing
});

/* زر "للأعلى" العائم — يظهر بس بعد تمرير مسافة معقولة، ويمرّر للأعلى بنعومة. */
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn){
  window.addEventListener('scroll', ()=>{
    backToTopBtn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  backToTopBtn.addEventListener('click', ()=>{
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}

/* ============================================================================
   11) Boot
   ========================================================================== */
window.addEventListener('load', async ()=>{
  dbReady = initSupabase();
  renderConfigBanner();

  const safely = async (label, fn) => {
    try { await fn(); }
    catch (e) { console.error(`Boot step "${label}" failed — continuing with the rest of the page.`, e); }
  };

  await Promise.all([
    safely('loadCitiesFromDb', loadCitiesFromDb),
    safely('loadDistrictPricesFromDb', loadDistrictPricesFromDb),
  ]);
  populateCitySelects();
  populateTypeSelects();
  updateValuationFieldsForType();
  updateAddPropertyFieldsForType();
  populateFilterSelects();
  populateHeroSearch();
  renderServices();
  renderFaq();
  renderLegalPages();
  runFinance();

/* عدّاد "عقار مسجَّل فعلياً" بالصفحة الرئيسية — مستقل تماماً عن قسم
   التحليلات (اللي صار كسولاً/lazy). استعلام عدّ بس (count فقط، بدون بيانات)
   عشان يبقى خفيف ولا يأثر على وقت التحميل. */
async function loadLiveStatsCount(){
  if (!dbReady) return;
  try {
    const { count, error } = await withTimeout(
      supa.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'approved')
    );
    if (!error && typeof count === 'number'){
      document.getElementById('stat-live-count').dataset.target = count;
    }
  } catch (e) {
    console.error('loadLiveStatsCount: Supabase call failed.', e);
  }
}

  // هذه الثلاثة مستقلة عن بعضها (كل وحدة تجيب بياناتها من جدول مختلف) —
  // تشغيلها بالتوازي بدل التتابع يقلّل زمن التحميل الكلي بشكل ملموس.
  await Promise.all([
    safely('renderOffers', () => renderOffers()),
    safely('renderFeatured', renderFeatured),
    safely('loadLiveStatsCount', loadLiveStatsCount),
  ]);
  updateHeroSearchCount();

  const totalDistricts = Object.values(CITY_DISTRICTS).reduce((sum, list) => sum + list.length, 0);
  document.getElementById('stat-district-count').dataset.target = totalDistricts;
  updateGradeFieldVisibility();
  try { runValuation(); } catch(e){}
  await initHeroSlideshow();
  typewriterHeroDesc();
  showPage(location.hash.slice(1) || 'home');
  handleDeepLinkOffer();
});
