
/* ============================================================================
   Config — same project as the public site (index.html)
   ========================================================================== */
const SUPABASE_URL = "https://wlebcvwsleoieodjtrcf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_KhUpsOF0OxVQWyWLakXx2g_yDsUlnxV";
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// مفتاح Turnstile العام — نفسه المستخدم بالموقع الرئيسي (الودجت يدعم حتى 10
// دومينات، ونفس الدومين هنا). يثبت للخادم إن الطلب جاي من متصفح حقيقي، مو
// سكربت يستدعي /describe مباشرة لاستنزاف حصة/فوترة Gemini.
const TURNSTILE_SITE_KEY = '0x4AAAAAAEu3S6icGpBIUVnz';
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
    setTimeout(()=> finish(null), 8000);
  });
}

/* ============================================================================
   بيانات المدن/الأحياء/أنواع العقار — نفس القوائم المستخدمة بالموقع العام،
   عشان قيم العروض تتطابق تماماً (بحث، تصفية، أسعار حقيقية بالتقييم...الخ)
   ========================================================================== */
const CITY_DISTRICTS = {
  "المدينة المنورة": ["العزيزية","العاقول","العريض","الخالدية","الزهرة","شظاة","الملك فهد","المبعوث","الروابي","الربوة","الإسكان","الدويمة","قربان","العوالي","الهجرة","العصبة","قباء","القصواء","الرانوناء","شوران","مهزور","مذينب","بني حارثة","بني معاوية","بني ظفر","بني خدرة","بني بياضة","السيح","الفتح","القبلتين","الجامعة","أبو كبير","الجرف","البركة","السلام","الدفاع","طيبة","أحد","سيد الشهداء","المصانع","العيون","النصر","الراية","المناخة","المغيسلة","الوبرة","السكب","الخاتم","أبو بريقاء","وادي البطان","الحرة الشرقية"],
  "مكة المكرمة": ["العوالي","الشوقية","الشرائع","النسيم","الزاهر","العتيبية","العمرة","النوارية","التنعيم","الراشدية","بطحاء قريش","الكعكية","ولي العهد","الحمراء وأم الجود","الزهراء","الضيافة","النزهة","الرصيفة","المسفلة","الهجرة","كدي","جرهم","الروابي","الخالدية","الهنداوية","المنصور","الشبيكة","الشامية","جرول","ريع ذاخر","الحجون","المعابدة","العزيزية الشمالية","الملاوي","العدل","العسيلة","وادي جليل","العمرة الجديدة","البحيرات","الشرائع الشمالية","الشرائع الجنوبية","الصفوة","الملك فهد","الحسينية","العكيشية","الليث الجديد"],
  "جدة": ["الروضة","الزهراء","السلامة","النهضة","الشاطئ","المحمدية","الخالدية","النعيم","النزهة","البوادي","الربوة","الصفا","الفيصلية","الرحاب","مشرفة","العزيزية","الورود","بني مالك","النسيم","الواحة","السامر","المنار","الأجواد","الريان","مريخ","بريمان","المنطقة الصناعية","الجامعة","الفيحاء","السليمانية","الثغر","الروابي","الوزيرية","غليل","مدائن الفهد","البلد","الهنداوية","البغدادية الشرقية","البغدادية الغربية","الكندرة","الصحيفة","السبيل","النزلة الشرقية","النزلة اليمانية","الثعالبة","المحجر","الكرنتينا","الأمير فواز الشمالي","الأمير فواز الجنوبي","السنابل","الهدى","الأجاويد","الفضيلة","الخمرة","القرينية","الحمدانية","الصالحية","الفلاح","الرحمانية","طيبة","الرياض","الكوثر","الياقوت","الزمرد","اللؤلؤ","الأمواج","الشراع","الفردوس","الأصالة","البساتين","أبحر الجنوبية","أبحر الشمالية","المرجان","الشفا","المنتزهات","أم السلم","الحرازات"],
  "الرياض": ["العليا","السليمانية","الملز","الوزارات","الضباط","الورود","الرحمانية","المحمدية","الرائد","النخيل","أم الحمام الشرقي","أم الحمام الغربي","المعذر","المعذر الشمالي","الهدا","الشفا","بدر","المروة","عكاظ","الحزم","ديراب","نمار","ظهرة نمار","العريجاء","العريجاء الغربية","العريجاء الوسطى","ظهرة البديعة","البديعة","السويدي","السويدي الغربي","شبرا","سلطانة","الجرادية","منفوحة","منفوحة الجديدة","الديرة","الشميسي","الفاخرية","العود","المرقب","الصالحية","الخالدية","غبيراء","اليمامة","الربوة","الريان","الروابي","النسيم الشرقي","النسيم الغربي","السلام","المنار","النهضة","الخليج","القدس","الحمراء","غرناطة","الشهداء","قرطبة","اليرموك","المونسية","الرمال","الجنادرية","القادسية","اشبيلية","الملك فيصل","الروضة","الملقا","حطين","العقيق","الصحافة","الياسمين","النرجس","العارض","القيروان","الربيع","الغدير","النفل","الوادي","التعاون","الازدهار","المصيف","المرسلات","الفلاح","الندى","الواحة","صلاح الدين","الملك فهد","الملك عبدالله","الملك عبدالعزيز","المغرزات","النور"],
};
const PROPERTY_TYPE_NAMES = ["فيلا","شقة في برج","شقة في عمارة","أرض","دبلكس","قصر","مزرعة","استراحة","محل تجاري","مكتب","مخزن","منتجع","معرض","عمارة","محطة","دور"];

function populateOfferCitySelect(){
  const sel = document.getElementById('offer-city');
  sel.innerHTML = '<option value="">— اختر —</option>' +
    Object.keys(CITY_DISTRICTS).map(c => `<option value="${c}">${c}</option>`).join('');
}
function populateOfferDistrictSelect(){
  const citySel = document.getElementById('offer-city');
  const distSel = document.getElementById('offer-district');
  const list = CITY_DISTRICTS[citySel.value] || [];
  distSel.innerHTML = '<option value="">— اختر المدينة أول —</option>' +
    list.map(d => `<option value="${d}">${d}</option>`).join('');
}
function populateOfferTypeSelect(){
  const sel = document.getElementById('offer-type');
  sel.innerHTML = '<option value="">— اختر —</option>' +
    PROPERTY_TYPE_NAMES.map(t => `<option value="${t}">${t}</option>`).join('');
}
populateOfferCitySelect();
populateOfferTypeSelect();
populateOfferDistrictSelect();
document.getElementById('offer-city').addEventListener('change', populateOfferDistrictSelect);

/* ============================================================================
   المدن والأحياء — تحميل حي من قاعدة البيانات + إضافة جديد من لوحة التحكم
   ========================================================================== */
const CITY_PRICE_PER_SQM = {};

// نفس منطق loadCitiesFromDb بملف site.js بالضبط — يدمج بيانات قاعدة البيانات
// الحية مع القائمة الثابتة (بدل استبدالها)، فلو قاعدة البيانات تعطلت مؤقتاً
// تبقى القائمة الأساسية شغّالة.
async function loadCityDistrictsFromDb(){
  try {
    const [citiesRes, districtsRes] = await Promise.all([
      supa.from('cities').select('name, price_per_sqm'),
      supa.from('districts').select('name, cities(name)'),
    ]);
    const { data: cities, error: e1 } = citiesRes;
    const { data: districts, error: e2 } = districtsRes;
    if (e1 || !cities || !cities.length) return;
    if (e2) return;
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
    console.error('loadCityDistrictsFromDb: Supabase call failed, keeping the built-in seed list.', e);
  }
}

function populateDistrictNewCitySelect(){
  const sel = document.getElementById('district-new-city');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = Object.keys(CITY_DISTRICTS).map(c => `<option value="${c}">${c}</option>`).join('');
  if (prev && CITY_DISTRICTS[prev]) sel.value = prev;
}

function renderCitiesSummaryTable(){
  const tbody = document.getElementById('cities-summary-tbody');
  if (!tbody) return;
  tbody.innerHTML = Object.entries(CITY_DISTRICTS)
    .map(([city, list]) => `<tr><td>${escapeAdmin(city)}</td><td>${list.length}</td></tr>`)
    .join('') || '<tr><td colspan="2">لا يوجد</td></tr>';
}

