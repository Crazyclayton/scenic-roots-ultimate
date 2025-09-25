// Scenic Roots Quoter application logic
let config = null;
let lines = [];
let globalScope = '';
let terms = '';
let discount = 0;
let tax = 0;
let deposit = 0;

// Initialize the app when the DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
  // Load configuration
  try {
    const res = await fetch('data/config.json');
    config = await res.json();
  } catch (err) {
    console.error('Unable to load configuration', err);
    alert('Failed to load configuration.');
    return;
  }
  // Set the primary brand color
  if (config.business && config.business.color) {
    document.documentElement.style.setProperty('--primary-color', config.business.color);
  }
  populatePresets();
  // Start with a blank line
  addLine();
  updateTotals();
  // Attach event listeners
  setListeners();
});

// Populate dropdowns and presets from configuration
function populatePresets() {
  // Tier presets
  const tierSel = document.getElementById('tierPreset');
  for (const tier in config.tiers) {
    const opt = document.createElement('option');
    opt.value = tier;
    opt.textContent = tier;
    tierSel.appendChild(opt);
  }
  // Global scope
  const globalScopeSel = document.getElementById('globalScope');
  config.scopePresets.forEach(scope => {
    const opt = document.createElement('option');
    opt.value = scope;
    opt.textContent = scope;
    globalScopeSel.appendChild(opt);
  });
  // Terms
  const termsSel = document.getElementById('termsSelect');
  config.termsPresets.forEach(term => {
    const opt = document.createElement('option');
    opt.value = term;
    opt.textContent = term;
    termsSel.appendChild(opt);
  });
  // Discount presets
  const discSel = document.getElementById('discount');
  config.discountPresets.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.value;
    opt.textContent = d.label;
    discSel.appendChild(opt);
  });
  // Tax presets
  const taxSel = document.getElementById('tax');
  config.taxPresets.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.value;
    opt.textContent = t.label;
    taxSel.appendChild(opt);
  });
  // Deposit presets
  const depSel = document.getElementById('deposit');
  config.depositPresets.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.value;
    opt.textContent = d.label;
    depSel.appendChild(opt);
  });
}

// Attach event listeners to controls
function setListeners() {
  document.getElementById('addLine').addEventListener('click', () => addLine());
  document.getElementById('tierPreset').addEventListener('change', handleTier);
  document.getElementById('discount').addEventListener('change', e => { discount = parseFloat(e.target.value || 0); updateTotals(); });
  document.getElementById('tax').addEventListener('change', e => { tax = parseFloat(e.target.value || 0); updateTotals(); });
  document.getElementById('deposit').addEventListener('change', e => { deposit = parseFloat(e.target.value || 0); updateTotals(); });
  document.getElementById('globalScope').addEventListener('change', e => { globalScope = e.target.value; });
  document.getElementById('termsSelect').addEventListener('change', e => { terms = e.target.value; });
  // View toggles
  document.getElementById('viewProposal').addEventListener('click', () => { showOutput('proposal'); });
  document.getElementById('viewQuote').addEventListener('click', () => { showOutput('quote'); });
  document.getElementById('viewAgreement').addEventListener('click', () => { showOutput('agreement'); });
  document.getElementById('viewEditor').addEventListener('click', () => { showEditor(); });
  // Save/Load/Clear
  document.getElementById('saveLocal').addEventListener('click', saveLocal);
  document.getElementById('loadLocal').addEventListener('click', loadLocal);
  document.getElementById('clearLines').addEventListener('click', () => { lines = []; renderLines(); updateTotals(); });
  // Export
  document.getElementById('exportPNG').addEventListener('click', exportPNG);
  document.getElementById('exportPDF').addEventListener('click', exportPDF);
}

