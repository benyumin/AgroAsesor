(function () {
  function payload() {
    return AgroService.getResult(document.getElementById('kind').value);
  }

  function lines(data) {
    if (!data) return ['No hay un resultado guardado para este tipo. Haz el cálculo o la ficha primero.'];
    const when = new Date().toLocaleDateString('es-CL');
    const rows = ['AgroAsesor', 'Fecha: ' + when];
    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value !== 'object') rows.push(key + ': ' + value);
    });
    rows.push('Fuente: SAG (referencia demostrativa, no es una consulta en vivo)');
    rows.push(window.AGRO_MOCK.disclaimer);
    return rows;
  }

  function preview() {
    const data = payload();
    document.getElementById('preview').innerHTML = '<h2>Vista previa</h2>' + lines(data).map((line) => '<p>' + line + '</p>').join('');
  }

  document.getElementById('preview-btn').addEventListener('click', preview);
  document.getElementById('pdf-btn').addEventListener('click', () => {
    const data = payload();
    if (!window.jspdf) { alert('No se pudo cargar el generador de PDF.'); return; }
    const doc = new window.jspdf.jsPDF();
    doc.setFontSize(16);
    doc.text('AgroAsesor', 14, 20);
    doc.setFontSize(11);
    lines(data).slice(1).forEach((line, index) => {
      doc.text(String(line).slice(0, 90), 14, 32 + index * 8);
    });
    doc.save('agroasesor-reporte.pdf');
  });
})();
