const seedRecords = [
  { id: "QC-2026-004", name: "Escherichia coli ATCC 25922", code: "EC-25922", batch: "25922-2026-01", manufacturer: "ATCC", registered: "18 Jun 2026", purchase: "18 Jun 2026", received: "20 Jun 2026", storage: "Freezer 01", location: "Rack A · Box 04", status: "Active", passage: "P1", tubes: "8 / 10", temperature: "−80 °C", review: "30 Jun 2027" },
  { id: "QC-2026-006", name: "Staphylococcus aureus ATCC 29213", code: "SA-29213", batch: "29213-2026-A", manufacturer: "ATCC", registered: "25 Jun 2026", purchase: "23 Jun 2026", received: "25 Jun 2026", storage: "Freezer 01", location: "Rack B · Box 02", status: "Active", passage: "P1", tubes: "7 / 10", temperature: "−80 °C", review: "23 Jun 2027" },
  { id: "QC-2026-008", name: "Pseudomonas aeruginosa ATCC 27853", code: "PA-27853", batch: "27853-2026-A", manufacturer: "ATCC", registered: "18 Jun 2026", purchase: "17 Jun 2026", received: "18 Jun 2026", storage: "Freezer 01", location: "Rack A · Box 04", status: "Review due", passage: "P2", tubes: "6 / 10", temperature: "−80 °C", review: "18 Jul 2026" },
  { id: "QC-2026-010", name: "Enterococcus faecalis ATCC 29212", code: "EF-29212", batch: "29212-2026-A", manufacturer: "ATCC", registered: "—", purchase: "21 Jul 2026", received: "23 Jul 2026", storage: "Freezer 02", location: "Rack C · Box 07", status: "Pending acceptance", passage: "P0", tubes: "5 / 5", temperature: "−20 °C", review: "23 Jul 2027" }
];

const sampleOrganisms = [
  ["Escherichia coli ATCC 25922", "EC-25922"],
  ["Staphylococcus aureus ATCC 29213", "SA-29213"],
  ["Enterococcus faecalis ATCC 29212", "EF-29212"],
  ["Pseudomonas aeruginosa ATCC 27853", "PA-27853"]
];
const sampleStorages = [["Freezer 01", "Rack A · Box 04", "−80 °C"], ["Freezer 02", "Rack B · Box 02", "−20 °C"], ["Refrigerator 01", "Rack C · Box 07", "2–8 °C"]];
const sampleStatuses = ["Active", "Active", "Review due", "Pending acceptance"];
for (let index = seedRecords.length + 1; index <= 50; index += 1) {
  const organism = sampleOrganisms[(index - 1) % sampleOrganisms.length];
  const storage = sampleStorages[(index - 1) % sampleStorages.length];
  const passage = index % 3 === 0 ? "P2" : "P1";
  seedRecords.push({ id: `QC-2026-${String(index + 10).padStart(3, "0")}`, name: organism[0], code: organism[1], batch: `${organism[1].slice(-5)}-2026-${String(index).padStart(2, "0")}`, manufacturer: "ATCC", registered: `${String((index % 27) + 1).padStart(2, "0")} Jun 2026`, purchase: `${String((index % 25) + 1).padStart(2, "0")} Jun 2026`, received: `${String((index % 23) + 1).padStart(2, "0")} Jun 2026`, storage: storage[0], location: storage[1], status: sampleStatuses[(index - 1) % sampleStatuses.length], passage, tubes: `${(index % 8) + 2} / 10`, temperature: storage[2], review: "30 Jun 2027" });
}

const state = {
  records: loadRecords(),
  selectedId: "QC-2026-004",
  currentView: "dashboard"
};

function loadRecords() {
  try {
    const saved = window.localStorage.getItem("stock-culture-records");
    const savedRecords = saved ? JSON.parse(saved) : null;
    return Array.isArray(savedRecords) && savedRecords.length >= 50 ? savedRecords : [...seedRecords];
  } catch (error) {
    return [...seedRecords];
  }
}

// Browser Back may restore native select values from the page cache.
window.addEventListener('pageshow', () => {
  document.querySelectorAll('[data-record-action]').forEach(select => { select.value = ''; });
});

