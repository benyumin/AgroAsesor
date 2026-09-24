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
    '<option value="' + item.id + '">' + item.name + ' · ' + item.crop + '</option>'
  ).join('');
  if (params.get('insumo')) insumoSelect.value = params.get('insumo');
  else if ([...insumoSelect.options].some((option) => option.value === 'i2')) insumoSelect.value = 'i2';

  function selectedPlot() {
    return state.plots.find((item) => item.id === plotSelect.value);
  }
  function selectedInsumo() {
    return AgroService.getInsumos(true).find((item) => item.id === insumoSelect.value);
  }

  function sync() {
    const plot = selectedPlot();
    const insumo = selectedInsumo();
    if (insumo) {
      document.getElementById('dose').value = insumo.dose;
      document.getElementById('insumo-help').textContent = insumo.type + ' · ' + insumo.dose + ' ' + insumo.unit + '/ha · ficha demostrativa';
    }
    if (plot) {
      document.getElementById('plot-help').textContent = plot.name + ' tiene ' + AgroService.fmt(plot.areaHa, 3) + ' ha (' + AgroService.fmt(plot.areaHa * 10000) + ' m²).';
    }
    const stockInput = document.getElementById('stock');
    if (plot && insumo && (stockInput.value === '' || stockInput.dataset.auto !== 'off')) {
      stockInput.value = Math.max(0, Math.round(plot.areaHa * insumo.dose * 0.64));
    }
    compute();
  }

  function compute() {
    const plot = selectedPlot();
    const insumo = selectedInsumo();
    const unit = insumo?.unit || 'kg';
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
    AgroService.saveResult('cobertura', { ...result, plot: plot.name, insumo: insumo?.name, area, dose, stock, unit, date: new Date().toISOString() });
    const percent = Math.max(0, Math.min(100, result.percent));
    const filled = Math.round(percent);
    document.getElementById('cover-plot-name').textContent = plot.name + ' · ' + AgroService.fmt(area, 2) + ' ha';
    document.getElementById('cover-label').textContent = AgroService.fmt(percent, 0) + '% cubierto';
    document.getElementById('field-fill').style.width = percent + '%';
    document.getElementById('field-caption').textContent = AgroService.fmt(result.coveredHa, 2) + ' de ' + AgroService.fmt(area, 2) + ' ha';
    document.getElementById('cover-grid').innerHTML = Array.from({ length: 100 }, (_, index) =>
      '<span class="' + (index < filled ? 'ok' : 'miss') + '"></span>'
    ).join('');
    document.getElementById('cover-text').innerHTML = result.missingHa > 0
      ? 'Con lo que tienes cubres <strong>' + AgroService.fmt(result.coveredHa, 2) + ' ha</strong> y quedan <strong>' + AgroService.fmt(result.missingHa, 2) + ' ha</strong> sin cubrir.'
      : 'Te alcanza para todo el potrero (' + AgroService.fmt(area, 2) + ' ha).';
    document.getElementById('cover-numbers').innerHTML =
      '<div class="metric"><span>Cubierto</span><strong>' + AgroService.fmt(result.coveredHa, 2) + ' ha</strong></div>' +
      '<div class="metric"><span>Sin cubrir</span><strong>' + AgroService.fmt(result.missingHa, 2) + ' ha</strong></div>' +
      '<div class="metric"><span>Producto que necesitas en total</span><strong>' + AgroService.fmt(result.needed) + ' ' + unit + '</strong></div>' +
      (result.missingQty > 0
        ? '<div class="metric"><span>Te faltan</span><strong>' + AgroService.fmt(result.missingQty) + ' ' + unit + '</strong></div>'
        : '<div class="metric"><span>Te sobran</span><strong>' + AgroService.fmt(result.surplus) + ' ' + unit + '</strong></div>');
    document.getElementById('cover-advice').textContent = result.missingQty > 0
      ? 'Necesitas ' + AgroService.fmt(result.missingQty) + ' ' + unit + ' adicionales para cubrir el potrero completo. Cálculo de apoyo, no una receta.'
      : 'Tienes producto de sobra: ' + AgroService.fmt(result.surplus) + ' ' + unit + '. Puedes guardar el resto o usarlo en otro potrero.';
  }

  ['change', 'input'].forEach((type) => {
    document.getElementById('cover-form').addEventListener(type, compute);
  });
  plotSelect.addEventListener('change', sync);
  insumoSelect.addEventListener('change', sync);
  document.querySelectorAll('[data-stock]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const stockInput = document.getElementById('stock');
      stockInput.dataset.auto = 'off';
      stockInput.value = chip.dataset.stock;
      compute();
    });
  });
  document.getElementById('stock').addEventListener('input', () => {
    document.getElementById('stock').dataset.auto = 'off';
  });
  sync();
})();
