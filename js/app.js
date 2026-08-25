const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

/* ── CLOUD ARCHITECTURE CONFIG (SUPABASE DB + RENDER API + VERCEL HOSTING) ── */
window.LMAP_CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-supabase-anon-key',
  RENDER_API_URL: 'https://lmap-api.onrender.com',
  VERCEL_HOSTING_URL: 'https://land-deduction-table.vercel.app',
  USE_CLOUD_SYNC: false
};

async function syncHoldingToCloud(holdingRecord) {
  if (!window.LMAP_CONFIG || !window.LMAP_CONFIG.USE_CLOUD_SYNC) return;
  try {
    if (window.LMAP_CONFIG.RENDER_API_URL) {
      await fetch(`${window.LMAP_CONFIG.RENDER_API_URL}/api/holdings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser ? currentUser.id : ''}`
        },
        body: JSON.stringify(holdingRecord)
      });
    }
  } catch (err) {
    console.warn('Cloud Sync Note: Saved locally in offline storage.');
  }
}

/* ── STORAGE ADAPTER ── */
const storage = window.storage || {
  get: async (key) => ({ value: localStorage.getItem(key) }),
  set: async (key, val) => { localStorage.setItem(key, val); return true; },
  delete: async (key) => { localStorage.removeItem(key); return true; },
  list: async (prefix) => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    return { keys };
  }
};

function toBn(str){ return String(str).replace(/[0-9]/g, d => BN_DIGITS[d]); }
function toEn(str){ return String(str).replace(/[০-৯]/g, d => BN_DIGITS.indexOf(d)); }
function parseNum(str){ const v=parseFloat(toEn(str).replace(/[^0-9.\-]/g,'')); return isNaN(v)?0:v; }

/* ── EXACT PRECISION DECIMAL ARITHMETIC ── */
function cleanDecimal(val){
  if(typeof val !== 'number' || isNaN(val)) return 0;
  return Math.round((val + Number.EPSILON) * 1e8) / 1e8;
}

/* SUPPORT BOTH COMMA (,), PLUS SIGN (+) AND WHITESPACE AS DELIMITERS (e.g. 1+1+1 works identically to 1,1,1) */
function kortonList(str){ 
  return toEn(str).split(/[,+\s]+/).map(s=>s.trim()).filter(s=>s.length>0); 
}

function kortonSum(str){
  const sum = kortonList(str).reduce((acc,s)=>{
    const v = parseFloat(s);
    return isNaN(v) ? acc : (acc + v);
  }, 0);
  return cleanDecimal(sum);
}

function getRowTotalKorton(row){
  if(kortonCols.length > 0){
    let sum = 0;
    kortonCols.forEach(col => {
      const val = row.kortonByHolding && row.kortonByHolding[col.id] ? parseNum(row.kortonByHolding[col.id]) : 0;
      sum += val;
    });
    return cleanDecimal(sum);
  } else {
    return kortonSum(row.korton);
  }
}

function remainingArea(row){
  const a = parseNum(row.area);
  const k = getRowTotalKorton(row);
  return cleanDecimal(a - k);
}

function bnNum(num){
  if(isNaN(num) || num === null || num === undefined) return toBn('0.00');
  const clean = cleanDecimal(num);
  let str = clean.toString();
  if(!str.includes('.')){
    str += '.00';
  } else {
    const parts = str.split('.');
    if(parts.length < 2){
      str = parts[0] + '.' + parts.padEnd(2, '0');
    }
  }
  return toBn(str);
}
function bnInt(num){ return toBn(String(num)); }

/* ── AREA UNIT (ভূমি পরিমাপক একক: শতক / একর) ── */
const ACRE_FACTOR = 100;
const UNIT_LABEL = { shotok:'শতক', acre:'একর' };
let areaUnit = 'shotok';

function convertValue(valStr, toUnit){
  if(!valStr || !String(valStr).trim()) return '';
  const num = parseNum(valStr);
  if(isNaN(num) || num === 0) return '';
  const converted = (toUnit === 'acre') ? (num / ACRE_FACTOR) : (num * ACRE_FACTOR);
  const rounded = cleanDecimal(converted);
  return toBn(String(rounded));
}

function convertKortonString(kortonStr, toUnit){
  if(!kortonStr || !String(kortonStr).trim()) return '';
  const parts = kortonList(kortonStr);
  return parts.map(p => {
    const num = parseFloat(p);
    if(isNaN(num) || num === 0) return '';
    const converted = (toUnit === 'acre') ? (num / ACRE_FACTOR) : (num * ACRE_FACTOR);
    const rounded = cleanDecimal(converted);
    return toBn(String(rounded));
  }).filter(Boolean).join(', ');
}

function attachAutoBangla(inputEl){
  inputEl.addEventListener('input',()=>{
    const pos=inputEl.selectionStart;
    const converted=toBn(inputEl.value);
    if(converted!==inputEl.value){inputEl.value=converted; try{inputEl.setSelectionRange(pos,pos);}catch(e){}}
  });
}

/* ── HORIZONTAL SUNRISE & SUNSET THEME TOGGLE ENGINE (NO TEXT) ── */
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
}

async function initTheme(){
  let theme = 'light';
  try{
    const r = await storage.get('theme-preference', false);
    if(r && r.value){ theme = r.value; }
    else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){ theme = 'dark'; }
  }catch(e){
    if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  }
  applyTheme(theme);
}

themeToggle.addEventListener('click', async () => {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  
  applyTheme(next);
  try{ await storage.set('theme-preference', next, false); }catch(e){}
});
initTheme();

/* ── ACTIVE UNIT DROPDOWN ── */
const unitSelect = document.getElementById('unitSelect');

function applyUnitLabels(){
  if(unitSelect) unitSelect.value = areaUnit;
  const uTag1 = document.getElementById('unitTag1');
  const uTag2 = document.getElementById('unitTag2');
  const uTag3 = document.getElementById('unitTag3');
  if(uTag1) uTag1.textContent = UNIT_LABEL[areaUnit];
  if(uTag2) uTag2.textContent = UNIT_LABEL[areaUnit];
  if(uTag3) uTag3.textContent = UNIT_LABEL[areaUnit];
}

unitSelect.addEventListener('change', (e) => {
  const newUnit = e.target.value;
  if(newUnit === areaUnit) return;
  areaUnit = newUnit;
  applyUnitLabels();

  dagRows = dagRows.map(r => {
    const updatedHoldingMap = {};
    if(r.kortonByHolding){
      Object.keys(r.kortonByHolding).forEach(k => {
        updatedHoldingMap[k] = convertValue(r.kortonByHolding[k], areaUnit);
      });
    }
    return {
      dagNo: r.dagNo,
      area: convertValue(r.area, areaUnit),
      korton: convertKortonString(r.korton, areaUnit),
      kortonByHolding: updatedHoldingMap
    };
  });

  renderDagTable();
});

/* ── FLOATING HELP MODAL CONTROLS ── */
const floatingHelpToggle = document.getElementById('floatingHelpToggle');
const helpModal = document.getElementById('helpModal');
const closeHelpBtn = document.getElementById('closeHelpBtn');

function openHelp(){ helpModal.classList.add('open'); }
function closeHelp(){ helpModal.classList.remove('open'); }

floatingHelpToggle.addEventListener('click', openHelp);
closeHelpBtn.addEventListener('click', closeHelp);
helpModal.addEventListener('click', (e)=>{ if(e.target === helpModal) closeHelp(); });

/* ── CORE DATA & INPUT ELEMENTS ── */
const dagThead=document.getElementById('dagThead');
const dagBody=document.getElementById('dagBody');
const dagTfoot=document.getElementById('dagTfoot');
const holdingsList=document.getElementById('holdingsList');
const summaryRow=document.getElementById('summaryRow');
const toastEl=document.getElementById('toast');
const formHeading=document.getElementById('formHeading');
const khatianInput=document.getElementById('khatian');
const holdingNoInput=document.getElementById('holdingNo');
attachAutoBangla(khatianInput);
attachAutoBangla(holdingNoInput);

khatianInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    holdingNoInput.focus();
  }
});

holdingNoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const firstDagInput = dagBody.querySelector('input[data-i="0"][data-f="dagNo"]');
    if (firstDagInput) firstDagInput.focus();
  }
});

let kortonCols = [];
let dagRows = [];
let editingId = null;

let toastTimer = null;
function toast(msg, type='success'){
  toastEl.textContent=msg;
  toastEl.className='toast show ' + type;
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toastEl.classList.remove('show'),2200);
}

function newDagRow(){ 
  const rowObj = { dagNo:'', area:'', korton:'', kortonByHolding: {} };
  kortonCols.forEach(col => { rowObj.kortonByHolding[col.id] = ''; });
  return rowObj;
}

/* ── LIVE SUMMARY LOGIC ── */
function updateLiveSummary(){
  let totalArea = 0, totalKorton = 0, totalRemain = 0, validDags = 0;
  dagRows.forEach(r => {
    const a = parseNum(r.area);
    const k = getRowTotalKorton(r);
    const rem = remainingArea(r);
    totalArea = cleanDecimal(totalArea + a);
    totalKorton = cleanDecimal(totalKorton + k);
    totalRemain = cleanDecimal(totalRemain + rem);
    if (r.dagNo.trim() !== '' || a > 0 || k > 0) {
      validDags++;
    }
  });

  const footArea = document.getElementById('footArea');
  const footKorton = document.getElementById('footKorton');
  const footRemain = document.getElementById('footRemain');
  if(footArea) footArea.textContent = bnNum(totalArea);
  if(footKorton) footKorton.textContent = bnNum(totalKorton);
  if(footRemain) footRemain.textContent = bnNum(totalRemain);

  kortonCols.forEach(col => {
    let colSum = 0;
    dagRows.forEach(r => {
      if(r.kortonByHolding && r.kortonByHolding[col.id]) colSum += parseNum(r.kortonByHolding[col.id]);
    });
    const colFoot = document.getElementById('footCol_' + col.id);
    if(colFoot) colFoot.textContent = bnNum(cleanDecimal(colSum));
  });

  summaryRow.innerHTML = `
    <div class="sum-card navy">
      <div class="label">চলমান দাগ সংখ্যা</div>
      <div class="val">${bnInt(validDags)}</div>
      <div class="icon">📋</div>
    </div>
    <div class="sum-card">
      <div class="label">সর্বমোট জমি (${UNIT_LABEL[areaUnit]})</div>
      <div class="val">${bnNum(totalArea)}</div>
      <div class="icon">🌾</div>
    </div>
    <div class="sum-card alt">
      <div class="label">মোট কর্তনকৃত জমি (${UNIT_LABEL[areaUnit]})</div>
      <div class="val">${bnNum(totalKorton)}</div>
      <div class="icon">✂️</div>
    </div>
    <div class="sum-card gold">
      <div class="label">অবশিষ্ট জমি (${UNIT_LABEL[areaUnit]})</div>
      <div class="val">${bnNum(totalRemain)}</div>
      <div class="icon">✅</div>
    </div>
  `;
}

