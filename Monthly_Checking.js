document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("monthly-checking-form");
  const identificationTest = form?.elements.identificationTest;
  const expectedResult = form?.elements.expectedResult;
  const resultOptionsByTest = {
    "Gram Stain": ["Gram Stain Positive Cocci in Cluster", "Gram Positive Cocci in Chain", "Gram Positive Rod", "Yeast / Fungal Hypae", "Gram Negative Rod", "Gram Negative Cocci"], Catalase: ["Positive (Produce Bubble)", "Negative (No Produce Bubbles)", "Not Applicable"], Oxidase: ["Positive (Dark Purple)", "Negative (No Color)", "Not Applicable"], Coagulase: ["Positive (Clotting)", "Negative (No Clotting)", "Not Applicable"], "PYR Hydrolysis": ["Positive (Red or Pink Color)", "Negative (No Color)", "Not Applicable"], "Streptococcal Grouping": ["Pass", "Fail"], "India Ink": ["Pass", "Fail"], Staphylase: ["Pass", "Fail"], "Germ Tube": ["Pass", "Fail"], Cefinase: ["Pass", "Fail"], "Motility Test Medium": ["Pass", "Fail"], "Triple Sugar Iron": ["Pass", "Fail"], Urease: ["Pass", "Fail"], "Bile Esculin Agar": ["Pass", "Fail"], "Simmons Citrate Agar": ["Pass", "Fail"], "Moeller Decarboxylase 2% Ornithine": ["Pass", "Fail"], "V Factor": ["Pass", "Fail"], "X Factor": ["Pass", "Fail"], "XV Factor": ["Pass", "Fail"], "MTZ Disc": ["Pass", "Fail"], "Optochin Disc": ["Pass", "Fail"], "Bacitracin 10 ug Disc": ["Pass", "Fail"], Malditof: ["Pass", "Fail"], Vitek: ["Pass", "Fail"]
  };
  resultOptionsByTest["Streptococcal Grouping"] = ["Group A", "Group B", "Group C", "Group D", "Group E", "Group F", "Group G"];
  resultOptionsByTest["India Ink"] = ["Positive (Capsules Around Organisms Visible as a halo)", "Negative (No Capsule Organisms Visible as a halo)", "Not Applicable"];
  resultOptionsByTest.Staphylase = ["Positive (Clumping)", "Negative (No Clumping)", "Not Applicable"];
  resultOptionsByTest["Germ Tube"] = ["Positive (Formation of Germ Tube)", "Negative (No Formation of Germ Tube)", "Not Applicable"];
  resultOptionsByTest.Cefinase = ["Positive (Red or Pink Color)", "Negative (No Color)", "Not Applicable"];
  resultOptionsByTest["Motility Test Medium"] = ["Positive (Motile)", "Negative (Non-Motile)", "Not Applicable"];
  if (identificationTest && expectedResult) identificationTest.addEventListener("change", () => {
    const values = resultOptionsByTest[identificationTest.value] || [];
    expectedResult.innerHTML = values.length ? `<option value="">Select expected result</option>${values.map((value) => `<option>${value}</option>`).join("")}` : '<option value="">Select identification test first</option>';
    expectedResult.disabled = !values.length;
  });
  const closeButton = document.getElementById("monthly-close");
  if (closeButton) closeButton.addEventListener("click", () => {
    if (window.confirm("Data not Save. Sure Want to Close?")) { form.reset(); window.location.href = "index.html"; }
  });
  const reviewButton = document.getElementById("monthly-review");
  if (reviewButton) reviewButton.addEventListener("click", () => { window.alert("Successfully Reviewed"); window.location.href = "index.html"; });
  const saveTrailEvent = (status) => { const events = (() => { try { return JSON.parse(localStorage.getItem('qc-trail-events') || '[]'); } catch { return []; } })(); events.push({ recordId: new URLSearchParams(window.location.search).get('record'), process: 'Culture Checking', status, date: new Date().toLocaleDateString('en-GB'), user: form?.elements.performedBy?.value || '—', update: 'Monthly checking updated.', details: [`Identification: ${identificationTest?.value || '—'}`, `Expected result: ${expectedResult?.value || '—'}`] }); localStorage.setItem('qc-trail-events', JSON.stringify(events)); };
  const showPerformModal = () => {
    const modal = document.createElement("div");
    modal.className = "monthly-modal-backdrop";
    modal.innerHTML = '<div class="monthly-modal" role="dialog" aria-modal="true"><div class="monthly-modal-icon">✓</div><h2>Perform successful</h2><p>Monthly stock culture checking saved successfully.</p><div class="monthly-modal-actions"><button class="button button-secondary" type="button" data-modal-ok>Okay</button><button class="button button-review" type="button" data-modal-review>Perform &amp; Review</button></div></div>';
    document.body.appendChild(modal);
    modal.querySelector("[data-modal-ok]").addEventListener("click", () => { saveTrailEvent('Performed'); form.reset(); modal.remove(); });
    modal.querySelector("[data-modal-review]").addEventListener("click", () => { saveTrailEvent('Reviewed'); form.reset(); window.location.href = "index.html"; });
  };
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    showPerformModal();
  });
});