// Add a new line item to the quote
function addLine(serviceLabel = null) {
  // Choose a default item if none specified
  const defaultItem = config.categories[0].items[0];
  const item = getItemByLabel(serviceLabel) || defaultItem;
  const newLine = {
    id: 'line-' + Date.now() + Math.random().toString(36).substring(2, 6),
    service: item.label,
    unit: item.unit,
    qty: 1,
    price: item.price,
    scope: '',
    photos: []
  };
  lines.push(newLine);
  renderLines();
  updateTotals();
}

// Retrieve an item definition by its label
function getItemByLabel(label) {
  if (!label) return null;
  for (const cat of config.categories) {
    for (const it of cat.items) {
      if (it.label === label) return it;
    }
  }
  return null;
}

// Handle selection of a tier preset (adds multiple line items)
function handleTier(e) {
  const tier = e.target.value;
  if (!tier) return;
  const items = config.tiers[tier] || [];
  items.forEach(label => addLine(label));
  // Reset the select after adding
  e.target.value = '';
}

// Render the lines table based on current state
function renderLines() {
  const tbody = document.querySelector('#quoteTable tbody');
  tbody.innerHTML = '';
  lines.forEach((ln, idx) => {
    const tr = document.createElement('tr');
    // Index
    const tdIndex = document.createElement('td');
    tdIndex.textContent = idx + 1;
    tr.appendChild(tdIndex);
    // Service select
    const tdService = document.createElement('td');
    const sel = document.createElement('select');
    config.categories.forEach(cat => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = cat.name;
      cat.items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.label;
        opt.textContent = item.label;
        if (item.label === ln.service) opt.selected = true;
        opt.dataset.unit = item.unit;
        opt.dataset.price = item.price;
        optgroup.appendChild(opt);
      });
      sel.appendChild(optgroup);
    });
    sel.addEventListener('change', (ev) => {
      const label = ev.target.value;
      const selected = getItemByLabel(label);
      ln.service = selected.label;
      ln.unit = selected.unit;
      ln.price = selected.price;
      renderLines();
      updateTotals();
    });
    tdService.appendChild(sel);
    tr.appendChild(tdService);
    // Quantity input
    const tdQty = document.createElement('td');
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = 0;
    qtyInput.value = ln.qty;
    qtyInput.addEventListener('input', (ev) => {
      ln.qty = parseFloat(ev.target.value || 0);
      updateTotals();
      renderLines();
    });
    tdQty.appendChild(qtyInput);
    tr.appendChild(tdQty);
    // Price input
    const tdPrice = document.createElement('td');
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.step = '0.01';
    priceInput.min = 0;
    priceInput.value = ln.price;
    priceInput.addEventListener('input', (ev) => {
      ln.price = parseFloat(ev.target.value || 0);
      updateTotals();
      renderLines();
    });
    tdPrice.appendChild(priceInput);
    tr.appendChild(tdPrice);
    // Scope select
    const tdScope = document.createElement('td');
    const scopeSel = document.createElement('select');
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '--';
    scopeSel.appendChild(emptyOpt);
    config.scopePresets.forEach(sc => {
      const opt = document.createElement('option');
      opt.value = sc;
      opt.textContent = sc;
      if (ln.scope === sc) opt.selected = true;
      scopeSel.appendChild(opt);
    });
    scopeSel.addEventListener('change', (ev) => {
      ln.scope = ev.target.value;
    });
    tdScope.appendChild(scopeSel);
    tr.appendChild(tdScope);
    // Photos input
    const tdPhotos = document.createElement('td');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', (ev) => {
      const files = Array.from(ev.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          ln.photos.push(evt.target.result);
          // update photo count display
          photoCount.textContent = ln.photos.length + ' photos';
        };
        reader.readAsDataURL(file);
      });
      ev.target.value = '';
    });
    const photoCount = document.createElement('div');
    photoCount.textContent = ln.photos.length + ' photos';
    photoCount.style.fontSize = '12px';
    tdPhotos.appendChild(fileInput);
    tdPhotos.appendChild(photoCount);
    tr.appendChild(tdPhotos);
    // Subtotal
    const tdSubtotal = document.createElement('td');
    tdSubtotal.textContent = '$' + (ln.qty * ln.price).toFixed(2);
    tr.appendChild(tdSubtotal);
    // Remove button
    const tdRemove = document.createElement('td');
    const remBtn = document.createElement('button');
    remBtn.textContent = '✕';
    remBtn.addEventListener('click', () => {
      lines = lines.filter(l => l.id !== ln.id);
      renderLines();
      updateTotals();
    });
    tdRemove.appendChild(remBtn);
    tr.appendChild(tdRemove);
    // Append row to table
    tbody.appendChild(tr);
  });
}