/* ── RENDER TWO-TIER MERGED TABLE HEADER & BODY ── */
function renderDagTable(focusTarget = null){
  let theadHtml = '';

  // Update Toggle Button label and state
  const toggleBtn = document.getElementById('toggleKortonModeBtn');
  const btnText = document.getElementById('kortonBtnText');
  const btnIcon = document.getElementById('kortonBtnIcon');
  if(toggleBtn && btnText && btnIcon){
    if(kortonCols.length === 0){
      btnText.textContent = 'হোল্ডিং অনুযায়ী কর্তন';
      toggleBtn.setAttribute('data-tip', 'প্লাস (+) বা কমা দিয়ে পৃথক করা কর্তনগুলোকে আলাদা হোল্ডিং কলামে বিভক্ত করুন');
      btnIcon.innerHTML = '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><path d="M16 8l3 3-3 3"/><path d="M8 16l-3-3 3-3"/>';
    } else {
      btnText.textContent = 'একত্রিত কর্তন হিসাব';
      toggleBtn.setAttribute('data-tip', 'সকল হোল্ডিং কলাম একত্রিত করে একটি একক ঘরে নিয়ে আসুন');
      btnIcon.innerHTML = '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>';
    }
  }

  if(kortonCols.length === 0){
    theadHtml = `<tr>
      <th class="col-sl">ক্রমিক</th>
      <th class="col-dag">দাগ নম্বর</th>
      <th class="col-area">জমির পরিমাণ (<span id="unitTag1">${UNIT_LABEL[areaUnit]}</span>)</th>
      <th class="col-korton">কর্তনকৃত জমি (একাধিক কর্তন + বা কমা দ্বারা লিখুন)</th>
      <th class="col-korton-total">মোট কর্তন (<span id="unitTag3">${UNIT_LABEL[areaUnit]}</span>)</th>
      <th class="col-remain">অবশিষ্ট জমি (<span id="unitTag2">${UNIT_LABEL[areaUnit]}</span>)</th>
      <th class="col-del"></th>
    </tr>`;
  } else {
    theadHtml = `
      <tr>
        <th class="col-sl" rowspan="2">ক্রমিক</th>
        <th class="col-dag" rowspan="2">দাগ নম্বর</th>
        <th class="col-area" rowspan="2">জমির পরিমাণ (<span id="unitTag1">${UNIT_LABEL[areaUnit]}</span>)</th>
        <th colspan="${kortonCols.length}" style="text-align:center; background:var(--surface-2); font-size:12.5px; color:var(--primary); font-weight:700; border-bottom:1px solid var(--line-strong); padding:7px 8px;">
          হোল্ডিং অনুযায়ী কর্তন
        </th>
        <th class="col-korton-total" rowspan="2">মোট কর্তন (<span id="unitTag3">${UNIT_LABEL[areaUnit]}</span>)</th>
        <th class="col-remain" rowspan="2">অবশিষ্ট জমি (<span id="unitTag2">${UNIT_LABEL[areaUnit]}</span>)</th>
        <th class="col-del" rowspan="2"></th>
      </tr>
      <tr>
    `;
    kortonCols.forEach((col, idx) => {
      const isLast = (idx === kortonCols.length - 1);
      theadHtml += `
        <th style="min-width:120px; text-align:center; padding:5px 6px; background:var(--surface-3);">
          <div class="kcol-header-wrap">
            <input type="text" data-colid="${col.id}" class="kcol-input" value="${col.holdingNo}" placeholder="হোল্ডিং নং" title="হোল্ডিং নম্বর">
            <button type="button" class="kcol-del" data-colid="${col.id}" title="কলাম মুছুন" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:13px; padding:2px;">✕</button>
            ${isLast ? `<button type="button" class="kcol-add-inline" title="আরেকটি হোল্ডিং যোগ করুন" style="background:var(--primary-light); border:1px solid var(--primary); color:var(--primary); cursor:pointer; font-size:11.5px; font-weight:bold; border-radius:4px; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; margin-left:2px;">＋</button>` : ''}
          </div>
        </th>
      `;
    });
    theadHtml += `</tr>`;
  }
  dagThead.innerHTML = theadHtml;

  dagBody.innerHTML = '';
  dagRows.forEach((row, i) => {
    const tr = document.createElement('tr');
    const rowKortonSum = getRowTotalKorton(row);
    const remain = remainingArea(row);

    let trHtml = `
      <td class="col-sl">${bnInt(i+1)}</td>
      <td class="col-dag"><input type="text" inputmode="numeric" maxlength="6" data-i="${i}" data-f="dagNo" value="${row.dagNo}" placeholder="দাগ নং" style="text-align:center;"></td>
      <td class="col-area"><input type="text" inputmode="decimal" maxlength="8" data-i="${i}" data-f="area" value="${row.area}" placeholder="০.০০" style="text-align:right;"></td>`;

    if(kortonCols.length === 0){
      trHtml += `<td class="col-korton"><input type="text" data-i="${i}" data-f="korton" value="${row.korton}" placeholder="${areaUnit==='acre'?'০.১৫+০.২০ বা কমা':'১.৫+২.০ বা কমা'}" style="text-align:right;"></td>`;
    } else {
      kortonCols.forEach(col => {
        const val = row.kortonByHolding && row.kortonByHolding[col.id] ? row.kortonByHolding[col.id] : '';
        trHtml += `<td><input type="text" inputmode="decimal" maxlength="8" data-i="${i}" data-colid="${col.id}" class="cell-kcol" value="${val}" placeholder="০.০০" style="text-align:right;"></td>`;
      });
    }

    trHtml += `
      <td class="korton-total-cell col-korton-total" id="kortonTotal_${i}">${bnNum(rowKortonSum)}</td>
      <td class="remain-cell col-remain ${remain<0?'neg':''}" id="remain_${i}">${bnNum(remain)}</td>
      <td class="col-del"><button class="row-del" data-i="${i}" title="সারি মুছুন" tabindex="-1">✕</button></td>
    `;
    tr.innerHTML = trHtml;
    dagBody.appendChild(tr);
  });

  const totalColCount = 6 + (kortonCols.length > 0 ? kortonCols.length - 1 : 0);
  const addRowTr = document.createElement('tr');
  addRowTr.innerHTML = `
    <td colspan="${totalColCount + 1}" style="text-align:left; background:var(--surface-2); padding:6px 10px; border-bottom:1.5px solid var(--line-strong);">
      <button type="button" class="btn ghost" id="addDagInlineBtn" data-tip="টিপ: শেষ ঘরে Enter চাপলে নতুন দাগ তৈরি হবে" style="border-style:dashed; border-width:1.5px; border-color:var(--primary); color:var(--primary); background:var(--primary-light); font-weight:600; padding:4px 14px; font-size:12.5px;">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        নতুন দাগ যুক্ত করুন
      </button>
    </td>
  `;
  dagBody.appendChild(addRowTr);

  let tfootHtml = `<tr>
    <td colspan="2">সর্বমোট</td>
    <td id="footArea">০.০০</td>`;

  if(kortonCols.length === 0){
    tfootHtml += `<td></td>`;
  } else {
    kortonCols.forEach(col => {
      tfootHtml += `<td style="color:var(--danger); text-align:right; font-weight:600;" id="footCol_${col.id}">০.০০</td>`;
    });
  }

  tfootHtml += `
    <td id="footKorton" style="color:var(--danger);">০.০০</td>
    <td id="footRemain">০.০০</td>
    <td></td>
  </tr>`;
  dagTfoot.innerHTML = tfootHtml;

  dagBody.querySelector('#addDagInlineBtn').addEventListener('click', () => {
    dagRows.push(newDagRow());
    renderDagTable({ index: dagRows.length - 1, field: 'dagNo' });
  });

  dagThead.querySelectorAll('.kcol-input').forEach(inp => {
    attachAutoBangla(inp);
    inp.addEventListener('input', e => {
      const colId = e.target.dataset.colid;
      const target = kortonCols.find(c => c.id === colId);
      if(target) target.holdingNo = e.target.value;
    });
  });

  dagThead.querySelectorAll('.kcol-del').forEach(btn => {
    btn.addEventListener('click', e => {
      const colId = e.target.dataset.colid;
      kortonCols = kortonCols.filter(c => c.id !== colId);
      dagRows.forEach(r => {
        if(r.kortonByHolding) delete r.kortonByHolding[colId];
      });
      renderDagTable();
    });
  });

  dagThead.querySelectorAll('.kcol-add-inline').forEach(btn => {
    btn.addEventListener('click', () => {
      const colId = 'kc_' + Date.now();
      kortonCols.push({ id: colId, holdingNo: '' });
      dagRows.forEach(r => {
        if(!r.kortonByHolding) r.kortonByHolding = {};
        r.kortonByHolding[colId] = '';
      });
      renderDagTable();
    });
  });

  dagBody.querySelectorAll('input').forEach(inp => {
    attachAutoBangla(inp);
    inp.addEventListener('input', e => {
      const i = +e.target.dataset.i;
      const f = e.target.dataset.f;
      const colId = e.target.dataset.colid;

      if(colId){
        if(!dagRows[i].kortonByHolding) dagRows[i].kortonByHolding = {};
        dagRows[i].kortonByHolding[colId] = e.target.value;
      } else if(f){
        dagRows[i][f] = e.target.value;
      }
      updateRowRemain(i);
      updateLiveSummary();
    });

    inp.addEventListener('keydown', e => {
      const i = +e.target.dataset.i;
      const f = e.target.dataset.f;
      const colId = e.target.dataset.colid;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (f === 'dagNo') {
          const next = dagBody.querySelector(`input[data-i="${i}"][data-f="area"]`);
          if (next) next.focus();
        } else if (f === 'area') {
          if(kortonCols.length === 0){
            const next = dagBody.querySelector(`input[data-i="${i}"][data-f="korton"]`);
            if (next) next.focus();
          } else {
            const next = dagBody.querySelector(`input[data-i="${i}"][data-colid="${kortonCols[0].id}"]`);
            if (next) next.focus();
          }
        } else if (f === 'korton' || (colId && colId === kortonCols[kortonCols.length - 1].id)) {
          if (i === dagRows.length - 1) {
            dagRows.push(newDagRow());
            renderDagTable({ index: i + 1, field: 'dagNo' });
          } else {
            const next = dagBody.querySelector(`input[data-i="${i + 1}"][data-f="dagNo"]`);
            if (next) next.focus();
          }
        } else if (colId) {
          const cIndex = kortonCols.findIndex(c => c.id === colId);
          if(cIndex >= 0 && cIndex < kortonCols.length - 1){
            const next = dagBody.querySelector(`input[data-i="${i}"][data-colid="${kortonCols[cIndex+1].id}"]`);
            if (next) next.focus();
          }
        }
      } else if (e.key === 'Tab' && !e.shiftKey && (f === 'korton' || (colId && colId === kortonCols[kortonCols.length - 1].id)) && i === dagRows.length - 1) {
        e.preventDefault();
        dagRows.push(newDagRow());
        renderDagTable({ index: i + 1, field: 'dagNo' });
      }
    });
  });

  dagBody.querySelectorAll('.row-del').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = +e.target.dataset.i;
      dagRows.splice(i, 1);
      if(dagRows.length === 0) dagRows.push(newDagRow());
      renderDagTable();
    });
  });

  updateLiveSummary();

  if (focusTarget) {
    const targetInput = dagBody.querySelector(`input[data-i="${focusTarget.index}"][data-f="${focusTarget.field}"]`);
    if (targetInput) targetInput.focus();
  }
}

