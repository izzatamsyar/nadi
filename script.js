/* ═══════════════════════════════════════════════════════════════
   NADI — Navigating Assets, Dependents and Financial Insights
   Faculty of Law (FUU), Universiti Kebangsaan Malaysia (UKM)
   script.js — Assessment Logic, Analytics Engine, Results
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   GLOBAL STATE
───────────────────────────────────────────── */
let nadiData = {};
let chartInstances = {};

/* ─────────────────────────────────────────────
   PAGE NAVIGATION
───────────────────────────────────────────── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function confirmBack() {
  if (confirm('Return to the home page? Your assessment data will be cleared.')) {
    resetAssessment();
    showPage('page-landing');
  }
}

function startNew() {
  if (confirm('Start a new assessment? Current results will be cleared.')) {
    resetAssessment();
    showPage('page-assessment');
  }
}

function resetAssessment() {
  nadiData = {};
  // Reset all form inputs
  document.querySelectorAll('.step-panel input, .step-panel select').forEach(el => {
    if (el.type === 'hidden') {
      // keep
    } else if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else if (el.type === 'number') {
      el.value = el.id.startsWith('f-') ? '' : '0';
    } else {
      el.value = '';
    }
  });
  // Reset toggles
  setToggle('hibah', 'no');
  setToggle('wasiat', 'no');
  // Go to step 1
  goToStep(1);
  // Destroy charts
  Object.values(chartInstances).forEach(c => { if (c) c.destroy(); });
  chartInstances = {};
  // Update calcs
  updateCalcIncome();
  updateCalcAssets();
  updateCalcLiabilities();
}

/* ─────────────────────────────────────────────
   STEP NAVIGATION
───────────────────────────────────────────── */
let currentStep = 1;

function goToStep(n) {
  // Hide all panels
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step-' + n).classList.add('active');

  // Update progress indicators
  for (let i = 1; i <= 5; i++) {
    const stepEl = document.getElementById('ps-' + i);
    stepEl.classList.remove('active', 'done');
    if (i < n) stepEl.classList.add('done');
    else if (i === n) stepEl.classList.add('active');
  }
  for (let i = 1; i <= 4; i++) {
    const lineEl = document.getElementById('pl-' + i);
    lineEl.classList.toggle('done', i < n);
  }

  currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep(n) {
  if (!validateStep(n - 1)) return;
  goToStep(n);
}

function prevStep(n) {
  goToStep(n);
}

/* ─────────────────────────────────────────────
   VALIDATION
───────────────────────────────────────────── */
function validateStep(step) {
  if (step === 1) {
    const name = v('f-name');
    const age = v('f-age');
    const gender = v('f-gender');
    const marital = v('f-marital');
    const employment = v('f-employment');
    if (!name || !age || !gender || !marital || !employment) {
      alert('Please fill in all required fields (marked with *) before continuing.');
      return false;
    }
    if (parseInt(age) < 18 || parseInt(age) > 100) {
      alert('Please enter a valid age between 18 and 100.');
      return false;
    }
  }
  return true;
}

/* ─────────────────────────────────────────────
   UTILITY HELPERS
───────────────────────────────────────────── */
function v(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function n(id) {
  const val = parseFloat(v(id)) || 0;
  return Math.max(0, val);
}

function fmt(amount) {
  return 'RM ' + amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(amount) {
  if (amount >= 1000000) return 'RM ' + (amount / 1000000).toFixed(2) + 'M';
  if (amount >= 1000) return 'RM ' + (amount / 1000).toFixed(1) + 'K';
  return fmt(amount);
}

/* ─────────────────────────────────────────────
   LIVE CALCULATIONS
───────────────────────────────────────────── */
function updateCalcIncome() {
  const total = n('i-salary') + n('i-spouse') + n('i-side') + n('i-rental') + n('i-other');
  setCalc('calc-income', fmt(total));
  updateCalcLiabilities(); // DTI depends on income
}

function updateCalcAssets() {
  const total = n('a-savings') + n('a-epf') + n('a-asb') + n('a-th') +
                n('a-shares') + n('a-property') + n('a-vehicle') + n('a-other');
  setCalc('calc-assets', fmt(total));
}

function updateCalcLiabilities() {
  const totalLiab = n('l-home') + n('l-vehicle') + n('l-personal') +
                    n('l-education') + n('l-cc') + n('l-other');
  const totalInc  = n('i-salary') + n('i-spouse') + n('i-side') + n('i-rental') + n('i-other');
  const dti = totalInc > 0 ? ((totalLiab / (totalInc * 12)) * 100).toFixed(1) : '0.0';
  setCalc('calc-liabilities', fmt(totalLiab));
  setCalc('calc-dti', dti + '%');
}

function setCalc(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* Attach live listeners */
window.addEventListener('DOMContentLoaded', () => {
  // Income fields
  ['i-salary','i-spouse','i-side','i-rental','i-other'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCalcIncome);
  });
  // Asset fields
  ['a-savings','a-epf','a-asb','a-th','a-shares','a-property','a-vehicle','a-other'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCalcAssets);
  });
  // Liability fields
  ['l-home','l-vehicle','l-personal','l-education','l-cc','l-other'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCalcLiabilities);
  });

  // Set print date
  const d = document.getElementById('print-date');
  if (d) d.textContent = 'Generated: ' + new Date().toLocaleDateString('en-MY', { year:'numeric', month:'long', day:'numeric' });
});

