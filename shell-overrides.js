document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;
  nav.innerHTML = `
    <span class="nav-label">MAIN MENU</span>
    <button class="nav-item is-active" type="button" data-dashboard><span class="nav-icon">*</span><span>Dashboard</span></button>
    <button class="nav-item" type="button"><span class="nav-icon">+</span><span>Registration</span></button>
    <button class="nav-item" type="button"><span class="nav-icon">H</span><span>Haematology</span></button>
    <button class="nav-item" type="button"><span class="nav-icon">A</span><span>Chemical Pathology</span></button>
    <button class="nav-item" type="button"><span class="nav-icon">S</span><span>Immunology and Serology</span></button>
    <button class="nav-item" type="button" data-module="microbiology"><span class="nav-icon">M</span><span>Microbiology</span></button>
    <button class="nav-item" type="button"><span class="nav-icon">C</span><span>Cytology</span></button>
    <button class="nav-item" type="button"><span class="nav-icon">H</span><span>Histopathology</span></button>
    <button class="nav-item" type="button"><span class="nav-icon">~</span><span>Statistics</span></button>
    <button class="nav-item" type="button"><span class="nav-icon">*</span><span>System Settings</span></button>
    <span class="nav-label nav-label-utility">UTILITY</span>
    <button class="nav-item" type="button"><span class="nav-icon">&gt;</span><span>Sign Out</span></button>`;

  const isQcOrganismPage = /(^|[\\/])index\.html$/i.test(window.location.pathname) || window.location.pathname === '';
  const isMainPage = /(^|[\\/])Main_Page\.html$/i.test(window.location.pathname);
  nav.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('is-active', item.dataset.module === 'microbiology'));

  const pageContainer = document.querySelector('.page-container');
  if (!pageContainer) return;
  let originalPage = pageContainer.innerHTML;
  if (isQcOrganismPage) {
    setTimeout(() => {
      const registerPanel = document.querySelector('#view-register');
      if (registerPanel) registerPanel.remove();
      originalPage = pageContainer.innerHTML;
    }, 0);
    document.addEventListener('click', (event) => {
      const registerTrigger = event.target.closest('[data-view="register"]');
      if (registerTrigger) { event.preventDefault(); event.stopPropagation(); window.location.href = 'Register_QC.html'; }
      const subcultureTrigger = event.target.closest('[data-view="subculture"]');
      if (subcultureTrigger) { event.preventDefault(); event.stopPropagation(); window.location.href = 'Subculture.html'; }
      const monthlyTrigger = event.target.closest('[data-view="monthly-checking"]');
      if (monthlyTrigger) { event.preventDefault(); event.stopPropagation(); window.location.href = 'Monthly_Checking.html'; }
    }, true);
    document.addEventListener('change', (event) => {
      const actionTrigger = event.target.closest('[data-record-action]');
      if (actionTrigger && actionTrigger.value === 'subculture') { event.preventDefault(); event.stopPropagation(); window.location.href = 'Subculture.html?record=' + encodeURIComponent(actionTrigger.dataset.recordAction || ''); }
      if (actionTrigger && actionTrigger.value === 'monthly-checking') { event.preventDefault(); event.stopPropagation(); window.location.href = 'Monthly_Checking.html?record=' + encodeURIComponent(actionTrigger.dataset.recordAction || ''); }
      if (actionTrigger && actionTrigger.value === 'storage') { event.preventDefault(); event.stopPropagation(); window.location.href = 'Storage.html?record=' + encodeURIComponent(actionTrigger.dataset.recordAction || ''); }
      if (actionTrigger && actionTrigger.value === 'qc-trail') { event.preventDefault(); event.stopPropagation(); window.location.href = 'QC_Trail.html?record=' + encodeURIComponent(actionTrigger.dataset.recordAction || ''); }
      if (actionTrigger && actionTrigger.value === 'test') { event.preventDefault(); event.stopPropagation(); const selectedId = actionTrigger.dataset.recordAction || ''; actionTrigger.value = ''; window.location.href = 'Entry.html?record=' + encodeURIComponent(selectedId); }
    }, true);
  }
  const submenu = `
    <section class="module-submenu" aria-label="Microbiology submenu">
      <div class="module-submenu-heading"><strong>MICRO</strong><em>Submenu</em></div>
      <div class="module-card-grid">
        <button class="module-card" type="button"><span class="module-card-icon">&gt;</span><span><strong>Process Status</strong><em>6001 – Process Status</em></span></button>
        <button class="module-card" type="button"><span class="module-card-icon">/</span><span><strong>Entry</strong><em>6002 – Entry</em></span></button>
        <button class="module-card" type="button"><span class="module-card-icon">&gt;</span><span><strong>Unit Receiving</strong><em>6003 – Unit Receiving</em></span></button>
        <button class="module-card" type="button"><span class="module-card-icon">/</span><span><strong>Outsource</strong><em>6004 – Outsource</em></span></button>
        <button class="module-card" type="button"><span class="module-card-icon">&gt;</span><span><strong>View Record</strong><em>6005 – View Record</em></span></button>
        <button class="module-card" type="button"><span class="module-card-icon">#</span><span><strong>Discard Sample</strong><em>6006 – Discard Sample</em></span></button>
        <button class="module-card" type="button"><span class="module-card-icon">&gt;</span><span><strong>Print Barcode and Label</strong><em>6009 – Print Barcode and Label</em></span></button>
        <button class="module-card" type="button"><span class="module-card-icon">&gt;</span><span><strong>WHONET</strong><em>6010 – WHONET</em></span></button>
        <button class="module-card module-card-primary" type="button" data-open-qc><span class="module-card-icon">M</span><span><strong>QC Organism</strong><em>Stock culture control</em></span></button>
        <button class="module-card module-card-primary" type="button" data-open-qc-media><span class="module-card-icon">M</span><span><strong>QC Media</strong><em>Culture media control</em></span></button>
      </div>
    </section>`;
  const showSubmenu = () => {
    pageContainer.innerHTML = submenu;
    nav.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('is-active', item.dataset.module === 'microbiology'));
    const crumb = document.querySelector('#breadcrumb-current');
    if (crumb) crumb.textContent = 'MICRO';
    pageContainer.querySelectorAll('[data-open-qc]').forEach((button) => button.addEventListener('click', () => { window.location.href = 'index.html'; }));
    pageContainer.querySelectorAll('[data-open-qc-media]').forEach((button) => button.addEventListener('click', () => { window.location.href = 'QC_Media.html'; }));
  };
  const showDashboard = () => {
    pageContainer.innerHTML = originalPage;
    nav.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('is-active', item.hasAttribute('data-dashboard')));
  };
  const showUnavailable = (label) => {
    pageContainer.innerHTML = `<section class="unavailable-page"><h1>This Page is not available</h1><p>${label} module is not included in this mockup.</p></section>`;
    nav.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('is-active', item.textContent.trim() === label));
    const crumb = document.querySelector('#breadcrumb-current');
    if (crumb) crumb.textContent = label;
  };
  nav.querySelector('[data-module="microbiology"]').addEventListener('click', () => {
    if (isMainPage) showSubmenu();
    else window.location.href = 'Main_Page.html';
  });
  nav.querySelector('[data-dashboard]').addEventListener('click', () => showUnavailable('Dashboard'));
  nav.querySelectorAll('.nav-item:not([data-view]):not([data-module])').forEach((item) => item.addEventListener('click', () => showUnavailable(item.textContent.trim())));
  if (isMainPage) showSubmenu();
});
