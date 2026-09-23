(function () {
  const params = new URLSearchParams(location.search);
  let mode = 'semillas';
  const state = AgroService.getState();
  const plotSelect = document.getElementById('plot');
  plotSelect.innerHTML = state.plots.map((plot) => {
    const predio = state.predios.find((item) => item.id === plot.predio);
    return '<option value="' + plot.id + '">' + predio.name + ' · ' + plot.name + '</option>';
  }).join('');
  document.getElementById('crop').innerHTML = AgroService.getCultivos().map((name) => '<option>' + name + '</option>').join('');
  if (params.get('plot')) plotSelect.value = params.get('plot');

  function maxArea() {
    const plot = state.plots.find((item) => item.id === plotSelect.value);
    return plot?.areaHa || state.predios.find((item) => item.id === plot?.predio)?.area || 0;
  }

  function syncPlot() {
    const plot = state.plots.find((item) => item.id === plotSelect.value);
    if (!plot) return;
    document.getElementById('crop').value = plot.crop || document.getElementById('crop').value;
    document.getElementById('area').value = plot.areaHa || '';
    if (mode === 'semillas') {
      const seed = window.AGRO_MOCK.semillas.find((item) => item.crop === plot.crop);
      if (seed) {
        document.getElementById('dose').value = seed.density;
        document.getElementById('unit').value = seed.unit;
      }
    }
    const insumo = AgroService.getInsumos(true).find((item) => item.id === params.get('insumo') || (item.crop === plot.crop && item.type !== 'Semilla'));
    if (mode === 'insumos' && insumo) {
      document.getElementById('dose').value = insumo.dose;
      document.getElementById('unit').value = insumo.unit;
    }
  }

  function setMode(next) {
    mode = next;
    document.querySelectorAll('#modes button').forEach((button) => {
      button.className = button.dataset.mode === mode ? 'button' : 'button secondary';
    });
    document.getElementById('dose-label').textContent = mode === 'semillas' ? 'Dosis o densidad por hectárea' : 'Dosis recomendada por hectárea';
    syncPlot();
  }

  plotSelect.addEventListener('change', syncPlot);
  document.getElementById('modes').addEventListener('click', (event) => {
    if (event.target.dataset.mode) setMode(event.target.dataset.mode);
  });
  document.getElementById('calc-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const errorBox = document.getElementById('calc-error');
    const area = AgroService.positive(document.getElementById('area').value);
    const dose = AgroService.positive(document.getElementById('dose').value);
    const max = maxArea();
    errorBox.textContent = '';
    if (area === null || dose === null) {
      errorBox.textContent = 'Ingresa superficie y dosis mayores a 0. No se aceptan vacíos ni valores inválidos.';
      return;
    }
    if (max && area > max) {
      errorBox.textContent = 'La superficie no puede ser mayor a la disponible (' + AgroService.fmt(max, 3) + ' ha).';
      return;
    }
    const result = AgroService.calculateDose(area, dose);
    const unit = document.getElementById('unit').value || 'kg';
    const payload = {
      mode, area, dose, unit, amount: result.amount,
      predio: plotSelect.selectedOptions[0].text,
      crop: document.getElementById('crop').value,
      date: new Date().toISOString()
    };
    AgroService.saveResult('calculo-' + mode, payload);
    document.getElementById('result').hidden = false;
    document.getElementById('result').innerHTML = '<p class="muted">Resultado inmediato</p><p class="result-value">' + AgroService.fmt(result.amount) + ' ' + unit + '</p><p>Fórmula: cantidad = superficie × dosis</p><p>' + AgroService.fmt(area) + ' × ' + AgroService.fmt(dose) + ' = ' + AgroService.fmt(result.amount) + ' ' + unit + '</p>';
  });
  if (params.get('insumo')) setMode('insumos');
  else setMode('semillas');
})();
