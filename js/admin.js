
/* ============================================================================
   Config — same project as the public site (index.html)
   ========================================================================== */
const SUPABASE_URL = "https://wlebcvwsleoieodjtrcf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_KhUpsOF0OxVQWyWLakXx2g_yDsUlnxV";
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  renderCitiesSummaryTable();
}

populateDistrictNewCitySelect();
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
   فريق العمل — إضافة عضو جديد (owner فقط، عبر Edge Function آمنة)
   ========================================================================== */
document.getElementById('btn-add-team-member')?.addEventListener('click', async ()=>{
  const emailInput = document.getElementById('team-new-email');
  const passwordInput = document.getElementById('team-new-password');
  const roleSelect = document.getElementById('team-new-role');
  const msg = document.getElementById('team-new-msg');
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const role = roleSelect.value;

  if (!email || !password){
    msg.textContent = '⚠️ عبّئ البريد وكلمة المرور.';
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
    const { data, error } = await supa.functions.invoke('manage-admin-users', {
      body: { email, password, role },
    });
    if (error || data?.error){
      msg.textContent = '⚠️ ' + (data?.error || error.message);
      msg.style.color = 'var(--danger)';
      return;
    }
    msg.textContent = `✅ تمت إضافة ${email} بصلاحية ${role === 'owner' ? 'كاملة' : 'مشاهدة بس'}.`;
    msg.style.color = 'var(--ok)';
    emailInput.value = ''; passwordInput.value = '';
  } catch (e) {
    msg.textContent = '⚠️ تعذّر الاتصال بالخادم.';
    msg.style.color = 'var(--danger)';
    console.error('btn-add-team-member failed', e);
  }
});

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
  document.body.classList.toggle('viewer-mode', currentUserRole !== 'owner');
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
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const msg = document.getElementById('login-msg');
  msg.style.color = 'var(--text-600)';
  msg.textContent = 'جاري الدخول...';
  try {
    const { error } = await supa.auth.signInWithPassword({ email, password });
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
  const newPass = document.getElementById('new-password-input').value;
  const confirmPass = document.getElementById('confirm-password-input').value;

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
    const { error } = await supa.auth.updateUser({ password: newPass });
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
        <td><span class="badge badge-${p.status}">${statusLabel(p.status)}</span></td>
        <td>${p.submitted_by_contact || '—'}</td>
        <td class="actions-cell">
          ${p.status !== 'approved' ? `<button class="btn btn-ok" data-owner-only onclick="setPropertyStatus('${p.id}','approved')">اعتماد</button>` : ''}
          ${p.status !== 'rejected' ? `<button class="btn btn-danger" data-owner-only onclick="setPropertyStatus('${p.id}','rejected')">رفض</button>` : ''}
          ${p.status === 'approved' ? `<button class="btn btn-ghost" data-owner-only onclick="convertToOffer('${p.id}')">تحويل لعرض</button>` : ''}
          <button class="btn btn-ghost" data-owner-only onclick="deleteProperty('${p.id}')">حذف</button>
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
    marketer_name: document.getElementById('offer-marketer-name').value.trim() || null,
    marketer_phone: document.getElementById('offer-marketer-phone').value.trim() || null,
    real_estate_license: document.getElementById('offer-re-license').value.trim() || null,
    ad_license: document.getElementById('offer-ad-license').value.trim() || null,
    description: document.getElementById('offer-description').value.trim() || null,
    is_published: document.getElementById('offer-published').checked,
  };
}
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
   رفع صورة العرض مباشرة من الجهاز إلى مخزن Supabase Storage
   ========================================================================== */