function persistRecords() {
  try { window.localStorage.setItem("stock-culture-records", JSON.stringify(state.records)); } catch (error) { /* Static mockup can continue without browser storage. */ }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  document.getElementById("toast-message").textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

// Capture the exact row shown in the Master List before its Entry navigation.
document.addEventListener("change", (event) => {
  const select = event.target.closest("[data-record-action]");
  if (!select || select.value !== "test") return;
  const selected = state.records.find(record => record.id === select.dataset.recordAction);
  if (selected) {
    try { sessionStorage.setItem("qc-entry-selected-record", JSON.stringify(selected)); }
    catch (error) { showToast("Unable to pass the selected record to Entry. Browser storage is unavailable."); }
  }
}, true);

function closeAcceptanceModal() {
  document.querySelector(".acceptance-edit-backdrop")?.remove();
}

function openAcceptanceModal(recordId) {
  const record = state.records.find((item) => item.id === recordId);
  if (!record) return;
  closeAcceptanceModal();
  const saved = record.acceptance || {};
  const passageNumber = String(record.passage || "0").replace(/^P/i, "");
  const passageLabel = `${passageNumber} · ${passageNumber === "0" ? "Original reference" : passageNumber === "1" ? "Reference stock" : "Working stock"}`;
  const savedRegistration = record.registration || { organism: record.name, passage: passageLabel, atcc: (record.name.match(/ATCC\s+\d+/i) || [record.code])[0], batch: record.batch, manufacturer: record.manufacturer, purchaseDate: "", receivedDate: "", expiryDate: "", orderedAmount: String(record.tubes || "").split("/").pop()?.trim(), tubeCount: String(record.tubes || "").split("/").pop()?.trim(), condition: "", coldChain: "", comment: "", storage: `${record.storage} · ${record.temperature}`, rack: record.location, endorsedBy: "", releaseToStorage: record.status === "Active" };
  const backdrop = document.createElement("div");
  backdrop.className = "acceptance-edit-backdrop";
  backdrop.innerHTML = `<section class="acceptance-edit-modal" role="dialog" aria-modal="true" aria-labelledby="acceptance-edit-title">
    <div class="acceptance-edit-head"><div><span class="eyebrow accent-eyebrow">Complete QC record</span><h2 id="acceptance-edit-title">Update QC organism</h2><p>${record.name} · ${record.id}</p></div><button type="button" class="acceptance-edit-close" aria-label="Close">×</button></div>
    <form id="acceptance-edit-form">
    <section class="acceptance-edit-section"><h3><span>01</span> Organism Identification</h3><div class="acceptance-edit-grid">
      <label class="field"><span>QC organism <em>*</em></span><select name="organism" required><option value="">Select organism</option><option>Escherichia coli ATCC 25922</option><option>Staphylococcus aureus ATCC 29213</option><option>Enterococcus faecalis ATCC 29212</option><option>Pseudomonas aeruginosa ATCC 27853</option></select></label>
      <label class="field"><span>Passage number <em>*</em></span><select name="passage" required><option value="">Select passage</option><option>0 · Original reference</option><option>1 · Reference stock</option><option>2 · Working stock</option><option>3 · Working stock</option></select></label>
      <label class="field"><span>ATCC <em>*</em></span><input name="atcc" required></label>
      <label class="field"><span>Batch / lot <em>*</em></span><input name="batch" required></label>
      <label class="field"><span>Manufacturer / source <em>*</em></span><input name="manufacturer" required></label>
      <label class="field"><span>Purchase date</span><input name="purchaseDate" type="date"></label>
      <label class="field"><span>Received date</span><input name="receivedDate" type="date"></label>
      <label class="field"><span>Expiry / review date</span><input name="expiryDate" type="date"></label>
    </div></section>
    <section class="acceptance-edit-section"><h3><span>02</span> Acceptance Testing</h3><div class="acceptance-edit-grid">
      <label class="field"><span>Plate / media <em>*</em></span><select name="plate" required><option value="">Select media</option><option>Blood agar plate</option><option>Mueller-Hinton agar</option><option>MacConkey agar</option><option>Sabouraud dextrose agar</option></select></label>
      <label class="field"><span>Description</span><input name="description" placeholder="Free-text description"></label>
      <label class="field"><span>Lot number <em>*</em></span><input name="lot" required placeholder="e.g. MHA-26-041"></label>
      <label class="field"><span>Organism name observed</span><select name="observedOrganism"><option value="">Select result</option><option>Matches certificate</option><option>Does not match certificate</option><option>Not performed</option></select></label>
      <label class="field"><span>Method identification <em>*</em></span><select name="method" required><option value="">Select method</option><option>Biochemical identification</option><option>MALDI-TOF</option><option>Microscopy &amp; staining</option><option>Reference certificate only</option></select></label>
      <label class="field"><span>Bio number</span><input name="bioNumber" placeholder="e.g. BIO-8841"></label>
      <label class="field"><span>Incubation description</span><select name="incubation"><option value="">Select incubation</option><option>35–37 °C for 18–24 hours</option><option>35–37 °C for 24–48 hours</option><option>Room temperature</option><option>Other condition</option></select></label>
      <label class="field"><span>Gram stain</span><select name="gramStain"><option value="">Select result</option><option>Gram positive</option><option>Gram negative</option><option>Not performed</option></select></label>
      <label class="field"><span>Identification</span><select name="identification"><option value="">Select identification</option><option>Confirmed</option><option>Presumptive</option><option>Not identified</option></select></label>
      <label class="field"><span>Performed by</span><select name="performedBy"><option value="">Select user</option><option>Sarah A.</option><option>Dr. Amir R.</option><option>Nurul H.</option></select></label>
      <label class="field"><span>Reviewed by</span><select name="reviewedBy"><option value="">Select reviewer</option><option>Dr. Amir R.</option><option>Dr. Mei L.</option><option>Sarah A.</option></select></label>
      <label class="field acceptance-edit-result"><span>Acceptance result <em>*</em></span><select name="result" required><option value="">Select result</option><option>Pass — accepted for stock preparation</option><option>Conditional — review required</option><option>Fail — quarantine</option></select></label>
    </div></section>
    <section class="acceptance-edit-section"><h3><span>03</span> Inspection Checklist</h3><div class="acceptance-edit-grid">
      <label class="field"><span>Ordered amount <em>*</em></span><input name="orderedAmount" type="number" min="1" required></label>
      <label class="field"><span>Number of stock culture vials <em>*</em></span><input name="tubeCount" type="number" min="1" required></label>
      <label class="field"><span>Condition of package / vial <em>*</em></span><select name="condition" required><option value="">Select condition</option><option>Intact — no deviation</option><option>Minor packaging damage</option><option>Temperature excursion</option><option>Leak / contamination suspected</option></select></label>
      <label class="field"><span>Cold-chain reading</span><input name="coldChain" placeholder="e.g. 4.2 °C on receipt"></label>
      <label class="field acceptance-edit-wide"><span>Inspection comment</span><textarea name="comment" rows="3"></textarea></label>
    </div></section>
    <section class="acceptance-edit-section"><h3><span>04</span> Storage &amp; Governance</h3><div class="acceptance-edit-grid">
      <label class="field"><span>Refrigerator / freezer</span><select name="storage"><option value="">Select location</option><option>Freezer 01 · −80 °C</option><option>Freezer 02 · −20 °C</option><option>Refrigerator 01 · 2–8 °C</option></select></label>
      <label class="field"><span>Rack and box</span><select name="rack"><option value="">Select rack / box</option><option>Rack A · Box 04</option><option>Rack B · Box 02</option><option>Rack C · Box 07</option><option>Rack D · Box 01</option></select></label>
      <label class="field"><span>Endorsed by</span><select name="endorsedBy"><option value="">Select endorser</option><option>Dr. Mei L.</option><option>Laboratory manager</option></select></label>
      <label class="acceptance-release"><input name="releaseToStorage" type="checkbox"><span>Release to storage after acceptance</span></label>
    </div></section>
    <div class="acceptance-edit-note"><span>i</span><p>Changes update this QC organism record and its status in the register.</p></div><div class="acceptance-edit-actions"><button class="button button-ghost acceptance-edit-cancel" type="button">Cancel</button><button class="button button-primary" type="submit">Update QC organism</button></div></form>
  </section>`;
  document.body.appendChild(backdrop);
  const form = backdrop.querySelector("form");
  Object.entries(savedRegistration).forEach(([name, value]) => { if (!form.elements[name] || value == null) return; if (form.elements[name].type === "checkbox") form.elements[name].checked = Boolean(value); else form.elements[name].value = value; });
  Object.entries(saved).forEach(([name, value]) => { if (form.elements[name] && value != null) form.elements[name].value = value; });
  backdrop.querySelector(".acceptance-edit-close").addEventListener("click", closeAcceptanceModal);
  backdrop.querySelector(".acceptance-edit-cancel").addEventListener("click", closeAcceptanceModal);
  backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closeAcceptanceModal(); });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    record.registration = { organism: data.get("organism"), passage: data.get("passage"), atcc: data.get("atcc"), batch: data.get("batch"), manufacturer: data.get("manufacturer"), purchaseDate: data.get("purchaseDate"), receivedDate: data.get("receivedDate"), expiryDate: data.get("expiryDate"), orderedAmount: data.get("orderedAmount"), tubeCount: data.get("tubeCount"), condition: data.get("condition"), coldChain: data.get("coldChain"), comment: data.get("comment"), storage: data.get("storage"), rack: data.get("rack"), endorsedBy: data.get("endorsedBy"), releaseToStorage: data.get("releaseToStorage") === "on" };
    record.acceptance = { plate: data.get("plate"), description: data.get("description"), lot: data.get("lot"), observedOrganism: data.get("observedOrganism"), method: data.get("method"), bioNumber: data.get("bioNumber"), incubation: data.get("incubation"), gramStain: data.get("gramStain"), identification: data.get("identification"), performedBy: data.get("performedBy"), reviewedBy: data.get("reviewedBy"), result: data.get("result") };
    record.name = record.registration.organism;
    record.code = record.registration.atcc;
    record.batch = record.registration.batch;
    record.manufacturer = record.registration.manufacturer;
    record.purchase = record.registration.purchaseDate ? formatDate(record.registration.purchaseDate) : record.purchase;
    record.received = record.registration.receivedDate ? formatDate(record.registration.receivedDate) : record.received;
    record.review = record.registration.expiryDate ? formatDate(record.registration.expiryDate) : record.review;
    record.passage = String(record.registration.passage || record.passage).split(" ")[0].replace(/^([0-9])$/, "P$1");
    record.tubes = `${record.registration.tubeCount} / ${record.registration.tubeCount}`;
    record.storage = String(record.registration.storage || "").split("·")[0].trim() || record.storage;
    record.location = record.registration.rack || record.location;
    record.temperature = record.storage.includes("Freezer 02") ? "−20 °C" : record.storage.includes("Freezer") ? "−80 °C" : "2–8 °C";
    const result = String(record.acceptance.result || "");
    record.status = !record.registration.releaseToStorage ? "Pending acceptance" : result.startsWith("Pass") ? "Active" : result.startsWith("Conditional") ? "Review due" : "Quarantine";
    persistRecords();
    renderTable();
    closeAcceptanceModal();
    showToast(`QC organism ${record.id} updated successfully.`);
  });
  form.elements.plate.focus();
}