function updateRowRemain(i){
  const remainCell=document.getElementById('remain_'+i);
  const kortonTotalCell=document.getElementById('kortonTotal_'+i);
  const kSum = getRowTotalKorton(dagRows[i]);
  const remain = remainingArea(dagRows[i]);

  if(kortonTotalCell) {
    kortonTotalCell.textContent = bnNum(kSum);
  }
  if(remainCell) {
    remainCell.textContent = bnNum(remain);
    remainCell.classList.toggle('neg', remain < 0);
  }
}

/* ── SMART TOGGLE: MULTI-HOLDING COLUMN SPLIT & UNIFIED MERGE (ACCEPTS + AND ,) ── */
document.getElementById('toggleKortonModeBtn').addEventListener('click', () => {
  if(kortonCols.length === 0){
    let maxCols = 0;
    dagRows.forEach(r => {
      const list = kortonList(r.korton);
      if(list.length > maxCols) maxCols = list.length;
    });
    if(maxCols === 0) maxCols = 2;

    kortonCols = [];
    for(let c = 0; c < maxCols; c++){
      kortonCols.push({ id: 'kc_' + Date.now() + '_' + c, holdingNo: '' });
    }

    dagRows.forEach(r => {
      const list = kortonList(r.korton);
      if(!r.kortonByHolding) r.kortonByHolding = {};
      kortonCols.forEach((col, idx) => {
        r.kortonByHolding[col.id] = list[idx] ? toBn(list[idx]) : '';
      });
      r.korton = '';
    });

    toast('হোল্ডিং অনুযায়ী আলাদা কর্তন কলাম তৈরি হয়েছে ✓', 'success');
  } else {
    dagRows.forEach(r => {
      const combined = kortonCols
        .map(col => (r.kortonByHolding && r.kortonByHolding[col.id]) ? r.kortonByHolding[col.id].trim() : '')
        .filter(v => v.length > 0)
        .join(', ');
      r.korton = combined;
      r.kortonByHolding = {};
    });
    kortonCols = [];

    toast('একত্রিত কর্তন হিসাবে পরিবর্তন করা হয়েছে ✓', 'success');
  }
  renderDagTable();
});

function clearForm(){
  khatianInput.value='';
  holdingNoInput.value='';
  kortonCols = [];
  dagRows=[newDagRow()];
  editingId=null;
  formHeading.textContent='';
  formHeading.style.display='none';
  areaUnit = 'shotok';
  applyUnitLabels();
  renderDagTable();
}
document.getElementById('clearFormBtn').addEventListener('click',clearForm);

async function saveHolding(){
  const khatian=khatianInput.value.trim();
  const holdingNo=holdingNoInput.value.trim();
  const validRows=dagRows.filter(r=>r.dagNo.trim()!=='');
  if(!holdingNo){ toast('হোল্ডিং নম্বর আবশ্যক','error'); return; }
  if(validRows.length===0){ toast('দাগ নম্বর আবশ্যক','error'); return; }

  const savedRows = validRows.map(r => {
    const updatedMap = {};
    if(r.kortonByHolding){
      Object.keys(r.kortonByHolding).forEach(k => {
        updatedMap[k] = r.kortonByHolding[k] || '';
      });
    }
    let combinedKorton = '';
    if(kortonCols.length > 0){
      combinedKorton = kortonCols.map(c => updatedMap[c.id]).filter(v => v && String(v).trim() !== '').join(', ');
    } else {
      combinedKorton = r.korton || '';
    }

    return {
      dagNo: r.dagNo,
      area: r.area,
      korton: combinedKorton,
      kortonByHolding: updatedMap
    };
  });

  const id=editingId||('h_'+Date.now());
  
  let creatorInfo = currentUser ? {
    id: currentUser.id,
    username: currentUser.username,
    name: currentUser.name,
    role: currentUser.role,
    office: currentUser.office || ''
  } : null;

  if (editingId) {
    const existingRec = allRecords.find(r => r.id === editingId);
    if (existingRec && existingRec.createdBy) {
      creatorInfo = existingRec.createdBy;
    }
  }

  const record={
    id,
    khatian,
    holdingNo,
    areaUnit,
    kortonCols: kortonCols.map(c => ({ ...c })),
    dagRows: savedRows,
    updatedAt: Date.now(),
    createdBy: creatorInfo
  };

  try{
    const res=await storage.set('holding:'+id,JSON.stringify(record));
    if(!res){ toast('সংরক্ষণ ব্যর্থ','error'); return; }
    toast('সংরক্ষণ সম্পন্ন ✓ (' + UNIT_LABEL[areaUnit] + ')','success');
    clearForm();
    await loadAll();
  }catch(err){ console.error(err); toast('সংরক্ষণ ত্রুটি','error'); }
}
document.getElementById('saveBtn').addEventListener('click', () => {
  if (requireUserAuth('ডাটা সংরক্ষণ করতে')) {
    saveHolding();
  }
});

function editHolding(record){
  khatianInput.value=record.khatian||'';
  holdingNoInput.value=record.holdingNo||'';
  areaUnit = record.areaUnit || 'shotok';
  applyUnitLabels();
  
  kortonCols = (record.kortonCols && record.kortonCols.length) ? record.kortonCols.map(c => ({...c})) : [];
  
  dagRows = (record.dagRows && record.dagRows.length)
    ? record.dagRows.map(r => {
        const map = {};
        if(r.kortonByHolding){
          Object.keys(r.kortonByHolding).forEach(k => {
            map[k] = r.kortonByHolding[k] || '';
          });
        }
        return {
          dagNo: r.dagNo,
          area: r.area,
          korton: r.korton,
          kortonByHolding: map
        };
      })
    : [newDagRow()];

  editingId=record.id;
  formHeading.textContent='হোল্ডিং সম্পাদনা — নং '+toBn(record.holdingNo)+' ('+UNIT_LABEL[areaUnit]+')';
  formHeading.style.display='block';
  renderDagTable();
  window.scrollTo({top:0,behavior:'smooth'});
}

async function deleteHolding(id){
  if(!confirm('হোল্ডিং তথ্য মুছে ফেলতে চান?')) return;
  try{
    await storage.delete('holding:'+id);
    toast('তথ্য মোছা হয়েছে');
    await loadAll();
  }catch(err){ console.error(err); toast('মোছা ব্যর্থ','error'); }
}

function holdingTotals(record){
  let area=0,korton=0,remain=0;
  record.dagRows.forEach(r=>{
    area = cleanDecimal(area + parseNum(r.area));
    korton = cleanDecimal(korton + getRowTotalKorton(r));
    remain = cleanDecimal(remain + remainingArea(r));
  });
  return {area,korton,remain};
}

