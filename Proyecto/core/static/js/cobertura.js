(function () {
  const params = new URLSearchParams(location.search);
  const state = AgroService.getState();
  const plotSelect = document.getElementById('plot');
  const insumoSelect = document.getElementById('insumo');
  plotSelect.innerHTML = state.plots.map((plot) => {
    const predio = state.predios.find((item) => item.id === plot.predio);
    return '<option value="' + plot.id + '">' + predio.name + ' · ' + plot.name + ' (' + AgroService.fmt(plot.areaHa, 2) + ' ha)</option>';
  }).join('');
  insumoSelect.innerHTML = AgroService.getInsumos(true).map((item) =>
    '<option value="' + item.id + '">' + item.name + '</option>'
  ).join('');
  if (params.get('insumo')) insumoSelect.value = params.get('insumo');

  function sync() {
    const plot = state.plots.find((item) => item.id === plotSelect.value);
    const insumo = AgroService.getInsumos(true).find((item) => item.id === insumoSelect.value);
    if (insumo) document.getElementById('dose').value = insumo.dose;
    if (plot && !document.getElementById('stock').value) document.getElementById('stock').value = 2000;
    compute();
  }

  function compute() {
    const plot = state.plots.find((item) => item.id === plotSelect.value);
    const insumo = AgroService.getInsumos(true).find((item) => item.id === insumoSelect.value);
    const area = plot?.areaHa;
    const dose = AgroService.positive(document.getElementById('dose').value);
    const stock = AgroService.nonNegative(document.getElementById('stock').value);
    const error = document.getElementById('cover-error');
    error.textContent = '';
    if (!plot || dose === null || stock === null) {
      error.textContent = 'Revisa predio, dosis mayor a 0 y cantidad disponible (0 o más).';
      return;
    }
    const result = AgroService.calculateCoverage(area, dose, stock);
    AgroService.saveResult('cobertura', { ...result, plot: plot.name, insumo: insumo?.name, area, dose, stock, date: new Date().toISOString() });
    const filled = Math.round(result.percent / 10);
    document.getElementById('cover-label').textContent = AgroService.fmt(result.percent, 0) + '% cubierto';
    document.getElementById('cover-grid').innerHTML = Array.from({ length: 10 }, (_, index) =>
      '<span class="' + (index < filled ? 'ok' : 'miss') + '"></span>'
    ).join('');
    document.getElementById('cover-text').innerHTML = AgroService.fmt(result.coveredHa, 2) + ' ha cubiertas · ' +
      AgroService.fmt(result.missingHa, 2) + ' ha sin cubrir.';
    document.getElementById('cover-numbers').innerHTML =
      '<p><strong>' + AgroService.fmt(result.coveredHa, 2) + ' ha</strong> cubiertas</p>' +
      '<p><strong>' + AgroService.fmt(result.missingHa, 2) + ' ha</strong> faltantes</p>' +
      (result.missingQty > 0
        ? '<p>Necesitas <strong>' + AgroService.fmt(result.missingQty) + ' ' + (insumo?.unit || 'kg') + '</strong> adicionales.</p>'
        : '<p>Cantidad sobrante: <strong>' + AgroService.fmt(result.surplus) + ' ' + (insumo?.unit || 'kg') + '</strong>.</p>');
  }

  ['change', 'input'].forEach((type) => {
    document.getElementById('cover-form').addEventListener(type, compute);
  });
  plotSelect.addEventListener('change', sync);
  insumoSelect.addEventListener('change', sync);
  sync();
})();