const acceptanceModalStyle = document.createElement("style");
acceptanceModalStyle.textContent = `.acceptance-edit-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:rgba(20,39,57,.52)}.acceptance-edit-modal{width:min(1000px,100%);max-height:calc(100vh - 40px);overflow:auto;padding:24px;border:1px solid #d8e3ec;border-radius:14px;background:#fff;box-shadow:0 24px 65px rgba(20,45,70,.28)}.acceptance-edit-head{display:flex;justify-content:space-between;gap:18px;margin-bottom:20px}.acceptance-edit-head h2{margin:3px 0;color:#18314d;font-size:22px}.acceptance-edit-head p{margin:5px 0 0;color:#7c91a8;font-size:12px}.acceptance-edit-close{width:35px;height:35px;flex:0 0 35px;border:1px solid #d4e0ec;border-radius:8px;color:#607991;background:#fff;font-size:21px;cursor:pointer}.acceptance-edit-section{margin-top:14px;padding:18px;border:1px solid #e0e8ef;border-radius:11px;background:#fbfdff}.acceptance-edit-section:first-of-type{margin-top:0}.acceptance-edit-section h3{display:flex;align-items:center;gap:9px;margin:0 0 16px;color:#3e5872;font-size:14px}.acceptance-edit-section h3 span{width:25px;height:25px;display:grid;place-items:center;border-radius:7px;color:#1974d6;background:#e7f2fd;font-size:10px}.acceptance-edit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.acceptance-edit-grid .field input,.acceptance-edit-grid .field select,.acceptance-edit-grid .field textarea{width:100%;min-height:40px;padding:8px 10px;border:1px solid #d4e0ec;border-radius:8px;background:#fff;color:#526a84;font:inherit}.acceptance-edit-result{grid-column:span 2}.acceptance-edit-wide{grid-column:1/-1}.acceptance-release{grid-column:1/-1;display:flex;align-items:center;gap:9px;color:#526a84;font-size:12px;font-weight:700}.acceptance-release input{width:16px;height:16px}.acceptance-edit-note{display:flex;gap:9px;margin-top:18px;padding:11px;border-radius:8px;color:#5f7386;background:#f0f7fc;font-size:11px}.acceptance-edit-note span{width:18px;height:18px;display:grid;place-items:center;border-radius:50%;color:#fff;background:#378bc5}.acceptance-edit-note p{margin:1px 0}.acceptance-edit-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid #e2eaf1}@media(max-width:760px){.acceptance-edit-backdrop{padding:10px}.acceptance-edit-modal{padding:17px}.acceptance-edit-grid{grid-template-columns:1fr}.acceptance-edit-result,.acceptance-edit-wide{grid-column:auto}.acceptance-edit-actions{display:grid;grid-template-columns:1fr}.acceptance-edit-actions .button{width:100%}}`;
document.head.appendChild(acceptanceModalStyle);