function sanitizeFilename(str){ return String(str).trim().replace(/[\\\/:*?"<>|]+/g,'').replace(/\s+/g,'_')||'হোল্ডিং'; }

/* ── SMART DYNAMIC PRINT (STRICT 0PX BORDER-RADIUS WITH APP BRANDING ON TOP & DEVELOPER ON BOTTOM) ── */
function printHolding(rec){
  const recUnit = rec.areaUnit || 'shotok';
  const unitLabelText = UNIT_LABEL[recUnit];
  const t = holdingTotals(rec);
  const printArea = document.getElementById('printArea');
  const hasCols = rec.kortonCols && rec.kortonCols.length > 0;
  
  // Calculate total columns to choose best orientation (Portrait vs Landscape)
  const totalCols = hasCols ? (5 + rec.kortonCols.length) : 6;
  const isLandscape = hasCols || totalCols > 5;

  // Dynamically configure @page orientation
  let printStyle = document.getElementById('printPageOrientation');
  if(!printStyle){
    printStyle = document.createElement('style');
    printStyle.id = 'printPageOrientation';
    document.head.appendChild(printStyle);
  }
  if(isLandscape){
    printStyle.textContent = `@media print { @page { size: A4 landscape; margin: 10mm 12mm; } }`;
  } else {
    printStyle.textContent = `@media print { @page { size: A4 portrait; margin: 12mm 14mm; } }`;
  }

  let thead = '';
  if(!hasCols){
    thead = `<tr>
      <th style="width:45px; text-align:center;">ক্রমিক</th>
      <th style="width:80px; text-align:center;">দাগ নম্বর</th>
      <th>মোট জমি (${unitLabelText})</th>
      <th>কর্তনকৃত জমি (বিস্তারিত)</th>
      <th>মোট কর্তন (${unitLabelText})</th>
      <th>অবশিষ্ট জমি (${unitLabelText})</th>
    </tr>`;
  } else {
    thead = `
      <tr>
        <th style="width:45px; text-align:center;" rowspan="2">ক্রমিক</th>
        <th style="width:80px; text-align:center;" rowspan="2">দাগ নম্বর</th>
        <th rowspan="2">মোট জমি (${unitLabelText})</th>
        <th colspan="${rec.kortonCols.length}" style="text-align:center; background:#4F46E5 !important; color:#fff !important;">হোল্ডিং অনুযায়ী কর্তন</th>
        <th rowspan="2">মোট কর্তন (${unitLabelText})</th>
        <th rowspan="2">অবশিষ্ট জমি (${unitLabelText})</th>
      </tr>
      <tr>
        ${rec.kortonCols.map(c => `<th style="text-align:center; font-size:12px;">${toBn(c.holdingNo || '—')}</th>`).join('')}
      </tr>
    `;
  }

  let tbody = rec.dagRows.map((r, i) => {
    let rowHtml = `<tr>
      <td style="text-align:center;">${bnInt(i+1)}</td>
      <td style="text-align:center; font-weight:600;">${toBn(r.dagNo)}</td>
      <td>${bnNum(parseNum(r.area))}</td>`;

    if(hasCols){
      rec.kortonCols.forEach(c => {
        const val = r.kortonByHolding && r.kortonByHolding[c.id] ? parseNum(r.kortonByHolding[c.id]) : 0;
        rowHtml += `<td style="color:#E84C5B;">${val > 0 ? bnNum(val) : '—'}</td>`;
      });
    } else {
      rowHtml += `<td>${kortonList(r.korton).map(v=>bnNum(parseFloat(v)||0)).join(', ')||'—'}</td>`;
    }

    rowHtml += `
      <td style="color:#E84C5B; font-weight:600;">${bnNum(getRowTotalKorton(r))}</td>
      <td style="font-weight:700; color:#4F46E5;">${bnNum(remainingArea(r))}</td>
    </tr>`;
    return rowHtml;
  }).join('');

  let tfoot = `<tr>
    <td colspan="2" style="text-align:center; font-weight:bold;">সর্বমোট:</td>
    <td style="font-weight:bold; color:#111; text-align:right;">${bnNum(t.area)}</td>`;

  if(hasCols){
    rec.kortonCols.forEach(c => {
      let colSum = 0;
      rec.dagRows.forEach(r => {
        if(r.kortonByHolding && r.kortonByHolding[c.id]) colSum += parseNum(r.kortonByHolding[c.id]);
      });
      tfoot += `<td style="color:#E84C5B; font-weight:bold; text-align:right;">${bnNum(cleanDecimal(colSum))}</td>`;
    });
  } else {
    tfoot += `<td style="text-align:center;">—</td>`;
  }

  tfoot += `
    <td style="color:#E84C5B; font-weight:bold; text-align:right;">${bnNum(t.korton)}</td>
    <td style="font-weight:bold; color:#4F46E5; text-align:right;">${bnNum(t.remain)}</td>
  </tr>`;

  printArea.innerHTML=`
    <div class="print-container">
      <div class="print-header">
        <div class="print-app-title">Land Management Automation Project (LMAP)</div>
        <div class="print-app-motto">Ministry of Land | United Nations Development Programme (UNDP) Bangladesh</div>
      </div>
      <div class="print-title-box">
        <h2 class="print-main-title">
          হোল্ডিং নং: ${toBn(rec.holdingNo)}
          ${rec.khatian ? ' &nbsp;|&nbsp; খতিয়ান নং: ' + toBn(rec.khatian) : ''}
          &nbsp;|&nbsp; সর্বমোট জমি: ${bnNum(t.area)} ${unitLabelText}
        </h2>
        <div class="print-meta-sub">
          প্রিন্ট তারিখ: ${new Date().toLocaleDateString('bn-BD')} &nbsp;|&nbsp; মোট দাগ: ${bnInt(rec.dagRows.length)} টি &nbsp;|&nbsp; ওরিয়েন্টেশন: ${isLandscape ? 'ল্যান্ডস্কেপ (Landscape)' : 'পোর্ট্রেট (Portrait)'}
        </div>
      </div>
      <table class="print-table">
        <thead>${thead}</thead>
        <tbody>${tbody}</tbody>
        <tfoot>${tfoot}</tfoot>
      </table>
      <div class="print-footer">
        <div class="print-footer-left">
          <strong>Project Scope:</strong> Implementation of the Holding Data and Khatian Data Entry and Verification in LMAP
        </div>
        <div class="print-footer-right">
          © ${new Date().getFullYear()} LMAP · ভূমি মন্ত্রণালয় ও UNDP Bangladesh
        </div>
      </div>
    </div>
  `;

  const originalTitle=document.title;
  document.title=sanitizeFilename(toBn(rec.holdingNo));
  const restoreTitle=()=>{
    document.title=originalTitle;
    if(printStyle) printStyle.textContent = '';
    window.removeEventListener('afterprint',restoreTitle);
  };
  window.addEventListener('afterprint',restoreTitle);
  setTimeout(()=>{ window.print(); setTimeout(restoreTitle,1000); },50);
}

/* ── BUILD STRUCTURED EXCEL SHEET DATA (SAME TO SAME AS PRINT FILE) ── */
function buildHoldingExcelData(rec){
  const recUnit = rec.areaUnit || 'shotok';
  const unitLabelText = UNIT_LABEL[recUnit];
  const t = holdingTotals(rec);
  const uDate = rec.updatedAt ? new Date(rec.updatedAt).toLocaleDateString('bn-BD') : new Date().toLocaleDateString('bn-BD');
  const hasCols = rec.kortonCols && rec.kortonCols.length > 0;

  const aoa = [];
  
  // 1. App Header & Tagline (Matching Print Header)
  aoa.push(['Land Management Automation Project (LMAP)']);
  aoa.push(['Ministry of Land | United Nations Development Programme (UNDP) Bangladesh']);
  
  // 2. Holding Details Title Box (Matching Print Title Box)
  aoa.push([`হোল্ডিং নং: ${toBn(rec.holdingNo)} ${rec.khatian ? '| খতিয়ান নং: ' + toBn(rec.khatian) : ''} | সর্বমোট জমি: ${bnNum(t.area)} ${unitLabelText} | তারিখ: ${uDate}`]);
  aoa.push([]); // Spacer row

  // 3. Table Column Headers
  const headers = ['ক্রমিক', 'দাগ নম্বর', `জমির পরিমাণ (${unitLabelText})`];
  if(hasCols){
    rec.kortonCols.forEach(c => {
      headers.push(`হোল্ডিং_${toBn(c.holdingNo || '—')}_কর্তন`);
    });
  } else {
    headers.push('কর্তনকৃত জমি (বিস্তারিত)');
  }
  headers.push(`মোট কর্তন (${unitLabelText})`);
  headers.push(`অবশিষ্ট জমি (${unitLabelText})`);
  aoa.push(headers);

  // 4. Data Rows
  rec.dagRows.forEach((r, i) => {
    const area = parseNum(r.area);
    const korton = getRowTotalKorton(r);
    const rem = remainingArea(r);
    const row = [toBn(i + 1), toBn(r.dagNo), area];

    if(hasCols){
      rec.kortonCols.forEach(c => {
        const val = r.kortonByHolding && r.kortonByHolding[c.id] ? parseNum(r.kortonByHolding[c.id]) : 0;
        row.push(val > 0 ? val : 0);
      });
    } else {
      const kDet = kortonList(r.korton).map(v => bnNum(parseFloat(v) || 0)).join(', ');
      row.push(kDet || '—');
    }

    row.push(korton);
    row.push(rem);
    aoa.push(row);
  });

  // 5. Table Footer / Totals Row
  const foot = ['সর্বমোট:', '', t.area];
  if(hasCols){
    rec.kortonCols.forEach(c => {
      let colSum = 0;
      rec.dagRows.forEach(r => {
        if(r.kortonByHolding && r.kortonByHolding[c.id]) colSum += parseNum(r.kortonByHolding[c.id]);
      });
      foot.push(cleanDecimal(colSum));
    });
  } else {
    foot.push('—');
  }
  foot.push(t.korton);
  foot.push(t.remain);
  aoa.push(foot);

  // 6. Developer Credit Footer (Matching Print Footer)
  aoa.push([]); // Spacer row
  aoa.push(['Project Scope: Implementation of the Holding Data and Khatian Data Entry and Verification in LMAP | Ministry of Land • UNDP Bangladesh']);

  // Calculate clean column widths
  const colWidths = [
    { wch: 10 }, // ক্রমিক
    { wch: 14 }, // দাগ নম্বর
    { wch: 22 }, // জমির পরিমাণ
  ];
  if(hasCols){
    rec.kortonCols.forEach(() => colWidths.push({ wch: 18 }));
  } else {
    colWidths.push({ wch: 28 });
  }
  colWidths.push({ wch: 20 }); // মোট কর্তন
  colWidths.push({ wch: 20 }); // অবশিষ্ট জমি

  return { aoa, colWidths };
}

/* ── GENUINE .XLSX EXPORT (SINGLE HOLDING) ── */
function exportSingleHoldingExcel(rec){
  if(typeof XLSX === 'undefined'){
    toast('এক্সেল এক্সপোর্ট লাইব্রেরি লোড হচ্ছে...', 'error');
    return;
  }
  const wb = XLSX.utils.book_new();
  const sName = ('হোল্ডিং_' + toBn(rec.holdingNo || '১')).replace(/[:\\/?*\[\]]/g, '').slice(0, 30);
  const { aoa, colWidths } = buildHoldingExcelData(rec);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, sName);

  const fname = sanitizeFilename('হোল্ডিং_' + toBn(rec.holdingNo)) + '.xlsx';
  XLSX.writeFile(wb, fname);
  toast('হোল্ডিং নং ' + toBn(rec.holdingNo) + ' এক্সেল (.xlsx) এক্সপোর্ট সম্পন্ন ✓', 'success');
}

/* ── GENUINE .XLSX EXPORT (ALL HOLDINGS MULTI-SHEET) ── */
function exportToExcel(){
  if (!allRecords || allRecords.length === 0) {
    toast('তথ্য পাওয়া যায়নি', 'error');
    return;
  }
  if(typeof XLSX === 'undefined'){
    toast('এক্সেল এক্সপোর্ট লাইব্রেরি লোড হচ্ছে...', 'error');
    return;
  }
  const wb = XLSX.utils.book_new();
  const usedNames = new Set();

  allRecords.forEach((rec, idx) => {
    let sName = ('হোল্ডিং_' + toBn(rec.holdingNo || (idx+1))).replace(/[:\\/?*\[\]]/g, '').slice(0, 30);
    if (usedNames.has(sName)) sName += '_' + (idx+1);
    usedNames.add(sName);

    const { aoa, colWidths } = buildHoldingExcelData(rec);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sName);
  });

  const dStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `LMAP_Holdings_MultiSheet_${dStr}.xlsx`);
  toast('সকল হোল্ডিং (.xlsx) এক্সপোর্ট সম্পন্ন ✓', 'success');
}

