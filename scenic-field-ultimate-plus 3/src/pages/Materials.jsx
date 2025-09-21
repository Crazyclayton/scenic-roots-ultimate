import React, {useRef} from 'react'
import Section from '../components/Section'
import useStore from '../store'

export default function Materials(){
  const { materials, setMaterials, exportCSV } = useStore()
  const fileRef = useRef()
  const update = (i, patch) => { const next=materials.slice(); next[i]={...next[i], ...patch}; setMaterials(next) }
  const add = () => setMaterials([...materials, { id:crypto.randomUUID(), name:'New Item', price:0 }])
  const remove = (i) => setMaterials(materials.filter((_,idx)=>idx!==i))

  const exportList = () => { const rows = [['Name','Price']].concat(materials.map(m=>[m.name, m.price])); exportCSV(rows, 'materials.csv') }
  const importCSV = (file) => {
    const fr = new FileReader(); fr.onload = () => {
      const lines = String(fr.result).split(/\r?\n/).filter(Boolean); const out=[]
      for(let i=1;i<lines.length;i++){ const parts = lines[i].split(','); if(parts.length>=2){ const name=parts[0].replace(/^"|"$/g,''); const price=Number(parts[1].replace(/^"|"$/g,''))||0; out.push({id:crypto.randomUUID(), name, price}) } }
      if(out.length){ setMaterials(out) }
    }; fr.readAsText(file)
  }

  return (<>
    <Section title="Materials Picker" actions={<>
      <button className="button" onClick={exportList}>Export CSV</button>
      <button className="button" onClick={()=>fileRef.current?.click()}>Import CSV</button>
      <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={e=>e.target.files[0]&&importCSV(e.target.files[0])}/>
      <button className="button primary" onClick={add}>Add</button>
    </>}>
      <table className="table"><thead><tr><th>Name</th><th>Price</th><th></th></tr></thead><tbody>
        {materials.map((m,i)=>(<tr key={i}>
          <td><input className="input" value={m.name} onChange={e=>update(i,{name:e.target.value})}/></td>
          <td><input type="number" className="input" value={m.price} onChange={e=>update(i,{price:Number(e.target.value)})}/></td>
          <td><button className="button danger" onClick={()=>remove(i)}>Remove</button></td>
        </tr>))}
      </tbody></table>
    </Section>
  </>)
}