/* ─────────────────────────────────────────────
   TOGGLE BUTTONS (Yes/No)
───────────────────────────────────────────── */
function setToggle(field, value) {
  document.getElementById(field + '-yes').classList.toggle('active', value === 'yes');
  document.getElementById(field + '-no').classList.toggle('active', value === 'no');
  document.getElementById('p-' + field).value = value;
}

/* ─────────────────────────────────────────────
   DATA COLLECTION
───────────────────────────────────────────── */
function collectData() {
  // Income totals
  const salary   = n('i-salary');
  const spouse   = n('i-spouse');
  const side     = n('i-side');
  const rental   = n('i-rental');
  const otherInc = n('i-other');
  const totalIncome = salary + spouse + side + rental + otherInc;

  // Asset totals
  const savings  = n('a-savings');
  const epf      = n('a-epf');
  const asb      = n('a-asb');
  const th       = n('a-th');
  const shares   = n('a-shares');
  const property = n('a-property');
  const vehicle  = n('a-vehicle');
  const otherAss = n('a-other');
  const totalAssets = savings + epf + asb + th + shares + property + vehicle + otherAss;

  // Liability totals
  const lHome    = n('l-home');
  const lVehicle = n('l-vehicle');
  const lPersonal= n('l-personal');
  const lEdu     = n('l-education');
  const lCC      = n('l-cc');
  const lOther   = n('l-other');
  const totalLiabilities = lHome + lVehicle + lPersonal + lEdu + lCC + lOther;

  // Derived
  const netWorth = totalAssets - totalLiabilities;
  const dti = totalIncome > 0 ? (totalLiabilities / (totalIncome * 12)) * 100 : 999;

  // Protection
  const familyTakaful  = n('p-family-takaful');
  const medicalTakaful = n('p-medical-takaful');
  const mrtt           = n('p-mrtt');
  const emergency      = n('p-emergency');
  const hibah          = v('p-hibah') === 'yes';
  const wasiat         = v('p-wasiat') === 'yes';

  // Emergency fund adequacy: rule-of-thumb = 6 months expenses
  // Estimate monthly expenses at 70% of income
  const estMonthlyExpenses = totalIncome * 0.70;
  const recommendedEmergency = estMonthlyExpenses * 6;

  nadiData = {
    // Family
    name:        v('f-name') || 'Respondent',
    age:         parseInt(v('f-age')) || 0,
    gender:      v('f-gender'),
    marital:     v('f-marital'),
    children:    parseInt(v('f-children')) || 0,
    childAges:   v('f-children-ages'),
    dependents:  parseInt(v('f-dependents')) || 0,
    employment:  v('f-employment'),

    // Income
    salary, spouse, side, rental, otherInc, totalIncome,

    // Assets
    savings, epf, asb, th, shares, property, vehicle, otherAss, totalAssets,
    liquidAssets: savings + epf + asb + th + shares, // easily realisable

    // Liabilities
    lHome, lVehicle, lPersonal, lEdu, lCC, lOther, totalLiabilities,

    // Derived
    netWorth, dti,

    // Protection
    familyTakaful, medicalTakaful, mrtt, emergency,
    totalProtection: familyTakaful + medicalTakaful,
    hibah, wasiat,
    estMonthlyExpenses,
    recommendedEmergency,
  };
}

/* ─────────────────────────────────────────────
   ANALYTICS ENGINE
   Rule-based scoring system — no AI required
───────────────────────────────────────────── */

/**
 * Analysis 1 — Family Dependency Analysis
 * Score out of 20
 */
function analyseFamily() {
  const { dependents, children, marital, totalIncome, spouse } = nadiData;
  let score = 20;
  let risk = 'low';
  let text = '';

  const hasDualIncome = spouse > 0;
  const dependencyRatio = totalIncome > 0 ? dependents / Math.max(totalIncome / 3000, 1) : dependents;

  if (dependents === 0) {
    score = 20;
    text = `${nadiData.name} currently has no declared dependents, which significantly reduces household financial exposure. With no dependents requiring financial support, the household retains maximum financial flexibility and lower baseline expenditure obligations.`;
  } else if (dependents <= 2) {
    score = 16;
    risk = 'medium';
    text = `The household supports ${dependents} dependent(s)${children > 0 ? `, including ${children} child/children` : ''}. This represents a moderate dependency burden. ${hasDualIncome ? 'The presence of dual income provides a degree of resilience, distributing financial obligations across two income streams.' : 'As a single-income household, all financial obligations rest on the primary earner, increasing household vulnerability.'}`;
  } else if (dependents <= 4) {
    score = 11;
    risk = 'medium';
    text = `The household carries a substantial dependency burden of ${dependents} dependents. ${children > 0 ? `With ${children} children, education and upbringing costs represent significant long-term commitments. ` : ''}${hasDualIncome ? 'Dual income streams provide some buffer, but the high dependency ratio warrants careful financial planning.' : 'The combination of a single-income structure and multiple dependents creates significant financial vulnerability should any disruption occur to the primary income source.'}`;
  } else {
    score = 5;
    risk = 'high';
    text = `A high dependency burden of ${dependents} dependents places considerable financial strain on the household. ${!hasDualIncome ? 'The reliance on a single income source to support this many dependents represents a critical financial risk. Any interruption to the primary income — through illness, job loss or disability — could rapidly destabilise the household\'s financial position. ' : ''}Comprehensive financial protection planning is strongly recommended.`;
  }

  if (marital === 'single' && dependents > 0) {
    score = Math.max(score - 3, 0);
    text += ` As a single individual with dependents, additional protection and estate planning measures are particularly important.`;
  }

  return { score, risk, text, label: 'Family Dependency' };
}