function setView(view, recordId = state.selectedId) {
  if (view === "detail" && recordId) {
    state.selectedId = recordId;
    updateDetail(recordId);
  }
  state.currentView = view;
  document.querySelectorAll("[data-view-panel]").forEach((panel) => panel.classList.toggle("is-visible", panel.dataset.viewPanel === view));
  document.querySelectorAll(".nav-item[data-view]").forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
  const labels = { dashboard: "QC organisms", register: "Register QC organism", detail: "Organism record", acceptance: "Acceptance testing", storage: "Storage map", passages: "Passage log", subculture: "Process subculture", usage: "Usage & disposal" };
  document.getElementById("breadcrumb-current").textContent = labels[view] || "QC organisms";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateDetail(recordId) {
  const record = state.records.find((item) => item.id === recordId) || seedRecords[0];
  const fields = {
    "detail-title": record.name,
    "detail-subtitle": `${record.id} · ${record.passage === "P0" ? "Original reference" : "Reference stock"} · Last updated ${record.registered === "—" ? record.received : record.registered}`,
    "detail-card-title": record.name,
    "detail-code": `${record.code} · Batch ${record.batch}`,
    "detail-passage": record.passage,
    "detail-tubes": record.tubes,
    "detail-storage": record.temperature,
    "detail-review": record.review,
    "detail-manufacturer": record.manufacturer,
    "detail-purchase": record.purchase,
    "detail-received": record.received
  };
  Object.entries(fields).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value; });
  const status = document.getElementById("detail-status");
  status.textContent = record.status;
  status.className = `status-badge ${record.status === "Active" ? "status-active" : record.status === "Review due" ? "status-review" : "status-pending"}`;
}

