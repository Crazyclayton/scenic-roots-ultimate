// Minimal state bridge — adapt to your existing structures as needed.
const QUOTER = window.QUOTER || (window.QUOTER = {
  lines: [], // [{id, description, unit, qty, unitCost, crewHrs, rateHr, areaPhotos:[{src,dataUrl,caption}], tags:[] }]
  settings: { targetProfitPct: 25, overheadPct: 10, blendedCrewRate: 55 },
  business: { name: "Scenic Roots Lawn Care & Landscaping", phone:"615-308-8477", email:"info@scenicroots.net", primaryColor:"#1c7c3e" },
  client: { name:"", address:"" }
});

async function loadAddons() {
  if (window._ADDONS) return window._ADDONS;
  const resp = await fetch('data/addons.json', {cache:'no-store'});
  window._ADDONS = await resp.json();
  return window._ADDONS;
}

function ensureAddonsBar() {
  if (document.getElementById('addons-bar')) return;
  const host = document.querySelector('#quick-add, #addons-host, .quick-add, .toolbar') || document.body;
  const bar = document.createElement('div');
  bar.id = 'addons-bar';
  bar.innerHTML = `
    <link rel="stylesheet" href="styles/quoter-upgrades.css"/>
    <select id="addon-select"><option value="">Add‑on catalog…</option></select>
    <input id="addon-qty" type="number" min="1" value="1" style="width:72px" />
    <button id="addon-add">Add</button>
    <button id="addon-reco">Recommend</button>
    <div id="addons-chips"></div>
  `;
  host.parentNode.insertBefore(bar, host);
}

function addLineFromAddon(item, qty=1) {
  // You likely have your own add‑line function; call it here instead.
  const line = {
    id: crypto.randomUUID(),
    description: item.label,
    unit: item.unit,
    qty: Number(qty),
    unitCost: 0,   // if you store cost, set it here. Revenue set via unit price below.
    rateHr: QUOTER.settings.blendedCrewRate,
    priceEach: item.price,
    areaPhotos: [], // attach later
    tags: ['addon']
  };
  QUOTER.lines.push(line);
  renderAddonChips();
  if (window.renderLinesTable) window.renderLinesTable(QUOTER.lines);
}

function renderAddonChips() {
  const wrap = document.querySelector('#addons-chips');
  if (!wrap) return;
  wrap.innerHTML = '';
  QUOTER.lines.filter(l => l.tags?.includes('addon')).forEach(l => {
    const chip = document.createElement('span');
    chip.className = 'addon-chip';
    chip.innerHTML = `${l.description} × ${l.qty} <span class="remove" title="remove">×</span>`;
    chip.querySelector('.remove').onclick = () => {
      QUOTER.lines = QUOTER.lines.filter(x => x.id !== l.id);
      renderAddonChips();
      if (window.renderLinesTable) window.renderLinesTable(QUOTER.lines);
    };
    wrap.appendChild(chip);
  });
}

async function initAddons() {
  ensureAddonsBar();
  const data = await loadAddons();
  const sel = document.getElementById('addon-select');
  sel.innerHTML = '<option value="">Add‑on catalog…</option>';
  data.categories.forEach(cat => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = cat.name;
    cat.items.forEach(it => {
      const opt = document.createElement('option');
      opt.value = it.id;
      opt.textContent = `${it.label} — ${it.unit} @ $${it.price}`;
      optgroup.appendChild(opt);
    });
    sel.appendChild(optgroup);
  });
  document.getElementById('addon-add').onclick = () => {
    const id = sel.value; if (!id) return;
    const qty = document.getElementById('addon-qty').value || 1;
    const item = data.categories.flatMap(c=>c.items).find(i=>i.id===id);
    addLineFromAddon(item, qty);
  };
  document.getElementById('addon-reco').onclick = () => showRecommendations();
}

function inferContext() {
  // Very light heuristic — customize with your app's fields
  const text = QUOTER.lines.map(l=>l.description.toLowerCase()).join(' ');
  return {
    hasBeds: /(mulch|bed|shrub|hedge|pine straw|edge)/.test(text),
    hasLawn: /(mow|lawn|sod|seed|aerate|level)/.test(text),
    heavyLeaves: /(leaf|leaves)/.test(text),
  };
}

async function showRecommendations() {
  const data = await loadAddons();
  const ctx = inferContext();
  const recs = [];
  if (ctx.hasBeds) {
    recs.push({title:'Bed Care', items:['bed-pre','edge-cut','mulch']});
  }
  if (ctx.hasLawn) {
    recs.push({title:'Lawn Health', items:['fert-app','lawn-leveling']});
  }
  if (ctx.heavyLeaves) {
    recs.push({title:'Cleanup', items:['leaf-clean','storm-debris']});
  }
  // Always propose a seasonal bundle
  recs.push({title:'Seasonal Bundle', items:data.bundles[0].items, bundle:data.bundles[0]});

  let panel = document.getElementById('recommendations');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'recommendations';
    document.getElementById('addons-bar').after(panel);
  }
  panel.innerHTML = '';
  recs.forEach(r => {
    const card = document.createElement('div');
    card.className = 'card';
    const items = r.items.map(id => data.categories.flatMap(c=>c.items).find(i=>i.id===id)).filter(Boolean);
    const total = items.reduce((s,i)=>s+i.price,0);
    const discount = r.bundle?.bundleDiscountPct ? Math.round(total*(r.bundle.bundleDiscountPct/100)) : 0;
    const net = total - discount;
    card.innerHTML = `
      <strong>${r.title}</strong>
      <div class="smallmute">${items.map(i=>i.label).join(' • ')}</div>
      <div><span class="badge">$${net}${discount?` (−${r.bundle.bundleDiscountPct}% bundle)`:''}</span></div>
      <button class="apply">Add These</button>
    `;
    card.querySelector('.apply').onclick = () => {
      items.forEach(i => addLineFromAddon(i, 1));
      renderAddonChips();
    };
    panel.appendChild(card);
  });
}

