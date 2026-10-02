(function () {
  const sections = [
    { id: 'cultivos', label: 'Cultivos' },
    { id: 'variedades', label: 'Variedades' },
    { id: 'problemas', label: 'Plagas y problemas' },
    { id: 'insumos', label: 'Insumos' },
    { id: 'calendario', label: 'Calendarios' },
    { id: 'zonas', label: 'Zonas' }
  ];
  let current = 'cultivos';
  const state = AgroService.getState();
  const fromDb = AgroService.catalogFromDb();

  document.getElementById('admin-stats').innerHTML = [
    ['Cultivos', (state.cultivos || []).length],
    ['Insumos', (state.insumos || []).length],
    ['Problemas', (state.problemas || []).length],
    ['Calendarios', (state.calendario || []).length]
  ].map(([label, value]) => '<article class="card"><span class="muted">' + label + '</span><strong class="stat-value">' + value + '</strong></article>').join('');

  function items() {
    const data = AgroService.getState()[current] || [];
    if (current === 'zonas') {
      return AgroService.getZonas().map((name, index) => ({ id: 'z' + index, name, active: true }));
    }
    return data;
  }

  function titleOf(item) {
    return item.name || item.crop || item.id;
  }

  function detailOf(item) {
    if (current === 'cultivos') {
      return (item.family || '') + ' · ' + (item.density || '—') + ' ' + (item.unit || 'kg') + '/ha · ' + (item.yield || '—') + ' t/ha';
    }
    if (current === 'insumos') {
      return (item.type || '') + ' · ' + (item.crop || '') + (item.problem ? ' · ' + item.problem : '') + ' · ' + (item.dose || '') + ' ' + (item.unit || '') + '/ha';
    }
    if (current === 'problemas') return (item.type || '') + ' · ' + (item.description || '').slice(0, 80);
    if (current === 'variedades') return (item.crop || '') + (item.zone ? ' · ' + item.zone : '');
    if (current === 'calendario') {
      return (item.crop || '') + ' · ' + (item.zone || '') + ' · siembra ' + AgroService.monthRange(item.sowStart || item.sow, item.sowEnd || item.sow);
    }
    return item.name || '';
  }

  function renderTabs() {
    document.getElementById('tabs').innerHTML = sections.map((item) =>
      '<button class="' + (item.id === current ? 'button' : 'button secondary') + '" type="button" data-sec="' + item.id + '">' + item.label + '</button>'
    ).join('');
  }

  function renderTable() {
    const section = sections.find((item) => item.id === current);
    document.getElementById('admin-title').textContent = section.label;
    document.getElementById('admin-hint').textContent = fromDb
      ? 'Estos registros vienen de la base de datos y alimentan las pantallas del agricultor. Para crear o editar, usa Django Admin.'
      : 'Catálogo de demostración local. Ejecuta seed_catalog para cargar la base.';
    document.getElementById('table').innerHTML = items().map((item) =>
      '<div class="admin-row"><div><strong>' + titleOf(item) + '</strong><small>' + detailOf(item) + '</small></div>' +
      '<span class="badge ' + (item.active === false ? 'amber' : '') + '">' +
      (current === 'insumos' ? (item.active ? 'Vigente' : 'No vigente') : (item.active === false ? 'Inactivo' : 'Activo')) +
      '</span></div>'
    ).join('');
  }

  function refresh() {
    renderTabs();
    renderTable();
  }

  document.getElementById('tabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-sec]');
    if (!button) return;
    current = button.dataset.sec;
    refresh();
  });
  refresh();
})();
