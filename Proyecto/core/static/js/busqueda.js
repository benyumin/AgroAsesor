(function () {
  document.getElementById('crop').innerHTML += AgroService.getCultivos().map((name) => '<option>' + name + '</option>').join('');
  document.getElementById('problem').innerHTML += AgroService.getProblemas().map((item) => '<option>' + item.name + '</option>').join('');
  document.getElementById('type').innerHTML += [...new Set(AgroService.getInsumos().map((item) => item.type))].map((name) => '<option>' + name + '</option>').join('');

  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function match(text, term) {
    return normalize(text).includes(term);
  }

  function search() {
    const term = normalize(document.getElementById('term').value.trim());
    const crop = document.getElementById('crop').value;
    const problem = document.getElementById('problem').value;
    const type = document.getElementById('type').value;
    const items = [];
    AgroService.getCultivos().forEach((name) => {
      const info = AgroService.getCultivo(name);
      items.push({
        kind: 'cultivo', title: name,
        text: name + ' ' + (info?.family || '') + ' ' + (info?.description || ''),
        detail: (info?.season || '') + (info?.density ? ' · ' + info.density + ' ' + (info.unit || 'kg') + '/ha' : ''),
        href: '/calendario/'
      });
    });
    AgroService.getVariedades().forEach((item) => items.push({
      kind: 'variedad', title: item.name, crop: item.crop,
      text: item.name + ' ' + item.crop + ' ' + item.zone,
      detail: item.crop + (item.zone ? ' · ' + item.zone : ''),
      href: '/predictor/'
    }));
    (window.AGRO_MOCK.semillas || []).forEach((item) => items.push({
      kind: 'semilla', title: item.crop + ' · semilla', crop: item.crop,
      text: item.crop + ' semilla ' + item.density,
      detail: item.density + ' ' + item.unit + '/ha',
      href: '/calculadora/'
    }));
    AgroService.getInsumos(true).forEach((item) => items.push({
      kind: 'insumo', title: item.name,
      text: item.name + ' ' + item.crop + ' ' + item.problem + ' ' + item.type + ' ' + (item.ingredient || ''),
      detail: item.type + ' · ' + item.crop + (item.problem ? ' · ' + item.problem : '') + ' · ' + item.dose + ' ' + item.unit + '/ha',
      href: '/asesor/?crop=' + encodeURIComponent(item.crop),
      crop: item.crop, problem: item.problem, type: item.type
    }));
    AgroService.getProblemas().forEach((item) => items.push({
      kind: 'problema', title: item.name,
      text: item.name + ' ' + item.type + ' ' + (item.description || '') + ' ' + (item.symptoms || ''),
      detail: item.type + ' · ' + (item.description || '').slice(0, 90),
      href: '/asesor/'
    }));
    AgroService.getCalendario().forEach((item) => items.push({
      kind: 'calendario', title: item.crop + ' en ' + item.zone,
      crop: item.crop,
      text: item.crop + ' ' + item.zone + ' ' + (item.variety || '') + ' ' + (item.notes || ''),
      detail: 'Siembra ' + AgroService.monthRange(item.sowStart, item.sowEnd),
      href: '/calendario/'
    }));
    AgroService.getPredios().forEach((item) => items.push({
      kind: 'predio', title: item.name,
      text: item.name + ' ' + item.location + ' ' + (item.zone || ''),
      detail: item.location,
      href: '/predios/?predio=' + item.id
    }));
    const results = items.filter((item) => {
      if (term && !match(item.text, term)) return false;
      if (crop && item.crop && item.crop !== crop) return false;
      if (crop && item.kind === 'cultivo') return item.title === crop;
      if (problem && item.problem && item.problem !== problem) return false;
      if (problem && item.kind === 'problema') return item.title === problem || !problem;
      if (type && item.type && item.type !== type) return false;
      if ((crop || problem || type) && !['insumo', 'cultivo', 'problema', 'variedad', 'semilla', 'calendario'].includes(item.kind)) {
        return false;
      }
      return true;
    });
    const labels = {
      cultivo: 'Cultivo', semilla: 'Semilla', insumo: 'Insumo', problema: 'Problema',
      predio: 'Predio', variedad: 'Variedad', calendario: 'Calendario'
    };
    document.getElementById('result-count').textContent = results.length
      ? results.length + ' resultado' + (results.length === 1 ? '' : 's') + ' en el catálogo y tus predios.'
      : 'Sin coincidencias.';
    document.getElementById('results').innerHTML = results.length
      ? results.map((item) => '<a class="card result kind-' + item.kind + '" href="' + item.href + '"><span class="badge">' + (labels[item.kind] || item.kind) + '</span><h3>' + item.title + '</h3><p class="muted">' + (item.detail || 'Abrir herramienta') + '</p></a>').join('')
      : '<section class="card"><h2>Sin coincidencias</h2><p class="muted">Prueba “mai”, “gusano”, “urea” o “tizon”. También puedes dejar la búsqueda vacía para ver todo el catálogo.</p></section>';
  }

  document.getElementById('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    search();
  });
  document.querySelectorAll('[data-q]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.getElementById('term').value = chip.dataset.q;
      search();
    });
  });
  search();
})();