/**
 * Analysis 2 — Financial Risk Analysis
 * Score out of 20
 */
function analyseFinancialRisk() {
  const { totalIncome, totalLiabilities, dti, emergency, recommendedEmergency, employment } = nadiData;
  let score = 20;
  let risk = 'low';
  let text = '';

  // DTI scoring (0–10 points)
  let dtiScore;
  if (dti <= 30)        { dtiScore = 10; }
  else if (dti <= 50)   { dtiScore = 7; }
  else if (dti <= 75)   { dtiScore = 4; }
  else if (dti <= 100)  { dtiScore = 2; }
  else                  { dtiScore = 0; }

  // Emergency fund scoring (0–5 points)
  const efRatio = recommendedEmergency > 0 ? emergency / recommendedEmergency : 0;
  let efScore;
  if (efRatio >= 1)      { efScore = 5; }
  else if (efRatio >= 0.7){ efScore = 4; }
  else if (efRatio >= 0.5){ efScore = 3; }
  else if (efRatio >= 0.3){ efScore = 2; }
  else if (efRatio > 0)   { efScore = 1; }
  else                    { efScore = 0; }

  // Employment stability (0–5 points)
  const empScores = { gov: 5, private: 3, self: 2, freelance: 1, retired: 4, unemployed: 0 };
  const empScore = empScores[employment] || 2;

  score = dtiScore + efScore + empScore;

  if (score >= 16)     { risk = 'low'; }
  else if (score >= 10){ risk = 'medium'; }
  else                 { risk = 'high'; }

  const dtiStr = dti < 999 ? dti.toFixed(1) + '%' : 'N/A (no income declared)';
  const efMonths = totalIncome > 0 ? (emergency / (totalIncome * 0.7)).toFixed(1) : '0';

  text = `The household's debt-to-income ratio stands at ${dtiStr}. `;

  if (dti <= 30) {
    text += `This is within a healthy range, indicating that outstanding debt obligations are well-managed relative to annual income. `;
  } else if (dti <= 50) {
    text += `This is at a moderate level. While manageable, there is limited buffer should income decrease or interest rates rise. `;
  } else if (dti <= 75) {
    text += `This elevated ratio indicates significant financial leverage. A large portion of annual income is committed to debt servicing, leaving limited capacity for savings and protection. `;
  } else {
    text += `This is at a critical level, suggesting that debt obligations may be difficult to sustain, particularly under adverse income conditions. Debt restructuring or reduction should be prioritised. `;
  }

  text += `The current emergency fund covers approximately ${efMonths} months of estimated household expenditure. `;

  if (efRatio >= 1) {
    text += `This meets the recommended six-month emergency reserve, providing adequate short-term financial resilience. `;
  } else if (efRatio >= 0.5) {
    text += `This partially meets the recommended six-month reserve. Building the emergency fund to the recommended level should be a near-term financial priority. `;
  } else {
    text += `This falls significantly below the recommended six-month emergency reserve. In the event of income disruption, the household faces a risk of rapid financial distress. Urgent attention to building an emergency fund is recommended. `;
  }

  const empLabels = { gov: 'government employment', private: 'private sector employment', self: 'self-employment', freelance: 'freelance/gig work', retired: 'retirement', unemployed: 'unemployment' };
  text += `Income stability is assessed as ${employment === 'gov' ? 'high' : employment === 'private' ? 'moderate' : employment === 'self' ? 'variable' : employment === 'freelance' ? 'low' : employment === 'retired' ? 'moderate-stable' : 'absent'}, consistent with ${empLabels[employment] || 'the declared employment status'}.`;

  return { score, risk, text, label: 'Financial Risk' };
}

/**
 * Analysis 3 — Protection Adequacy Analysis
 * Score out of 20
 */
