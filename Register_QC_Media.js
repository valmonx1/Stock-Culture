'use strict';
const INSPECTION_ITEMS = [
  'Correct amount',
  'Expired date',
  'Cracked or damage plate',
  'Agar detached from petri dish',
  'Frozen or melted agar',
  'Unequel filling of the plate',
  'Insufficient agar in the plate (<3mm)',
  'Hemolysis of blood containing media',
  'Change in the expected color of the media',
  'Excessive bubbles or rough surface',
  'Excessive moisture or dehydration',
  'Obvious contamination'
];
const inspectionFields = document.getElementById('inspection-items');
inspectionFields.innerHTML = INSPECTION_ITEMS.map((item,index)=>`<label><span>${item} *</span><input data-inspection-item name="inspectionItem${index+1}" required placeholder="Enter inspection finding"></label>`).join('');
const editId = new URLSearchParams(location.search).get('media');
const editRecord = editId ? QCMediaStore.find(editId) : null;
function progress(){ const done=[...document.querySelectorAll('[data-inspection-item]')].filter(x=>x.value.trim()).length; document.getElementById('inspection-progress').textContent=`${done} / 12 completed`; }
document.querySelectorAll('[data-inspection-item]').forEach(x=>x.addEventListener('input',progress));
if(editRecord){const form=document.getElementById('media-registration-form');form.elements.media.value=editRecord.media;form.elements.lot.value=editRecord.lot;form.elements.manufacturer.value=editRecord.manufacturer;form.elements.dateReceived.value=editRecord.dateReceived;form.elements.inspectionObservation.value=editRecord.inspectionObservation||'';form.elements.inspectionComment.value=editRecord.inspectionComment||'';(editRecord.inspection||[]).forEach((item,index)=>{const field=document.querySelectorAll('[data-inspection-item]')[index];if(field)field.value=item.value||item.observation||'';});progress();document.querySelector('.media-heading h1').textContent='Edit Media';document.querySelector('.media-heading p').textContent=`Update registration and visual inspection for ${editRecord.id}.`;document.querySelector('[type="submit"]').textContent='Save Changes';}
document.getElementById('media-registration-form').addEventListener('submit',event=>{ event.preventDefault(); const form=event.currentTarget; if(!form.reportValidity()) return; const fields=[...document.querySelectorAll('[data-inspection-item]')]; if(fields.some(x=>!x.value.trim())){ fields.find(x=>!x.value.trim()).focus(); return; } const data=new FormData(form); const rows=QCMediaStore.read(); const changes={media:data.get('media'),lot:data.get('lot').trim(),manufacturer:data.get('manufacturer'),dateReceived:data.get('dateReceived'),inspectionObservation:data.get('inspectionObservation'),inspectionComment:data.get('inspectionComment').trim(),inspection:fields.map((field,index)=>({item:INSPECTION_ITEMS[index],value:field.value.trim()}))};const record=editRecord?QCMediaStore.update(editRecord.id,changes):{id:QCMediaStore.nextId(rows),...changes,status:'Pending'};if(!editRecord)QCMediaStore.write([record,...rows]); const toast=document.getElementById('media-toast'); toast.textContent=editRecord?`${record.id} updated successfully.`:`${record.id} registered successfully. Status: Pending.`; toast.hidden=false; setTimeout(()=>location.href=editRecord?'QC_Media.html':`Media_Performance_Testing.html?media=${encodeURIComponent(record.id)}`,900); });
