(function () {
  const labels = {
    asesor: 'Ficha técnica',
    'calculo-semillas': 'Cálculo de semillas',
    'calculo-insumos': 'Cálculo de insumos',
    cobertura: 'Cobertura del terreno',
    predictor: 'Estimación de cosecha',
    calendario: 'Calendario de siembra'
  };

  const fieldMap = {
    name: 'Producto',
    type: 'Tipo',
    crop: 'Cultivo',
    problem: 'Problema',
    zone: 'Zona',
    ingredient: 'Ingrediente',
    dose: 'Dosis',
    unit: 'Unidad',
    application: 'Aplicación',
    safety: 'Seguridad',
    description: 'Descripción',
    source: 'Fuente',
    predio: 'Predio',
    amount: 'Cantidad',
    area: 'Superficie (ha)',
    stock: 'Stock',
    coveredHa: 'Hectáreas cubiertas',
    missingHa: 'Hectáreas sin cubrir',
    missingQty: 'Falta',
    surplus: 'Sobra',
    percent: 'Cobertura %',
    needed: 'Necesario',
    production: 'Producción (t)',
    rate: 'Rendimiento (t/ha)',
    variety: 'Variedad',
    sow: 'Siembra',
    harvest: 'Cosecha',
    notes: 'Notas',
    season: 'Temporada',
    insumo: 'Insumo',
    plot: 'Potrero',
    year: 'Año',
    waitDays: 'Carencia (días)',
    updated: 'Actualización',
    id: 'Código'
  };

  const skip = new Set(['active', 'problemType', 'date', 'ok', 'confidence', 'mode']);

  function payload() {
    return AgroService.getResult(document.getElementById('kind').value);
  }

  function rows(data) {
    if (!data) return [{ value: 'No hay un resultado guardado para este tipo. Haz el cálculo o la ficha primero.' }];
    return Object.entries(data)
      .filter(([key, value]) => !skip.has(key) && value !== undefined && value !== null && value !== '' && typeof value !== 'object')
      .map(([key, value]) => ({ label: fieldMap[key] || key, value: String(value) }));
  }

  function preview() {
    const kind = document.getElementById('kind').value;
    const data = payload();
    const list = rows(data);
    document.getElementById('preview').innerHTML = '<h2>' + (labels[kind] || 'Vista previa') + '</h2>' +
      (data ? '<p class="muted">Listo para descargar. Revisa los datos y pulsa Exportar PDF.</p>' : '') +
      list.map((row) => '<p>' + (row.label ? '<strong>' + row.label + ':</strong> ' : '') + row.value + '</p>').join('') +
      '<p class="alert">' + window.AGRO_MOCK.disclaimer + '</p>';
  }

  document.getElementById('kind').addEventListener('change', preview);
  preview();
  document.getElementById('pdf-btn').addEventListener('click', () => {
    const kind = document.getElementById('kind').value;
    const data = payload();
    AgroService.downloadPdf(
      'agroasesor-' + kind + '.pdf',
      labels[kind] || 'Reporte AgroAsesor',
      rows(data)
    );
  });
})();
