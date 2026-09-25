(function () {
  const state = AgroService.getState();
  const crops = [...new Set(state.plots.map((plot) => plot.crop).filter(Boolean))];
  const area = state.predios.reduce((sum, item) => sum + item.area, 0);
  const pending = state.activities.filter((item) => !item.done).length;
  const stats = [
    ['Predios', state.predios.length],
    ['Hectáreas', AgroService.fmt(area, 1)],
    ['Cultivos', crops.length],
    ['Pendientes', pending]
  ];
  document.getElementById('stats').innerHTML = stats.map(([label, value]) =>
    '<article class="card stat"><span class="muted">' + label + '</span><strong class="stat-value">' + value + '</strong></article>'
  ).join('');

  const board = document.getElementById('plot-board');
  board.innerHTML = state.plots.map((plot) => {
    const predio = state.predios.find((item) => item.id === plot.predio);
    const planned = plot.status === 'Planificado';
    return '<article class="plot-row">' +
      '<div><strong>' + plot.name + '</strong><small class="muted">' + (predio ? predio.name : '') + ' · ' + (plot.crop || 'Sin cultivo') + '</small></div>' +
      '<span class="badge' + (planned ? ' amber' : '') + '">' + plot.status + '</span>' +
      '<span class="plot-area">' + AgroService.fmt(plot.areaHa, 1) + ' ha</span>' +
      '<span class="plot-actions">' +
        '<a href="/calculadora/?plot=' + plot.id + '">Cantidad</a>' +
        '<a href="/cobertura/?plot=' + plot.id + '">Cobertura</a>' +
      '</span></article>';
  }).join('');

  const next = state.plots.find((plot) => plot.status === 'Planificado') || state.plots[0];
  const nextPredio = next && state.predios.find((item) => item.id === next.predio);
  document.getElementById('next-step').innerHTML = next
    ? '<a class="next-step" href="/calculadora/?plot=' + next.id + '"><span>Siguiente</span><strong>Calcular ' + next.crop + ' en ' + next.name + '</strong><small>' + (nextPredio ? nextPredio.name : '') + ' · ' + AgroService.fmt(next.areaHa, 1) + ' ha</small></a>'
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
})();
