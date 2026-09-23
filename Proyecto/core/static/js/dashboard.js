(function () {
  const state = AgroService.getState();
  const crops = new Set(state.plots.map((plot) => plot.crop).filter(Boolean));
  const area = state.predios.reduce((sum, item) => sum + item.area, 0);
  const pending = state.activities.filter((item) => !item.done).length;
  const stats = [
    ['Predios registrados', state.predios.length, 'Tu campo organizado'],
    ['Superficie total', AgroService.fmt(area, 1) + ' ha', 'Terreno registrado'],
    ['Cultivos activos', crops.size, 'Diversidad en tus predios'],
    ['Recomendaciones pendientes', pending, 'Para revisar esta semana']
  ];
  document.getElementById('stats').innerHTML = stats.map(([label, value, note]) =>
    '<article class="card"><span class="muted">' + label + '</span><strong class="stat-value">' + value + '</strong><small class="muted">' + note + '</small></article>'
  ).join('');
  document.getElementById('pending-badge').textContent = pending + ' pendientes';
  const box = document.getElementById('activities');
  function render() {
    const current = AgroService.getState();
    box.innerHTML = current.activities.map((item) =>
      '<div class="activity"><button class="check' + (item.done ? ' checked' : '') + '" data-id="' + item.id + '" aria-label="' + (item.done ? 'Marcar pendiente: ' : 'Completar: ') + item.title + '"></button><div><strong>' + item.title + '</strong><small class="muted"> ' + item.detail + '</small></div><span class="badge ' + (item.done ? '' : 'amber') + '">' + (item.done ? 'Completada' : item.type) + '</span></div>'
    ).join('');
  }
  render();
  box.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    AgroService.toggleActivity(button.dataset.id);
    render();
  });
  document.getElementById('predio-list').innerHTML = state.predios.map((item) =>
    '<a href="/predios/?predio=' + item.id + '"><div><strong>' + item.name + '</strong><small class="muted"> ' + item.location + '</small></div><span class="badge">' + AgroService.fmt(item.area, 1) + ' ha</span></a>'
  ).join('');
})();
