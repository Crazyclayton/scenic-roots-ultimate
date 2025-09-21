import React, { useState, useRef } from 'react'
import Section from '../components/Section'
import Field from '../components/Field'
import List from '../components/List'
import useStore from '../store'
import { money, quotePrice, seasonalMessage, printQuoteHTML } from '../utils'
import dayjs from 'dayjs'

export default function Quotes(){
  const { quotes, addQuote, exportCSV, settings, setToast, toggleClientMode } = useStore()
  const [form, setForm] = useState({ title:'', address:'', materials:[], laborHours:1, isLandscaping:true, tier:'', existing:false, onetime:true, addons:'', yard:'', issues:'', seasonal:'' })
  const [mat, setMat] = useState({ name:'Mulch (yd)', qty:1, unitPrice:70 })
  const fileRef = useRef()
  const [photos, setPhotos] = useState([])

  const applyTemplate = (tplId) => {
    const tpl = (settings.templates||[]).find(t=>t.id===tplId)
    if(!tpl) return
    setForm(f => ({...f, title:tpl.label, isLandscaping:tplId.includes('land'), laborHours:tpl.laborHours, materials: tpl.mats.map(m=>({...m, id:crypto.randomUUID()})) }))
    setToast('Template applied')
  }

  const materialsSubtotal = (form.materials||[]).reduce((s,m)=>s+m.qty*m.unitPrice,0)
  let { price, baseCost } = quotePrice({materialsSubtotal, laborHours:Number(form.laborHours||0)}, settings, form.isLandscaping)
  const rotatedSeasonal = form.seasonal || seasonalMessage(settings)

  let discountNote = ''
  if(form.tier){
    const t = settings.tiers.find(x=>x.id===form.tier)
    if(t){ const before = price; price = price * (1 - t.discount); discountNote += `${t.name} member discount ${Math.round(t.discount*100)}% (was ${money(before)}) • ` }
  }
  if(form.existing){
    const before = price; price = price * 0.85; discountNote += `Existing customer 15% (was ${money(before)}) • `
  }

  const addMaterial = () => setForm(f => ({...f, materials:[...(f.materials||[]), {...mat, id:crypto.randomUUID()}]}))
  const removeMat = (id) => setForm(f => ({...f, materials:f.materials.filter(x=>x.id!==id)}))
  const addPhotos = (files) => { const arr = Array.from(files||[]).slice(0,8).map(f=>({ name:f.name, url:URL.createObjectURL(f) })); setPhotos(p => [...p, ...arr]) }

  const mapsLink = form.address ? `https://maps.apple.com/?q=${encodeURIComponent(form.address)}` : null

  const createQuote = () => {
    const q = { id: crypto.randomUUID(), title: form.title || `Quote ${quotes.length+1}`, createdAt: Date.now(),
      address: form.address, materials: form.materials, laborHours: Number(form.laborHours||0), isLandscaping: form.isLandscaping,
      baseCost, price, tier:form.tier, existing:form.existing, onetime:form.onetime, addons:form.addons, yard:form.yard, issues:form.issues, seasonal: rotatedSeasonal, discountNote: discountNote.trim() }
    addQuote(q); setForm({ title:'', address:'', materials:[], laborHours:1, isLandscaping:true, tier:'', existing:false, onetime:true, addons:'', yard:'', issues:'', seasonal:'' }); setPhotos([]); setToast('Quote saved')
  }

  const exportQuotes = () => {
    const rows = [['Title','Created','Price','Address','Tier','Existing?','Category']].concat(
      quotes.map(q => [q.title, dayjs(q.createdAt).format('YYYY-MM-DD HH:mm'), q.price, q.address||'', q.tier||'', q.existing?'yes':'no', q.isLandscaping?'Landscaping':'Lawn'])
    ); exportCSV(rows, 'quotes.csv')
  }

  const shareQuote = async () => {
    const q = { title: form.title || 'Quote', createdAt: Date.now(), price, isLandscaping: form.isLandscaping }
    const text = `${q.title} — ${q.isLandscaping?'Landscaping':'Lawn Care'}\nPrice: ${money(q.price)}`
    if(navigator.share){ try{ await navigator.share({ title:q.title, text }); }catch{} } else { window.location.href = 'mailto:?subject='+encodeURIComponent(q.title)+'&body='+encodeURIComponent(text) }
  }

  const printQuote = () => {
    const q = { title: form.title || 'Quote', createdAt: Date.now(), materials: form.materials, laborHours: Number(form.laborHours||0), isLandscaping: form.isLandscaping, price, addons:form.addons, yard:form.yard, issues:form.issues, seasonal: rotatedSeasonal, discountNote }
    const html = printQuoteHTML(q, settings); const w = window.open('', '_blank'); if(!w) return alert('Allow popups to print'); w.document.write(html); w.document.close()
  }

  // Quick calculators
  const [areaSqft, setAreaSqft] = useState(200)
  const [depthIn, setDepthIn] = useState(2)
  const mulchYards = (areaSqft * (depthIn/12)) / 27

  return (<>
    <Section title="Templates & Actions" actions={<div className="row">
      <select className="input" onChange={e=>applyTemplate(e.target.value)} defaultValue="">
        <option value="" disabled>Choose template…</option>
        {(settings.templates||[]).map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      <button className="button" onClick={shareQuote}>Share</button>
      <button className="button" onClick={printQuote}>Print/PDF</button>
      <button className="button" onClick={toggleClientMode}>{settings.clientMode?'Exit Client Mode':'Client Mode'}</button>
    </div>}>
      <div className="grid-2">
        <Field label="Title"><input className="input" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Front bed refresh — Basic/Standard/Premium"/></Field>
        <Field label="Client Address"><input className="input" value={form.address} onChange={e=>setForm({...form, address:e.target.value})} placeholder="123 Main St, Dickson, TN"/></Field>
      </div>
      {mapsLink && <div className="row" style={{marginTop:6}}><a className="button" href={mapsLink} target="_blank" rel="noreferrer">Open in Apple Maps</a></div>}
      <div className="grid-2" style={{marginTop:8}}>
        <Field label="Labor Hours"><input type="number" min="0" step="0.25" className="input" value={form.laborHours} onChange={e=>setForm({...form, laborHours:e.target.value})}/></Field>
        <Field label="Category"><select className="input" value={form.isLandscaping?'land':'lawn'} onChange={e=>setForm({...form, isLandscaping:e.target.value==='land'})}><option value="land">Landscaping</option><option value="lawn">Lawn Care</option></select></Field>
      </div>
      <div className="grid-2" style={{marginTop:8}}>
        <Field label="Membership Tier"><select className="input" value={form.tier} onChange={e=>setForm({...form, tier:e.target.value})}><option value="">None</option>{settings.tiers.map(t=><option key={t.id} value={t.id}>{t.name} (−{Math.round(t.discount*100)}%)</option>)}</select></Field>
        <Field label="Existing Customer?"><select className="input" value={form.existing?'yes':'no'} onChange={e=>setForm({...form, existing:e.target.value==='yes'})}><option value="no">No</option><option value="yes">Yes (−15%)</option></select></Field>
      </div>
      <div className="grid-2" style={{marginTop:8}}>
        <Field label="One-time Job?"><select className="input" value={form.onetime?'yes':'no'} onChange={e=>setForm({...form, onetime:e.target.value==='yes'})}><option value="yes">Yes</option><option value="no">No (recurring)</option></select></Field>
        <Field label="Seasonal Offer"><input className="input" value={rotatedSeasonal} onChange={e=>setForm({...form, seasonal:e.target.value})}/></Field>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div style={{display:'flex', gap:10, alignItems:'end'}}>
          <Field label="Material"><input className="input" value={mat.name} onChange={e=>setMat({...mat, name:e.target.value})}/></Field>
          <Field label="Qty"><input type="number" min="0" step="0.25" className="input" value={mat.qty} onChange={e=>setMat({...mat, qty:Number(e.target.value)})}/></Field>
          <Field label="Unit Price ($)"><input type="number" min="0" step="1" className="input" value={mat.unitPrice} onChange={e=>setMat({...mat, unitPrice:Number(e.target.value)})}/></Field>
          <button className="button" onClick={addMaterial}>Add</button>
        </div>
        {(form.materials||[]).length===0 ? <div style={{color:'#bdbdbd', marginTop:8}}>No materials added yet.</div> :
          <List columns={['Item','Qty','Unit','Total','']} rows={form.materials.map(m=>[m.name, m.qty, money(m.unitPrice), money(m.qty*m.unitPrice), <button className="button danger" onClick={()=>removeMat(m.id)}>Remove</button>])}/>}
      </div>

      <div className="grid-2" style={{marginTop:8}}>
        <Field label="Add-ons (upsells)"><textarea className="input" rows="3" placeholder={settings.sop.addonsHint} value={form.addons} onChange={e=>setForm({...form, addons:e.target.value})}/></Field>
        <Field label="Yard Health Notes"><textarea className="input" rows="3" placeholder={settings.sop.yardHealthPrompt} value={form.yard} onChange={e=>setForm({...form, yard:e.target.value})}/></Field>
      </div>
      <div className="grid-2" style={{marginTop:8}}>
        <Field label="Problems Observed"><textarea className="input" rows="3" placeholder={settings.sop.problemsPrompt} value={form.issues} onChange={e=>setForm({...form, issues:e.target.value})}/></Field>
        <Field label="Attach Photos (won’t persist)"><input ref={fileRef} type="file" accept="image/*" multiple className="input" onChange={e=>addPhotos(e.target.files)}/></Field>
      </div>
      {photos.length>0 && <div className="card" style={{marginTop:10}}><div style={{display:'flex', gap:8, flexWrap:'wrap'}}>{photos.map((p,i)=><img key={i} src={p.url} alt="" style={{width:90, height:90, objectFit:'cover', borderRadius:10, border:'1px solid var(--line)'}}/>)}</div></div>}

      <div className="row" style={{marginTop:10}}>
        <div className="card" style={{flex:'1 1 140px'}}><div>Materials</div><div className="kpi">{money(materialsSubtotal)}</div></div>
        {!settings.clientMode && <div className="card" style={{flex:'1 1 140px'}}><div>Base Cost</div><div className="kpi">{money(baseCost)}</div></div>}
        <div className="card" style={{flex:'1 1 160px', borderColor:'#2b3e31'}}><div>Client Price</div><div className="kpi">{money(price)}</div></div>
      </div>

      <div className="row" style={{marginTop:10}}>
        <button className="button primary" onClick={createQuote}>Save Quote</button>
        <button className="button" onClick={exportQuotes}>Export CSV</button>
      </div>

      <Section title="Recent Quotes">
        {quotes.length===0 ? <div style={{color:'#bdbdbd'}}>No quotes yet.</div> :
          <List columns={['Title','Created','Price']} rows={quotes.slice().reverse().map(q=>[q.title, dayjs(q.createdAt).format('MMM D, HH:mm'), money(q.price)])} />}
      </Section>

      <div className="card" style={{marginTop:10}}>
        <div style={{fontWeight:700, marginBottom:6}}>Quick Calculators</div>
        <div className="grid-2">
          <Field label="Area (sqft)"><input type="number" className="input" value={areaSqft} onChange={e=>setAreaSqft(Number(e.target.value)||0)}/></Field>
          <Field label="Depth (inches)"><input type="number" className="input" value={depthIn} onChange={e=>setDepthIn(Number(e.target.value)||0)}/></Field>
        </div>
        <div style={{marginTop:8}}>Mulch needed: <strong>{mulchYards.toFixed(2)} yd³</strong></div>
      </div>
    </Section>
  </>)
}
