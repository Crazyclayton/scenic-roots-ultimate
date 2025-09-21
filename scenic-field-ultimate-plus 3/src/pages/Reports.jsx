import React from 'react'
import Section from '../components/Section'
import useStore from '../store'
import { money } from '../utils'

export default function Reports(){
  const { quotes, jobs, timelogs, exportCSV } = useStore()
  const completed = jobs.filter(j=>j.status==='done').length
  const avgPrice = quotes.length ? quotes.reduce((s,q)=>s+q.price,0)/quotes.length : 0
  const exportLogs = () => {
    const rows = [['Start','End','Minutes']].concat(
      timelogs.map(l=>[new Date(l.start).toLocaleString(), l.end?new Date(l.end).toLocaleString():'', l.end?Math.round((l.end-l.start)/60000):''])
    ); exportCSV(rows, 'time-logs.csv')
  }
  return (<>
    <Section title="KPIs">
      <div className="row">
        <div className="card" style={{flex:'1 1 140px'}}><div>Completed Jobs</div><div className="kpi">{completed}</div></div>
        <div className="card" style={{flex:'1 1 160px'}}><div>Avg Quote Price</div><div className="kpi">{money(avgPrice)}</div></div>
        <div className="card" style={{flex:'1 1 160px'}}><div>Quotes</div><div className="kpi">{quotes.length}</div></div>
      </div>
    </Section>
    <Section title="Exports" actions={<button className="button" onClick={exportLogs}>Time Logs CSV</button>}>
      <div style={{color:'#bdbdbd'}}>Use Settings → Backup to export/import full JSON.</div>
    </Section>
  </>)
}