// Compute and display totals
function updateTotals() {
  const subtotal = lines.reduce((sum, ln) => sum + ln.qty * ln.price, 0);
  const discountAmount = subtotal * (discount / 100);
  const afterDiscount = subtotal + discountAmount;
  const taxAmount = afterDiscount * (tax / 100);
  const total = afterDiscount + taxAmount;
  const depositDue = total * (deposit / 100);
  const div = document.getElementById('totals');
  div.innerHTML =
    '<div>Subtotal: $' + subtotal.toFixed(2) + '</div>' +
    '<div>Discount/Markup: $' + discountAmount.toFixed(2) + '</div>' +
    '<div>After Discount: $' + afterDiscount.toFixed(2) + '</div>' +
    '<div>Tax: $' + taxAmount.toFixed(2) + '</div>' +
    '<div>Total: $' + total.toFixed(2) + '</div>' +
    '<div>Deposit Due: $' + depositDue.toFixed(2) + '</div>';
}

// Show editor view
function showEditor() {
  document.getElementById('editorView').style.display = '';
  document.getElementById('outputView').style.display = 'none';
}

// Display client-facing output
function showOutput(type) {
  renderOutput(type);
  document.getElementById('editorView').style.display = 'none';
  document.getElementById('outputView').style.display = '';
}