// تُستدعى بعد تسجيل الدخول (نفس مكان loadDashboard) — تحدّث كل القوائم
// المعتمدة على CITY_DISTRICTS دفعة وحدة بعد اكتمال الجلب من قاعدة البيانات
async function refreshCityDistrictData(){
  await loadCityDistrictsFromDb();
  populateOfferCitySelect();
  populateOfferDistrictSelect();
  populateDistrictNewCitySelect();
  populatePriceManualCitySelect();
  renderCitiesSummaryTable();
}

populateDistrictNewCitySelect();
populatePriceManualCitySelect();
renderCitiesSummaryTable();

document.getElementById('btn-add-city')?.addEventListener('click', async ()=>{
  const nameInput = document.getElementById('city-new-name');
  const priceInput = document.getElementById('city-new-price');
  const slugInput = document.getElementById('city-new-slug');
  const msg = document.getElementById('city-new-msg');
  const name = nameInput.value.trim();
  if (!name){
    msg.textContent = '⚠️ اكتب اسم المدينة.';
    msg.style.color = 'var(--danger)';
    return;
  }
  if (CITY_DISTRICTS[name]){
    msg.textContent = '⚠️ هذي المدينة مسجَّلة أصلاً.';
    msg.style.color = 'var(--danger)';
    return;
  }
  const payload = { name };
  if (priceInput.value) payload.price_per_sqm = parseFloat(priceInput.value);
  if (slugInput.value.trim()) payload.raghdan_slug = slugInput.value.trim();
  msg.textContent = 'جارٍ الإضافة...';
  msg.style.color = 'var(--text-600)';
  try {
    const { error } = await supa.from('cities').insert(payload);
    if (error){
      msg.textContent = '⚠️ تعذّرت الإضافة: ' + error.message;
      msg.style.color = 'var(--danger)';
      return;
    }
    msg.textContent = '✅ تمت إضافة المدينة.';
    msg.style.color = 'var(--ok)';
    nameInput.value = ''; priceInput.value = ''; slugInput.value = '';
    await refreshCityDistrictData();
  } catch (e) {
    msg.textContent = '⚠️ تعذّر الاتصال بقاعدة البيانات.';
    msg.style.color = 'var(--danger)';
    console.error('btn-add-city failed', e);
  }
});

document.getElementById('btn-add-district')?.addEventListener('click', async ()=>{
  const citySel = document.getElementById('district-new-city');
  const nameInput = document.getElementById('district-new-name');
  const msg = document.getElementById('district-new-msg');
  const cityName = citySel.value;
  const name = nameInput.value.trim();
  if (!cityName || !name){
    msg.textContent = '⚠️ اختر المدينة واكتب اسم الحي.';
    msg.style.color = 'var(--danger)';
    return;
  }
  if ((CITY_DISTRICTS[cityName] || []).includes(name)){
    msg.textContent = '⚠️ هذا الحي مسجَّل أصلاً بهذي المدينة.';
    msg.style.color = 'var(--danger)';
    return;
  }
  msg.textContent = 'جارٍ الإضافة...';
  msg.style.color = 'var(--text-600)';
  try {
    const { data: cityRow, error: cityErr } = await supa.from('cities').select('id').eq('name', cityName).single();
    if (cityErr || !cityRow){
      msg.textContent = '⚠️ تعذّر إيجاد المدينة بقاعدة البيانات.';
      msg.style.color = 'var(--danger)';
      return;
    }
    const { error } = await supa.from('districts').insert({ city_id: cityRow.id, name });
    if (error){
      msg.textContent = '⚠️ تعذّرت الإضافة: ' + error.message;
      msg.style.color = 'var(--danger)';
      return;
    }
    msg.textContent = '✅ تمت إضافة الحي.';
    msg.style.color = 'var(--ok)';
    nameInput.value = '';
    await refreshCityDistrictData();
  } catch (e) {
    msg.textContent = '⚠️ تعذّر الاتصال بقاعدة البيانات.';
    msg.style.color = 'var(--danger)';
    console.error('btn-add-district failed', e);
  }
});

/* ============================================================================
   تحديث سعر حي يدوياً (owner فقط) — لحي فشل التحديث التلقائي من راغدان.
   يُخزَّن نطاق (أدنى/أعلى)، والمتوسط بينهم يُستخدم كـprice_per_sqm العادي
   (نفس حقل راغدان بالضبط) — باقي الموقع يحسب عليه بدون أي منطق خاص. علامة
   source='manual' توقف التحديث الأسبوعي عن لمس هذا الحي لحد "إرجاع للتلقائي".
   ========================================================================== */
function populatePriceManualCitySelect(){
  const sel = document.getElementById('price-manual-city');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = Object.keys(CITY_DISTRICTS).map(c => `<option value="${c}">${c}</option>`).join('');
  if (prev && CITY_DISTRICTS[prev]) sel.value = prev;
  populatePriceManualDistrictSelect();
}
function populatePriceManualDistrictSelect(){
  const citySel = document.getElementById('price-manual-city');
  const distSel = document.getElementById('price-manual-district');
  if (!citySel || !distSel) return;
  const list = CITY_DISTRICTS[citySel.value] || [];
  distSel.innerHTML = list.map(d => `<option value="${d}">${d}</option>`).join('');
  loadManualPriceStatus();
}
document.getElementById('price-manual-city')?.addEventListener('change', populatePriceManualDistrictSelect);
document.getElementById('price-manual-district')?.addEventListener('change', loadManualPriceStatus);

async function findDistrictId(cityName, districtName){
  const { data: cityRow, error: cityErr } = await supa.from('cities').select('id').eq('name', cityName).single();
  if (cityErr || !cityRow) return null;
  const { data: distRow, error: distErr } = await supa.from('districts').select('id').eq('city_id', cityRow.id).eq('name', districtName).single();
  if (distErr || !distRow) return null;
  return distRow.id;
}

async function loadManualPriceStatus(){
  const statusEl = document.getElementById('price-manual-status');
  const revertBtn = document.getElementById('btn-revert-manual-price');
  const lowInput = document.getElementById('price-manual-low');
  const highInput = document.getElementById('price-manual-high');
  const noteInput = document.getElementById('price-manual-note');
  const cityName = document.getElementById('price-manual-city').value;
  const districtName = document.getElementById('price-manual-district').value;
  if (!cityName || !districtName){ statusEl.textContent = ''; revertBtn.style.display = 'none'; return; }

  statusEl.textContent = 'جارٍ التحقق...';
  lowInput.value = ''; highInput.value = ''; noteInput.value = '';
  revertBtn.style.display = 'none';
  try {
    const districtId = await findDistrictId(cityName, districtName);
    if (!districtId){ statusEl.textContent = '⚠️ تعذّر إيجاد الحي بقاعدة البيانات.'; return; }
    const { data: row } = await supa.from('district_prices').select('price_per_sqm, source, manual_price_low, manual_price_high, manual_source_note').eq('district_id', districtId).maybeSingle();
    if (!row){
      statusEl.textContent = 'الحالة الحالية: لا يوجد سعر مسجَّل بعد.';
      return;
    }
    if (row.source === 'manual'){
      statusEl.textContent = `الحالة الحالية: يدوي — ${money(row.manual_price_low)}–${money(row.manual_price_high)} ر.س/م²${row.manual_source_note ? ' (' + row.manual_source_note + ')' : ''}`;
      lowInput.value = row.manual_price_low || '';
      highInput.value = row.manual_price_high || '';
      noteInput.value = row.manual_source_note || '';
      revertBtn.style.display = '';
    } else {
      statusEl.textContent = `الحالة الحالية: ${money(row.price_per_sqm)} ر.س/م² (تلقائي — ${row.source})`;
    }
  } catch (e) {
    console.error('loadManualPriceStatus failed', e);
    statusEl.textContent = '⚠️ تعذّر الاتصال بقاعدة البيانات.';
  }
}

