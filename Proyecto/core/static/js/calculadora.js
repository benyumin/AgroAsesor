(function () {
  const params = new URLSearchParams(location.search);
  let mode = 'semillas';
  const state = AgroService.getState();
  const plotSelect = document.getElementById('plot');
  const insumoSelect = document.getElementById('insumo');
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

  function fillInsumos() {
    const crop = document.getElementById('crop').value;
    const list = AgroService.getInsumos(true).filter((item) => item.type !== 'Semilla' && (!crop || item.crop === crop));
    const fallback = AgroService.getInsumos(true).filter((item) => item.type !== 'Semilla');
    const source = list.length ? list : fallback;
    insumoSelect.innerHTML = source.map((item) =>
      '<option value="' + item.id + '">' + item.name + ' · ' + item.type + ' · ' + item.crop + '</option>'
    ).join('');
    const wanted = params.get('insumo');
    if (wanted) insumoSelect.value = wanted;
  }

  function currentInsumo() {
    return AgroService.getInsumos(true).find((item) => AgroService.sameId(item.id, insumoSelect.value));
  }

  function lastPayload() {
    return AgroService.getResult('calculo-' + mode);
  }

  function renderStats() {
    document.getElementById('calc-stats').innerHTML = [
      ['Cultivos', AgroService.getCultivos().length],
      ['Semillas en catálogo', (window.AGRO_MOCK.semillas || []).length],
      ['Insumos vigentes', AgroService.getInsumos(true).length],
      ['Fuente', AgroService.catalogFromDb() ? 'Base de datos' : 'Demo local']
    ].map(([label, value]) => '<div class="info-chip"><span>' + label + '</span><strong>' + value + '</strong></div>').join('');
  }

  function renderNotes() {
    const crop = AgroService.getCultivo(document.getElementById('crop').value);
    const box = document.getElementById('crop-notes');
    if (!crop) { box.innerHTML = ''; return; }
    const seed = AgroService.getSemilla(crop.name);
    const insumo = mode === 'insumos' ? currentInsumo() : null;
    box.innerHTML = '<h2>' + crop.name + '</h2><p>' + (crop.description || '') + '</p>' +
      '<div class="metric-grid">' +
      '<div class="metric"><span>Densidad de siembra</span><strong>' + AgroService.fmt(seed?.density || crop.density) + ' ' + (crop.unit || 'kg') + '/ha</strong></div>' +
      '<div class="metric"><span>Rendimiento ref.</span><strong>' + AgroService.fmt(crop.yield, 1) + ' t/ha</strong></div></div>' +
      (crop.notes ? '<div class="note-card"><h3>Manejo</h3><p>' + crop.notes + '</p></div>' : '') +
      (insumo ? '<div class="note-card"><h3>' + insumo.name + '</h3><p>' + (insumo.description || '') + '</p><p class="muted">' + (insumo.application || '') + '</p></div>' : '');
  }

  function syncPlot() {
    const plot = selectedPlot();
    if (!plot) return;
    document.getElementById('crop').value = plot.crop || document.getElementById('crop').value;
    document.getElementById('area').value = plot.areaHa || '';
    fillInsumos();
    if (mode === 'semillas') {
      const seed = AgroService.getSemilla(document.getElementById('crop').value);
      if (seed) {
        document.getElementById('dose').value = seed.density;
        document.getElementById('unit').value = seed.unit;
      } else if (!document.getElementById('dose').value) {
        document.getElementById('dose').value = 25;
        document.getElementById('unit').value = 'kg';
      }
    } else {
      const insumo = currentInsumo();
      if (insumo) {
        document.getElementById('dose').value = insumo.dose;
        document.getElementById('unit').value = insumo.unit;
        document.getElementById('insumo-help').textContent = insumo.type + ' · ' + insumo.dose + ' ' + insumo.unit + '/ha · ' + (insumo.zone || 'Zona Central');
      }
    }
    const fromDb = AgroService.catalogFromDb();
    const extra = fromDb ? ' · Dosis del catálogo (base de datos)' : '';
    document.getElementById('plot-help').textContent = 'Superficie disponible: ' + AgroService.fmt(maxArea(), 3) + ' ha · Cultivo actual: ' + (plot.crop || 'sin cultivo') + extra;
    renderNotes();
    renderResult(false);
  }

  function setMode(next) {
    mode = next;
    document.querySelectorAll('#modes button').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mode === mode);
    });
    const seed = mode === 'semillas';
    document.getElementById('insumo-field').hidden = seed;
    document.getElementById('form-title').textContent = seed ? 'Calcular semillas' : 'Calcular insumo';
    document.getElementById('form-hint').textContent = seed
      ? 'La densidad sale del cultivo en la base de datos. Ajústala si no vas a sembrar todo el potrero.'
      : 'Elige el producto del catálogo. La dosis de la ficha se copia sola; puedes cambiarla si la etiqueta dice otra cosa.';
    document.getElementById('dose-label').textContent = seed ? 'Dosis o densidad por hectárea' : 'Dosis recomendada por hectárea';
    document.getElementById('dose-help').textContent = seed ? 'Kilos de semilla por cada hectárea.' : 'Cantidad de producto por cada hectárea.';
    syncPlot();
  }

  function bags(amount) {
    const count = Math.min(12, Math.max(1, Math.round(amount / 25) || 1));
    return '<div class="bags" aria-hidden="true">' + Array.from({ length: count }, () => '<b></b>').join('') + '</div>';
  }

  function buildPayload(area, dose, unit, amount) {
    const plot = selectedPlot();
    const predio = plotSelect.selectedOptions[0]?.text || '';
    const insumo = mode === 'insumos' ? currentInsumo() : null;
    return {
      mode, area, dose, unit, amount,
      predio, crop: document.getElementById('crop').value,
      insumo: insumo?.name || '',
      type: insumo?.type || 'Semilla',
      date: new Date().toISOString()
    };
  }

  function renderResult(save) {
    const errorBox = document.getElementById('calc-error');
    const area = AgroService.positive(document.getElementById('area').value);
    const dose = AgroService.positive(document.getElementById('dose').value);
    const unit = document.getElementById('unit').value || 'kg';
    const max = maxArea();
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
    const payload = buildPayload(area, dose, unit, result.amount);
    if (save) AgroService.saveResult('calculo-' + mode, payload);
    const bagsNote = unit === 'kg' ? '<p class="muted">Cada saco dibujado representa unos 25 kg, solo como referencia visual.</p>' : '';
    document.getElementById('result').innerHTML =
      '<p class="result-kicker">' + (mode === 'semillas' ? 'Semilla necesaria' : 'Insumo necesario') + '</p>' +
      '<p class="result-value">' + AgroService.fmt(result.amount) + ' ' + unit + '</p>' +
      '<p>Para <strong>' + predio + '</strong> · ' + document.getElementById('crop').value +
      (payload.insumo ? ' · ' + payload.insumo : '') + '</p>' +
      bags(result.amount) + bagsNote +
      '<div class="formula-box"><p class="formula-line">Cantidad = superficie × dosis</p><p>' +
      AgroService.fmt(area) + ' ha × ' + AgroService.fmt(dose) + ' ' + unit + '/ha = <strong>' + AgroService.fmt(result.amount) + ' ' + unit + '</strong></p></div>' +
      '<div class="metric-grid"><div class="metric"><span>Superficie</span><strong>' + AgroService.fmt(area, 3) + ' ha</strong></div>' +
      '<div class="metric"><span>Dosis</span><strong>' + AgroService.fmt(dose) + ' ' + unit + '/ha</strong></div></div>' +
      '<div class="next-links"><a class="button secondary" href="/cobertura/?insumo=' + (currentInsumo()?.id || '') + '">¿Me alcanza para cubrir el terreno?</a></div>';
    return true;
  }

  function downloadLast() {
    const data = lastPayload() || buildPayload(
      AgroService.positive(document.getElementById('area').value),
      AgroService.positive(document.getElementById('dose').value),
      document.getElementById('unit').value,
      AgroService.positive(document.getElementById('area').value) * AgroService.positive(document.getElementById('dose').value)
    );
    if (!data || !data.amount) {
      alert('Calcula primero para descargar el PDF.');
      return;
    }
    AgroService.downloadPdf('calculo-' + mode + '.pdf', mode === 'semillas' ? 'Cálculo de semillas' : 'Cálculo de insumos', [
      { heading: data.predio },
      { label: 'Cultivo', value: data.crop },
      { label: 'Producto', value: data.insumo || 'Semilla del catálogo' },
      { label: 'Superficie', value: AgroService.fmt(data.area, 3) + ' ha' },
      { label: 'Dosis', value: AgroService.fmt(data.dose) + ' ' + data.unit + '/ha' },
      { label: 'Cantidad a llevar', value: AgroService.fmt(data.amount) + ' ' + data.unit }
    ]);
  }

  plotSelect.addEventListener('change', syncPlot);
  document.getElementById('crop').addEventListener('change', () => {
    if (mode === 'semillas') {
      const seed = AgroService.getSemilla(document.getElementById('crop').value);
      if (seed) {
        document.getElementById('dose').value = seed.density;
        document.getElementById('unit').value = seed.unit;
      }
    } else {
      fillInsumos();
      const insumo = currentInsumo();
      if (insumo) {
        document.getElementById('dose').value = insumo.dose;
        document.getElementById('unit').value = insumo.unit;
      }
    }
    renderNotes();
    renderResult(false);
  });
  insumoSelect.addEventListener('change', () => {
    const insumo = currentInsumo();
    if (insumo) {
      document.getElementById('dose').value = insumo.dose;
      document.getElementById('unit').value = insumo.unit;
    }
    renderNotes();
    renderResult(false);
  });
  ['area', 'dose', 'unit'].forEach((id) => {
    document.getElementById(id).addEventListener('input', () => renderResult(false));
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
      note.textContent = 'Cálculo guardado. Ya puedes exportarlo en PDF desde aquí o en Reportes.';
      document.getElementById('result').appendChild(note);
    }
  });
  document.getElementById('pdf-calc').addEventListener('click', () => {
    renderResult(true);
    downloadLast();
  });
  renderStats();
  setMode(params.get('insumo') ? 'insumos' : 'semillas');
})();
