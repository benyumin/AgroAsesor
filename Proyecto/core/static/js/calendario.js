(function () {
  const monthsShort = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const cropFilter = document.getElementById('crop-filter');
  const zoneSelect = document.getElementById('zone');
  let selectedId = null;

  AgroService.getCultivos().forEach((name) => {
    cropFilter.insertAdjacentHTML('beforeend', '<option value="' + name + '">' + name + '</option>');
  });
  zoneSelect.innerHTML = AgroService.getZonas().map((name) => '<option>' + name + '</option>').join('');

  function inRange(month, start, end) {
    if (!start || !end) return false;
    if (start <= end) return month >= start && month <= end;
    return month >= start || month <= end;
  }

  function phase(row, month) {
    if (inRange(month, row.sowStart, row.sowEnd)) return 'sow';
    if (inRange(month, row.harvestStart, row.harvestEnd)) return 'harvest';
    const afterSow = (row.sowEnd % 12) + 1;
    let beforeHarvest = row.harvestStart - 1;
    if (beforeHarvest < 1) beforeHarvest = 12;
    if (inRange(month, afterSow, beforeHarvest)) return 'grow';
    return 'idle';
  }

  function rows() {
    return AgroService.getCalendario(zoneSelect.value, cropFilter.value || '');
  }

  function renderStats() {
    const all = AgroService.getCalendario();
    document.getElementById('cal-stats').innerHTML = [
      ['Calendarios', all.length],
      ['Zonas', AgroService.getZonas().length],
      ['Cultivos', AgroService.getCultivos().length],
      ['Variedades', AgroService.getVariedades().length]
    ].map(([label, value]) => '<div class="info-chip"><span>' + label + '</span><strong>' + value + '</strong></div>').join('');
  }

  function showDetail(row) {
    if (!row) {
      document.getElementById('cal-detail').innerHTML = '<h2>Elige un cultivo</h2><p class="muted">Toca una franja del calendario para ver variedad, ventana de siembra y manejo.</p>';
      return;
    }
    selectedId = row.id;
    const crop = AgroService.getCultivo(row.crop);
    const insumos = AgroService.getInsumos(true).filter((item) => item.crop === row.crop).slice(0, 4);
    const pests = [...new Set(insumos.map((item) => item.problem).filter(Boolean))];
    AgroService.saveResult('calendario', {
      crop: row.crop,
      variety: row.variety,
      zone: row.zone,
      sow: AgroService.monthRange(row.sowStart, row.sowEnd),
      harvest: AgroService.monthRange(row.harvestStart, row.harvestEnd),
      notes: row.notes,
      year: document.getElementById('year').value
    });
    document.getElementById('cal-detail').innerHTML =
      '<span class="badge">' + row.zone + '</span>' +
      '<h2>' + row.crop + '</h2>' +
      (row.variety ? '<p class="cal-variety">' + row.variety + '</p>' : '') +
      '<div class="metric-grid">' +
      '<div class="metric"><span>Siembra</span><strong>' + AgroService.monthRange(row.sowStart, row.sowEnd) + '</strong></div>' +
      '<div class="metric"><span>Cosecha</span><strong>' + AgroService.monthRange(row.harvestStart, row.harvestEnd) + '</strong></div>' +
      '</div>' +
      (crop ? '<p>' + (crop.description || '') + '</p>' : '') +
      '<p>' + (row.notes || '') + '</p>' +
      (crop && crop.notes ? '<div class="note-card"><h3>Manejo</h3><p>' + crop.notes + '</p>' +
        (crop.cycleDays ? '<p class="muted">Ciclo de referencia: ' + crop.cycleDays + ' días · ' + (crop.density || '—') + ' ' + (crop.unit || 'kg') + '/ha de semilla.</p>' : '') +
        '</div>' : '') +
      (pests.length ? '<h3>Problemas frecuentes</h3><ul class="help-list">' + pests.map((name) => '<li>' + name + '</li>').join('') + '</ul>' : '') +
      (insumos.length ? '<h3>Insumos del catálogo</h3><ul class="help-list">' + insumos.map((item) => '<li><a class="text-link" href="/asesor/?crop=' + encodeURIComponent(row.crop) + '">' + item.name + '</a> · ' + item.type + '</li>').join('') + '</ul>' : '') +
      '<div class="toolbar"><button class="button" type="button" id="cal-pdf">Descargar PDF de esta ventana</button>' +
      '<a class="button secondary" href="/calculadora/">Calcular semilla</a></div>';
  }

  function render() {
    renderStats();
    const data = rows();
    const board = document.getElementById('cal-board');
    if (!data.length) {
      board.innerHTML = '<p class="muted">No hay calendarios para esta zona y cultivo. Prueba otra zona del valle central.</p>';
      showDetail(null);
      return;
    }
    board.innerHTML = '<div class="cal-grid-head"><span>Cultivo</span>' + monthsShort.map((month) => '<span>' + month + '</span>').join('') + '</div>' +
      data.map((row) => {
        const active = String(row.id) === String(selectedId) ? ' is-selected' : '';
        return '<button type="button" class="cal-row' + active + '" data-id="' + row.id + '">' +
          '<span class="cal-name"><strong>' + row.crop + '</strong><small>' + (row.variety || row.zone) + '</small></span>' +
          monthsShort.map((_, index) => {
            const kind = phase(row, index + 1);
            return '<span class="cal-cell ' + kind + '" title="' + kind + '"></span>';
          }).join('') +
          '</button>';
      }).join('');
    const current = data.find((row) => String(row.id) === String(selectedId)) || data[0];
    showDetail(current);
  }

  document.getElementById('cal-board').addEventListener('click', (event) => {
    const button = event.target.closest('[data-id]');
    if (!button) return;
    selectedId = button.dataset.id;
    render();
  });
  document.getElementById('cal-detail').addEventListener('click', (event) => {
    if (event.target.id !== 'cal-pdf') return;
    const row = rows().find((item) => String(item.id) === String(selectedId)) || rows()[0];
    if (!row) return;
    AgroService.downloadPdf('calendario-' + row.crop.toLowerCase() + '.pdf', 'Calendario de siembra · ' + row.crop, [
      { heading: row.zone + ' · ' + document.getElementById('year').value },
      { label: 'Variedad', value: row.variety || '—' },
      { label: 'Siembra', value: AgroService.monthRange(row.sowStart, row.sowEnd) },
      { label: 'Cosecha', value: AgroService.monthRange(row.harvestStart, row.harvestEnd) },
      { label: 'Observaciones', value: row.notes }
    ]);
  });
  cropFilter.addEventListener('change', render);
  zoneSelect.addEventListener('change', render);
  render();
})();