function analyseProtection() {
  const { familyTakaful, medicalTakaful, mrtt, totalIncome, totalLiabilities, emergency, recommendedEmergency, lHome } = nadiData;
  let score = 0;
  let risk = 'high';

  // Life / Family Takaful (0–8 pts)
  // Rule: coverage should ideally be ~10x annual income
  const recommendedLife = totalIncome * 12 * 10;
  const lifeRatio = recommendedLife > 0 ? familyTakaful / recommendedLife : 0;
  let lifeScore;
  if (familyTakaful === 0)        { lifeScore = 0; }
  else if (lifeRatio >= 1)        { lifeScore = 8; }
  else if (lifeRatio >= 0.5)      { lifeScore = 6; }
  else if (lifeRatio >= 0.25)     { lifeScore = 4; }
  else                            { lifeScore = 2; }

  // Medical Takaful (0–6 pts)
  let medScore = medicalTakaful > 0 ? 6 : 0;

  // MRTT (0–3 pts) — relevant if there is home financing
  let mrttScore = 0;
  if (lHome > 0) {
    mrttScore = mrtt > 0 ? 3 : 0;
  } else {
    mrttScore = 3; // No home financing, so no MRTT gap
  }

  // Emergency fund buffer (0–3 pts)
  const efRatio = recommendedEmergency > 0 ? emergency / recommendedEmergency : 0;
  const efScore = Math.min(Math.round(efRatio * 3), 3);

  score = lifeScore + medScore + mrttScore + efScore;

  if (score >= 16)     { risk = 'low'; }
  else if (score >= 10){ risk = 'medium'; }
  else                 { risk = 'high'; }

  let text = '';

  if (familyTakaful === 0) {
    text += `No Family Takaful coverage has been declared. This represents a significant gap in the household's financial safety net. In the event of death or total permanent disability of the primary earner, no Takaful sum assured would be available to sustain the household. `;
  } else if (lifeRatio < 0.5) {
    text += `Family Takaful coverage of ${fmt(familyTakaful)} is below the generally recommended level of approximately ${fmtShort(recommendedLife)} (10× annual income). There is a meaningful protection shortfall that should be addressed. `;
  } else if (lifeRatio < 1) {
    text += `Family Takaful coverage of ${fmt(familyTakaful)} is moderate but does not fully meet the recommended 10× annual income benchmark of ${fmtShort(recommendedLife)}. Consider reviewing coverage levels with a certified takaful advisor. `;
  } else {
    text += `Family Takaful coverage of ${fmt(familyTakaful)} meets or exceeds the recommended benchmark, providing strong income replacement protection for the household. `;
  }

  if (medicalTakaful === 0) {
    text += `No Medical Takaful coverage has been declared. Medical emergencies without coverage could significantly deplete household savings and financial reserves. `;
  } else {
    text += `Medical Takaful coverage is in place (${fmt(medicalTakaful)}), which provides a critical buffer against unexpected healthcare costs. `;
  }

  if (lHome > 0) {
    if (mrtt === 0) {
      text += `Home financing of ${fmt(lHome)} is outstanding without MRTT/MRTA coverage. Should the primary earner be unable to service the financing, the property could be at risk.`;
    } else {
      text += `MRTT/MRTA coverage of ${fmt(mrtt)} is in place for the home financing, which appropriately mitigates property-related financing risk.`;
    }
  }

  return { score, risk, text, label: 'Protection Adequacy' };
}

/**
 * Analysis 4 — Financial Continuity Analysis
 * Score out of 20
 */
function analyseContinuity() {
  const { totalIncome, spouse, totalLiabilities, totalAssets, liquidAssets,
          dependents, familyTakaful, emergency, estMonthlyExpenses } = nadiData;
  let score = 0;
  let risk = 'high';

  // Scenario: primary earner income stops
  const replacementIncome = spouse; // Only spouse income survives
  const monthlyGap = Math.max(estMonthlyExpenses - replacementIncome, 0);

  // How long can assets + emergency fund sustain the household?
  const totalLiquid = liquidAssets + emergency;
  const sustainMonths = monthlyGap > 0 && totalLiquid > 0 ? totalLiquid / monthlyGap : 99;

  // Takaful income replacement
  const takafulReplacementYears = estMonthlyExpenses > 0 ? familyTakaful / (estMonthlyExpenses * 12) : 0;

  // Scoring
  // Liquid asset coverage (0–8 pts)
  let liqScore;
  if (sustainMonths >= 24)      { liqScore = 8; }
  else if (sustainMonths >= 12) { liqScore = 6; }
  else if (sustainMonths >= 6)  { liqScore = 4; }
  else if (sustainMonths >= 3)  { liqScore = 2; }
  else                          { liqScore = 0; }

  // Takaful coverage adequacy (0–6 pts)
  let takScore;
  if (takafulReplacementYears >= 10)     { takScore = 6; }
  else if (takafulReplacementYears >= 5) { takScore = 4; }
  else if (takafulReplacementYears >= 2) { takScore = 2; }
  else if (takafulReplacementYears > 0)  { takScore = 1; }
  else                                   { takScore = 0; }

  // Dual income factor (0–4 pts)
  const dualScore = replacementIncome > 0 ? (replacementIncome / totalIncome >= 0.4 ? 4 : 2) : 0;

  // Asset-to-liability ratio (0–2 pts)
  const alRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : 10;
  const alScore = alRatio >= 2 ? 2 : alRatio >= 1 ? 1 : 0;

  score = liqScore + takScore + dualScore + alScore;

  if (score >= 16)     { risk = 'low'; }
  else if (score >= 10){ risk = 'medium'; }
  else                 { risk = 'high'; }

  let text = '';

  text += `Assuming the primary income earner is no longer able to generate income (through death, disability or critical illness), the household would face a monthly financial gap of approximately ${fmt(monthlyGap)}. `;

  if (sustainMonths >= 24) {
    text += `Current liquid assets and emergency reserves would sustain the household for an estimated ${Math.round(sustainMonths)} months, providing strong short-to-medium term continuity. `;
  } else if (sustainMonths >= 12) {
    text += `Liquid reserves would cover approximately ${Math.round(sustainMonths)} months of expenses — a reasonable buffer, though long-term continuity remains dependent on Takaful proceeds or other income sources. `;
  } else if (sustainMonths >= 3) {
    text += `Liquid reserves would last only ${Math.round(sustainMonths)} months, indicating limited financial runway in the event of income loss. `;
  } else {
    text += `Liquid reserves are critically low, providing less than three months of coverage in the event of income loss. This represents a severe financial continuity risk. `;
  }

  if (takafulReplacementYears >= 5) {
    text += `Family Takaful proceeds could theoretically sustain household expenses for approximately ${takafulReplacementYears.toFixed(1)} years — a meaningful income replacement buffer. `;
  } else if (takafulReplacementYears > 0) {
    text += `Family Takaful proceeds would provide approximately ${takafulReplacementYears.toFixed(1)} years of income replacement, which may be insufficient for long-term family sustainability. `;
  } else {
    text += `The absence of Family Takaful coverage means there is no income replacement mechanism in the event of the primary earner's death or disability. This is a critical vulnerability. `;
  }

  if (replacementIncome > 0) {
    text += `Spouse income of ${fmt(replacementIncome)} per month provides an additional continuity buffer.`;
  } else {
    text += `There is no spouse income recorded, meaning all continuity burden falls on savings, Takaful proceeds and liquid assets.`;
  }

  return { score, risk, text, label: 'Financial Continuity' };
}

