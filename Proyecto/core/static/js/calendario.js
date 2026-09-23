(function () {
  const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const cropFilter = document.getElementById('crop-filter');
  cropFilter.innerHTML += window.AGRO_MOCK.calendario.map((item) => '<option>' + item.name + '</option>').join('');
  document.getElementById('zone').innerHTML = window.AGRO_MOCK.zonas.map((name) => '<option>' + name + '</option>').join('');

  function phase(item, month) {
    const sow = item.sow - 1;
    const growEnd = (sow + Math.max(1, item.cycle - 2)) % 12;
    const harvest = (sow + item.cycle - 1) % 12;
    if (month === sow) return 'sow';
    if (month === harvest) return 'harvest';
    const start = sow;
    const end = harvest >= start ? harvest : harvest + 12;
    const m = month >= start ? month : month + 12;
    if (m > start && m < end) return 'grow';
    return '';
  }

  function render() {
    const crop = cropFilter.value;
    const rows = window.AGRO_MOCK.calendario.filter((item) => !crop || item.name === crop);
    document.getElementById('cal-table').innerHTML = '<thead><tr><th>Cultivo</th>' + months.map((month) => '<th>' + month + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map((item) => '<tr data-crop="' + item.name + '"><th>' + item.name + '</th>' + months.map((_, index) => {
        const kind = phase(item, index);
        return '<td><div class="cell ' + kind + '" title="' + (kind || '') + '"></div></td>';
      }).join('') + '</tr>').join('') + '</tbody>';
    document.getElementById('cal-detail').innerHTML = '<p class="legend"><span class="cell sow"></span> Siembra <span class="cell grow"></span> Crecimiento <span class="cell harvest"></span> Cosecha</p><p class="muted">Selecciona un cultivo en la tabla para ver el detalle.</p>';
  }

  document.getElementById('cal-table').addEventListener('click', (event) => {
    const row = event.target.closest('tr[data-crop]');
    if (!row) return;
    const item = window.AGRO_MOCK.calendario.find((entry) => entry.name === row.dataset.crop);
    document.getElementById('cal-detail').innerHTML =
      '<h2>' + item.name + '</h2><p>Época de siembra: mes ' + item.sow + '</p><p>Ciclo aproximado: ' + item.cycle + ' meses</p><p>Notas técnicas: ' + item.notes + '</p><p>Zona: ' + document.getElementById('zone').value + ' · Año ' + document.getElementById('year').value + '</p>';
  });
  cropFilter.addEventListener('change', render);
  render();
})();
