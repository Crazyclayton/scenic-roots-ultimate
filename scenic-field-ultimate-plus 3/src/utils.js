export const money = n => (n||0).toLocaleString(undefined,{style:'currency',currency:'USD'})
export function crewHourly(settings){ const w=settings.wages; return (w.lead + w.hand + w.helper) * 1.1 }
export function quotePrice({materialsSubtotal, laborHours}, settings, isLandscaping=true){
  const hourly=crewHourly(settings); const laborCost=hourly*(laborHours||0); const baseCost=laborCost+(materialsSubtotal||0)
  const target=settings.profitTarget||0.25; let price = baseCost/(1-target)
  if(isLandscaping && settings.jaysFee?.enabled){ if(price >= (settings.jaysFee.threshold||1200)){ const fee=price*(settings.jaysFee.percent||0.33); price += fee } }
  return { price, baseCost }
}
export function seasonalMessage(settings){
  const arr = settings.seasonal||[]; if(!arr.length) return ''
  const idx = new Date().getMonth() % arr.length
  return arr[idx]
}
export function printQuoteHTML(q, settings){
  const rows = (q.materials||[]).map(m=>`<tr><td>${m.name}</td><td style='text-align:right'>${m.qty}</td><td style='text-align:right'>$${m.unitPrice.toFixed(2)}</td><td style='text-align:right'>$${(m.qty*m.unitPrice).toFixed(2)}</td></tr>`).join('')
  const addOn = q.addons?.trim()? `<h3>Add-ons</h3><p>${q.addons}</p>` : ''
  const yard = q.yard?.trim()? `<h3>Yard Health Notes</h3><p>${q.yard}</p>` : ''
  const issues = q.issues?.trim()? `<h3>Problems Observed</h3><p>${q.issues}</p>` : ''
  const seasonal = q.seasonal?.trim()? `<h3>Seasonal Offer</h3><p>${q.seasonal}</p>` : ''
  const discountLine = q.discountNote ? `<p class='muted'>${q.discountNote}</p>` : ''
  return `<!doctype html><html><head><meta charset='utf-8'><title>${q.title}</title></head>
  <body class='print-quote'>
    <h1>${settings.company}</h1>
    <div class='muted'>${settings.phone} • ${settings.website}</div>
    <hr/>
    <h2>${q.title}</h2>
    <p><strong>Category:</strong> ${q.isLandscaping?'Landscaping':'Lawn Care'} • <strong>Labor Hours:</strong> ${q.laborHours}</p>
    ${discountLine}
    <table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
    <tbody>${rows || "<tr><td colspan='4' class='muted'>No materials</td></tr>"}</tbody></table>
    <p class='total'>Client Price: <strong>$${q.price.toFixed(2)}</strong></p>
    ${addOn}${yard}${issues}${seasonal}
    <p class='muted'>Prepared on ${new Date(q.createdAt).toLocaleString()}</p>
    <script>window.print()</script>
  </body></html>`
}