document.getElementById('btn-save-manual-price')?.addEventListener('click', async ()=>{
  const msg = document.getElementById('price-manual-msg');
  const cityName = document.getElementById('price-manual-city').value;
  const districtName = document.getElementById('price-manual-district').value;
  const low = parseFloat(document.getElementById('price-manual-low').value);
  const high = parseFloat(document.getElementById('price-manual-high').value);
  const note = document.getElementById('price-manual-note').value.trim() || null;

  if (!cityName || !districtName){ msg.textContent = '⚠️ اختر المدينة والحي.'; msg.style.color = 'var(--danger)'; return; }
  if (!Number.isFinite(low) || !Number.isFinite(high) || low <= 0 || high <= 0){
    msg.textContent = '⚠️ عبّئ السعرين الأدنى والأعلى بأرقام صحيحة.'; msg.style.color = 'var(--danger)'; return;
  }
  if (low > high){ msg.textContent = '⚠️ السعر الأدنى لازم يكون أقل من أو يساوي الأعلى.'; msg.style.color = 'var(--danger)'; return; }

  msg.textContent = 'جارٍ الحفظ...';
  msg.style.color = 'var(--text-600)';
  try {
    const districtId = await findDistrictId(cityName, districtName);
    if (!districtId){ msg.textContent = '⚠️ تعذّر إيجاد الحي بقاعدة البيانات.'; msg.style.color = 'var(--danger)'; return; }
    const { error } = await supa.from('district_prices').upsert({
      district_id: districtId,
      price_per_sqm: (low + high) / 2,
      manual_price_low: low,
      manual_price_high: high,
      manual_source_note: note,
      source: 'manual',
      period_note: 'إدخال يدوي (owner)',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'district_id' });
    if (error){ msg.textContent = '⚠️ تعذّر الحفظ: ' + error.message; msg.style.color = 'var(--danger)'; return; }
    msg.textContent = '✅ تم الحفظ — التحديث الأسبوعي التلقائي ما يلمس هذا الحي بعد الحين.';
    msg.style.color = 'var(--ok)';
    loadManualPriceStatus();
  } catch (e) {
    console.error('btn-save-manual-price failed', e);
    msg.textContent = '⚠️ تعذّر الاتصال بقاعدة البيانات.';
    msg.style.color = 'var(--danger)';
  }
});

document.getElementById('btn-revert-manual-price')?.addEventListener('click', async ()=>{
  const msg = document.getElementById('price-manual-msg');
  const cityName = document.getElementById('price-manual-city').value;
  const districtName = document.getElementById('price-manual-district').value;
  if (!confirm('إرجاع هذا الحي للتحديث التلقائي؟ السعر الحالي يبقى مؤقتاً لحد أول تشغيلة أسبوعية جاية.')) return;
  msg.textContent = 'جارٍ التحديث...';
  msg.style.color = 'var(--text-600)';
  try {
    const districtId = await findDistrictId(cityName, districtName);
    if (!districtId){ msg.textContent = '⚠️ تعذّر إيجاد الحي بقاعدة البيانات.'; msg.style.color = 'var(--danger)'; return; }
    const { error } = await supa.from('district_prices').update({
      source: 'raghdan.sa',
      manual_price_low: null,
      manual_price_high: null,
      manual_source_note: null,
    }).eq('district_id', districtId);
    if (error){ msg.textContent = '⚠️ تعذّر التحديث: ' + error.message; msg.style.color = 'var(--danger)'; return; }
    msg.textContent = '✅ رجع للتحديث التلقائي — بيتحدَّث أول تشغيلة أسبوعية جاية.';
    msg.style.color = 'var(--ok)';
    loadManualPriceStatus();
  } catch (e) {
    console.error('btn-revert-manual-price failed', e);
    msg.textContent = '⚠️ تعذّر الاتصال بقاعدة البيانات.';
    msg.style.color = 'var(--danger)';
  }
});

/* ============================================================================
   فريق العمل — إضافة/عرض/حذف/تعطيل/تغيير كلمة مرور (owner فقط، عبر Edge Function آمنة)
   ========================================================================== */
const TEAM_IDTYPE_CONFIG = {
  email:    { label: 'البريد الإلكتروني', type: 'email', placeholder: 'colleague@example.com' },
  username: { label: 'اسم الدخول',        type: 'text',  placeholder: 'مثال: sara_ahmed (حروف/أرقام إنجليزية بس)' },
  phone:    { label: 'رقم الجوال (بالصيغة الدولية)', type: 'tel', placeholder: 'مثال: 966501234567+' },
};

document.getElementById('team-new-idtype')?.addEventListener('change', (e)=>{
  const cfg = TEAM_IDTYPE_CONFIG[e.target.value] || TEAM_IDTYPE_CONFIG.email;
  document.getElementById('team-new-identifier-label').textContent = cfg.label;
  const input = document.getElementById('team-new-identifier');
  input.type = cfg.type;
  input.placeholder = cfg.placeholder;
  input.value = '';
});

function roleArabicLabel(role){
  return { owner:'صلاحيات كاملة', editor:'كل الصلاحيات إلا المدن/الفريق', viewer:'مشاهدة بس' }[role] || role;
}

document.getElementById('btn-add-team-member')?.addEventListener('click', async ()=>{
  const idType = document.getElementById('team-new-idtype').value;
  const identifierInput = document.getElementById('team-new-identifier');
  const passwordInput = document.getElementById('team-new-password');
  const roleSelect = document.getElementById('team-new-role');
  const msg = document.getElementById('team-new-msg');
  const identifier = identifierInput.value.trim();
  const password = passwordInput.value;
  const role = roleSelect.value;

  if (!identifier || !password){
    msg.textContent = '⚠️ عبّئ الحقل وكلمة المرور.';
    msg.style.color = 'var(--danger)';
    return;
  }
  if (password.length < 6){
    msg.textContent = '⚠️ كلمة المرور لازم تكون 6 أحرف على الأقل.';
    msg.style.color = 'var(--danger)';
    return;
  }
  msg.textContent = 'جارٍ الإضافة...';
  msg.style.color = 'var(--text-600)';
  try {
    const payload = { action: 'create', password, role, identifierType: idType };
    if (idType === 'email') payload.email = identifier;
    else if (idType === 'username') payload.username = identifier;
    else if (idType === 'phone') payload.phone = identifier;

    const { data, error } = await supa.functions.invoke('manage-admin-users', { body: payload });
    if (error || data?.error){
      msg.textContent = '⚠️ ' + (data?.error || error.message);
      msg.style.color = 'var(--danger)';
      return;
    }
    msg.textContent = `✅ تمت الإضافة بصلاحية ${roleArabicLabel(role)}.`;
    msg.style.color = 'var(--ok)';
    identifierInput.value = ''; passwordInput.value = '';
    loadTeamMembers();
  } catch (e) {
    msg.textContent = '⚠️ تعذّر الاتصال بالخادم.';
    msg.style.color = 'var(--danger)';
    console.error('btn-add-team-member failed', e);
  }
});

