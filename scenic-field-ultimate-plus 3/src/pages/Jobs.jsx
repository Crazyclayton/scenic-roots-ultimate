import React, {useState} from 'react'
import Section from '../components/Section'
import List from '../components/List'
import useStore from '../store'
import dayjs from 'dayjs'

export default function Jobs(){
  const { jobs, addJob, completeJob } = useStore()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState(() => new Date().toISOString().slice(0,10))
  const [gallery, setGallery] = useState([])

  const create = () => { addJob({ id: crypto.randomUUID(), title: title||'Untitled Job', due, status:'active' }); setTitle('') }
  const addPhotos = files => { const arr = Array.from(files||[]).slice(0,8).map(f=>({ name:f.name, url:URL.createObjectURL(f) })); setGallery(g => [...g, ...arr]) }

  return (<>
    <Section title="Schedule" actions={<button className="button primary" onClick={create}>Add Job</button>}>
      <div style={{display:'grid',gridTemplateColumns:'1fr auto', gap:10}}>
        <input className="input" placeholder="Front bed refresh — riprap" value={title} onChange={e=>setTitle(e.target.value)}/>
        <input className="input" type="date" value={due} onChange={e=>setDue(e.target.value)}/>
      </div>
    </Section>
    <Section title="Active Jobs">
      {jobs.filter(j=>j.status!=='done').length===0 ? <div style={{color:'#bdbdbd'}}>No active jobs.</div> :
        <List columns={['Title','Due','Status','']} rows={jobs.filter(j=>j.status!=='done').map(j=>[j.title, dayjs(j.due).format('MMM D'), j.status, <button className="button" onClick={()=>completeJob(j.id)}>Mark Done</button>])}/>}
    </Section>
    <Section title="Job Photos">
      <input type="file" className="input" accept="image/*" multiple onChange={e=>addPhotos(e.target.files)}/>
      {gallery.length>0 && <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:10}}>{gallery.map((p,i)=><img key={i} src={p.url} alt="" style={{width:90, height:90, objectFit:'cover', borderRadius:10, border:'1px solid var(--line)'}}/>)}</div>}
    </Section>
    <Section title="Completed">
      {jobs.filter(j=>j.status==='done').length===0 ? <div style={{color:'#bdbdbd'}}>None yet.</div> :
        <List columns={['Title','When']} rows={jobs.filter(j=>j.status==='done').map(j=>[j.title, dayjs().format('MMM D')])}/>}
    </Section>
  </>)
}
