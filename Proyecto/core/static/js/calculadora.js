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

  function selectedPlot() {
    return state.plots.find((item) => item.id === plotSelect.value);
  }

  function maxArea() {
    const plot = selectedPlot();
    return plot?.areaHa || state.predios.find((item) => item.id === plot?.predio)?.area || 0;
  }

  function currentInsumo() {
    const plot = selectedPlot();
    const wanted = params.get('insumo');
    const list = AgroService.getInsumos(true);
    return list.find((item) => item.id === wanted) ||
      list.find((item) => item.crop === plot?.crop && item.type !== 'Semilla');
  }

  function syncPlot() {
    const plot = selectedPlot();
    if (!plot) return;
    document.getElementById('crop').value = plot.crop || document.getElementById('crop').value;
    document.getElementById('area').value = plot.areaHa || '';
    document.getElementById('plot-help').textContent = 'Superficie disponible: ' + AgroService.fmt(maxArea(), 3) + ' ha · Cultivo actual: ' + (plot.crop || 'sin cultivo');
    if (mode === 'semillas') {
      const seed = window.AGRO_MOCK.semillas.find((item) => item.crop === plot.crop);
      if (seed) {
        document.getElementById('dose').value = seed.density;
        document.getElementById('unit').value = seed.unit;
      }
    } else {
      const insumo = currentInsumo();
      if (insumo) {
        document.getElementById('dose').value = insumo.dose;
        document.getElementById('unit').value = insumo.unit;
      }
    }
    renderResult(false);
  }

  function setMode(next) {
    mode = next;
    document.querySelectorAll('#modes button').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mode === mode);
    });
    const seed = mode === 'semillas';
    document.getElementById('form-title').textContent = seed ? 'Calcular semillas' : 'Calcular insumo';
    document.getElementById('form-hint').textContent = seed
      ? 'Elige el potrero. La superficie se completa sola; puedes ajustarla si no vas a sembrar todo.'
      : 'Usa la dosis de la ficha o la etiqueta. El resultado es la cantidad total para el potrero.';
    document.getElementById('dose-label').textContent = seed ? 'Dosis o densidad por hectárea' : 'Dosis recomendada por hectárea';
    document.getElementById('dose-help').textContent = seed ? 'Kilos de semilla por cada hectárea.' : 'Cantidad de producto por cada hectárea.';
    syncPlot();
  }

  function bags(amount) {
    const count = Math.min(12, Math.max(1, Math.round(amount / 25) || 1));
    return '<div class="bags" aria-hidden="true">' + Array.from({ length: count }, () => '<b></b>').join('') + '</div>';
  }

  function renderResult(save) {
    const errorBox = document.getElementById('calc-error');
    const area = AgroService.positive(document.getElementById('area').value);
    const dose = AgroService.positive(document.getElementById('dose').value);
    const unit = document.getElementById('unit').value || 'kg';
    const max = maxArea();
    const plot = selectedPlot();
    const predio = plotSelect.selectedOptions[0]?.text || '';
    errorBox.textContent = '';

    if (document.getElementById('area').value === '' || document.getElementById('dose').value === '') {
      document.getElementById('result').innerHTML =
        '<p class="result-kicker">Resultado</p><h2>Completa superficie y dosis</h2><p class="muted">En cuanto pongas los dos números, aquí verás cuánto necesitas.</p>';
      return false;
    }
    if (area === null || dose === null) {
      errorBox.textContent = 'Ingresa superficie y dosis mayores a 0. No se aceptan vacíos ni valores inválidos.';
      return false;
    }
    if (max && area > max) {
      errorBox.textContent = 'La superficie no puede ser mayor a la disponible (' + AgroService.fmt(max, 3) + ' ha).';
      return false;
    }
    const result = AgroService.calculateDose(area, dose);
    const payload = {
      mode, area, dose, unit, amount: result.amount,
      predio, crop: document.getElementById('crop').value,
      date: new Date().toISOString()
    };
    if (save) AgroService.saveResult('calculo-' + mode, payload);
    document.getElementById('result').innerHTML =
      '<p class="result-kicker">' + (mode === 'semillas' ? 'Semilla necesaria' : 'Insumo necesario') + '</p>' +
      '<p class="result-value">' + AgroService.fmt(result.amount) + ' ' + unit + '</p>' +
      '<p>Para <strong>' + predio + '</strong> · ' + document.getElementById('crop').value + '</p>' +
      bags(result.amount) +
      '<div class="formula-box"><p class="formula-line">Cantidad = superficie × dosis</p><p>' +
      AgroService.fmt(area) + ' ha × ' + AgroService.fmt(dose) + ' ' + unit + '/ha = <strong>' + AgroService.fmt(result.amount) + ' ' + unit + '</strong></p></div>' +
      '<div class="metric-grid"><div class="metric"><span>Superficie</span><strong>' + AgroService.fmt(area, 3) + ' ha</strong></div>' +
      '<div class="metric"><span>Dosis</span><strong>' + AgroService.fmt(dose) + ' ' + unit + '/ha</strong></div></div>' +
      '<div class="next-links"><a class="button secondary" href="/cobertura/">¿Me alcanza para cubrir el terreno?</a></div>';
    return true;
  }

  plotSelect.addEventListener('change', syncPlot);
  ['area', 'dose', 'unit', 'crop'].forEach((id) => {
    document.getElementById(id).addEventListener('input', () => renderResult(false));
    document.getElementById(id).addEventListener('change', () => renderResult(false));
  });
  document.getElementById('modes').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-mode]');
    if (button) setMode(button.dataset.mode);
  });
  document.querySelectorAll('[data-ex]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const [area, dose, unit] = chip.dataset.ex.split(',');
      document.getElementById('area').value = area;
      document.getElementById('dose').value = dose;
      document.getElementById('unit').value = unit;
      renderResult(false);
    });
  });
  document.getElementById('calc-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (renderResult(true)) {
      const note = document.createElement('p');
      note.className = 'callout';
      note.textContent = 'Cálculo guardado. Ya puedes exportarlo en Reportes PDF.';
      document.getElementById('result').appendChild(note);
    }
  });
  setMode(params.get('insumo') ? 'insumos' : 'semillas');
})();
