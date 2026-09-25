(function () {
  document.getElementById('crop').innerHTML = AgroService.getCultivos().map((name) => '<option>' + name + '</option>').join('');
  document.getElementById('zone').innerHTML = window.AGRO_MOCK.zonas.map((name) => '<option>' + name + '</option>').join('');
  const first = AgroService.getPlots()[0];
  if (first) {
    document.getElementById('crop').value = first.crop;
    document.getElementById('area').value = first.areaHa;
  }
  function estimate(save) {
    const crop = document.getElementById('crop').value;
    const area = AgroService.positive(document.getElementById('area').value);
    const box = document.getElementById('predict-error');
    box.textContent = '';
    const result = AgroService.predictYield(crop, area);
    if (!result.ok) { box.textContent = result.error; return; }
    if (save) AgroService.saveResult('predictor', { crop, area, ...result, date: new Date().toISOString() });
    document.getElementById('predict-result').innerHTML =
      '<p class="muted">Rendimiento de referencia · ' + crop + '</p><p class="predict-value">' + AgroService.fmt(result.rate, 1) + ' ton/ha</p>' +
      '<div class="metric-grid"><div class="metric"><span>Producción estimada</span><strong>' + AgroService.fmt(result.production, 1) + ' t</strong></div>' +
      '<div class="metric"><span>Superficie</span><strong>' + AgroService.fmt(area, 2) + ' ha</strong></div></div>' +
      '<p class="muted">Referencia de demostración. No considera clima, suelo ni manejo real.</p>' +
      '<p class="alert">' + window.AGRO_MOCK.disclaimer + '</p>';
  }

  document.getElementById('predict-form').addEventListener('submit', (event) => {
    event.preventDefault();
    estimate(true);
  });
  document.getElementById('crop').addEventListener('change', () => estimate(false));
  document.getElementById('area').addEventListener('input', () => estimate(false));
  estimate(false);
})();