async function loadTeamMembers(){
  const tbody = document.getElementById('team-members-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5">جارٍ التحميل...</td></tr>';
  try {
    const { data, error } = await supa.functions.invoke('manage-admin-users', { body: { action: 'list' } });
    if (error || data?.error){
      tbody.innerHTML = `<tr><td colspan="5">⚠️ ${escapeAdmin(data?.error || error.message)}</td></tr>`;
      return;
    }
    const callerId = data.callerId;
    tbody.innerHTML = (data.users || []).map(u=>{
      const idLabel = u.email || (u.username ? `${escapeAdmin(u.username)} (اسم دخول)` : '') || u.phone || '—';
      const isSelf = u.id === callerId;
      const dateLabel = u.created_at ? new Date(u.created_at).toLocaleDateString('ar-SA') : '—';
      return `<tr>
        <td>${idLabel}</td>
        <td>${roleArabicLabel(u.role)}</td>
        <td>${u.banned ? '<span class="badge badge-closed">معطّل</span>' : '<span class="badge badge-approved">فعّال</span>'}</td>
        <td>${dateLabel}</td>
        <td class="actions-cell">
          ${isSelf ? '<span style="color:var(--text-600);font-size:12px">هذا حسابك</span>' : `
            <button class="btn btn-ghost" onclick="resetTeamMemberPassword('${u.id}')">كلمة مرور</button>
            <button class="btn btn-ghost" onclick="toggleTeamMemberBan('${u.id}', ${!u.banned})">${u.banned ? 'تفعيل' : 'تعطيل'}</button>
            <button class="btn btn-danger" onclick="deleteTeamMember('${u.id}')">حذف</button>
          `}
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="5">لا يوجد أعضاء</td></tr>';
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5">⚠️ تعذّر الاتصال بالخادم</td></tr>';
    console.error('loadTeamMembers failed', e);
  }
}

async function deleteTeamMember(id){
  if (!confirm('حذف هذا العضو نهائياً؟ لا يمكن التراجع.')) return;
  try {
    const { data, error } = await supa.functions.invoke('manage-admin-users', { body: { action: 'delete', userId: id } });
    if (error || data?.error){ showToast('⚠️ ' + (data?.error || error.message)); return; }
    showToast('🗑️ تم الحذف');
    loadTeamMembers();
  } catch (e) { console.error(e); showToast('⚠️ تعذّر الحذف'); }
}

async function toggleTeamMemberBan(id, ban){
  if (!confirm(ban ? 'تعطيل هذا العضو؟ ما يقدر يسجّل دخول لين تفعّله مرة ثانية.' : 'إعادة تفعيل هذا العضو؟')) return;
  try {
    const { data, error } = await supa.functions.invoke('manage-admin-users', { body: { action: 'toggle_ban', userId: id, ban } });
    if (error || data?.error){ showToast('⚠️ ' + (data?.error || error.message)); return; }
    showToast(ban ? '⏸️ تم التعطيل' : '▶️ تم التفعيل');
    loadTeamMembers();
  } catch (e) { console.error(e); showToast('⚠️ تعذّر التحديث'); }
}

async function resetTeamMemberPassword(id){
  const newPassword = prompt('اكتب كلمة المرور الجديدة لهذا العضو (6 أحرف على الأقل):');
  if (!newPassword) return;
  if (newPassword.length < 6){ showToast('⚠️ كلمة المرور قصيرة جداً'); return; }
  try {
    const { data, error } = await supa.functions.invoke('manage-admin-users', { body: { action: 'set_password', userId: id, newPassword } });
    if (error || data?.error){ showToast('⚠️ ' + (data?.error || error.message)); return; }
    showToast('🔑 تم تغيير كلمة المرور');
  } catch (e) { console.error(e); showToast('⚠️ تعذّر التحديث'); }
}

function money(n){ return Math.round(n || 0).toLocaleString('en-US'); }
// بيانات الأطراف تجي من نموذج عام بالموقع الرئيسي (مو محمي بتسجيل دخول)،
// فلازم تعقيمها قبل عرضها هنا لمنع أي حقن HTML/script بحقول العقد.
function escapeAdmin(s){ const d = document.createElement('div'); d.textContent = String(s ?? ''); return d.innerHTML; }
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(()=> t.style.display = 'none', 2500);
}

/* ============================================================================
   Auth
   ========================================================================== */
async function checkSession(){
  const { data: { session } } = await supa.auth.getSession();
  applySessionUI(session);
}

let currentUserRole = null;

function applyRoleUI(){
  document.body.dataset.role = currentUserRole || 'viewer';
}

function applySessionUI(session){
  const preLoginLink = document.getElementById('pre-login-home-link');
  if (session){
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    if (preLoginLink) preLoginLink.style.display = 'none';
    document.getElementById('admin-email').textContent = session.user.email;
    // viewer افتراضي (أكثر أماناً) لو ما فيه دور محفوظ إطلاقاً — بس هذا ما
    // يفترض يصير للحساب owner الحالي بعد ما يشغّل المستخدم الـmigration
    currentUserRole = session.user.app_metadata?.role || 'viewer';
    applyRoleUI();
    loadDashboard();
    refreshCityDistrictData();
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    if (preLoginLink) preLoginLink.style.display = 'flex';
    currentUserRole = null;
  }
}

// يضمن تحديث الواجهة فوراً حتى لو رمز الدخول (من رابط Magic Link أو إعادة
// تعيين كلمة المرور) اكتمل معالجته بعد لحظات من تحميل الصفحة، بدل ما تفوت
// اللحظة بفحص واحد فقط عند التحميل.
supa.auth.onAuthStateChange((_event, session) => {
  applySessionUI(session);
});

document.getElementById('btn-login').addEventListener('click', async ()=>{
  const raw = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const msg = document.getElementById('login-msg');
  msg.style.color = 'var(--text-600)';
  msg.textContent = 'جاري الدخول...';
  // يدعم 3 صيغ تلقائياً حسب المكتوب: بريد إلكتروني عادي، رقم جوال (أرقام بس)،
  // أو اسم دخول (أي شي ثاني) — نحوّله لنفس البريد الوهمي اللي استخدمناه وقت
  // إنشاء الحساب بـ manage-admin-users (@team.himmat.local)
  let credentials;
  if (raw.includes('@')) {
    credentials = { email: raw };
  } else if (/^\+?\d{6,15}$/.test(raw)) {
    credentials = { phone: raw };
  } else {
    const clean = raw.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    credentials = { email: `${clean}@team.himmat.local` };
  }
  try {
    const { error } = await supa.auth.signInWithPassword({ ...credentials, password });
    if (error){
      msg.style.color = 'var(--danger)';
      msg.textContent = '⚠️ ' + error.message;
    } else {
      msg.textContent = '';
      await checkSession();
    }
  } catch (e) {
    msg.style.color = 'var(--danger)';
    msg.textContent = '⚠️ تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مجدداً.';
    console.error(e);
  }
});
document.getElementById('login-password').addEventListener('keydown', e=>{
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});
document.getElementById('btn-logout').addEventListener('click', async ()=>{
  await supa.auth.signOut();
  checkSession();
});

/* ============================================================================
   تغيير كلمة المرور — مباشرة من لوحة التحكم، بدون الحاجة للرجوع للوحة
   Supabase أو التعامل مع بريد استعادة قد تفشل صلاحيته (فحص أمني تلقائي من
   بعض مزوّدي البريد يفتح الرابط قبل المستخدم ويستهلكه).
   ========================================================================== */
function openChangePasswordModal(){
  document.getElementById('current-password-input').value = '';
  document.getElementById('new-password-input').value = '';
  document.getElementById('confirm-password-input').value = '';
  document.getElementById('change-password-msg').textContent = '';
  document.getElementById('change-password-overlay').classList.remove('hide');
}
function closeChangePasswordModal(){
  document.getElementById('change-password-overlay').classList.add('hide');
}
document.getElementById('btn-change-password').addEventListener('click', openChangePasswordModal);
document.getElementById('btn-cancel-password-change').addEventListener('click', closeChangePasswordModal);

document.getElementById('btn-save-new-password').addEventListener('click', async ()=>{
  const msg = document.getElementById('change-password-msg');
  const currentPass = document.getElementById('current-password-input').value;
  const newPass = document.getElementById('new-password-input').value;
  const confirmPass = document.getElementById('confirm-password-input').value;

  if (!currentPass){
    msg.textContent = '⚠️ اكتب كلمة المرور الحالية.';
    msg.style.color = 'var(--danger)';
    return;
  }
  if (newPass.length < 6){
    msg.textContent = '⚠️ كلمة المرور لازم تكون 6 أحرف على الأقل.';
    msg.style.color = 'var(--danger)';
    return;
  }
  if (newPass !== confirmPass){
    msg.textContent = '⚠️ كلمتا المرور غير متطابقتين.';
    msg.style.color = 'var(--danger)';
    return;
  }

  msg.textContent = 'جاري الحفظ...';
  msg.style.color = 'var(--text-600)';
  try {
    const { error } = await supa.auth.updateUser({ password: newPass, current_password: currentPass });
    if (error) throw error;
    msg.textContent = '✅ تم تغيير كلمة المرور بنجاح.';
    msg.style.color = 'var(--ok)';
    setTimeout(closeChangePasswordModal, 1500);
  } catch (e) {
    console.error('changePassword failed', e);
    msg.textContent = '⚠️ تعذّر التغيير: ' + e.message;
    msg.style.color = 'var(--danger)';
  }
});

/* ============================================================================
   Tabs
   ========================================================================== */
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'properties') loadProperties();
    if (btn.dataset.tab === 'offers') loadOffers();
    if (btn.dataset.tab === 'inquiries') loadInquiries();
    if (btn.dataset.tab === 'contracts') loadContracts();
    if (btn.dataset.tab === 'team') loadTeamMembers();
  });
});

/* ============================================================================
   Dashboard
   ========================================================================== */
async function loadDashboard(){
  try {
    const [pending, approved, rejected, newInq, contractsCount, recent] = await Promise.all([
      supa.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supa.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supa.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supa.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supa.from('contracts').select('id', { count: 'exact', head: true }),
      supa.from('properties').select('*').order('created_at', { ascending: false }).limit(8),
    ]);
    document.getElementById('s-pending').textContent = pending.count ?? 0;
    document.getElementById('s-approved').textContent = approved.count ?? 0;
    document.getElementById('s-rejected').textContent = rejected.count ?? 0;
    document.getElementById('s-new-inquiries').textContent = newInq.count ?? 0;
    document.getElementById('s-contracts').textContent = contractsCount.count ?? 0;

    const tbody = document.getElementById('dashboard-recent');
    const rows = recent.data || [];
    tbody.innerHTML = rows.length ? rows.map(p => `
      <tr>
        <td>${p.city}</td><td>${p.district}</td><td>${p.property_type}</td>
        <td>${money(p.price)} ر.س</td>
        <td><span class="badge badge-${p.status}">${statusLabel(p.status)}</span></td>
        <td>${new Date(p.created_at).toLocaleDateString('ar-SA')}</td>
      </tr>`).join('') : `<tr class="empty-row"><td colspan="6">لا توجد عقارات بعد.</td></tr>`;
  } catch (e) {
    console.error('loadDashboard failed', e);
    showToast('⚠️ تعذّر تحميل لوحة القيادة');
  }
  loadJobStatus();
  loadMostViewed();
}

const JOB_LABELS = {
  'update-district-prices': 'تحديث أسعار الأحياء',
  'send-reminders': 'تنبيهات الدفعات/الإخلاء',
};

async function loadJobStatus(){
  const el = document.getElementById('job-status-list');
  try {
    const { data, error } = await supa.from('job_runs')
      .select('*')
      .order('finished_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    const latestByJob = {};
    (data || []).forEach(r => { if (!latestByJob[r.job_name]) latestByJob[r.job_name] = r; });

    el.innerHTML = Object.entries(JOB_LABELS).map(([name, label]) => {
      const run = latestByJob[name];
      if (!run) return `<div>⚪ ${label} — لا يوجد تشغيل مسجَّل بعد</div>`;
      const icon = run.status === 'success' ? '✅' : (run.status === 'partial' ? '⚠️' : '❌');
      const when = new Date(run.finished_at).toLocaleString('ar-SA');
      const extra = run.summary?.updated != null ? ` (${run.summary.updated}/${run.summary.total} نجح)` : '';
      return `<div>${icon} ${label} — آخر تشغيل: ${when}${extra}</div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = '⚠️ تعذّر تحميل حالة الوظائف.';
    console.error('loadJobStatus failed', e);
  }
}

async function loadMostViewed(){
  const el = document.getElementById('most-viewed-list');
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supa.from('offer_views')
      .select('offer_id, offers(title)')
      .gte('viewed_at', thirtyDaysAgo);
    if (error) throw error;

    const counts = {};
    (data || []).forEach(r => {
      const title = r.offers?.title || 'عرض محذوف';
      counts[title] = (counts[title] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    el.innerHTML = sorted.length
      ? sorted.map(([title, count]) => `<div>${escapeAdmin(title)} — <b>${count}</b> مشاهدة</div>`).join('')
      : '<span style="color:var(--text-600)">لا توجد مشاهدات مسجَّلة بعد آخر 30 يوم.</span>';
  } catch (e) {
    el.innerHTML = '⚠️ تعذّر تحميل الأكثر مشاهدة.';
    console.error('loadMostViewed failed', e);
  }
}

function statusLabel(s){
  return { pending:'بانتظار المراجعة', approved:'معتمد', rejected:'مرفوض',
           new:'جديد', contacted:'تم التواصل', closed:'مغلق' }[s] || s;
}

/* ============================================================================
   Properties moderation
   ========================================================================== */
async function loadProperties(){
  const filter = document.getElementById('prop-filter').value;
  const tbody = document.getElementById('properties-tbody');
  tbody.innerHTML = `<tr class="empty-row"><td colspan="9">جاري التحميل...</td></tr>`;
  try {
    let query = supa.from('properties').select('*').order('created_at', { ascending: false }).limit(100);
    if (filter !== 'all') query = query.eq('status', filter);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || !data.length){
      tbody.innerHTML = `<tr class="empty-row"><td colspan="9">لا توجد عقارات مطابقة.</td></tr>`;
      return;
    }
    window.__PROPERTIES_CACHE = {};
    data.forEach(p => window.__PROPERTIES_CACHE[p.id] = p);

    tbody.innerHTML = data.map(p => {
      const roomsOrFloors = p.property_type === 'عمارة'
        ? `${p.floors_count ?? '—'} × ${p.units_per_floor ?? '—'}`
        : (p.rooms ?? '—');
      return `
      <tr>
        <td>${p.city}</td><td>${p.district}</td><td>${p.property_type}</td>
        <td>${money(p.price)} ر.س</td><td>${p.area_sqm} م²</td><td>${roomsOrFloors}</td>
        <td><span class="badge badge-${p.status}">${statusLabel(p.status)}</span>${p.converted_to_offer ? ' <span class="badge badge-approved" title="عندها عرض منشور أصلاً">✓ محوَّل لعرض</span>' : ''}</td>
        <td>${p.submitted_by_contact || '—'}</td>
        <td class="actions-cell">
          ${p.status !== 'approved' ? `<button class="btn btn-ok" data-staff-only onclick="setPropertyStatus('${p.id}','approved')">اعتماد</button>` : ''}
          ${p.status !== 'rejected' ? `<button class="btn btn-danger" data-staff-only onclick="setPropertyStatus('${p.id}','rejected')">رفض</button>` : ''}
          ${p.status === 'approved' ? `<button class="btn btn-ghost" data-staff-only onclick="convertToOffer('${p.id}', ${!!p.converted_to_offer})">${p.converted_to_offer ? 'تحويل مرة أخرى' : 'تحويل لعرض'}</button>` : ''}
          <button class="btn btn-ghost" data-staff-only onclick="deleteProperty('${p.id}')">حذف</button>
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    console.error('loadProperties failed', e);
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">⚠️ تعذّر تحميل العقارات.</td></tr>`;
  }
}
document.getElementById('prop-filter').addEventListener('change', loadProperties);
document.getElementById('btn-refresh-props').addEventListener('click', loadProperties);

async function setPropertyStatus(id, status){
  try {
    const { error } = await supa.from('properties').update({ status }).eq('id', id);
    if (error) throw error;
    showToast(status === 'approved' ? '✅ تم اعتماد العقار' : '✅ تم رفض العقار');
    // نحوّل الفلتر لـ"الكل" عند الاعتماد عشان العقار يفضل ظاهر بزر "تحويل لعرض"
    // بدل ما يختفي فوراً من فلتر "بانتظار المراجعة" الحالي
    if (status === 'approved') document.getElementById('prop-filter').value = 'all';
    loadProperties();
    loadDashboard();
  } catch (e) {
    console.error(e);
    showToast('⚠️ تعذّر تحديث الحالة: ' + e.message);
  }
}

async function deleteProperty(id){
  if (!confirm('حذف هذا العقار نهائياً؟ لا يمكن التراجع.')) return;
  try {
    const { error } = await supa.from('properties').delete().eq('id', id);
    if (error) throw error;
    showToast('🗑️ تم الحذف');
    loadProperties();
    loadDashboard();
  } catch (e) {
    console.error(e);
    showToast('⚠️ تعذّر الحذف: ' + e.message);
  }
}

/* ============================================================================
   Offers — rich marketing listings (description, map, marketer, licenses)
   ========================================================================== */
function readOfferForm(){
  const parsedImageUrls = JSON.parse(document.getElementById('offer-image-urls').value || '[]');
  return {
    title: document.getElementById('offer-title').value.trim(),
    city: document.getElementById('offer-city').value.trim(),
    district: document.getElementById('offer-district').value.trim(),
    property_type: document.getElementById('offer-type').value.trim(),
    area_sqm: parseFloat(document.getElementById('offer-area').value) || null,
    rooms: parseInt(document.getElementById('offer-rooms').value, 10) || null,
    price_original: parseFloat(document.getElementById('offer-price-original').value) || null,
    discount_pct: parseInt(document.getElementById('offer-discount').value, 10) || 0,
    price_final: parseFloat(document.getElementById('offer-price-final').value) || null,
    map_url: document.getElementById('offer-map-url').value.trim() || null,
    image_url: document.getElementById('offer-image-url').value.trim() || null,
    image_urls: parsedImageUrls.length ? parsedImageUrls : null,
    marketer_name: document.getElementById('offer-marketer-name').value.trim() || null,
    marketer_phone: document.getElementById('offer-marketer-phone').value.trim() || null,
    real_estate_license: document.getElementById('offer-re-license').value.trim() || null,
    ad_license: document.getElementById('offer-ad-license').value.trim() || null,
    description: document.getElementById('offer-description').value.trim() || null,
    is_published: document.getElementById('offer-published').checked,
  };
}

const AI_DESCRIBE_URL = 'https://himmat-ai-backend.ahmedvall.workers.dev/describe';
document.getElementById('btn-generate-description')?.addEventListener('click', async ()=>{
  const btn = document.getElementById('btn-generate-description');
  const msg = document.getElementById('generate-description-msg');
  const f = readOfferForm();

  if (!f.property_type || !f.city || !f.district){
    msg.textContent = '⚠️ عبّئ المدينة والحي ونوع العقار أول (أقل معلومات لازمة للتوليد).';
    msg.style.color = 'var(--danger)';
    return;
  }

  const infoParts = [
    `نوع العقار: ${f.property_type}`,
    `الموقع: حي ${f.district}، ${f.city}`,
  ];
  if (f.area_sqm) infoParts.push(`المساحة: ${f.area_sqm} م²`);
  if (f.rooms) infoParts.push(`عدد الغرف: ${f.rooms}`);
  if (f.price_final) infoParts.push(`السعر: ${money(f.price_final)} ر.س`);
  if (f.title) infoParts.push(`العنوان المبدئي: ${f.title}`);

  btn.disabled = true;
  msg.textContent = 'جارٍ التوليد...';
  msg.style.color = 'var(--text-600)';
  try {
    const turnstileToken = await getTurnstileToken();
    const res = await fetch(AI_DESCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ info: infoParts.join('\n'), turnstileToken }),
    });
    const data = await res.json().catch(()=> ({}));
    if (!res.ok || data.error){
      msg.textContent = '⚠️ ' + (data.error || `تعذّر التوليد (HTTP ${res.status})`);
      msg.style.color = 'var(--danger)';
      return;
    }
    document.getElementById('offer-description').value = data.reply || '';
    msg.textContent = '✅ تم التوليد — راجع النص وعدّل حسب الحاجة قبل الحفظ.';
    msg.style.color = 'var(--ok)';
  } catch (e) {
    console.error('generate-description failed', e);
    msg.textContent = '⚠️ تعذّر الاتصال بالخادم.';
    msg.style.color = 'var(--danger)';
  } finally {
    btn.disabled = false;
  }
});
/* ضغط الصورة بالمتصفح قبل الرفع — تصغير الأبعاد لحد أقصى معقول (1600px)
   وإعادة الترميز كـJPEG بجودة 80%. يقلل حجم الملف المرفوع بشكل كبير
   (عادة 60-90% أصغر) بدون فرق ملموس بالجودة على الشاشة. لو فشل الضغط لأي
   سبب (متصفح قديم، صيغة غير متوقعة)، نرفع الصورة الأصلية بدل ما نوقف كامل
   العملية. */
function compressImage(file, maxWidth = 1600, quality = 0.8){
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxWidth){
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('تعذّر ضغط الصورة')); return; }
        resolve(blob);
      }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('تعذّر تحميل الصورة للمعالجة')); };
    img.src = objectUrl;
  });
}