function statusBadge(status) {
  const klass = status === "Active" ? "status-active" : status === "Review due" ? "status-review" : status === "Pending acceptance" ? "status-pending" : "status-quarantine";
  return `<span class="status-badge ${klass}">${status}</span>`;
}

function renderTable() {
  const query = document.getElementById("global-search").value.trim().toLowerCase();
  const status = document.getElementById("status-filter").value;
  const storage = document.getElementById("storage-filter").value;
  const filtered = state.records.filter((record) => {
    const matchesQuery = !query || [record.id, record.name, record.code, record.batch, record.manufacturer].join(" ").toLowerCase().includes(query);
    const matchesStatus = status === "all" || record.status === status;
    const matchesStorage = storage === "all" || record.storage === storage;
    return matchesQuery && matchesStatus && matchesStorage;
  });
  const tbody = document.getElementById("organism-rows");
  tbody.innerHTML = filtered.map((record) => `<tr>
    <td><select class="action-select" data-record-action="${record.id}" aria-label="Actions for ${record.name}"><option value="" selected disabled hidden>Action</option><option value="acceptance">Edit QC Acceptance</option><option value="test">QC Organism</option><option value="storage">Storage</option><option value="qc-trail">QC Trail</option></select></td>
    <td><strong>${record.id}</strong></td>
    <td><strong>${record.name}</strong><small>${record.passage === "P0" ? "Original reference" : "Reference stock"}</small></td>
    <td>${record.batch}</td><td>${record.manufacturer}</td><td>${record.registered}</td><td>${record.purchase}</td><td>${record.received}</td><td>${record.storage}</td><td>${record.location}</td><td>${statusBadge(record.status)}</td>
  </tr>`).join("");
  document.getElementById("empty-state").classList.toggle("is-hidden", filtered.length > 0);
  document.getElementById("organism-table").classList.toggle("is-hidden", filtered.length === 0);
  document.getElementById("result-summary").textContent = `Showing ${filtered.length} of ${state.records.length} records`;
  tbody.querySelectorAll("[data-record-action]").forEach((select) => select.addEventListener("change", () => {
    const value = select.value;
    const id = select.dataset.recordAction;
    if (value === "acceptance") openAcceptanceModal(id);
    else if (value) setView(value, id);
    select.value = "";
  }));
}

function handleRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const required = [...form.querySelectorAll("[name][required], [name]")].filter((field) => ["organismId", "organism", "passage", "code", "batch", "manufacturer", "purchaseDate", "receivedDate", "plate", "plateLot", "method", "acceptanceResult", "orderedAmount", "tubeCount", "condition", "storage", "rack", "performedDate", "performedBy"].includes(field.name));
  const missing = required.filter((field) => !field.value.trim());
  if (missing.length) {
    missing[0].focus();
    showToast(`Lengkapkan ${missing.length} medan wajib sebelum mendaftar.`);
    return;
  }
  const data = new FormData(form);
  const nextId = `QC-2026-${String(state.records.length + 11).padStart(3, "0")}`;
  const storageText = data.get("storage").split("·")[0].trim();
  const record = { id: nextId, name: data.get("organism"), code: data.get("code"), batch: data.get("batch"), manufacturer: data.get("manufacturer"), registered: "27 Jul 2026", purchase: formatDate(data.get("purchaseDate")), received: formatDate(data.get("receivedDate")), storage: storageText, location: data.get("rack"), status: data.get("releaseToStorage") ? "Active" : "Pending acceptance", passage: (data.get("passage") || "P0").split(" ")[0], tubes: `${data.get("tubeCount")} / ${data.get("tubeCount")}`, temperature: storageText.includes("Freezer") ? (storageText.includes("02") ? "−20 °C" : "−80 °C") : "2–8 °C", review: data.get("expiryDate") ? formatDate(data.get("expiryDate")) : "To be reviewed" };
  state.records = [record, ...state.records];
  state.selectedId = record.id;
  persistRecords();
  renderTable();
  updateDetail(record.id);
  showToast(data.get("releaseToStorage") ? "QC organism registered and released to storage." : "Draft saved in quarantine queue.");
  window.setTimeout(() => setView("detail", record.id), 500);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function exportView() {
  const header = ["Organism ID", "Organism Name", "Batch/Lot Number", "Manufacturer", "Registered date", "Purchase date", "Received date", "Storage", "Rack / box", "Status"];
  const rows = state.records.map((record) => [record.id, record.name, record.batch, record.manufacturer, record.registered, record.purchase, record.received, record.storage, record.location, record.status]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = "qc-organism-register.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Register view exported as CSV.");
}

function setupDetailTabs() {
  document.querySelectorAll("[data-detail-tab]").forEach((tab) => tab.addEventListener("click", () => {
    const target = tab.dataset.detailTab;
    document.querySelectorAll("[data-detail-tab]").forEach((item) => item.classList.toggle("is-active", item === tab));
    document.querySelectorAll("[data-detail-panel]").forEach((panel) => panel.classList.toggle("is-visible", panel.dataset.detailPanel === target));
  }));
}

