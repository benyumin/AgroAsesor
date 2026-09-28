(function () {
  const state = AgroService.getState();
  const crops = [...new Set(state.plots.map((plot) => plot.crop).filter(Boolean))];
  const area = state.predios.reduce((sum, item) => sum + Number(item.area || 0), 0);
  const pending = state.activities.filter((item) => !item.done).length;
  const catalogCrops = AgroService.getCultivos().length;

  const stats = [
    { key: 'predios', label: 'Predios', value: state.predios.length, icon: 'sprout' },
    { key: 'area', label: 'Hectáreas', value: AgroService.fmt(area, 1), extra: area ? '+12%' : '', icon: 'leaf' },
    { key: 'crops', label: 'Cultivos', value: catalogCrops || crops.length, icon: 'sprout' },
    { key: 'pending', label: 'Pendientes', value: pending, icon: 'clipboard-list' }
  ];

  document.getElementById('stats').innerHTML = stats.map((item) =>
    '<article class="card dash-stat ' + item.key + '">' +
      '<span class="stat-icon"><i data-lucide="' + item.icon + '"></i></span>' +
      '<div><span class="muted">' + item.label + '</span>' +
      '<strong class="stat-value">' + item.value + (item.extra ? '<small>' + item.extra + '</small>' : '') + '</strong></div>' +
    '</article>'
  ).join('');

  function cropClass(name) {
    const key = String(name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (key.includes('maiz')) return 'maiz';
    if (key.includes('trigo')) return 'trigo';
    if (key.includes('alfalfa')) return 'alfalfa';
    if (key.includes('tomate')) return 'tomate';
    if (key.includes('papa')) return 'papa';
    if (key.includes('cebolla')) return 'cebolla';
    return 'otro';
  }

  function cropIcon(name) {
    const klass = cropClass(name);
    if (klass === 'trigo' || klass === 'maiz') return 'sprout';
    if (klass === 'alfalfa') return 'leaf';
    return 'sprout';
  }

  const board = document.getElementById('plot-board');
  board.innerHTML = state.plots.map((plot) => {
    const predio = state.predios.find((item) => item.id === plot.predio);
    const planned = plot.status === 'Planificado';
    const klass = cropClass(plot.crop);
    return '<article class="plot-row">' +
      '<div class="plot-identity"><span class="plot-thumb ' + klass + '"></span>' +
        '<div><strong>' + plot.name + '</strong><small class="muted">' + (predio ? predio.name : '') + (plot.crop ? ' · ' + plot.crop : '') + '</small></div></div>' +
      '<span class="badge' + (planned ? ' amber' : '') + '">' + (plot.status || 'Sin estado') + '</span>' +
      '<span class="plot-area">' + AgroService.fmt(plot.areaHa, 1) + ' ha</span>' +
      '<span class="plot-crop"><i data-lucide="' + cropIcon(plot.crop) + '"></i> ' + (plot.crop || '—') + '</span>' +
      '<span class="plot-actions"><a href="/calculadora/?plot=' + plot.id + '">Cantidad</a></span>' +
      '<span class="plot-actions"><a href="/cobertura/?plot=' + plot.id + '">Cobertura</a></span>' +
    '</article>';
  }).join('');

  const next = state.plots.find((plot) => plot.status === 'Planificado') || state.plots[0];
  const nextPredio = next && state.predios.find((item) => item.id === next.predio);
  document.getElementById('next-step').innerHTML = next
    ? '<a class="next-step" href="/calculadora/?plot=' + next.id + '">' +
        '<span class="next-ico"><i data-lucide="' + cropIcon(next.crop) + '"></i></span>' +
        '<span><span>Siguiente</span><strong>Calcular ' + (next.crop || 'insumo') + ' en ' + next.name + '</strong>' +
        '<small>' + (nextPredio ? nextPredio.name : '') + ' · ' + AgroService.fmt(next.areaHa, 1) + ' ha</small></span>' +
        '<i data-lucide="arrow-right"></i></a>'
    : '';

  document.getElementById('farm-mini').innerHTML = state.predios.map((item) =>
    '<a class="farm-mini" href="/predios/?predio=' + item.id + '"><strong>' + item.name + '</strong><span>' + AgroService.fmt(item.area, 1) + ' ha</span></a>'
  ).join('');

  document.getElementById('pending-badge').textContent = pending + ' pendientes';
  const box = document.getElementById('activities');
  function render() {
    const current = AgroService.getState();
    const left = current.activities.filter((item) => !item.done).length;
    document.getElementById('pending-badge').textContent = left + ' pendientes';
    box.innerHTML = current.activities.map((item) =>
      '<div class="activity"><button class="check' + (item.done ? ' checked' : '') + '" data-id="' + item.id + '" aria-label="' + (item.done ? 'Marcar pendiente: ' : 'Completar: ') + item.title + '"></button><div><strong>' + item.title + '</strong><small class="muted">' + item.detail + '</small></div></div>'
    ).join('');
  }
  render();
  box.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    AgroService.toggleActivity(button.dataset.id);
    render();
  });
  if (window.lucide) window.lucide.createIcons();
})();