/* ============================================================================
   رفع صور العرض (تدعم عدة صور دفعة وحدة) مباشرة من الجهاز إلى مخزن Supabase
   Storage — أول صورة بالقائمة تصير تلقائياً "صورة الغلاف" (image_url)
   المستخدمة بالبطاقات وشريحة الهيرو، والباقي يظهر كمعرض بنافذة التفاصيل.
   ========================================================================== */
let currentOfferImages = []; // مصفوفة روابط الصور بالنموذج الحالي (بالترتيب)

function renderOfferImageThumbs(){
  const wrap = document.getElementById('offer-image-thumbs');
  wrap.innerHTML = currentOfferImages.map((url, i) => `
    <div style="position:relative">
      <img src="${url}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;border:1px solid var(--line)${i===0 ? ';outline:2px solid var(--gold-500)' : ''}">
      <button type="button" onclick="removeOfferImage(${i})" title="حذف" style="position:absolute;top:-6px;left:-6px;width:20px;height:20px;border-radius:50%;background:var(--danger);color:#fff;border:none;font-size:12px;line-height:1;cursor:pointer">✕</button>
      ${i===0 ? '<span style="position:absolute;bottom:2px;right:2px;background:var(--gold-500);color:#020617;font-size:9px;padding:1px 4px;border-radius:4px">غلاف</span>' : ''}
    </div>`).join('');
  document.getElementById('offer-image-url').value = currentOfferImages[0] || '';
  document.getElementById('offer-image-urls').value = JSON.stringify(currentOfferImages);
}
function removeOfferImage(index){
  currentOfferImages.splice(index, 1);
  renderOfferImageThumbs();
}

