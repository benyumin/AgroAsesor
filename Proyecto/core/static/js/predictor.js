(function () {
  document.getElementById('crop').innerHTML = AgroService.getCultivos().map((name) => '<option>' + name + '</option>').join('');
  document.getElementById('zone').innerHTML = window.AGRO_MOCK.zonas.map((name) => '<option>' + name + '</option>').join('');
  const first = AgroService.getPlots()[0];
  if (first) {
    document.getElementById('crop').value = first.crop;
    document.getElementById('area').value = first.areaHa;
  }
  document.getElementById('predict-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const crop = document.getElementById('crop').value;
    const area = AgroService.positive(document.getElementById('area').value);
    const box = document.getElementById('predict-error');
    box.textContent = '';
    const result = AgroService.predictYield(crop, area);
    if (!result.ok) { box.textContent = result.error; return; }
    AgroService.saveResult('predictor', { crop, area, ...result, date: new Date().toISOString() });
    document.getElementById('predict-result').hidden = false;
    document.getElementById('predict-result').innerHTML =
      '<p class="muted">Rendimiento estimado</p><p class="predict-value">' + AgroService.fmt(result.rate, 1) + ' ton/ha</p>' +
      '<p>Producción estimada: <strong>' + AgroService.fmt(result.production, 1) + ' toneladas</strong></p>' +
      '<p>Estimación demostrativa basada en datos históricos de referencia.</p>' +
      '<p class="badge blue">Referencia visual: ODEPA · INIA</p>' +
      '<p class="muted">No se consulta ninguna API en tiempo real.</p>' +
      '<ul><li>Supuesto: rendimiento medio de referencia por cultivo.</li><li>Limitación: no considera clima, suelo ni manejo real.</li><li>Confianza estimada: ' + result.confidence + '</li><li>Versión del modelo mock: ' + window.AGRO_MOCK.version + '</li></ul>' +
      '<p class="alert">' + window.AGRO_MOCK.disclaimer + '</p>';
  });
})();
