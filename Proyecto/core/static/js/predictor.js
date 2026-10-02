(function () {
  const cropSelect = document.getElementById('crop');
  const zoneSelect = document.getElementById('zone');
  const varietySelect = document.getElementById('variety');
  cropSelect.innerHTML = AgroService.getCultivos().map((name) => '<option>' + name + '</option>').join('');
  zoneSelect.innerHTML = AgroService.getZonas().map((name) => '<option>' + name + '</option>').join('');
  const first = AgroService.getPlots()[0];
  if (first) {
    cropSelect.value = first.crop;
    document.getElementById('area').value = first.areaHa;
    const predio = AgroService.getPredios().find((item) => item.id === first.predio);
    if (predio?.zone) zoneSelect.value = predio.zone;
  }

  document.getElementById('predict-stats').innerHTML = [
    ['Cultivos', AgroService.getCultivos().length],
    ['Variedades', AgroService.getVariedades().length],
    ['Rendimientos', Object.keys(window.AGRO_MOCK.yields || {}).length],
    ['Fuente', AgroService.catalogFromDb() ? 'Base de datos' : 'Demo local']
  ].map(([label, value]) => '<div class="info-chip"><span>' + label + '</span><strong>' + value + '</strong></div>').join('');

  function fillVarieties() {
    const list = AgroService.getVariedades(cropSelect.value, zoneSelect.value);
    varietySelect.innerHTML = (list.length ? list : AgroService.getVariedades(cropSelect.value)).map((item) =>
      '<option value="' + item.name + '">' + item.name + '</option>'
    ).join('') || '<option>Sin variedad en catálogo</option>';
    if (first?.variety) varietySelect.value = first.variety;
  }

  function lastResult(crop, area, result, variety) {
    return {
      crop, variety, zone: zoneSelect.value, area, rate: result.rate,
      production: result.production, season: document.getElementById('season').value,
      date: new Date().toISOString()
    };
  }

  function estimate(save) {
    const crop = cropSelect.value;
    const variety = varietySelect.value;
    const area = AgroService.positive(document.getElementById('area').value);
    const box = document.getElementById('predict-error');
    box.textContent = '';
    const result = AgroService.predictYield(crop, area);
    if (!result.ok) { box.textContent = result.error; return; }
    const payload = lastResult(crop, area, result, variety);
    if (save) AgroService.saveResult('predictor', payload);
    const info = AgroService.getCultivo(crop);
    const varietyInfo = AgroService.getVariedades(crop).find((item) => item.name === variety);
    document.getElementById('predict-result').innerHTML =
      '<p class="muted">Rendimiento de referencia · ' + crop + '</p>' +
      '<p class="predict-value">' + AgroService.fmt(result.rate, 1) + ' ton/ha</p>' +
      '<div class="formula-box"><p class="formula-line">Producción = rendimiento × superficie</p><p>' +
      AgroService.fmt(result.rate, 1) + ' t/ha × ' + AgroService.fmt(area, 2) + ' ha = <strong>' + AgroService.fmt(result.production, 1) + ' t</strong></p></div>' +
      '<div class="metric-grid"><div class="metric"><span>Producción estimada</span><strong>' + AgroService.fmt(result.production, 1) + ' t</strong></div>' +
      '<div class="metric"><span>Superficie</span><strong>' + AgroService.fmt(area, 2) + ' ha</strong></div></div>' +
      '<p class="muted">' + result.confidence + '</p>' +
      '<p class="alert">' + window.AGRO_MOCK.disclaimer + '</p>';
    document.getElementById('predict-notes').innerHTML =
      '<h2>' + crop + (variety ? ' · ' + variety : '') + '</h2>' +
      '<p>' + (info?.description || '') + '</p>' +
      (varietyInfo?.description ? '<p class="muted">' + varietyInfo.description + (varietyInfo.cycleDays ? ' · ciclo ' + varietyInfo.cycleDays + ' días' : '') + '</p>' : '') +
      (info?.notes ? '<div class="note-card"><h3>Manejo</h3><p>' + info.notes + '</p></div>' : '') +
      (info?.season ? '<p class="muted">Época: ' + info.season + (info.family ? ' · familia ' + info.family : '') + '</p>' : '');
  }

  document.getElementById('predict-form').addEventListener('submit', (event) => {
    event.preventDefault();
    estimate(true);
  });
  ['crop', 'zone', 'variety', 'area', 'season'].forEach((id) => {
    document.getElementById(id).addEventListener('change', () => {
      if (id === 'crop' || id === 'zone') fillVarieties();
      estimate(false);
    });
  });
  document.getElementById('area').addEventListener('input', () => estimate(false));
  document.getElementById('pdf-predict').addEventListener('click', () => {
    estimate(true);
    const data = AgroService.getResult('predictor');
    if (!data) return;
    AgroService.downloadPdf('cosecha.pdf', 'Estimación de cosecha', [
      { label: 'Cultivo', value: data.crop },
      { label: 'Variedad', value: data.variety },
      { label: 'Zona', value: data.zone },
      { label: 'Temporada', value: data.season },
      { label: 'Superficie', value: AgroService.fmt(data.area, 2) + ' ha' },
      { label: 'Rendimiento', value: AgroService.fmt(data.rate, 1) + ' t/ha' },
      { label: 'Producción', value: AgroService.fmt(data.production, 1) + ' t' }
    ]);
  });
  fillVarieties();
  estimate(false);
})();