// -------- Attach photos to a line & Client Proposal rendering ----------
function fileToDataURL(file){
  return new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onload=e=>res(e.target.result);
    fr.onerror=rej;
    fr.readAsDataURL(file);
  });
}

// Hook up to your existing "Upload Photos" chooser; fallback creates a field here
function ensurePhotoHook(){
  let input = document.getElementById('area-photo-input');
  if(!input){
    input = document.createElement('input');
    input.type='file'; input.accept='image/*'; input.multiple=true; input.id='area-photo-input';
    const anchor = document.querySelector('#photos-host, #client-options, #addons-bar') || document.body;
    anchor.after(input);
  }
  input.onchange = async (e)=>{
    const files=[...e.target.files];
    if(!files.length) return;
    // attach photos to the LAST non‑addon line or create a placeholder line
    let line = [...QUOTER.lines].reverse().find(l=>!l.tags?.includes('addon'));
    if(!line){ line = {id:crypto.randomUUID(), description:'Area Photo', unit:'ea', qty:1, priceEach:0, areaPhotos:[]}; QUOTER.lines.push(line); }
    for(const f of files){
      line.areaPhotos = line.areaPhotos || [];
      line.areaPhotos.push({src:f.name, dataUrl: await fileToDataURL(f)});
    }
    if (window.renderLinesTable) window.renderLinesTable(QUOTER.lines);
  };
}

// Money helpers
function money(n){ return `$${(Math.round(n*100)/100).toFixed(2)}`; }
function lineSubtotal(l){ const rev = (l.qty||0) * (l.priceEach||0); return rev; }

function renderClientProposal(){
  const host = document.getElementById('client-proposal');
  host.style.display='block';
  const color = QUOTER.business.primaryColor || '#1c7c3e';
  const lines = QUOTER.lines.filter(l=> (l.qty||0)>0 || (l.areaPhotos&&l.areaPhotos.length));
  const total = lines.reduce((s,l)=>s+lineSubtotal(l),0);
  host.innerHTML = `
    <div class="cp-header">
      <div>
        <h2 style="margin:0">${QUOTER.business.name}</h2>
        <div class="smallmute">${QUOTER.business.phone} • ${QUOTER.business.email}</div>
      </div>
      <div><span class="badge" style="border-color:${color}; background-color:${color}20">Client Proposal</span></div>
    </div>
    <div class="smallmute">Client: <strong>${QUOTER.client.name||''}</strong> &nbsp; • &nbsp; ${QUOTER.client.address||''}</div>
    <div class="cp-grid" id="cp-grid"></div>
    <div class="cp-total">Project Total (before tax): ${money(total)}</div>
  `;
  const grid = host.querySelector('#cp-grid');
  lines.forEach(l=>{
    const card = document.createElement('div'); card.className='cp-card';
    const photos = (l.areaPhotos||[]).map(p=>`<img src="${p.dataUrl}" alt="area photo">`).join('');
    card.innerHTML = `
      <div style="font-weight:600">${l.description}</div>
      <div class="smallmute">${l.qty||1} × ${l.unit||'ea'} @ ${l.priceEach?money(l.priceEach):'$—'}</div>
      ${photos?`<div class="photos">${photos}</div>`:''}
      <div class="cp-line"><span>Line Subtotal</span><span>${money(lineSubtotal(l))}</span></div>
    `;
    grid.appendChild(card);
  });
}

// ---------- Export (PDF/PNG) using the client view ----------
async function exportClientAsPNG(){
  const el = document.getElementById('client-proposal');
  if(el.style.display==='none') renderClientProposal();
  const canvas = await html2canvas(el, {scale: 2, backgroundColor: '#ffffff'});
  const data = canvas.toDataURL('image/png');
  // trigger download
  const a = document.createElement('a'); a.href = data; a.download = 'client-proposal.png'; a.click();
  return data;
}

async function exportClientAsPDF(){
  const el = document.getElementById('client-proposal');
  if(el.style.display==='none') renderClientProposal();
  const canvas = await html2canvas(el, {scale: 2, backgroundColor: '#ffffff'});
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({orientation:'p', unit:'pt', format:'a4'});
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  // fit width
  const ratio = canvas.width / canvas.height;
  const width = pageWidth - 40, height = width / ratio;
  pdf.addImage(imgData, 'PNG', 20, 20, width, height);
  pdf.save('client-proposal.pdf');
  return pdf;
}

// ---------- Public initializer ----------
window.QuoterUpgrades = {
  async mount(){
    await initAddons();
    ensurePhotoHook();
    // Wire to your existing buttons if they exist
    const btnClient = document.querySelector('button#client-proposal-btn, button[aria-label="Client Proposal"], button:contains("Client Proposal")');
    const btnPNG = document.querySelector('button#export-png, button:contains("Export PNG")');
    const btnPDF = document.querySelector('button#export-pdf, button:contains("Export PDF")');
    if (btnClient) btnClient.addEventListener('click', renderClientProposal);
    if (btnPNG) btnPNG.addEventListener('click', exportClientAsPNG);
    if (btnPDF) btnPDF.addEventListener('click', exportClientAsPDF);
  },
  renderClientProposal,
  exportClientAsPDF,
  exportClientAsPNG,
  addLineFromAddon
};