/**
 * Analysis 5 — Wealth Preservation Analysis
 * Score out of 20
 */
function analyseWealth() {
  const { hibah, wasiat, totalAssets, netWorth, dependents, children, age } = nadiData;
  let score = 0;
  let risk = 'high';

  // Hibah (0–8 pts)
  const hibahScore = hibah ? 8 : 0;
  // Wasiat (0–8 pts)
  const wasiatScore = wasiat ? 8 : 0;
  // Asset base (0–4 pts)
  let assetScore;
  if (netWorth >= 500000)      { assetScore = 4; }
  else if (netWorth >= 200000) { assetScore = 3; }
  else if (netWorth >= 50000)  { assetScore = 2; }
  else if (netWorth > 0)       { assetScore = 1; }
  else                         { assetScore = 0; }

  score = hibahScore + wasiatScore + assetScore;

  if (score >= 16)     { risk = 'low'; }
  else if (score >= 10){ risk = 'medium'; }
  else                 { risk = 'high'; }

  let text = '';

  // Hibah narrative
  if (hibah) {
    text += `A Hibah arrangement is in place, demonstrating proactive Islamic estate and gift planning. Hibah allows assets to be transferred to beneficiaries during the donor's lifetime, bypassing the delays and costs associated with faraid distribution. This significantly strengthens the household's wealth preservation posture. `;
  } else {
    text += `No Hibah arrangement has been declared. Hibah (inter-vivos gift under Islamic law) can be a powerful tool for ensuring immediate and controlled asset transfer to intended beneficiaries, particularly where faraid distribution may not align with the family's financial needs. It is recommended that ${nadiData.name} consult a qualified Islamic estate planner to explore Hibah options. `;
  }

  // Wasiat narrative
  if (wasiat) {
    text += `A Wasiat (Islamic Will) is in place, which ensures that the disposition of the estate — up to one-third of the net estate for non-heirs — is governed by documented intentions rather than left entirely to faraid rules. This provides clarity and reduces potential disputes among beneficiaries. `;
  } else {
    text += `No Wasiat has been declared. Without a Wasiat, the distribution of the estate will follow the faraid (Islamic inheritance law) rules applicable to ${nadiData.name}'s status. While faraid provides a structured framework, a Wasiat enables the testator to cater for specific needs such as charitable bequests and dependents not covered under faraid shares. `;
  }

  // Asset base narrative
  if (totalAssets > 0) {
    text += `The household holds total assets of ${fmt(totalAssets)}, with a net worth of ${fmt(netWorth)}. ${netWorth >= 0 ? 'A positive net worth provides a meaningful wealth base to preserve and transmit.' : 'A negative net worth indicates that liabilities currently exceed assets, making wealth preservation planning a secondary priority after debt reduction.'}`;
  } else {
    text += `No assets have been declared, suggesting that wealth preservation planning is in its early stages. Building assets while simultaneously establishing estate planning instruments such as Hibah and Wasiat is recommended.`;
  }

  if (dependents > 0 && !hibah && !wasiat) {
    text += ` Given the presence of ${dependents} dependent(s), the absence of both Hibah and Wasiat arrangements represents a significant estate planning gap that could adversely affect ${children > 0 ? 'the children\'s' : 'the dependents\''} financial security.`;
  }

  return { score, risk, text, label: 'Wealth Preservation' };
}

