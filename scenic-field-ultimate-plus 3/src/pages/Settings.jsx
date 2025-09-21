import React, {useRef} from 'react'
import Section from '../components/Section'
import Field from '../components/Field'
import useStore from '../store'

export default function Settings(){
  const { settings, setSettings, exportJSON, importJSON, toggleClientMode } = useStore()
  const fileRef = useRef()
  const change = (path, val)=>{
    const next = structuredClone(settings)
    const seg = path.split('.'); let cur = next; for (let i=0;i<seg.length-1;i++) cur = cur[seg[i]]; cur[seg[seg.length-1]] = val; setSettings(next)
  }
  const updateTier = (i, patch) => { const tiers=settings.tiers.slice(); tiers[i]={...tiers[i], ...patch}; change('tiers', tiers) }
  const addTier = () => change('tiers', [...settings.tiers, {id:crypto.randomUUID(), name:'New', discount:0.05}])
  const removeTier = (i) => change('tiers', settings.tiers.filter((_,idx)=>idx!==i))
  const updateTpl = (i, patch) => { const t=settings.templates.slice(); t[i]={...t[i], ...patch}; change('templates', t) }
  const addTpl = () => change('templates', [...settings.templates, {id:crypto.randomUUID(), label:'New Template', laborHours:1, mats:[]}])
  const removeTpl = (i) => change('templates', settings.templates.filter((_,idx)=>idx!==i))

  return (<>
    <Section title="Company">
      <div className="grid-2">
        <Field label="Name"><input className="input" value={settings.company} onChange={e=>change('company', e.target.value)}/></Field>
        <Field label="Phone"><input className="input" value={settings.phone} onChange={e=>change('phone', e.target.value)}/></Field>
      </div>
      <Field label="Website"><input className="input" value={settings.website} onChange={e=>change('website', e.target.value)}/></Field>
    </Section>
    <Section title="Crew & Profit">
      <div className="grid-2">
        <Field label="Lead Wage ($/hr)"><input type="number" className="input" value={settings.wages.lead} onChange={e=>change('wages.lead', Number(e.target.value))}/></Field>
        <Field label="Experienced Hand ($/hr)"><input type="number" className="input" value={settings.wages.hand} onChange={e=>change('wages.hand', Number(e.target.value))}/></Field>
      </div>
      <div className="grid-2" style={{marginTop:8}}>
        <Field label="Helper ($/hr)"><input type="number" className="input" value={settings.wages.helper} onChange={e=>change('wages.helper', Number(e.target.value))}/></Field>
        <Field label="Target Profit %"><input type="number" className="input" value={Math.round((settings.profitTarget||0)*100)} onChange={e=>change('profitTarget', Number(e.target.value)/100)}/></Field>
      </div>
    </Section>
    <Section title="Jay’s Planning/Execution Fee">
      <div className="grid-2">
        <Field label="Enabled?"><select className="input" value={settings.jaysFee.enabled?'yes':'no'} onChange={e=>change('jaysFee.enabled', e.target.value==='yes')}><option value="yes">Yes</option><option value="no">No</option></select></Field>
        <Field label="Threshold ($)"><input type="number" className="input" value={settings.jaysFee.threshold} onChange={e=>change('jaysFee.threshold', Number(e.target.value))}/></Field>
      </div>
      <div className="grid-2" style={{marginTop:8}}>
        <Field label="Percent"><input type="number" className="input" value={Math.round(settings.jaysFee.percent*100)} onChange={e=>change('jaysFee.percent', Number(e.target.value)/100)}/></Field>
        <div></div>
      </div>
    </Section>
    <Section title="Membership Tiers" actions={<button className="button primary" onClick={addTier}>Add Tier</button>}>
      <table className="table"><thead><tr><th>Name</th><th>Discount %</th><th></th></tr></thead><tbody>
        {settings.tiers.map((t,i)=>(<tr key={t.id}>
          <td><input className="input" value={t.name} onChange={e=>updateTier(i,{name:e.target.value})}/></td>
          <td><input type="number" className="input" value={Math.round(t.discount*100)} onChange={e=>updateTier(i,{discount:Number(e.target.value)/100})}/></td>
          <td><button className="button danger" onClick={()=>removeTier(i)}>Remove</button></td>
        </tr>))}
      </tbody></table>
    </Section>
    <Section title="Quote Templates" actions={<button className="button primary" onClick={addTpl}>Add Template</button>}>
      <table className="table"><thead><tr><th>Label</th><th>Labor Hours</th><th>Materials (JSON)</th><th></th></tr></thead><tbody>
        {settings.templates.map((t,i)=>(<tr key={t.id}>
          <td><input className="input" value={t.label} onChange={e=>updateTpl(i,{label:e.target.value})}/></td>
          <td><input type="number" className="input" value={t.laborHours} onChange={e=>updateTpl(i,{laborHours:Number(e.target.value)})}/></td>
          <td><input className="input" value={JSON.stringify(t.mats)} onChange={e=>{try{updateTpl(i,{mats:JSON.parse(e.target.value)})}catch{}}}/></td>
          <td><button className="button danger" onClick={()=>removeTpl(i)}>Remove</button></td>
        </tr>))}
      </tbody></table>
    </Section>
    <Section title="SOP Blocks">
      <div className="grid-2">
        <Field label="Add-ons Hint"><input className="input" value={settings.sop.addonsHint} onChange={e=>change('sop.addonsHint', e.target.value)}/></Field>
        <Field label="Yard Health Prompt"><input className="input" value={settings.sop.yardHealthPrompt} onChange={e=>change('sop.yardHealthPrompt', e.target.value)}/></Field>
      </div>
      <Field label="Problems Prompt"><input className="input" value={settings.sop.problemsPrompt} onChange={e=>change('sop.problemsPrompt', e.target.value)}/></Field>
      <div className="grid-2" style={{marginTop:8}}>
        <Field label="Client Mode">
          <button className="button" onClick={toggleClientMode}>{settings.clientMode?'ON (hide internal)':'OFF'}</button>
        </Field>
        <Field label="Backup / Restore">
          <div className="row">
            <button className="button" onClick={exportJSON}>Export JSON</button>
            <button className="button" onClick={()=>fileRef.current?.click()}>Import JSON</button>
            <input ref={fileRef} type="file" accept="application/json" style={{display:'none'}} onChange={e=>e.target.files[0]&&importJSON(e.target.files[0])}/>
          </div>
        </Field>
      </div>
    </Section>
  </>)
}