document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);

/* ── FLOATING UNIVERSAL LAND CONVERTER WIDGET ── */
const floatingCalcToggle = document.getElementById('floatingHelpToggle');
const calcDrawer = document.getElementById('calcDrawer');
const closeCalcBtn = document.getElementById('closeCalcBtn');
const calcClearBtn = document.getElementById('calcClearBtn');

const floatingCalcBtn = document.getElementById('floatingCalcToggle');
if(floatingCalcBtn){
  floatingCalcBtn.addEventListener('click', () => calcDrawer.classList.toggle('open'));
}
closeCalcBtn.addEventListener('click', () => calcDrawer.classList.remove('open'));

const calcInputs = {
  shotok: document.getElementById('calc_shotok'),
  katha: document.getElementById('calc_katha'),
  bigha: document.getElementById('calc_bigha'),
  acre: document.getElementById('calc_acre'),
  hectare: document.getElementById('calc_hectare'),
  kani: document.getElementById('calc_kani'),
  ganda: document.getElementById('calc_ganda'),
  sqft: document.getElementById('calc_sqft')
};

Object.values(calcInputs).forEach(inp => attachAutoBangla(inp));

function updateAllUnitsFromShotok(shotokVal, sourceKey){
  if(isNaN(shotokVal) || shotokVal <= 0){
    Object.keys(calcInputs).forEach(k => {
      if(k !== sourceKey) calcInputs[k].value = '';
    });
    return;
  }

  const values = {
    shotok: shotokVal,
    katha: shotokVal / 1.65,
    bigha: shotokVal / 33,
    acre: shotokVal / 100,
    hectare: shotokVal / 247.105,
    kani: shotokVal / 40,
    ganda: shotokVal / 2,
    sqft: shotokVal * 435.6
  };

  Object.keys(calcInputs).forEach(k => {
    if(k !== sourceKey){
      const val = cleanDecimal(values[k]);
      calcInputs[k].value = toBn(String(val));
    }
  });
}

function handleCalcInput(unitKey, value){
  const num = parseNum(value);
  if(num <= 0 || isNaN(num)){
    updateAllUnitsFromShotok(0, unitKey);
    return;
  }

  let shotokVal = 0;
  switch(unitKey){
    case 'shotok': shotokVal = num; break;
    case 'katha': shotokVal = num * 1.65; break;
    case 'bigha': shotokVal = num * 33; break;
    case 'acre': shotokVal = num * 100; break;
    case 'hectare': shotokVal = num * 247.105; break;
    case 'kani': shotokVal = num * 40; break;
    case 'ganda': shotokVal = num * 2; break;
    case 'sqft': shotokVal = num / 435.6; break;
  }
  updateAllUnitsFromShotok(shotokVal, unitKey);
}

Object.keys(calcInputs).forEach(k => {
  calcInputs[k].addEventListener('input', (e) => handleCalcInput(k, e.target.value));
});

calcClearBtn.addEventListener('click', () => {
  Object.values(calcInputs).forEach(inp => inp.value = '');
});