/* ─────────────────────────────────────────────
   NADI READINESS INDEX
───────────────────────────────────────────── */
function computeNadiScore(analyses) {
  // Sum of all 5 sub-scores (each max 20) = max 100
  const raw = analyses.reduce((sum, a) => sum + a.score, 0);
  return Math.min(Math.max(Math.round(raw), 0), 100);
}

function getCategory(score) {
  if (score >= 80) return { cat: 'Resilient',   cls: 'badge-resilient',   name: 'Resilient'  };
  if (score >= 60) return { cat: 'Developing',  cls: 'badge-developing',  name: 'Developing' };
  if (score >= 40) return { cat: 'Vulnerable',  cls: 'badge-vulnerable',  name: 'Vulnerable' };
  return              { cat: 'Critical',    cls: 'badge-critical',    name: 'Critical'   };
}

function getCategoryInterpretation(score) {
  if (score >= 80) return `${nadiData.name}'s household demonstrates strong financial readiness across all five assessment dimensions. While the current position is resilient, maintaining and enhancing existing protection, savings and estate planning arrangements will sustain long-term financial wellbeing.`;
  if (score >= 60) return `The household shows moderate financial readiness with meaningful strengths in some areas and identifiable gaps in others. Targeted action on key vulnerabilities identified in this report can progressively improve the household's overall financial resilience.`;
  if (score >= 40) return `The household is at a financially vulnerable stage. Specific risks across income, protection and/or estate planning require immediate attention to prevent potential financial distress. The recommended actions in this report should be prioritised.`;
  return `The household's financial readiness is at a critical level, with significant vulnerabilities across multiple dimensions. Immediate and comprehensive financial planning action is required. Professional advice from a licensed financial planner and Shariah-certified estate planner is strongly recommended.`;
}

/* ─────────────────────────────────────────────
   RISK GENERATION
───────────────────────────────────────────── */
function generateRisks(analyses, score) {
  const risks = [];
  const d = nadiData;

  if (d.totalIncome === 0)
    risks.push({ type: 'error', title: 'No Income Declared', desc: 'No household income has been entered, creating a high baseline financial risk.' });

  if (d.dti > 75)
    risks.push({ type: 'error', title: 'High Debt-to-Income Ratio', desc: `DTI of ${d.dti.toFixed(1)}% indicates that debt obligations are consuming a disproportionate share of annual income.` });
  else if (d.dti > 50)
    risks.push({ type: 'warn', title: 'Elevated Debt Burden', desc: `DTI of ${d.dti.toFixed(1)}% is above the recommended threshold and warrants active debt management.` });

  if (d.emergency < d.recommendedEmergency * 0.5)
    risks.push({ type: 'error', title: 'Insufficient Emergency Fund', desc: `Current emergency fund of ${fmt(d.emergency)} is less than half of the recommended ${fmt(d.recommendedEmergency)}.` });

  if (d.familyTakaful === 0)
    risks.push({ type: 'error', title: 'No Family Takaful Coverage', desc: 'The absence of life/Family Takaful leaves the household without an income replacement mechanism in the event of death or disability.' });

  if (d.medicalTakaful === 0)
    risks.push({ type: 'warn', title: 'No Medical Takaful Coverage', desc: 'Without medical coverage, unexpected healthcare costs could rapidly erode household savings.' });

  if (d.lHome > 0 && d.mrtt === 0)
    risks.push({ type: 'warn', title: 'Home Financing Without MRTT', desc: `Outstanding home financing of ${fmt(d.lHome)} carries the risk of property loss if the primary earner cannot continue servicing the debt.` });

  if (!d.hibah && !d.wasiat && d.dependents > 0)
    risks.push({ type: 'warn', title: 'No Estate Planning Instruments', desc: 'Neither Hibah nor Wasiat is in place, posing a risk to dependents\' financial security upon the primary earner\'s demise.' });

  if (d.spouse === 0 && d.dependents > 1)
    risks.push({ type: 'warn', title: 'Single Income with Multiple Dependents', desc: 'A sole breadwinner supporting multiple dependents creates heightened income concentration risk.' });

  if (d.netWorth < 0)
    risks.push({ type: 'error', title: 'Negative Net Worth', desc: `Total liabilities (${fmt(d.totalLiabilities)}) exceed total assets (${fmt(d.totalAssets)}), indicating technical insolvency.` });

  if (d.employment === 'freelance' && d.emergency < d.recommendedEmergency)
    risks.push({ type: 'warn', title: 'Income Volatility Risk', desc: 'Freelance/gig income is variable. Without a full emergency fund, income fluctuations pose a direct household cash flow risk.' });

  // Deduplicate and cap at 6
  return risks.slice(0, 6);
}

