import React from 'react'
import useStore from '../store'
export default function Toast(){const t=useStore(s=>s.toast);if(!t)return null;return <div className='toast-wrap'><div className='toast'>{t}</div></div>}