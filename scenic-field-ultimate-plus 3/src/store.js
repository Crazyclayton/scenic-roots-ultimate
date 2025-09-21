import create from 'zustand'
const persisted = (key, initial) => { const raw = localStorage.getItem(key); let state = initial; try{ if(raw) state = JSON.parse(raw) }catch{}; const save = (val)=>localStorage.setItem(key, JSON.stringify(val)); return [state, save] }

const [initQuotes, saveQuotes] = persisted('quotes', [])
const [initJobs, saveJobs] = persisted('jobs', [])
const [initLogs, saveLogs] = persisted('timelogs', [])
const [initMaterials, saveMaterials] = persisted('materials', [
  { id:'mulch', name:'Mulch (yd)', price:70 },
  { id:'topsoil', name:'Topsoil (yd)', price:80 },
  { id:'riprap', name:'Riprap (ton)', price:45 },
  { id:'#57', name:'#57 Gravel (ton)', price:42 },
])
const [initSettings, saveSettings] = persisted('settings', {
  company:'Scenic Roots Lawn Care & Landscaping',
  phone:'615-308-8477',
  website:'scenicroots.net',
  wages:{ lead:20, hand:20, helper:15 },
  profitTarget:0.25,
  jaysFee:{ enabled:true, threshold:1200, percent:0.33 },
  tiers:[
    { id:'bronze', name:'Bronze', discount:0.05 },
    { id:'silver', name:'Silver', discount:0.10 },
    { id:'gold', name:'Gold', discount:0.15 }
  ],
  templates:[
    { id:'basic-land', label:'Basic Landscaping (Bed Refresh)', laborHours:3, mats:[{name:'Mulch (yd)', qty:2, unitPrice:70}] },
    { id:'standard-land', label:'Standard Landscaping (Refresh + Topsoil & Level)', laborHours:4.5, mats:[{name:'Mulch (yd)', qty:3, unitPrice:70},{name:'Topsoil (yd)', qty:1, unitPrice:80}] },
    { id:'premium-land', label:'Premium Landscaping (Redesign + #57 Decorative)', laborHours:6.5, mats:[{name:'Mulch (yd)', qty:3, unitPrice:70},{name:'Topsoil (yd)', qty:2, unitPrice:80},{name:'#57 Gravel (ton)', qty:1, unitPrice:42}] },
    { id:'basic-lawn', label:'Basic Lawn Care (Bi-weekly mow + trim + blow)', laborHours:1.5, mats:[] },
    { id:'standard-lawn', label:'Standard Lawn Care (Weekly mow + trim + edging + blow)', laborHours:2.5, mats:[] },
    { id:'premium-lawn', label:'Premium Lawn Care (Weekly mow + edging + blow + spot spray)', laborHours:4, mats:[] }
  ],
  seasonal: [
    '🍁 Fall Clean-up Special — Leaf removal & bed refresh',
    '❄️ Winter Pruning — Shrubs & small trees',
    '🌱 Spring Pre-emergent — Weed control kickoff',
    '☀️ Summer Mulch — Moisture retention & curb appeal'
  ],
  sop: {
    addonsHint: 'Edging • Bed reshape • Mulch top-dress • Sod patch • Gutter clean • Downspout extensions',
    yardHealthPrompt: 'Grass thickness, thatch/compaction, weed presence, irrigation coverage, disease/insect signs',
    problemsPrompt: 'Drainage pooling, erosion, trip hazards, bare spots, low areas, downspout discharge'
  },
  clientMode: false
})

const useStore = create((set, get)=>({
  quotes:initQuotes, jobs:initJobs, timelogs:initLogs, materials:initMaterials, settings:initSettings, toast:null,
  setToast:(m)=>{ set({toast:m}); setTimeout(()=>set({toast:null}), 2200) },

  addQuote:(q)=>{ const list=[...get().quotes, q]; set({quotes:list}); saveQuotes(list) },
  updateQuote:(id, patch)=>{ const list=get().quotes.map(q=>q.id===id?{...q,...patch}:q); set({quotes:list}); saveQuotes(list) },
  removeQuote:(id)=>{ const list=get().quotes.filter(q=>q.id!==id); set({quotes:list}); saveQuotes(list) },

  addJob:(j)=>{ const list=[...get().jobs, j]; set({jobs:list}); saveJobs(list) },
  completeJob:(id)=>{ const list=get().jobs.map(j=>j.id===id?{...j,status:'done'}:j); set({jobs:list}); saveJobs(list) },

  clockIn:(crew)=>{ const log={ id:crypto.randomUUID(), crew, start:Date.now(), end:null, note:'' }; const list=[...get().timelogs, log]; set({timelogs:list}); saveLogs(list); get().setToast('Clocked in') },
  clockOut:()=>{ const list=[...get().timelogs]; for(let i=list.length-1;i>=0;i--){ if(!list[i].end){ list[i].end=Date.now(); break } } set({timelogs:list}); saveLogs(list); get().setToast('Clocked out') },

  setMaterials:(list)=>{ set({materials:list}); saveMaterials(list) },
  setSettings:(s)=>{ set({settings:s}); saveSettings(s) },
  toggleClientMode:()=>{ const s={...get().settings, clientMode:!get().settings.clientMode}; set({settings:s}); saveSettings(s) },

  exportJSON:()=>{ const data={ quotes:get().quotes, jobs:get().jobs, timelogs:get().timelogs, materials:get().materials, settings:get().settings }; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='scenic-field-backup.json'; a.click(); URL.revokeObjectURL(url) },
  importJSON:(file)=>{ const fr=new FileReader(); fr.onload=()=>{ try{ const data=JSON.parse(fr.result); if(data.quotes){ set({quotes:data.quotes}); saveQuotes(data.quotes) } if(data.jobs){ set({jobs:data.jobs}); saveJobs(data.jobs) } if(data.timelogs){ set({timelogs:data.timelogs}); saveLogs(data.timelogs) } if(data.materials){ set({materials:data.materials}); saveMaterials(data.materials) } if(data.settings){ set({settings:data.settings}); saveSettings(data.settings) } }catch(e){ alert('Invalid JSON') } }; fr.readAsText(file) },
  exportCSV:(rows, filename)=>{ const csv=rows.map(r=>r.map(v=>('"'+String(v).replaceAll('"','""')+'"')).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url) }
}))
export default useStore