/* ─────────────────────────────────────────────
   ACTION PLAN GENERATION
───────────────────────────────────────────── */
function generateActions(analyses, score) {
  const actions = [];
  const d = nadiData;
  let n = 1;

  if (d.emergency < d.recommendedEmergency) {
    actions.push({
      title: 'Build Emergency Fund to 6-Month Target',
      desc: `Current emergency fund: ${fmt(d.emergency)}. Target: ${fmt(d.recommendedEmergency)}. Systematically set aside a portion of monthly income until this reserve is fully funded.`
    });
  }

  if (d.familyTakaful === 0) {
    actions.push({
      title: 'Obtain Family Takaful Coverage Immediately',
      desc: `No Family Takaful is in place. Engage a licensed Takaful agent to assess appropriate sum covered. The recommended benchmark is 10× annual income (${fmt(d.totalIncome * 12 * 10)}).`
    });
  } else if (d.familyTakaful < d.totalIncome * 12 * 5) {
    actions.push({
      title: 'Review and Increase Family Takaful Sum Covered',
      desc: `Current coverage of ${fmt(d.familyTakaful)} may be insufficient. Review coverage adequacy against household income, liabilities and dependent needs.`
    });
  }

  if (d.medicalTakaful === 0) {
    actions.push({
      title: 'Obtain Medical and Health Takaful Coverage',
      desc: 'Medical Takaful protects against unexpected healthcare costs. Enrol in a comprehensive hospital and surgical plan through a licensed Takaful operator.'
    });
  }

  if (d.lHome > 0 && d.mrtt === 0) {
    actions.push({
      title: 'Secure MRTT/MRTA Coverage for Home Financing',
      desc: `Outstanding home financing of ${fmt(d.lHome)} should be protected by a Mortgage Reducing Term Takaful (MRTT) policy to prevent property risk in the event of death or disability.`
    });
  }

  if (!d.wasiat) {
    actions.push({
      title: 'Prepare a Wasiat (Islamic Will)',
      desc: 'Engage a qualified Islamic estate planner or Amanah Raya Berhad to prepare a Wasiat. This ensures assets are distributed according to documented intentions within the framework of Shariah law.'
    });
  }

  if (!d.hibah && d.totalAssets > 50000) {
    actions.push({
      title: 'Explore Hibah Arrangements for Key Assets',
      desc: 'Consider establishing Hibah arrangements for liquid assets, property or savings to facilitate controlled, timely asset transfer to intended beneficiaries during your lifetime.'
    });
  }

  if (d.dti > 50) {
    actions.push({
      title: 'Develop a Structured Debt Reduction Plan',
      desc: `With a DTI of ${d.dti.toFixed(1)}%, prioritise high-interest debt repayment (e.g. credit card balances) and avoid taking on additional financing in the short term.`
    });
  }

  if (d.spouse === 0 && d.totalIncome > 0) {
    actions.push({
      title: 'Diversify Household Income Sources',
      desc: 'Single-income households benefit significantly from developing additional income streams — rental income, side business or passive investments — to reduce income concentration risk.'
    });
  }

  // Always recommend professional advice
  actions.push({
    title: 'Consult a Licensed Financial Planner and Islamic Estate Advisor',
    desc: 'NADI provides an educational assessment. For a comprehensive and personalised financial strategy, consult a Securities Commission-licensed financial planner and a qualified Islamic estate planning professional.'
  });

  return actions.slice(0, 8);
}

