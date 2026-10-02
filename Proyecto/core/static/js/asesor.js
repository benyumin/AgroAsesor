(function () {
  const params = new URLSearchParams(location.search);
  const labels = ['Cultivo', 'Problema agrícola', 'Tipo de insumo', 'Recomendación'];
  let step = 0;
  let crop = params.get('crop') || '';
  let problem = '';
  let type = '';

  function activeInsumos() {
    return AgroService.getInsumos(true);
  }

  function cropInfo(name) {
    return AgroService.getCultivo(name);
  }

  function options() {
    if (step === 0) {
      return AgroService.getCultivos().map((name) => {
        const info = cropInfo(name);
        return {
          value: name,
          title: name,
          hint: info ? ((info.family || '') + (info.season ? ' · ' + info.season : '')) : ''
        };
      });
    }
    if (step === 1) {
      const related = activeInsumos().filter((item) => !crop || item.crop === crop);
      const names = [...new Set(related.map((item) => item.problem).filter(Boolean))];
      const extras = AgroService.getProblemas().filter((item) => names.includes(item.name) || !names.length);
      const list = names.length ? names : extras.map((item) => item.name);
      return list.map((name) => {
        const info = AgroService.getProblemas().find((item) => item.name === name);
        return { value: name, title: name, hint: info ? info.type : '' };
      });
    }
    const types = [...new Set(activeInsumos()
      .filter((item) => item.crop === crop && item.problem === problem)
      .map((item) => item.type))];
    return types.map((name) => ({ value: name, title: name, hint: 'Catálogo vigente' }));
  }

  function matches() {
    return activeInsumos().filter((item) => item.crop === crop && item.problem === problem && item.type === type);
  }

  function match() {
    return matches()[0] || null;
  }

  function fichaRows(item) {
    return [
      { label: 'Producto', value: item.name },
      { label: 'Tipo', value: item.type },
      { label: 'Cultivo', value: item.crop },
      { label: 'Problema', value: item.problem || '—' },
      { label: 'Zona', value: item.zone || 'Zona Central' },
      { label: 'Ingrediente activo', value: item.ingredient || '—' },
      { label: 'Dosis', value: item.dose + ' ' + item.unit + '/ha' },
      { label: 'Modo de aplicación', value: item.application || '—' },
      { label: 'Carencia', value: (item.waitDays != null ? item.waitDays + ' días' : '—') },
      { label: 'Seguridad', value: item.safety || '—' },
      { label: 'Descripción', value: item.description || '—' },
      { label: 'Fuente', value: item.source },
      { label: 'Actualización', value: item.updated || '—' }
    ];
  }

  function downloadFicha(item) {
    AgroService.downloadPdf(
      'ficha-' + (item.name || 'insumo').toLowerCase().replace(/\s+/g, '-') + '.pdf',
      'Ficha técnica demostrativa · ' + item.name,
      [{ heading: 'Datos del producto' }].concat(fichaRows(item).map((row) => ({ label: row.label, value: row.value })))
    );
  }

  function renderStats() {
    const insumos = activeInsumos();
    const box = document.getElementById('asesor-stats');
    if (!box) return;
    box.innerHTML = [
      ['Cultivos', AgroService.getCultivos().length],
      ['Problemas', AgroService.getProblemas().length],
      ['Insumos vigentes', insumos.length],
      ['Insecticidas', insumos.filter((item) => item.type === 'Insecticida').length]
    ].map(([label, value]) => '<div class="info-chip"><span>' + label + '</span><strong>' + value + '</strong></div>').join('');
  }

  function renderAside() {
    const info = crop ? cropInfo(crop) : null;
    const pests = crop
      ? [...new Set(activeInsumos().filter((item) => item.crop === crop).map((item) => item.problem).filter(Boolean))]
      : [];
    const box = document.getElementById('asesor-aside');
    let extra = '';
    if (info) {
      extra += '<div class="note-card"><h3>' + info.name + '</h3><p>' + (info.description || '') + '</p>' +
        (info.notes ? '<p class="muted" style="margin-top:8px">' + info.notes + '</p>' : '') + '</div>';
    }
    if (pests.length) {
      extra += '<h3>Problemas asociados</h3><ul class="help-list">' + pests.map((name) => '<li>' + name + '</li>').join('') + '</ul>';
    }
    box.innerHTML = '<h2>Cómo usarla</h2><ol class="help-list"><li>Elige el cultivo del potrero.</li><li>Marca el problema que ves.</li><li>Escoge el tipo de producto.</li><li>Descarga la ficha o pásala a “Cuánto llevar”.</li></ol>' +
      extra + '<p class="alert">' + window.AGRO_MOCK.disclaimer + '</p>';
  }

  function render() {
    renderStats();
    renderAside();
    document.getElementById('steps').innerHTML = labels.map((label, index) =>
      '<li><button type="button" data-step="' + index + '" class="' + (index === step ? 'is-active' : '') + '"' + (index > step ? ' disabled' : '') + '>' + (index + 1) + '. ' + label + '</button></li>'
    ).join('');
    const box = document.getElementById('wizard');
    if (step < 3) {
      const hints = [
        'Toca el cultivo que quieres consultar. La ficha y las plagas salen del catálogo.',
        '¿Qué problema ves? Plaga, enfermedad, maleza o nutrición.',
        '¿Qué tipo de producto buscas para esa combinación?'
      ];
      const opts = options();
      box.innerHTML = '<p class="hint">Paso ' + (step + 1) + ' de 4</p><h2>' + labels[step] + '</h2><p class="muted">' + hints[step] + '</p><div class="choice-grid">' +
        (opts.length ? opts.map((opt) =>
          '<button type="button" data-value="' + opt.value + '">' + opt.title + (opt.hint ? '<small>' + opt.hint + '</small>' : '') + '</button>'
        ).join('') : '<p class="muted">No hay opciones vigentes para esta combinación. Vuelve un paso y prueba otro problema.</p>') +
        '</div>';
      return;
    }
    const items = matches();
    if (!items.length) {
      box.innerHTML = '<p>No hay una ficha vigente para esta combinación. Prueba otro tipo de insumo.</p>';
      return;
    }
    const item = items[0];
    AgroService.saveResult('asesor', item);
    const related = items.slice(1);
    const pest = AgroService.getProblemas().find((entry) => entry.name === item.problem);
    box.innerHTML = '<article class="ficha">' +
      '<div class="ficha-head"><span class="badge">Ficha del catálogo</span>' +
      (item.problemType ? '<span class="badge ' + item.problemType + '">' + (pest ? pest.type : item.problemType) + '</span>' : '') +
      '<span class="badge">' + (item.zone || 'Zona Central') + '</span></div>' +
      '<h2>' + item.name + '</h2>' +
      '<p class="muted">' + (item.description || 'Producto demostrativo vinculado al cultivo y al problema elegido.') + '</p>' +
      '<dl>' + fichaRows(item).map((row) => '<dt>' + row.label + '</dt><dd>' + row.value + '</dd>').join('') +
      '</dl>' +
      (pest ? '<div class="note-card"><h3>' + pest.name + '</h3><p>' + (pest.description || '') + '</p>' +
        (pest.symptoms ? '<p><strong>Síntomas:</strong> ' + pest.symptoms + '</p>' : '') +
        (pest.management ? '<p><strong>Manejo:</strong> ' + pest.management + '</p>' : '') + '</div>' : '') +
      (related.length ? '<p class="muted">También hay ' + related.length + ' ficha(s) alternativa(s) para esta combinación.</p>' : '') +
      '<p class="alert">' + window.AGRO_MOCK.disclaimer + '</p>' +
      '<div class="toolbar"><button class="button" type="button" id="ficha-pdf">Descargar ficha PDF</button>' +
      '<a class="button secondary" href="/calculadora/?insumo=' + item.id + '">Calcular dosis</a>' +
      '<a class="button secondary" href="/cobertura/?insumo=' + item.id + '">Calcular cobertura</a></div></article>';
  }

  document.getElementById('steps').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-step]');
    if (!button || button.disabled) return;
    step = Number(button.dataset.step);
    render();
  });
  document.getElementById('wizard').addEventListener('click', (event) => {
    if (event.target.id === 'ficha-pdf') {
      const item = match();
      if (item) downloadFicha(item);
      return;
    }
    const button = event.target.closest('button[data-value]');
    if (!button) return;
    if (step === 0) crop = button.dataset.value;
    if (step === 1) problem = button.dataset.value;
    if (step === 2) type = button.dataset.value;
    step = Math.min(3, step + 1);
    render();
  });
  render();
})();