function ensureSubcultureView() {
  const usageView = document.getElementById("view-usage");
  if (!usageView || document.getElementById("view-subculture")) return;
  usageView.insertAdjacentHTML("beforebegin", `<section class="view" id="view-subculture" data-view-panel="subculture">
    <div class="page-heading register-heading"><div><button class="back-link" type="button" data-view="passages">← Back to passage log</button><span class="eyebrow accent-eyebrow">Controlled propagation</span><h1>Process subculture</h1><p>Create a traceable working stock from an accepted reference stock.</p></div><div class="heading-status"><span class="draft-pill"><span class="status-dot status-dot-amber"></span> Draft process</span><span class="record-reference">Next passage <strong>P3</strong></span></div></div>
    <div class="stepper" aria-label="Subculture progress"><div class="stepper-item is-active"><span>1</span><strong>Select source</strong></div><div class="stepper-line"></div><div class="stepper-item"><span>2</span><strong>Prepare culture</strong></div><div class="stepper-line"></div><div class="stepper-item"><span>3</span><strong>Verify purity</strong></div><div class="stepper-line"></div><div class="stepper-item"><span>4</span><strong>Release stock</strong></div></div>
    <form id="subculture-form" novalidate><div class="form-grid form-grid-top">
      <section class="card form-section"><div class="section-heading"><div class="section-number">01</div><div><span class="eyebrow">Traceable source</span><h2>Select source stock</h2><p>Only accepted, available stock can be used as the parent culture.</p></div><span class="result-pill result-pill-pending">Source required</span></div><div class="form-fields two-columns">
        <label class="field field-span-2"><span>Source organism <em>*</em></span><select name="sourceOrganism"><option value="">Select accepted stock</option><option>Escherichia coli ATCC 25922 · QC-2026-004 · P1</option><option>Staphylococcus aureus ATCC 29213 · QC-2026-006 · P1</option><option>Pseudomonas aeruginosa ATCC 27853 · QC-2026-008 · P2</option></select></label>
        <label class="field"><span>Source tube / loop ID <em>*</em></span><input name="sourceTube" placeholder="e.g. T04" /></label><label class="field"><span>New passage number <em>*</em></span><select name="newPassage"><option value="">Select passage</option><option>P2 · Working stock</option><option>P3 · Working stock</option><option>P4 · Working stock</option></select></label><label class="field"><span>Purpose <em>*</em></span><select name="subculturePurpose"><option value="">Select purpose</option><option>Routine QC working stock</option><option>Replacement stock</option><option>Method verification</option><option>Proficiency testing preparation</option></select></label><label class="field"><span>Date started <em>*</em></span><input name="subcultureDate" type="date" /></label>
      </div></section>
      <section class="card form-section"><div class="section-heading"><div class="section-number">02</div><div><span class="eyebrow">Growth conditions</span><h2>Prepare subculture</h2><p>Record the medium, incubation and quantity created.</p></div></div><div class="form-fields two-columns">
        <label class="field"><span>Media / plate <em>*</em></span><select name="subcultureMedia"><option value="">Select medium</option><option>Blood agar plate</option><option>Mueller-Hinton agar</option><option>MacConkey agar</option><option>Sabouraud dextrose agar</option></select></label><label class="field"><span>Media lot number</span><input name="subcultureMediaLot" placeholder="e.g. BAP-26-090" /></label><label class="field"><span>Incubation condition <em>*</em></span><select name="incubation"><option value="">Select condition</option><option>35 ± 2 °C · Ambient air</option><option>35 ± 2 °C · 5% CO₂</option><option>30 ± 2 °C · Ambient air</option><option>25 ± 2 °C · Ambient air</option></select></label><label class="field"><span>Incubation duration</span><input name="incubationDuration" placeholder="e.g. 18–24 hours" /></label><label class="field"><span>Number of tubes / loops <em>*</em></span><input name="subcultureQuantity" type="number" min="1" placeholder="e.g. 10" /></label><label class="field"><span>Prepared by <em>*</em></span><select name="subcultureBy"><option value="">Select user</option><option>Sarah A.</option><option>Dr. Amir R.</option><option>Nurul H.</option></select></label>
      </div></section>
    </div><div class="form-grid form-grid-bottom">
      <section class="card form-section"><div class="section-heading"><div class="section-number">03</div><div><span class="eyebrow">Release gate</span><h2>Verify purity &amp; identity</h2><p>Complete the check before the new working stock is released.</p></div><span class="result-pill result-pill-pending">Pending result</span></div><div class="form-fields two-columns"><label class="field"><span>Purity observation <em>*</em></span><select name="purityResult"><option value="">Select result</option><option>Pure growth — accepted</option><option>Mixed growth — quarantine</option><option>No growth — repeat process</option></select></label><label class="field"><span>Identity check</span><select name="identityCheck"><option value="">Select result</option><option>Matches source organism</option><option>Does not match source organism</option><option>Not performed</option></select></label><label class="field"><span>Method / evidence</span><select name="subcultureMethod"><option value="">Select method</option><option>Colony morphology</option><option>Microscopy &amp; staining</option><option>Biochemical identification</option><option>MALDI-TOF</option></select></label><label class="field"><span>Reviewed by <em>*</em></span><select name="subcultureReviewer"><option value="">Select reviewer</option><option>Dr. Amir R.</option><option>Dr. Mei L.</option><option>Sarah A.</option></select></label><label class="field field-span-2"><span>Observation / deviation comment</span><textarea name="subcultureComment" rows="4" placeholder="Document colony appearance, unexpected growth or corrective action."></textarea></label></div><div class="callout callout-info"><span class="callout-icon">i</span><span>Do not release a working stock when purity is mixed or identity is not confirmed. Keep it quarantined and start a deviation record.</span></div></section>
      <section class="card form-section"><div class="section-heading"><div class="section-number">04</div><div><span class="eyebrow">Traceable storage</span><h2>Release working stock</h2><p>Assign the new tubes to a box and make the passage available for QC use.</p></div></div><div class="form-fields two-columns"><label class="field"><span>Destination freezer <em>*</em></span><select name="subcultureStorage"><option value="">Select location</option><option>Freezer 01 · −80 °C</option><option>Freezer 02 · −20 °C</option><option>Refrigerator 01 · 2–8 °C</option></select></label><label class="field"><span>Rack and box <em>*</em></span><select name="subcultureRack"><option value="">Select rack / box</option><option>Rack A · Box 04</option><option>Rack B · Box 02</option><option>Rack C · Box 07</option><option>Rack D · Box 01</option></select></label><label class="field"><span>Position / label range</span><input name="labelRange" placeholder="e.g. A04-01 to A04-10" /></label><label class="field"><span>Review date</span><input name="subcultureReviewDate" type="date" /></label></div><div class="release-check"><label class="checkbox-row"><input type="checkbox" name="releaseSubculture" /><span></span><strong>Release to working stock after purity check</strong></label><small>Unchecked records the process as quarantine / draft.</small></div></section>
    </div><div class="form-actions"><button class="button button-ghost" type="button" data-view="passages">Close</button><div><button class="button button-secondary" type="button" id="save-subculture-draft">Save draft</button><button class="button button-primary" type="submit">Save subculture <span class="button-symbol">→</span></button></div></div></form>
  </section>`);
  const passageQuickAction = document.querySelector('.quick-action[data-view="passages"]');
  if (passageQuickAction) passageQuickAction.dataset.view = "subculture";
  const actionMenu = document.querySelector("[data-action-menu]");
  if (actionMenu && !actionMenu.querySelector('[data-view="subculture"]')) actionMenu.insertAdjacentHTML("beforeend", '<button type="button" data-view="subculture">Start subculture</button>');
  const passageButton = document.getElementById("add-passage");
  if (passageButton) passageButton.dataset.view = "subculture";
}