/* ── HOLDINGS LIST RENDER (WITH NO LOGO ON SINGLE EXCEL BUTTON) ── */
function renderHoldingsList(records){
  if(records.length===0){
    if (!currentUser) {
      holdingsList.innerHTML=`
        <div class="empty" style="padding:28px 16px;">
          <div class="empty-icon">🔒</div>
          <strong>প্রাইভেট ডাটা সিকিউরিটি প্রটেক্টেড</strong>
          <div style="font-size:12px; color:var(--ink-soft); margin-top:6px; max-width:400px; line-height:1.45;">
            আপনার প্রাইভেট এন্ট্রি করা ভূমি কর্তন ও খতিয়ান তথ্য নিরাপদে দেখতে এবং নতুন ডাটা তৈরি করতে অফিশিয়াল ইউজার হিসেবে লগইন করুন।
          </div>
          <button class="btn primary" style="margin-top:14px; padding:8px 20px; font-weight:bold;" onclick="openAuthModal()">🔑 প্রফেশনাল ইউজার লগইন করুন</button>
        </div>`;
    } else {
      holdingsList.innerHTML=`<div class="empty"><div class="empty-icon">📂</div><strong>আপনার তালিকায় কোনো কর্তনকৃত হোল্ডিং নেই</strong></div>`;
    }
    return;
  }
  holdingsList.innerHTML='';
  records.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).forEach((rec, idx)=>{
    const serialNo = toBn(idx + 1);
    const recUnit = rec.areaUnit || 'shotok';
    const unitLabelText = UNIT_LABEL[recUnit];
    const t = holdingTotals(rec);
    const card = document.createElement('div');
    card.className = 'holding-card';
    const hasCols = rec.kortonCols && rec.kortonCols.length > 0;

    let miniThead = '';
    if(!hasCols){
      miniThead = `<tr>
        <th>ক্রমিক</th>
        <th>দাগ নম্বর</th>
        <th>জমির পরিমাণ (${unitLabelText})</th>
        <th>কর্তনকৃত জমি (বিস্তারিত)</th>
        <th>মোট কর্তনকৃত জমি (${unitLabelText})</th>
        <th>অবশিষ্ট জমি (${unitLabelText})</th>
      </tr>`;
    } else {
      miniThead = `
        <tr>
          <th rowspan="2" style="text-align:center;">ক্রমিক</th>
          <th rowspan="2" style="text-align:center;">দাগ নম্বর</th>
          <th rowspan="2">জমির পরিমাণ (${unitLabelText})</th>
          <th colspan="${rec.kortonCols.length}" style="text-align:center; background:var(--surface-3); font-weight:700; color:var(--primary);">হোল্ডিং অনুযায়ী কর্তন</th>
          <th rowspan="2">মোট কর্তনকৃত জমি (${unitLabelText})</th>
          <th rowspan="2">অবশিষ্ট জমি (${unitLabelText})</th>
        </tr>
        <tr>
          ${rec.kortonCols.map(c => `<th style="text-align:center; font-size:11.5px;">${toBn(c.holdingNo || '—')}</th>`).join('')}
        </tr>
      `;
    }

    let miniTbody = rec.dagRows.map((r, i) => {
      let rHtml = `<tr>
        <td>${bnInt(i+1)}</td>
        <td>${toBn(r.dagNo)}</td>
        <td>${bnNum(parseNum(r.area))}</td>`;

      if(hasCols){
        rec.kortonCols.forEach(c => {
          const val = r.kortonByHolding && r.kortonByHolding[c.id] ? parseNum(r.kortonByHolding[c.id]) : 0;
          rHtml += `<td style="color:var(--danger);">${val > 0 ? bnNum(val) : '—'}</td>`;
        });
      } else {
        rHtml += `<td>${kortonList(r.korton).map(v=>bnNum(parseFloat(v)||0)).join(', ')||'—'}</td>`;
      }

      rHtml += `
        <td style="color:var(--danger);">${bnNum(getRowTotalKorton(r))}</td>
        <td>${bnNum(remainingArea(r))}</td>
      </tr>`;
      return rHtml;
    }).join('');

    let miniTfoot = `<tr>
      <td colspan="2">সর্বমোট:</td>
      <td style="font-weight:bold; color:var(--ink);">${bnNum(t.area)}</td>`;

    if(hasCols){
      rec.kortonCols.forEach(c => {
        let colSum = 0;
        rec.dagRows.forEach(r => {
          if(r.kortonByHolding && r.kortonByHolding[c.id]) colSum += parseNum(r.kortonByHolding[c.id]);
        });
        miniTfoot += `<td style="color:var(--danger); font-weight:bold;">${bnNum(cleanDecimal(colSum))}</td>`;
      });
    } else {
      miniTfoot += `<td>—</td>`;
    }

    miniTfoot += `
      <td style="color:var(--danger); font-weight:bold;">${bnNum(t.korton)}</td>
      <td style="font-weight:bold;">${bnNum(t.remain)}</td>
    </tr>`;

    card.innerHTML=`
      <div class="holding-head">
        <div class="holding-head-left">
          <div class="holding-serial-badge" title="ক্রমিক নম্বর">${serialNo}</div>
          <div>
            <div class="holding-title">হোল্ডিং নং ${toBn(rec.holdingNo)}</div>
            <div class="holding-meta">
              ${rec.khatian?'খতিয়ান: '+toBn(rec.khatian)+' | ':''}একক: <strong style="color:var(--primary);">${unitLabelText}</strong>
              ${rec.createdBy ? ` &nbsp;|&nbsp; <span class="holding-owner-badge">👤 এন্ট্রি: <strong>${toBn(rec.createdBy.name)}</strong> (${rec.createdBy.role})</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="holding-figs">
            <div class="fig"><div class="n">${bnInt(rec.dagRows.length)}</div><div class="l">দাগ</div></div>
            <div class="fig"><div class="n">${bnNum(t.area)}</div><div class="l">মোট ${unitLabelText}</div></div>
            <div class="fig"><div class="n">${bnNum(t.korton)}</div><div class="l">মোট কর্তন</div></div>
            <div class="fig"><div class="n">${bnNum(t.remain)}</div><div class="l">অবশিষ্ট</div></div>
          </div>
          <svg class="holding-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div class="holding-body" id="body_${rec.id}">
        <table class="dagno-mini">
          <thead>${miniThead}</thead>
          <tbody>${miniTbody}</tbody>
          <tfoot>${miniTfoot}</tfoot>
        </table>
        <div class="btn-row">
          <button class="btn ghost" data-edit="${rec.id}">✎ সম্পাদনা</button>
          <button class="btn gold-btn" data-pdf="${rec.id}">⎙ প্রিন্ট</button>
          <button class="btn navy" data-excel="${rec.id}" title="শুধুমাত্র এই হোল্ডিং .xlsx ফাইলে ডাউনলোড করুন">এক্সেল (.xlsx)</button>
          <button class="btn danger" data-del="${rec.id}">✕ মুছুন</button>
        </div>
      </div>
    `;
    const head=card.querySelector('.holding-head');
    head.addEventListener('click',()=>{
      const body=card.querySelector('.holding-body');
      const isOpen=body.classList.contains('open');
      document.querySelectorAll('.holding-body.open').forEach(b=>b.classList.remove('open'));
      document.querySelectorAll('.holding-head.open').forEach(h=>h.classList.remove('open'));
      if(!isOpen){ body.classList.add('open'); head.classList.add('open'); }
    });
    card.querySelector('[data-edit]').addEventListener('click',e=>{ e.stopPropagation(); editHolding(rec); });
    card.querySelector('[data-del]').addEventListener('click',e=>{ e.stopPropagation(); deleteHolding(rec.id); });
    card.querySelector('[data-pdf]').addEventListener('click',e=>{ e.stopPropagation(); printHolding(rec); });
    card.querySelector('[data-excel]').addEventListener('click',e=>{ e.stopPropagation(); exportSingleHoldingExcel(rec); });
    holdingsList.appendChild(card);
  });
}

let allRecords=[];
let userFilterMode = 'my'; // 'my' vs 'all'

/* ── CRYPTOGRAPHIC SECURITY & PRIVACY LIBRARY (SHA-256 HASHING) ── */
async function hashPassword(plainText) {
  if (!plainText) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(plainText);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  let hash = 0;
  for (let i = 0; i < plainText.length; i++) {
    const char = plainText.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16);
}

/* ── ADVANCED USER AUTHENTICATION, REGISTRATION & PROFILE ENGINE ── */
let currentUser = null;
let registeredUsersDB = [];

function initUserAuth() {
  try {
    const dbStr = localStorage.getItem('lmap_users_db');
    if (dbStr) {
      registeredUsersDB = JSON.parse(dbStr);
    } else {
      registeredUsersDB = [];
    }
  } catch (e) {
    registeredUsersDB = [];
  }

  try {
    const storedUser = localStorage.getItem('lmap_active_user');
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
    }
  } catch (e) {
    currentUser = null;
  }

  renderUserProfileWidget();
  refreshListDisplay();
}

/* ── STRICT APP PRIVACY ACCESS CONTROLLER ── */
function applyUserFilter(records) {
  const myDataCountEl = document.getElementById('myDataCount');
  const allDataCountEl = document.getElementById('allDataCount');
  const noticeEl = document.getElementById('userFilterNotice');
  const filterMyDataBtn = document.getElementById('filterMyDataBtn');
  const filterAllDataBtn = document.getElementById('filterAllDataBtn');

  // CASE 1: UNAUTHENTICATED VISITOR -> ZERO DATA VISIBILITY (STRICT PRIVACY LOCK)
  if (!currentUser) {
    if (myDataCountEl) myDataCountEl.textContent = '০';
    if (allDataCountEl) allDataCountEl.textContent = '০';
    if (filterMyDataBtn) filterMyDataBtn.style.display = 'none';
    if (filterAllDataBtn) filterAllDataBtn.style.display = 'none';
    if (noticeEl) {
      noticeEl.innerHTML = `🔒 <strong>সিকিউরিটি প্রটেকশন:</strong> আপনার প্রাইভেট ডাটা দেখতে ইউজার লগইন করুন`;
    }
    return [];
  }

  const curUserClean = (currentUser.username || '').trim().toLowerCase();
  const curUserId = currentUser.id || '';

  // Calculate my records with robust case-insensitive matching & legacy record inclusion
  const myRecords = records.filter(r => {
    if (!r.createdBy) return true; // Legacy holdings created without owner metadata
    const recUserClean = (r.createdBy.username || '').trim().toLowerCase();
    const recUserId = r.createdBy.id || '';
    return (recUserClean && recUserClean === curUserClean) || (recUserId && recUserId === curUserId);
  });

  if (myDataCountEl) myDataCountEl.textContent = bnInt(myRecords.length);
  if (allDataCountEl) allDataCountEl.textContent = bnInt(records.length);

  const isAdmin = currentUser.role === 'Admin';

  if (!isAdmin) {
    // STANDARD USER: STRICT OWN-DATA ONLY PRIVACY ACCESS
    userFilterMode = 'my';
    if (filterMyDataBtn) {
      filterMyDataBtn.style.display = 'inline-flex';
      filterMyDataBtn.classList.add('active');
    }
    if (filterAllDataBtn) {
      filterAllDataBtn.style.display = 'none'; // Hide All Data button for non-admins
    }
    if (noticeEl) {
      noticeEl.innerHTML = `🔒 <strong>প্রাইভেট এক্সেস:</strong> ইউজার: <strong>${currentUser.name}</strong> (${currentUser.role}) — আপনার সংরক্ষিত (${bnInt(myRecords.length)} টি) ডাটা প্রদর্শিত হচ্ছে`;
    }
    return myRecords;
  } else {
    // ADMIN USER: CAN VIEW SYSTEM ALL DATA
    if (filterMyDataBtn) {
      filterMyDataBtn.style.display = 'inline-flex';
      if (userFilterMode === 'my') filterMyDataBtn.classList.add('active');
      else filterMyDataBtn.classList.remove('active');
    }
    if (filterAllDataBtn) {
      filterAllDataBtn.style.display = 'inline-flex';
      if (userFilterMode === 'all') filterAllDataBtn.classList.add('active');
      else filterAllDataBtn.classList.remove('active');
    }

    if (userFilterMode === 'my') {
      if (noticeEl) noticeEl.innerHTML = `👑 <strong>এডমিন কন্ট্রোল:</strong> আপনার নিজস্ব ডাটা (${bnInt(myRecords.length)} টি) প্রদর্শিত হচ্ছে`;
      return myRecords;
    } else {
      if (noticeEl) noticeEl.innerHTML = `🌐 <strong>এডমিন কন্ট্রোল:</strong> সিস্টেমে সমস্ত নিবন্ধিত ইউজারের মোট (${bnInt(records.length)} টি) ডাটা দেখানো হচ্ছে`;
      return records;
    }
  }
}

async function loadAll(){
  try{
    const listRes=await storage.list('holding:',false);
    const keys=(listRes&&listRes.keys)||[];
    const records=[];
    for(const k of keys){
      try{ const r=await storage.get(k,false); if(r&&r.value) records.push(JSON.parse(r.value)); }catch(e){}
    }
    allRecords=records;
    refreshListDisplay();
    document.getElementById('searchBox').value='';
  }catch(err){
    console.error(err);
    holdingsList.innerHTML=`<div class="empty"><div class="empty-icon">⚠️</div><strong>তথ্য লোড ব্যর্থ</strong></div>`;
  }
}

// INITIALIZE USER SESSION FIRST BEFORE LOADING DATA
initUserAuth();
dagRows=[newDagRow()];
renderDagTable();
loadAll();

function renderUserProfileWidget() {
  const widget = document.getElementById('userProfileWidget');
  if (!widget) return;

  if (currentUser) {
    const initial = (currentUser.name || 'U').charAt(0).toUpperCase();
    widget.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <div class="user-badge-card" id="btnOpenProfileModal" title="ইউজার প্রোফাইল ও একাউন্ট দেখুন">
          <div class="user-avatar-mini">${initial}</div>
          <div class="user-badge-info">
            <span class="user-name-text">${currentUser.name}</span>
            <span class="user-role-badge">${currentUser.role}</span>
          </div>
        </div>
        <button class="btn danger btn-sm" id="btnHeaderQuickLogout" type="button" title="লগআউট করুন" style="padding:4px 10px; font-size:11.5px; border-radius:14px;">
          লগআউট
        </button>
      </div>
    `;
    const btnProfile = document.getElementById('btnOpenProfileModal');
    if (btnProfile) {
      btnProfile.addEventListener('click', openUserProfileModal);
    }
    const btnQuickLogout = document.getElementById('btnHeaderQuickLogout');
    if (btnQuickLogout) {
      btnQuickLogout.addEventListener('click', (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        logoutUser();
      });
    }
  } else {
    widget.innerHTML = `
      <button class="btn btn-auth-login" id="btnOpenAuthModal">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>ইউজার লগইন</span>
      </button>
    `;
    const btnLogin = document.getElementById('btnOpenAuthModal');
    if (btnLogin) {
      btnLogin.addEventListener('click', openAuthModal);
    }
  }
}