async function uploadOneOfferImage(file){
  let uploadBlob = file;
  try {
    uploadBlob = await compressImage(file, 1600, 0.8);
  } catch (compressErr) {
    console.error('compressImage: فشل الضغط، سيتم رفع الصورة الأصلية بدلاً منه.', compressErr);
    uploadBlob = file;
  }
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error: uploadError } = await supa.storage.from('property-images').upload(fileName, uploadBlob, { contentType: 'image/jpeg' });
  if (uploadError) throw uploadError;
  const { data: urlData } = supa.storage.from('property-images').getPublicUrl(fileName);
  return urlData.publicUrl;
}

document.getElementById('offer-image-file').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  const statusEl = document.getElementById('offer-image-upload-status');
  if (!files.length) return;

  const invalid = files.find(f => !f.type.startsWith('image/'));
  if (invalid) {
    statusEl.textContent = '⚠️ فيه ملف مختار مو صورة.';
    statusEl.style.color = 'var(--danger)';
    return;
  }
  const tooBig = files.find(f => f.size > 5 * 1024 * 1024);
  if (tooBig) {
    statusEl.textContent = '⚠️ فيه صورة أكبر من 5 ميجابايت — اختر صور أصغر.';
    statusEl.style.color = 'var(--danger)';
    return;
  }

  let doneCount = 0;
  for (const file of files) {
    statusEl.textContent = `جاري رفع الصورة ${++doneCount} من ${files.length}...`;
    statusEl.style.color = 'var(--text-600)';
    try {
      const url = await uploadOneOfferImage(file);
      currentOfferImages.push(url);
      renderOfferImageThumbs();
    } catch (err) {
      console.error('offer image upload failed', err);
      statusEl.textContent = '⚠️ تعذّر رفع إحدى الصور: ' + (err.message || 'خطأ غير معروف');
      statusEl.style.color = 'var(--danger)';
      return;
    }
  }
  statusEl.textContent = `✅ اترفعت ${files.length} صورة بنجاح.`;
  statusEl.style.color = 'var(--ok)';
  e.target.value = ''; // يسمح تختار نفس الملفات مرة ثانية لو احتجت
});

function clearOfferForm(){
  convertingPropertyId = null;
  document.getElementById('offer-edit-id').value = '';
  ['offer-title','offer-city','offer-district','offer-type','offer-area','offer-rooms',
   'offer-price-original','offer-price-final','offer-map-url','offer-image-url','offer-marketer-name',
   'offer-marketer-phone','offer-re-license','offer-ad-license','offer-description'].forEach(id=>{
    document.getElementById(id).value = '';
  });
  populateOfferDistrictSelect();
  document.getElementById('offer-image-file').value = '';
  currentOfferImages = [];
  renderOfferImageThumbs();
  document.getElementById('offer-image-upload-status').textContent = '';
  document.getElementById('offer-discount').value = '0';
  document.getElementById('offer-published').checked = true;
  document.getElementById('offer-form-title').textContent = 'إضافة عرض جديد';
  document.getElementById('btn-cancel-offer-edit').style.display = 'none';
}
document.getElementById('btn-cancel-offer-edit').addEventListener('click', clearOfferForm);