/* ─────────────────────────────────────────────
   RENDER RESULTS
───────────────────────────────────────────── */
function renderResults(analyses, score, category) {
  const d = nadiData;

  /* Score animation */
  const scoreEl = document.getElementById('score-display');
  const scoreArc = document.getElementById('score-arc');
  const circumference = 2 * Math.PI * 52; // r=52

  let current = 0;
  const interval = setInterval(() => {
    current = Math.min(current + 1, score);
    scoreEl.textContent = current;
    const dashoffset = circumference - (current / 100) * circumference;
    scoreArc.style.strokeDashoffset = dashoffset;
    scoreArc.style.strokeDasharray = circumference;
    if (current >= score) clearInterval(interval);
  }, 18);

  /* Category */
  const badgeEl = document.getElementById('score-badge');
  const nameEl  = document.getElementById('score-name');
  const interpEl = document.getElementById('score-interpretation');
  badgeEl.textContent = category.cat;
  badgeEl.className = 'score-badge ' + category.cls;
  nameEl.textContent = category.name;
  interpEl.textContent = getCategoryInterpretation(score);

  /* Summary Cards */
  set('res-income',      fmt(d.totalIncome));
  set('res-assets',      fmt(d.totalAssets));
  set('res-liabilities', fmt(d.totalLiabilities));
  set('res-dti',         d.dti < 999 ? d.dti.toFixed(1) + '%' : 'N/A');

  /* Analysis Cards */
  const ids = ['dependency','risk','protection','continuity','wealth'];
  const riskLabels = { low: 'Low Risk', medium: 'Moderate Risk', high: 'High Risk' };
  const riskCls    = { low: 'risk-low', medium: 'risk-medium', high: 'risk-high' };

  analyses.forEach((an, i) => {
    const key = ids[i];
    set('text-' + key, an.text);
    const badge = document.getElementById('badge-' + key);
    if (badge) {
      badge.textContent = riskLabels[an.risk];
      badge.className = 'analysis-risk-badge ' + riskCls[an.risk];
    }
  });

  /* Risks */
  const risks = generateRisks(analyses, score);
  const risksGrid = document.getElementById('risks-grid');
  risksGrid.innerHTML = '';
  if (risks.length === 0) {
    risksGrid.innerHTML = '<p style="color:var(--grey-600);font-size:14px;">No critical vulnerabilities identified at this time. Continue to monitor and maintain your financial planning arrangements.</p>';
  } else {
    risks.forEach(r => {
      const cls = r.type === 'error' ? '' : r.type === 'warn' ? ' warn' : ' info';
      risksGrid.innerHTML += `<div class="risk-card${cls}"><div class="risk-card-title">${r.title}</div><div class="risk-card-desc">${r.desc}</div></div>`;
    });
  }

  /* Actions */
  const actions = generateActions(analyses, score);
  const actionsEl = document.getElementById('actions-list');
  actionsEl.innerHTML = '';
  actions.forEach((a, i) => {
    actionsEl.innerHTML += `<div class="action-item"><div class="action-num">${i + 1}</div><div><div class="action-title">${a.title}</div><div class="action-desc">${a.desc}</div></div></div>`;
  });

  /* Charts */
  renderCharts(d);
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ─────────────────────────────────────────────
   CHART RENDERING (Chart.js)
───────────────────────────────────────────── */
function renderCharts(d) {
  // Destroy existing charts
  if (chartInstances.assetLiability) chartInstances.assetLiability.destroy();
  if (chartInstances.income) chartInstances.income.destroy();

  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: { family: 'Inter', size: 12 },
          color: '#5A6170'
        }
      },
      tooltip: {
        callbacks: {
          label: ctx => ' ' + fmt(ctx.raw)
        }
      }
    }
  };

  /* Asset vs Liability Bar Chart */
  const alCtx = document.getElementById('chart-asset-liability');
  if (alCtx) {
    chartInstances.assetLiability = new Chart(alCtx, {
      type: 'bar',
      data: {
        labels: ['Savings', 'EPF/KWSP', 'ASB', 'Tabung Haji', 'Shares', 'Property', 'Vehicle', 'Other Assets', 'Home Financing', 'Vehicle Financing', 'Personal', 'Education', 'Credit Card', 'Other Debt'],
        datasets: [
          {
            label: 'Assets',
            data: [d.savings, d.epf, d.asb, d.th, d.shares, d.property, d.vehicle, d.otherAss, 0, 0, 0, 0, 0, 0],
            backgroundColor: '#C9A84C',
            borderRadius: 4,
          },
          {
            label: 'Liabilities',
            data: [0, 0, 0, 0, 0, 0, 0, 0, d.lHome, d.lVehicle, d.lPersonal, d.lEdu, d.lCC, d.lOther],
            backgroundColor: '#0B1F3A',
            borderRadius: 4,
          }
        ]
      },
      options: {
        ...chartDefaults,
        scales: {
          y: {
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#9BA3B0',
              callback: v => fmtShort(v)
            },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            ticks: {
              font: { family: 'Inter', size: 10 },
              color: '#9BA3B0',
              maxRotation: 45
            },
            grid: { display: false }
          }
        }
      }
    });
  }

  /* Income Breakdown Doughnut */
  const incCtx = document.getElementById('chart-income');
  if (incCtx) {
    const incomeLabels = ['Salary', 'Spouse', 'Side Income', 'Rental', 'Other'];
    const incomeData   = [d.salary, d.spouse, d.side, d.rental, d.otherInc];
    const nonZeroLabels = [], nonZeroData = [];
    incomeLabels.forEach((l, i) => {
      if (incomeData[i] > 0) { nonZeroLabels.push(l); nonZeroData.push(incomeData[i]); }
    });

    chartInstances.income = new Chart(incCtx, {
      type: 'doughnut',
      data: {
        labels: nonZeroLabels.length ? nonZeroLabels : ['No Income'],
        datasets: [{
          data: nonZeroData.length ? nonZeroData : [1],
          backgroundColor: ['#C9A84C','#D4AF55','#0B1F3A','#132D52','#9E9888'],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        ...chartDefaults,
        cutout: '62%',
        plugins: {
          ...chartDefaults.plugins,
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}`
            }
          }
        }
      }
    });
  }
}

/* ─────────────────────────────────────────────
   MAIN GENERATE FUNCTION
───────────────────────────────────────────── */
function generateResults() {
  // Final step validation
  collectData();

  // Run all 5 analyses
  const analyses = [
    analyseFamily(),
    analyseFinancialRisk(),
    analyseProtection(),
    analyseContinuity(),
    analyseWealth()
  ];

  // Compute NADI Score
  const score    = computeNadiScore(analyses);
  const category = getCategory(score);

  // Update print date
  const d = document.getElementById('print-date');
  if (d) d.textContent = 'Generated: ' + new Date().toLocaleDateString('en-MY', { year:'numeric', month:'long', day:'numeric' });

  // Navigate to results
  showPage('page-results');

  // Render (after DOM is visible)
  setTimeout(() => renderResults(analyses, score, category), 80);
}