function requireUserAuth(actionName = 'কাজটি সম্পন্ন করতে') {
  if (currentUser) return true;
  toast(`🔒 ${actionName} প্রথমে অফিশিয়াল ইউজার হিসেবে লগইন করুন!`, 'warning');
  openAuthModal();
  return false;
}

function openAuthModal() {
  const authModal = document.getElementById('authModal');
  if (authModal) authModal.classList.add('open');
  switchAuthTab('login');
}

function closeAuthModal() {
  const authModal = document.getElementById('authModal');
  if (authModal) authModal.classList.remove('open');
}

function switchAuthTab(tab) {
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginFormPanel = document.getElementById('loginFormPanel');
  const registerFormPanel = document.getElementById('registerFormPanel');
  const authModalTitle = document.getElementById('authModalTitle');

  if (tab === 'login') {
    if (tabLoginBtn) tabLoginBtn.classList.add('active');
    if (tabRegisterBtn) tabRegisterBtn.classList.remove('active');
    if (loginFormPanel) loginFormPanel.style.display = 'block';
    if (registerFormPanel) registerFormPanel.style.display = 'none';
    if (authModalTitle) authModalTitle.textContent = 'LMAP প্রফেশনাল ইউজার পোর্টাল';
  } else {
    if (tabLoginBtn) tabLoginBtn.classList.remove('active');
    if (tabRegisterBtn) tabRegisterBtn.classList.add('active');
    if (loginFormPanel) loginFormPanel.style.display = 'none';
    if (registerFormPanel) registerFormPanel.style.display = 'block';
    if (authModalTitle) authModalTitle.textContent = 'নতুন ইউজার একাউন্ট রেজিস্ট্রেশন';
  }
}

async function loginUser(username, password, role) {
  if (!username || !username.trim()) {
    toast('ইউজার আইডি ইনপুট দিন', 'error');
    return;
  }

  const uClean = username.trim().toLowerCase();
  let existingUser = registeredUsersDB.find(u => u.username.toLowerCase() === uClean);
  
  if (existingUser) {
    if (password && existingUser.passwordHash) {
      const pHash = await hashPassword(password);
      if (pHash !== existingUser.passwordHash) {
        toast('ভুল পাসওয়ার্ড ইনপুট দেওয়া হয়েছে', 'error');
        return;
      }
    }
    currentUser = { ...existingUser };
  } else {
    let displayName = username.trim();
    if (displayName.includes('@')) displayName = displayName.split('@')[0];
    displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    const pHash = await hashPassword(password);
    currentUser = {
      id: 'usr_' + Date.now(),
      username: username.trim(),
      name: displayName,
      role: role || 'DMF',
      office: 'উপজেলা ভূমি অফিস',
      passwordHash: pHash,
      createdAt: new Date().toISOString()
    };
    registeredUsersDB.push(currentUser);
    localStorage.setItem('lmap_users_db', JSON.stringify(registeredUsersDB));
  }

  localStorage.setItem('lmap_active_user', JSON.stringify(currentUser));
  userFilterMode = 'my';
  renderUserProfileWidget();
  closeAuthModal();
  refreshListDisplay();
  toast(`স্বাগতম ${currentUser.name}! প্রাইভেট সেশন সিকিউরভাবে লগইন হয়েছে 🔒`, 'success');
}

async function registerUser(fullName, username, password, role, office) {
  if (!fullName.trim() || !username.trim() || !password.trim()) {
    toast('সকল প্রয়োজনীয় তথ্য পূরণ করুন', 'error');
    return;
  }

  const uClean = username.trim().toLowerCase();
  const exists = registeredUsersDB.some(u => u.username.toLowerCase() === uClean);
  if (exists) {
    toast('এই ইউজার আইডিটি ইতিমধ্যেই নিবন্ধিত রয়েছে', 'error');
    return;
  }

  const pHash = await hashPassword(password);
  const newUser = {
    id: 'usr_' + Date.now(),
    username: username.trim(),
    name: fullName.trim(),
    role: role || 'DMF',
    office: office.trim() || 'উপজেলা ভূমি অফিস',
    passwordHash: pHash,
    createdAt: new Date().toISOString()
  };

  registeredUsersDB.push(newUser);
  localStorage.setItem('lmap_users_db', JSON.stringify(registeredUsersDB));

  currentUser = newUser;
  localStorage.setItem('lmap_active_user', JSON.stringify(currentUser));
  userFilterMode = 'my';
  renderUserProfileWidget();
  closeAuthModal();
  refreshListDisplay();
  toast(`অভিনন্দন ${newUser.name}! আপনার প্রাইভেট একাউন্ট নিবন্ধিত হয়েছে 🔒`, 'success');
}

function logoutUser() {
  try {
    if (typeof logAuditActivity === 'function') {
      logAuditActivity('ইউজার লগআউট', currentUser ? `${currentUser.name} সফলভাবে লগআউট করেছেন` : '');
    }
  } catch (e) {}

  currentUser = null;
  userFilterMode = 'my';

  try {
    localStorage.removeItem('lmap_active_user');
    sessionStorage.clear();
  } catch (e) {}

  try {
    renderUserProfileWidget();
  } catch (e) {}

  try {
    closeUserProfileModal();
  } catch (e) {}

  try {
    refreshListDisplay();
  } catch (e) {}

  toast('সফলভাবে লগআউট করা হয়েছে 🚪', 'info');
}

/* ── USER PROFILE VIEW & EDIT CONTROLLER ── */
function openUserProfileModal() {
  if (!currentUser) {
    openAuthModal();
    return;
  }

  const profileModal = document.getElementById('userProfileModal');
  if (profileModal) profileModal.classList.add('open');

  showProfileViewSection();

  // Populate Profile View
  const initial = (currentUser.name || 'U').charAt(0).toUpperCase();
  document.getElementById('profileAvatarLarge').textContent = initial;
  document.getElementById('profileViewName').textContent = currentUser.name || 'ইউজার';
  document.getElementById('profileViewRole').textContent = currentUser.role || 'DMF';
  document.getElementById('profileViewOffice').textContent = currentUser.office || 'উপজেলা ভূমি অফিস';
  document.getElementById('profileViewUsername').textContent = currentUser.username || '—';

  // Calculate User Stats
  const userHoldings = allRecords.filter(r => r.createdBy && r.createdBy.username === currentUser.username);
  let totalPlots = 0;
  let totalArea = 0;

  userHoldings.forEach(r => {
    if (r.dagRows) totalPlots += r.dagRows.length;
    const t = holdingTotals(r);
    totalArea += t.area;
  });

  document.getElementById('pstatHoldingsCount').textContent = bnInt(userHoldings.length);
  document.getElementById('pstatPlotsCount').textContent = bnInt(totalPlots);
  document.getElementById('pstatAreaCount').textContent = bnNum(cleanDecimal(totalArea));
}

function closeUserProfileModal() {
  const profileModal = document.getElementById('userProfileModal');
  if (profileModal) profileModal.classList.remove('open');
}

function showProfileViewSection() {
  document.getElementById('profileViewSection').style.display = 'block';
  document.getElementById('profileEditSection').style.display = 'none';
}

function showProfileEditSection() {
  document.getElementById('profileViewSection').style.display = 'none';
  document.getElementById('profileEditSection').style.display = 'block';

  // Populate Edit Fields
  document.getElementById('editFullName').value = currentUser.name || '';
  const editUserEl = document.getElementById('editUsername');
  if (editUserEl) editUserEl.value = currentUser.username || '';
  document.getElementById('editRole').value = currentUser.role || 'DMF';
  document.getElementById('editOffice').value = currentUser.office || '';
  document.getElementById('editPassword').value = '';
}