let convertingPropertyId = null; // العقار الجاري تحويله لعرض حالياً — يُستخدم لتحديث علامة "محوَّل" بعد نجاح الحفظ فقط
function convertToOffer(propertyId, alreadyConverted){
  if (alreadyConverted && !confirm('هذا العقار محوَّل لعرض من قبل أصلاً. متأكد تبي تسوّي عرض ثاني له؟')) return;
  const p = window.__PROPERTIES_CACHE?.[propertyId];
  if (!p) return;
  clearOfferForm();
  convertingPropertyId = propertyId;
  document.getElementById('offer-title').value = `${p.property_type} — ${p.district}`;
  document.getElementById('offer-city').value = p.city || '';
  populateOfferDistrictSelect();
  document.getElementById('offer-district').value = p.district || '';
  document.getElementById('offer-type').value = p.property_type || '';
  document.getElementById('offer-area').value = p.area_sqm || '';
  if (p.property_type !== 'عمارة') document.getElementById('offer-rooms').value = p.rooms || '';
  document.getElementById('offer-price-original').value = p.price || '';
  document.getElementById('offer-price-final').value = p.price || '';
  document.querySelector('[data-tab="offers"]').click();
  document.getElementById('offer-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('offer-title').focus();
  showToast('✅ تم تعبئة بيانات العقار — أكمل باقي التفاصيل (الصورة، المسوّق، الخصم إن وجد)');
}

document.getElementById('btn-save-offer').addEventListener('click', async ()=>{
  const msg = document.getElementById('offer-form-msg');
  const payload = readOfferForm();
  if (!payload.title || !payload.city || !payload.district || !payload.property_type){
    msg.style.color = 'var(--danger)';
    msg.textContent = '⚠️ عبّئ العنوان والمدينة والحي ونوع العقار على الأقل.';
    return;
  }
  const editId = document.getElementById('offer-edit-id').value;
  const propertyIdToMark = convertingPropertyId; // نسخة محلية قبل ما clearOfferForm يصفّرها
  try {
    let error;
    if (editId){
      ({ error } = await supa.from('offers').update(payload).eq('id', editId));
    } else {
      ({ error } = await supa.from('offers').insert(payload));
    }
    if (error) throw error;
    if (!editId && propertyIdToMark){
      const { error: markError } = await supa.from('properties').update({ converted_to_offer: true }).eq('id', propertyIdToMark);
      if (markError) console.error('تعذّر تحديث علامة converted_to_offer', markError);
      loadProperties();
    }
    msg.style.color = 'var(--ok)';
    msg.textContent = editId ? '✅ تم تحديث العرض' : '✅ تم إضافة العرض';
    clearOfferForm();
    loadOffers();
  } catch (e) {
    console.error(e);
    msg.style.color = 'var(--danger)';
    msg.textContent = '⚠️ تعذّر الحفظ: ' + e.message;
  }
});

async function loadOffers(){
  const tbody = document.getElementById('offers-tbody');
  tbody.innerHTML = `<tr class="empty-row"><td colspan="7">جاري التحميل...</td></tr>`;
  try {
    const { data, error } = await supa.from('offers').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    if (!data || !data.length){
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">لا توجد عروض بعد.</td></tr>`;
      return;
    }
    window.__OFFERS_CACHE = {};
    data.forEach(o => window.__OFFERS_CACHE[o.id] = o);
    tbody.innerHTML = data.map(o => `
      <tr>
        <td>${o.title}</td><td>${o.city}</td><td>${o.district}</td>
        <td>${o.price_final ? money(o.price_final) + ' ر.س' : '—'}</td>
        <td>${o.discount_pct || 0}%</td>
        <td>
          <span class="badge ${o.is_published ? 'badge-approved' : 'badge-pending'}">${o.is_published ? 'منشور' : 'مخفي'}</span>
          ${o.is_sold ? '<span class="badge badge-rejected">مباع</span>' : ''}
        </td>
        <td class="actions-cell">
          <button class="btn btn-ghost" onclick="editOffer('${o.id}')">تعديل</button>
          <button class="btn btn-ghost" data-staff-only onclick="toggleOfferPublish('${o.id}', ${!o.is_published})">${o.is_published ? 'إخفاء' : 'نشر'}</button>
          <button class="btn btn-ghost" data-staff-only onclick="toggleOfferSold('${o.id}', ${!o.is_sold})">${o.is_sold ? 'إرجاع للمتاح' : 'تم البيع'}</button>
          <button class="btn btn-danger" data-staff-only onclick="deleteOffer('${o.id}')">حذف</button>
        </td>
      </tr>`).join('');
  } catch (e) {
    console.error('loadOffers failed', e);
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">⚠️ تعذّر تحميل العروض.</td></tr>`;
  }
}

function editOffer(id){
  const o = window.__OFFERS_CACHE?.[id];
  if (!o) return;
  document.getElementById('offer-edit-id').value = o.id;
  document.getElementById('offer-title').value = o.title || '';
  document.getElementById('offer-city').value = o.city || '';
  populateOfferDistrictSelect();
  document.getElementById('offer-district').value = o.district || '';
  document.getElementById('offer-type').value = o.property_type || '';
  document.getElementById('offer-area').value = o.area_sqm || '';
  document.getElementById('offer-rooms').value = o.rooms || '';
  document.getElementById('offer-price-original').value = o.price_original || '';
  document.getElementById('offer-discount').value = o.discount_pct || 0;
  document.getElementById('offer-price-final').value = o.price_final || '';
  document.getElementById('offer-map-url').value = o.map_url || '';
  currentOfferImages = (o.image_urls && o.image_urls.length) ? [...o.image_urls] : (o.image_url ? [o.image_url] : []);
  renderOfferImageThumbs();
  document.getElementById('offer-marketer-name').value = o.marketer_name || '';
  document.getElementById('offer-marketer-phone').value = o.marketer_phone || '';
  document.getElementById('offer-re-license').value = o.real_estate_license || '';
  document.getElementById('offer-ad-license').value = o.ad_license || '';
  document.getElementById('offer-description').value = o.description || '';
  document.getElementById('offer-published').checked = !!o.is_published;
  document.getElementById('offer-form-title').textContent = 'تعديل العرض';
  document.getElementById('btn-cancel-offer-edit').style.display = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function toggleOfferPublish(id, newState){
  try {
    const { error } = await supa.from('offers').update({ is_published: newState }).eq('id', id);
    if (error) throw error;
    showToast(newState ? '✅ تم النشر' : '✅ تم الإخفاء');
    loadOffers();
  } catch (e) {
    console.error(e);
    showToast('⚠️ تعذّر التحديث: ' + e.message);
  }
}

async function toggleOfferSold(id, newState){
  try {
    const { error } = await supa.from('offers').update({ is_sold: newState }).eq('id', id);
    if (error) throw error;
    showToast(newState ? '✅ تم تعليمه كمباع' : '✅ رجع متاح للبيع');
    loadOffers();
  } catch (e) {
    console.error(e);
    showToast('⚠️ تعذّر التحديث: ' + e.message);
  }
}

async function deleteOffer(id){
  if (!confirm('حذف هذا العرض نهائياً؟')) return;
  try {
    const { error } = await supa.from('offers').delete().eq('id', id);
    if (error) throw error;
    showToast('🗑️ تم الحذف');
    loadOffers();
  } catch (e) {
    console.error(e);
    showToast('⚠️ تعذّر الحذف: ' + e.message);
  }
}

/* ============================================================================
   Inquiries
   ========================================================================== */
async function loadInquiries(){
  const filter = document.getElementById('inq-filter').value;
  const tbody = document.getElementById('inquiries-tbody');
  tbody.innerHTML = `<tr class="empty-row"><td colspan="7">جاري التحميل...</td></tr>`;
  try {
    let query = supa.from('inquiries').select('*').order('created_at', { ascending: false }).limit(100);
    if (filter !== 'all') query = query.eq('status', filter);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || !data.length){
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">لا توجد استفسارات مطابقة.</td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(i => `
      <tr>
        <td>${i.full_name}</td><td>${i.email || i.phone || '—'}</td><td>${i.inquiry_type || '—'}</td>
        <td style="white-space:normal;max-width:260px">${i.message || '—'}</td>
        <td><span class="badge badge-${i.status}">${statusLabel(i.status)}</span></td>
        <td>${new Date(i.created_at).toLocaleDateString('ar-SA')}</td>
        <td class="actions-cell">
          ${i.status !== 'contacted' ? `<button class="btn btn-ghost" data-staff-only onclick="setInquiryStatus('${i.id}','contacted')">تم التواصل</button>` : ''}
          ${i.status !== 'closed' ? `<button class="btn btn-ghost" data-staff-only onclick="setInquiryStatus('${i.id}','closed')">إغلاق</button>` : ''}
        </td>
      </tr>`).join('');
  } catch (e) {
    console.error('loadInquiries failed', e);
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">⚠️ تعذّر تحميل الاستفسارات.</td></tr>`;
  }
}
document.getElementById('inq-filter').addEventListener('change', loadInquiries);
document.getElementById('btn-refresh-inq').addEventListener('click', loadInquiries);

async function setInquiryStatus(id, status){
  try {
    const { error } = await supa.from('inquiries').update({ status }).eq('id', id);
    if (error) throw error;
    showToast('✅ تم التحديث');
    loadInquiries();
    loadDashboard();
  } catch (e) {
    console.error(e);
    showToast('⚠️ تعذّر التحديث: ' + e.message);
  }
}

/* ============================================================================
   Contracts (read-only) — العقد يُنشأ فقط من موقع الزوار (index.html) عبر
   create_contract_with_schedule، هذا القسم بس للعرض والمتابعة
   ========================================================================== */
function contractStatusLabel(s){
  return { ACTIVE:'ساري', EXPIRED:'منتهي', CANCELLED:'ملغى' }[s] || s;
}
function contractStatusBadge(s){
  return { ACTIVE:'approved', EXPIRED:'pending', CANCELLED:'rejected' }[s] || 'pending';
}

let contractsCache = {}; // id -> صف العقد كامل، يستخدمه toggleInstallments بدون استعلام إضافي
function idTypeLabel(t){
  return { national_id:'هوية وطنية', iqama:'إقامة', other:'أخرى' }[t] || '—';
}

async function loadContracts(){
  const tbody = document.getElementById('contracts-tbody');
  const search = document.getElementById('contracts-search').value.trim().toLowerCase();
  tbody.innerHTML = `<tr class="empty-row"><td colspan="12">جاري التحميل...</td></tr>`;

try {
    const { data, error } = await supa.from('contracts')
      .select(`*,
        lessor:parties!contracts_lessor_id_fkey(full_name, phone, national_id, id_type, nationality, date_of_birth),
        lessee:parties!contracts_lessee_id_fkey(full_name, phone, national_id, id_type, nationality, date_of_birth),
        contract_installments(id)`)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;

    let rows = data || [];
    if (search){
      rows = rows.filter(c =>
        (c.contract_number || '').toLowerCase().includes(search) ||
        (c.lessor?.full_name || '').toLowerCase().includes(search) ||
        (c.lessee?.full_name || '').toLowerCase().includes(search)
      );
    }
    if (!rows.length){
      tbody.innerHTML = `<tr class="empty-row"><td colspan="12">لا توجد عقود مطابقة.</td></tr>`;
      return;
    }

    rows.forEach(c => { contractsCache[c.id] = c; });

    tbody.innerHTML = rows.map(c => `
      <tr>
        <td>${c.contract_number}</td>
        <td>${c.lessor?.full_name || '—'}</td>
        <td>${c.lessee?.full_name || '—'}</td>
        <td>${c.city || '—'} / ${c.district || '—'}</td>
        <td>${c.unit_type || '—'}</td>
        <td>${c.floor_number || '—'}</td>
        <td>${c.area_sqm ? c.area_sqm + ' م²' : '—'}</td>
        <td>${money(c.annual_rent)} ر.س</td>
        <td>${(c.contract_installments || []).length}</td>
        <td><span class="badge badge-${contractStatusBadge(c.status)}">${contractStatusLabel(c.status)}</span></td>
        <td>${new Date(c.created_at).toLocaleDateString('ar-SA')}</td>
        <td class="actions-cell">
          <button class="btn btn-ghost" id="btn-toggle-${c.id}" onclick="toggleInstallments('${c.id}')">عرض التفاصيل</button>
        </td>
      </tr>
      <tr class="installments-row" id="installments-${c.id}" style="display:none">
        <td colspan="12"></td>
      </tr>`).join('');
  } catch (e) {
    console.error('loadContracts failed', e);
    tbody.innerHTML = `<tr class="empty-row"><td colspan="12">⚠️ تعذّر تحميل العقود.</td></tr>`;
  }
}
document.getElementById('btn-refresh-contracts').addEventListener('click', loadContracts);
let contractsSearchDebounce;
document.getElementById('contracts-search').addEventListener('input', ()=>{
  clearTimeout(contractsSearchDebounce);
  contractsSearchDebounce = setTimeout(loadContracts, 300);
});

async function toggleInstallments(contractId){
  const row = document.getElementById('installments-' + contractId);
  const btn = document.getElementById('btn-toggle-' + contractId);
  if (!row) return;
  if (row.style.display !== 'none'){
    row.style.display = 'none';
    if (btn) btn.textContent = 'عرض التفاصيل';
    return;
  }
  const cell = row.querySelector('td');
  cell.innerHTML = 'جاري التحميل...';
  row.style.display = '';
  if (btn) btn.textContent = 'إخفاء التفاصيل';

  const c = contractsCache[contractId];
  const partyBlock = (label, p) => `
    <div class="card" style="padding:12px 16px">
      <b style="display:block;margin-bottom:6px">${label}</b>
      <div style="font-size:13px;color:var(--text-600);line-height:1.9">
        ${escapeAdmin(p?.full_name || '—')}<br>
        رقم الهوية: ${escapeAdmin(p?.national_id || '—')} (${idTypeLabel(p?.id_type)})<br>
        الجنسية: ${escapeAdmin(p?.nationality || '—')} — جوال: ${escapeAdmin(p?.phone || '—')}<br>
        تاريخ الميلاد: ${p?.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('ar-SA') : '—'}
      </div>
    </div>`;
  const partiesHtml = c ? `
    <div class="grid-2col" style="margin-bottom:14px">
      ${partyBlock('المؤجر', c.lessor)}
      ${partyBlock('المستأجر', c.lessee)}
    </div>
    ${c.deed_number ? `<p style="font-size:13px;color:var(--text-600);margin:0 0 14px">رقم الصك: ${escapeAdmin(c.deed_number)}</p>` : ''}
  ` : '';

  try {
    const { data, error } = await supa.from('contract_installments')
      .select('*')
      .eq('contract_id', contractId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    const items = data || [];
    const scheduleHtml = items.length
      ? `<table style="width:100%;margin:6px 0">
           <thead><tr><th>تاريخ الاستحقاق</th><th>المبلغ</th><th>حالة السداد</th><th></th></tr></thead>
           <tbody>${items.map(i => `
             <tr>
               <td>${new Date(i.due_date).toLocaleDateString('ar-SA')}</td>
               <td>${money(i.total_installment)} ر.س</td>
               <td>${i.payment_status === 'PAID' ? '✅ مدفوعة' : '⏳ قيد الانتظار'}</td>
               <td>${i.payment_status !== 'PAID' ? `<button class="btn btn-ghost" data-staff-only onclick="markInstallmentPaid('${i.id}', '${contractId}')">تم السداد</button>` : ''}</td>
             </tr>`).join('')}</tbody>
         </table>`
      : 'لا توجد دفعات مسجّلة لهذا العقد.';
    cell.innerHTML = partiesHtml + scheduleHtml;
  } catch (e) {
    console.error('toggleInstallments failed', e);
    cell.innerHTML = partiesHtml + '⚠️ تعذّر تحميل جدول الدفعات.';
  }
}

async function markInstallmentPaid(installmentId, contractId){
  if (!confirm('تأكيد استلام هذه الدفعة؟')) return;
  try {
    const { error } = await supa.from('contract_installments')
      .update({ payment_status: 'PAID' })
      .eq('id', installmentId);
    if (error) throw error;
    showToast('✅ تم تسجيل السداد');
    // نعيد فتح تفاصيل نفس العقد لتحديث الجدول فوراً
    const row = document.getElementById('installments-' + contractId);
    const btn = document.getElementById('btn-toggle-' + contractId);
    if (row) row.style.display = 'none';
    if (btn) btn.textContent = 'عرض التفاصيل';
    toggleInstallments(contractId);
  } catch (e) {
    console.error('markInstallmentPaid failed', e);
    showToast('⚠️ تعذّر تحديث حالة السداد: ' + e.message);
  }
}

/* ============================================================================
   Boot
   ========================================================================== */
checkSession();