function handleSubculture(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const requiredNames = ["sourceOrganism", "sourceTube", "newPassage", "subculturePurpose", "subcultureDate", "subcultureMedia", "incubation", "subcultureQuantity", "subcultureBy", "purityResult", "subcultureReviewer", "subcultureStorage", "subcultureRack"];
  const missing = requiredNames.map((name) => form.elements[name]).filter((field) => field && !String(field.value).trim());
  if (missing.length) {
    missing[0].focus();
    showToast(`Lengkapkan ${missing.length} medan wajib untuk proses subculture.`);
    return;
  }
  const data = new FormData(form);
  const released = data.get("releaseSubculture") === "on" && String(data.get("purityResult")).startsWith("Pure");
  const passage = String(data.get("newPassage")).split(" ")[0];
  showToast(released ? `${passage} working stock released to storage.` : `${passage} subculture saved in quarantine.`);
  form.reset();
  window.setTimeout(() => setView("passages"), 500);
}

document.addEventListener("click", (event) => {
  const viewTrigger = event.target.closest("[data-view]");
  if (viewTrigger && !viewTrigger.matches("select")) {
    event.preventDefault();
    setView(viewTrigger.dataset.view, viewTrigger.dataset.recordId || state.selectedId);
  }
  const toggle = event.target.closest("[data-action-toggle]");
  if (toggle) toggle.closest(".action-menu").classList.toggle("is-open");
  if (!event.target.closest(".action-menu")) document.querySelectorAll(".action-menu.is-open").forEach((menu) => menu.classList.remove("is-open"));
});

document.getElementById("global-search").addEventListener("input", renderTable);
document.getElementById("status-filter").addEventListener("change", renderTable);
document.getElementById("storage-filter").addEventListener("change", renderTable);
document.getElementById("apply-filters").addEventListener("click", () => { renderTable(); showToast("Filters applied."); });
document.getElementById("clear-filters").addEventListener("click", () => { document.getElementById("global-search").value = ""; document.getElementById("status-filter").value = "all"; document.getElementById("storage-filter").value = "all"; renderTable(); showToast("Filters cleared."); });
document.getElementById("export-button").addEventListener("click", exportView);
document.getElementById("register-form").addEventListener("submit", handleRegister);
document.getElementById("save-draft").addEventListener("click", () => showToast("Draft saved locally for this mockup."));
document.getElementById("certificate-file").addEventListener("change", (event) => { const file = event.target.files[0]; if (!file) return; document.querySelector("#selected-file strong").textContent = file.name; document.getElementById("selected-file").classList.remove("is-hidden"); showToast("Certificate attached to draft."); });
document.getElementById("remove-file").addEventListener("click", () => { document.getElementById("certificate-file").value = ""; document.getElementById("selected-file").classList.add("is-hidden"); });
document.getElementById("log-temperature").addEventListener("click", () => showToast("Temperature log form would open here."));
document.getElementById("add-passage").addEventListener("click", () => showToast("Opening subculture process."));
document.getElementById("record-usage").addEventListener("click", () => { setView("usage"); document.getElementById("usage-organism").focus(); });
document.getElementById("reset-usage").addEventListener("click", () => { document.getElementById("usage-tube").value = ""; document.getElementById("usage-comment").value = ""; showToast("Movement form cleared."); });
document.getElementById("save-usage").addEventListener("click", () => { const type = document.getElementById("usage-type").value; const tube = document.getElementById("usage-tube").value || "tube not specified"; showToast(`${type} saved for ${tube}.`); document.getElementById("usage-tube").value = ""; document.getElementById("usage-comment").value = ""; });
ensureSubcultureView();
document.getElementById("subculture-form").addEventListener("submit", handleSubculture);
document.getElementById("save-subculture-draft").addEventListener("click", () => showToast("Subculture draft saved locally for this mockup."));
setupDetailTabs();
renderTable();
updateDetail(state.selectedId);