async function saveProfileEdit() {
  const name = document.getElementById('editFullName').value.trim();
  const username = document.getElementById('editUsername').value.trim();
  const role = document.getElementById('editRole').value;
  const office = document.getElementById('editOffice').value.trim();
  const pwd = document.getElementById('editPassword').value;

  if (!name) {
    toast('ইউজারের পূর্ণ নাম আবশ্যক', 'error');
    return;
  }
  if (!username) {
    toast('ইউজার আইডি/ইমেইল আবশ্যক', 'error');
    return;
  }

  const oldUsername = currentUser.username;
  const newUsername = username;

  if (newUsername.toLowerCase() !== oldUsername.toLowerCase()) {
    const exists = registeredUsersDB.some(u => u.id !== currentUser.id && u.username.toLowerCase() === newUsername.toLowerCase());
    if (exists) {
      toast('এই ইউজার আইডিটি অন্য একাউন্টে ব্যবহৃত হচ্ছে', 'error');
      return;
    }
    currentUser.username = newUsername;

    // Migrate user's saved holdings to new username
    for (let r of allRecords) {
      if (r.createdBy && (r.createdBy.username === oldUsername || r.createdBy.id === currentUser.id)) {
        r.createdBy.username = newUsername;
        r.createdBy.name = name;
        r.createdBy.role = role;
        r.createdBy.office = office;
        try {
          await storage.set('holding:' + r.id, JSON.stringify(r));
        } catch (e) {}
      }
    }
  }

  currentUser.name = name;
  currentUser.role = role;
  currentUser.office = office || 'উপজেলা ভূমি অফিস';

  if (pwd && pwd.trim()) {
    currentUser.passwordHash = await hashPassword(pwd.trim());
  }

  // Update active user and database
  localStorage.setItem('lmap_active_user', JSON.stringify(currentUser));
  const idx = registeredUsersDB.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) {
    registeredUsersDB[idx] = { ...currentUser };
    localStorage.setItem('lmap_users_db', JSON.stringify(registeredUsersDB));
  }

  renderUserProfileWidget();
  showProfileViewSection();
  openUserProfileModal();
  refreshListDisplay();
  toast('ইউজার প্রোফাইল ও ইউজার আইডি সফলভাবে আপডেট করা হয়েছে ✓', 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  initUserAuth();

  const closeAuthBtn = document.getElementById('closeAuthBtn');
  if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthModal);

  const closeProfileBtn = document.getElementById('closeProfileBtn');
  if (closeProfileBtn) closeProfileBtn.addEventListener('click', closeUserProfileModal);

  const tabLoginBtn = document.getElementById('tabLoginBtn');
  if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));

  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));

  const authLoginForm = document.getElementById('authLoginForm');
  if (authLoginForm) {
    const handleLogin = (e) => {
      if (e) e.preventDefault();
      const uInp = document.getElementById('authUsername');
      const pInp = document.getElementById('authPassword');
      const rInp = document.getElementById('authRole');
      loginUser(uInp.value, pInp.value, rInp.value);
    };
    authLoginForm.addEventListener('submit', handleLogin);
    const btnLoginSubmit = document.getElementById('btnLoginSubmit');
    if (btnLoginSubmit) btnLoginSubmit.addEventListener('click', handleLogin);
  }

  const authRegisterForm = document.getElementById('authRegisterForm');
  if (authRegisterForm) {
    const handleRegister = (e) => {
      if (e) e.preventDefault();
      const fInp = document.getElementById('regFullName');
      const uInp = document.getElementById('regUsername');
      const pInp = document.getElementById('regPassword');
      const rInp = document.getElementById('regRole');
      const oInp = document.getElementById('regOffice');
      registerUser(fInp.value, uInp.value, pInp.value, rInp.value, oInp.value);
    };
    authRegisterForm.addEventListener('submit', handleRegister);
    const btnRegisterSubmit = document.getElementById('btnRegisterSubmit');
    if (btnRegisterSubmit) btnRegisterSubmit.addEventListener('click', handleRegister);
  }

  const btnEditProfileOpen = document.getElementById('btnEditProfileOpen');
  if (btnEditProfileOpen) btnEditProfileOpen.addEventListener('click', showProfileEditSection);

  const btnCancelProfileEdit = document.getElementById('btnCancelProfileEdit');
  if (btnCancelProfileEdit) btnCancelProfileEdit.addEventListener('click', showProfileViewSection);

  const editProfileForm = document.getElementById('editProfileForm');
  if (editProfileForm) {
    const handleEditSave = (e) => {
      if (e) e.preventDefault();
      saveProfileEdit();
    };
    editProfileForm.addEventListener('submit', handleEditSave);
    const btnSaveProfileSubmit = document.getElementById('btnSaveProfileSubmit');
    if (btnSaveProfileSubmit) btnSaveProfileSubmit.addEventListener('click', handleEditSave);
  }

  const btnProfileLogout = document.getElementById('btnProfileLogout');
  if (btnProfileLogout) btnProfileLogout.addEventListener('click', logoutUser);

  // Extra Enterprise Features Event Listeners
  const btnOpenAnalyticsModal = document.getElementById('btnOpenAnalyticsModal');
  if (btnOpenAnalyticsModal) btnOpenAnalyticsModal.addEventListener('click', openAnalyticsModal);

  const closeAnalyticsBtn = document.getElementById('closeAnalyticsBtn');
  if (closeAnalyticsBtn) closeAnalyticsBtn.addEventListener('click', closeAnalyticsModal);

  const btnOpenAuditLogModal = document.getElementById('btnOpenAuditLogModal');
  if (btnOpenAuditLogModal) btnOpenAuditLogModal.addEventListener('click', openAuditLogModal);

  const closeAuditLogBtn = document.getElementById('closeAuditLogBtn');
  if (closeAuditLogBtn) closeAuditLogBtn.addEventListener('click', closeAuditLogModal);

  const btnExportJsonBackup = document.getElementById('btnExportJsonBackup');
  if (btnExportJsonBackup) btnExportJsonBackup.addEventListener('click', exportJsonBackup);

  const importJsonBackupFile = document.getElementById('importJsonBackupFile');
  if (importJsonBackupFile) {
    importJsonBackupFile.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        importJsonBackup(e.target.files[0]);
      }
    });
  }
});

/* ── AUDIT LOGGING ENGINE ── */
let auditLogsDB = [];

function initAuditLog() {
  try {
    const str = localStorage.getItem('lmap_audit_log');
    if (str) auditLogsDB = JSON.parse(str);
    else auditLogsDB = [];
  } catch (e) {
    auditLogsDB = [];
  }
}

function logAuditActivity(actionName, details = '') {
  initAuditLog();
  const entry = {
    id: 'log_' + Date.now(),
    time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date: new Date().toLocaleDateString('bn-BD'),
    user: currentUser ? currentUser.name : 'অজ্ঞাত ভিজিটর',
    role: currentUser ? currentUser.role : 'Guest',
    action: actionName,
    details: details
  };
  auditLogsDB.unshift(entry);
  if (auditLogsDB.length > 100) auditLogsDB.pop();
  try {
    localStorage.setItem('lmap_audit_log', JSON.stringify(auditLogsDB));
  } catch (e) {}
}

function openAuditLogModal() {
  initAuditLog();
  const modal = document.getElementById('auditLogModal');
  if (modal) modal.classList.add('open');

  const listEl = document.getElementById('auditLogList');
  if (!listEl) return;

  if (auditLogsDB.length === 0) {
    listEl.innerHTML = `<div class="empty"><div class="empty-icon">📜</div><strong>কোনো অ্যাক্টিভিটি লগ নেই</strong></div>`;
    return;
  }

  listEl.innerHTML = auditLogsDB.map(log => `
    <div class="audit-item">
      <div class="audit-item-head">
        <span>${log.action}</span>
        <span class="audit-item-time">${log.date} ${log.time}</span>
      </div>
      <div class="audit-item-desc">ইউজার: <strong>${log.user}</strong> (${log.role}) — ${log.details}</div>
    </div>
  `).join('');
}

function closeAuditLogModal() {
  const modal = document.getElementById('auditLogModal');
  if (modal) modal.classList.remove('open');
}

/* ── DATA ANALYTICS CONTROLLER ── */
function openAnalyticsModal() {
  const modal = document.getElementById('analyticsModal');
  if (modal) modal.classList.add('open');

  const visibleRecords = applyUserFilter(allRecords);

  let totalHoldings = visibleRecords.length;
  let khatians = new Set();
  let totalPlots = 0;
  let totalArea = 0;
  let totalKorton = 0;
  let totalRemain = 0;

  visibleRecords.forEach(r => {
    if (r.khatian) khatians.add(r.khatian);
    if (r.dagRows) totalPlots += r.dagRows.length;
    const t = holdingTotals(r);
    totalArea += t.area;
    totalKorton += t.korton;
    totalRemain += t.remain;
  });

  const avgKortonPct = totalArea > 0 ? ((totalKorton / totalArea) * 100).toFixed(1) : 0;

  document.getElementById('statTotHoldings').textContent = bnInt(totalHoldings);
  document.getElementById('statTotKhatian').textContent = bnInt(khatians.size);
  document.getElementById('statTotPlots').textContent = bnInt(totalPlots);
  document.getElementById('statTotArea').textContent = bnNum(cleanDecimal(totalArea));
  document.getElementById('statTotKorton').textContent = bnNum(cleanDecimal(totalKorton)) + ' শতক';
  document.getElementById('statTotRemain').textContent = bnNum(cleanDecimal(totalRemain)) + ' শতক';
  document.getElementById('statAvgKortonPct').textContent = bnNum(avgKortonPct) + '%';
}

function closeAnalyticsModal() {
  const modal = document.getElementById('analyticsModal');
  if (modal) modal.classList.remove('open');
}

/* ── SYSTEM JSON BACKUP & RESTORE ── */
function exportJsonBackup() {
  if (!requireUserAuth('সিস্টেম ব্যাকআপ এক্সপোর্ট করতে')) return;
  const backupData = {
    version: 'LMAP-4.5',
    exportDate: new Date().toISOString(),
    exportedBy: currentUser,
    holdings: allRecords,
    usersDB: registeredUsersDB
  };
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LMAP_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  logAuditActivity('সিস্টেম ব্যাকআপ এক্সপোর্ট', 'JSON ব্যাকআপ ফাইল ডাউনলোড করা হয়েছে');
  toast('সিস্টেম ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে ✓', 'success');
}

function importJsonBackup(file) {
  if (!requireUserAuth('ব্যাকআপ রিস্টোর করতে')) return;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.holdings && Array.isArray(data.holdings)) {
        for (const h of data.holdings) {
          if (h.id) {
            await storage.set('holding:' + h.id, JSON.stringify(h));
          }
        }
        if (data.usersDB && Array.isArray(data.usersDB)) {
          localStorage.setItem('lmap_users_db', JSON.stringify(data.usersDB));
        }
        await loadAll();
        logAuditActivity('ব্যাকআপ রিস্টোর', `JSON ব্যাকআপ থেকে ${data.holdings.length} টি হোল্ডিং রিস্টোর করা হয়েছে`);
        toast(`সাফল্যের সাথে ${data.holdings.length} টি হোল্ডিং রিস্টোর করা হয়েছে 🎉`, 'success');
      } else {
        toast('অবৈধ ব্যাকআপ ফাইল ফরম্যাট', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('ব্যাকআপ ফাইল রিড করতে সমস্যা হয়েছে', 'error');
    }
  };
  reader.readAsText(file);
}

/* ── KEYBOARD SHORTCUTS CONTROLLER ── */
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (requireUserAuth('ডাটা সংরক্ষণ করতে')) saveHolding();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    const searchBox = document.getElementById('searchBox');
    if (searchBox) searchBox.focus();
  } else if (e.key === 'Escape') {
    closeAuthModal();
    closeUserProfileModal();
    closeAnalyticsModal();
    closeAuditLogModal();
  }
});