document.getElementById('offer-image-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const statusEl = document.getElementById('offer-image-upload-status');
  const previewEl = document.getElementById('offer-image-preview');
  const urlField = document.getElementById('offer-image-url');
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    statusEl.textContent = '⚠️ الملف المختار مو صورة.';
    statusEl.style.color = 'var(--danger)';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    statusEl.textContent = '⚠️ حجم الصورة أكبر من 5 ميجابايت — اختر صورة أصغر.';
    statusEl.style.color = 'var(--danger)';
    return;
  }

  statusEl.textContent = 'جاري ضغط الصورة...';
  statusEl.style.color = 'var(--text-600)';

  let uploadBlob = file;
  try {
    uploadBlob = await compressImage(file, 1600, 0.8);
  } catch (compressErr) {
    console.error('compressImage: فشل الضغط، سيتم رفع الصورة الأصلية بدلاً منه.', compressErr);
    uploadBlob = file;
  }

  statusEl.textContent = 'جاري الرفع...';
  statusEl.style.color = 'var(--text-600)';

  try {
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: uploadError } = await supa.storage.from('property-images').upload(fileName, uploadBlob, { contentType: 'image/jpeg' });
    if (uploadError) throw uploadError;

    const { data: urlData } = supa.storage.from('property-images').getPublicUrl(fileName);
    urlField.value = urlData.publicUrl;
    previewEl.src = urlData.publicUrl;
    previewEl.style.display = 'block';
    statusEl.textContent = '✅ اترفعت بنجاح.';
    statusEl.style.color = 'var(--ok)';
  } catch (err) {
    console.error('offer image upload failed', err);
    statusEl.textContent = '⚠️ تعذّر الرفع: ' + (err.message || 'خطأ غير معروف');
    statusEl.style.color = 'var(--danger)';
  }
});

function clearOfferForm(){
  document.getElementById('offer-edit-id').value = '';
  ['offer-title','offer-city','offer-district','offer-type','offer-area','offer-rooms',
   'offer-price-original','offer-price-final','offer-map-url','offer-image-url','offer-marketer-name',
   'offer-marketer-phone','offer-re-license','offer-ad-license','offer-description'].forEach(id=>{
    document.getElementById(id).value = '';
  });
  populateOfferDistrictSelect();
  document.getElementById('offer-image-file').value = '';
  document.getElementById('offer-image-preview').style.display = 'none';
  document.getElementById('offer-image-upload-status').textContent = '';
  document.getElementById('offer-discount').value = '0';
  document.getElementById('offer-published').checked = true;
  document.getElementById('offer-form-title').textContent = 'إضافة عرض جديد';
  document.getElementById('btn-cancel-offer-edit').style.display = 'none';
}
document.getElementById('btn-cancel-offer-edit').addEventListener('click', clearOfferForm);

function convertToOffer(propertyId){
  const p = window.__PROPERTIES_CACHE?.[propertyId];
  if (!p) return;
  clearOfferForm();
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
  try {
    let error;
    if (editId){
      ({ error } = await supa.from('offers').update(payload).eq('id', editId));
    } else {
      ({ error } = await supa.from('offers').insert(payload));
    }
    if (error) throw error;
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
          <button class="btn btn-ghost" data-owner-only onclick="toggleOfferPublish('${o.id}', ${!o.is_published})">${o.is_published ? 'إخفاء' : 'نشر'}</button>
          <button class="btn btn-ghost" data-owner-only onclick="toggleOfferSold('${o.id}', ${!o.is_sold})">${o.is_sold ? 'إرجاع للمتاح' : 'تم البيع'}</button>
          <button class="btn btn-danger" data-owner-only onclick="deleteOffer('${o.id}')">حذف</button>
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
  document.getElementById('offer-image-url').value = o.image_url || '';
  const editPreview = document.getElementById('offer-image-preview');
  if (o.image_url){ editPreview.src = o.image_url; editPreview.style.display = 'block'; }
  else { editPreview.style.display = 'none'; }
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
          ${i.status !== 'contacted' ? `<button class="btn btn-ghost" data-owner-only onclick="setInquiryStatus('${i.id}','contacted')">تم التواصل</button>` : ''}
          ${i.status !== 'closed' ? `<button class="btn btn-ghost" data-owner-only onclick="setInquiryStatus('${i.id}','closed')">إغلاق</button>` : ''}
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
               <td>${i.payment_status !== 'PAID' ? `<button class="btn btn-ghost" data-owner-only onclick="markInstallmentPaid('${i.id}', '${contractId}')">تم السداد</button>` : ''}</td>
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