// Render output (proposal, quote, agreement)
function renderOutput(type) {
  const container = document.getElementById('clientOutput');
  container.innerHTML = '';
  // Business header
  const biz = config.business;
  const header = document.createElement('div');
  header.innerHTML =
    '<h2 style="color:' + biz.color + '">' + biz.name + '</h2>' +
    '<div>Phone: ' + biz.phone + ' | Email: ' + biz.email + '</div>';
  container.appendChild(header);
  // Title
  let title = '';
  if (type === 'proposal') title = 'Client Proposal';
  else if (type === 'quote') title = 'Quick Quote Sheet';
  else if (type === 'agreement') title = 'Proposal & Agreement';
  const heading = document.createElement('h3');
  heading.textContent = title;
  container.appendChild(heading);
  // Table
  const tbl = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Description','Qty','Unit','Price','Subtotal'].forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  tbl.appendChild(thead);
  const tb = document.createElement('tbody');
  lines.forEach(ln => {
    const tr = document.createElement('tr');
    // Description and optional scope/photos
    const tdDesc = document.createElement('td');
    let descHtml = ln.service;
    if (ln.scope) descHtml += '<br><em>' + ln.scope + '</em>';
    if (type === 'proposal' && ln.photos.length) {
      descHtml += '<br>';
      ln.photos.forEach((p, i) => {
        descHtml += '<img src="' + p + '" alt="photo' + i + '" style="max-width:150px; max-height:150px; margin:2px;">';
      });
    }
    tdDesc.innerHTML = descHtml;
    tr.appendChild(tdDesc);
    // Qty
    const tdQty = document.createElement('td');
    tdQty.textContent = ln.qty;
    tr.appendChild(tdQty);
    // Unit
    const tdUnit = document.createElement('td');
    tdUnit.textContent = ln.unit;
    tr.appendChild(tdUnit);
    // Price
    const tdPrice = document.createElement('td');
    tdPrice.textContent = '$' + ln.price.toFixed(2);
    tr.appendChild(tdPrice);
    // Subtotal
    const tdSub = document.createElement('td');
    tdSub.textContent = '$' + (ln.qty * ln.price).toFixed(2);
    tr.appendChild(tdSub);
    tb.appendChild(tr);
  });
  tbl.appendChild(tb);
  container.appendChild(tbl);
  // Totals
  const subtotal = lines.reduce((sum, ln) => sum + ln.qty * ln.price, 0);
  const discountAmount = subtotal * (discount / 100);
  const afterDiscount = subtotal + discountAmount;
  const taxAmount = afterDiscount * (tax / 100);
  const total = afterDiscount + taxAmount;
  const depositDue = total * (deposit / 100);
  const summaryDiv = document.createElement('div');
  summaryDiv.style.marginTop = '10px';
  summaryDiv.innerHTML =
    '<div><strong>Subtotal:</strong> $' + subtotal.toFixed(2) + '</div>' +
    '<div><strong>Discount/Markup:</strong> $' + discountAmount.toFixed(2) + '</div>' +
    '<div><strong>After Discount:</strong> $' + afterDiscount.toFixed(2) + '</div>' +
    '<div><strong>Tax:</strong> $' + taxAmount.toFixed(2) + '</div>' +
    '<div><strong>Total:</strong> $' + total.toFixed(2) + '</div>' +
    '<div><strong>Deposit Due:</strong> $' + depositDue.toFixed(2) + '</div>';
  container.appendChild(summaryDiv);
  // Terms
  if (terms) {
    const termsDiv = document.createElement('div');
    termsDiv.style.marginTop = '10px';
    termsDiv.innerHTML = '<strong>Terms:</strong> ' + terms;
    container.appendChild(termsDiv);
  }
  // Global scope
  if (globalScope) {
    const scopeDiv = document.createElement('div');
    scopeDiv.style.marginTop = '10px';
    scopeDiv.innerHTML = '<strong>Scope of Work:</strong> ' + globalScope;
    container.appendChild(scopeDiv);
  }
  // Signature lines for agreements
  if (type === 'agreement') {
    const sig = document.createElement('div');
    sig.style.marginTop = '20px';
    sig.innerHTML =
      '<p>Client Signature: ________________________ Date: ____________</p>' +
      '<p>Provider Signature: ______________________ Date: ____________</p>';
    container.appendChild(sig);
  }
}

// Save data locally in browser storage
function saveLocal() {
  const data = { lines, globalScope, terms, discount, tax, deposit };
  localStorage.setItem('scenicQuoteData', JSON.stringify(data));
  alert('Saved locally');
}

// Load data from local storage
function loadLocal() {
  const dataStr = localStorage.getItem('scenicQuoteData');
  if (!dataStr) {
    alert('No saved data found.');
    return;
  }
  try {
    const obj = JSON.parse(dataStr);
    lines = obj.lines || [];
    globalScope = obj.globalScope || '';
    terms = obj.terms || '';
    discount = obj.discount || 0;
    tax = obj.tax || 0;
    deposit = obj.deposit || 0;
    // Update selects
    document.getElementById('globalScope').value = globalScope;
    document.getElementById('termsSelect').value = terms;
    document.getElementById('discount').value = discount;
    document.getElementById('tax').value = tax;
    document.getElementById('deposit').value = deposit;
    renderLines();
    updateTotals();
  } catch (err) {
    alert('Failed to load saved data.');
  }
}

// Export output view to PNG
function exportPNG() {
  const outputDiv = document.getElementById('clientOutput');
  html2canvas(outputDiv, { scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'quote.png';
    link.click();
  });
}

// Export output view to PDF
function exportPDF() {
  const outputDiv = document.getElementById('clientOutput');
  html2canvas(outputDiv, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Calculate width and height preserving aspect ratio
    const imgWidth = pageWidth - 20;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let position = 10;
    if (imgHeight < pageHeight - 20) {
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    } else {
      // If the image is taller than one page, scale to fit and let pdf.js handle splitting
      const ratio = imgHeight / (pageHeight - 20);
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight / ratio);
    }
    pdf.save('quote.pdf');
  });
}
