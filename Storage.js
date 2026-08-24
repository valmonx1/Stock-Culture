const recordId = new URLSearchParams(window.location.search).get('record');
const savedRecords = (() => { try { return JSON.parse(localStorage.getItem('stock-culture-records') || '[]'); } catch { return []; } })();
const selectedRecord = savedRecords.find((record) => record.id === recordId) || savedRecords[0];
const organismSelect = document.querySelector('[name="organism"]');
const atccSelect = document.querySelector('[name="atcc"]');
const organismLabel = organismSelect?.closest('.field')?.querySelector('span');
if (organismLabel) organismLabel.textContent = 'Source Organism';
if (organismSelect && atccSelect) {
  const organismInput = document.createElement('input'); organismInput.className = 'dimmed-input'; organismInput.name = 'organism'; organismInput.type = 'text'; organismInput.readOnly = true;
  const atccInput = document.createElement('input'); atccInput.className = 'dimmed-input'; atccInput.name = 'atcc'; atccInput.type = 'text'; atccInput.readOnly = true;
  [organismInput, atccInput].forEach((input) => { input.style.background = '#eef2f5'; input.style.color = '#7f90a1'; input.style.cursor = 'not-allowed'; });
  const organismMatch = String(selectedRecord?.name || '').match(/^(.*?)\s+ATCC\s+(\d+)/i);
  organismInput.value = organismMatch ? organismMatch[1] : (selectedRecord?.name || '');
  atccInput.value = organismMatch ? `ATCC ${organismMatch[2]}` : '';
  organismSelect.replaceWith(organismInput); atccSelect.replaceWith(atccInput);
}
const form = document.getElementById('storage-form');
const toast = document.getElementById('storage-toast');
function showStorageToast(message){ toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(showStorageToast.timer); showStorageToast.timer = setTimeout(()=>toast.classList.remove('is-visible'),2600); }
function saveTrailUpdate(){ const events = (() => { try { return JSON.parse(localStorage.getItem('qc-trail-events') || '[]'); } catch { return []; } })(); events.push({ recordId, process:'Storage', status:'Stored', date:form.elements.storedDate.value, user:form.elements.performedBy.value, update:'Culture assigned to controlled storage.', details:[`Freezer: ${form.elements.freezer.value}`, `Rack / box: ${form.elements.rack.value}`, `Vial: ${form.elements.vial.value}`] }); localStorage.setItem('qc-trail-events', JSON.stringify(events)); }
form.addEventListener('submit',(event)=>{ event.preventDefault(); const required=['organism','vial','freezer','rack','storedDate','performedBy'].map(name=>form.elements[name]).filter(field=>field&&!field.value.trim()); if(required.length){ required[0].focus(); showStorageToast(`Lengkapkan ${required.length} medan wajib.`); return; } saveTrailUpdate(); showStorageToast('Storage record saved successfully.'); form.reset(); });
document.getElementById('close-storage').addEventListener('click',()=>{ if(confirm('Data not saved. Sure want to close?')) window.location.href='index.html'; });
