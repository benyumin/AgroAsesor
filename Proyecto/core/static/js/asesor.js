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

  function options() {
    if (step === 0) return AgroService.getCultivos();
    if (step === 1) return [...new Set(activeInsumos().filter((item) => item.crop === crop).map((item) => item.problem))];
    return [...new Set(activeInsumos().filter((item) => item.crop === crop && item.problem === problem).map((item) => item.type))];
  }

  function match() {
    return activeInsumos().find((item) => item.crop === crop && item.problem === problem && item.type === type);
  }

  function render() {
    document.getElementById('steps').innerHTML = labels.map((label, index) =>
      '<li><button type="button" data-step="' + index + '" class="' + (index === step ? 'is-active' : '') + '"' + (index > step ? ' disabled' : '') + '>' + (index + 1) + '. ' + label + '</button></li>'
    ).join('');
    const box = document.getElementById('wizard');
    if (step < 3) {
      box.innerHTML = '<p class="hint">Paso ' + (step + 1) + ' de 4</p><h2>' + labels[step] + '</h2><p class="muted">' +
        ['Toca el cultivo que quieres consultar.', '¿Qué problema ves en el cultivo?', '¿Qué tipo de producto buscas?'][step] +
        '</p><div class="choice-grid">' +
        (options().length ? options().map((value) => '<button type="button" data-value="' + value + '">' + value + '</button>').join('') : '<p class="muted">No hay opciones vigentes para esta combinación.</p>') +
        '</div>';
      return;
    }
    const item = match();
    if (!item) {
      box.innerHTML = '<p>No hay una ficha vigente para esta combinación. Prueba otro tipo de insumo.</p>';
      return;
    }
    AgroService.saveResult('asesor', item);
    box.innerHTML = '<article class="ficha"><span class="badge">Ficha demostrativa</span><h2>' + item.name + '</h2>' +
      '<dl>' + [['Tipo', item.type], ['Ingrediente activo', item.ingredient], ['Problema', item.problem],
        ['Dosis', item.dose + ' ' + item.unit + '/ha'], ['Modo de aplicación', item.application],
        ['Consideraciones de seguridad', item.safety], ['Estado vigente', item.active ? 'Vigente' : 'No vigente'],
        ['Fuente', item.source], ['Fecha de actualización', item.updated]].map(([k, v]) => '<dt>' + k + '</dt><dd>' + v + '</dd>').join('') +
      '</dl><p class="alert">' + window.AGRO_MOCK.disclaimer + '</p>' +
      '<div class="toolbar"><button class="button" type="button" id="ficha">Ver ficha técnica</button>' +
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
    if (event.target.id === 'ficha') {
      alert('Ficha técnica demostrativa de ' + (match()?.name || '') + '. No hay conexión real con SAG.');
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
