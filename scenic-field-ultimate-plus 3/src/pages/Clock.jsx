import React, {useMemo} from 'react'
import Section from '../components/Section'
import useStore from '../store'
import { money, crewHourly } from '../utils'

export default function Clock(){
  const { settings, clockIn, clockOut, timelogs } = useStore()
  const hourly = useMemo(()=>crewHourly(settings), [settings])
  const active = timelogs.find(l=>!l.end)
  const costPerHour = hourly
  const costPerMin = costPerHour/60
  return (<>
    <Section title="Crew Time Clock">
      <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
        {!active ? <button className="button primary" onClick={()=>clockIn({lead:true,hand:true,helper:true})}>Clock In</button> : <button className="button danger" onClick={clockOut}>Clock Out</button>}
        <div className="button">Hourly: {money(costPerHour)}</div>
        <div className="button">Per Min: {money(costPerMin)}</div>
      </div>
      <div style={{marginTop:10, color:'#bdbdbd'}}>Lead ${settings.wages.lead} • Hand ${settings.wages.hand} • Helper ${settings.wages.helper}</div>
    </Section>
  </>)
}
