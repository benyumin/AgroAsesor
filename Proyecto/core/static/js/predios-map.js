(function () {
  const help = {
    select: 'Toca un potrero en el mapa para ver cultivo, superficie y planificación.',
    draw: 'Marca los vértices del potrero sobre el mapa. Con tres puntos ya puedes pulsar Listo.',
    edit: 'Arrastra los vértices. La superficie se actualiza al moverlos.',
    divide: 'Marca los vértices de un sector dentro del potrero seleccionado.',
    measure: 'Marca dos o más puntos para medir una distancia.',
    delete: 'Confirma la eliminación del potrero seleccionado.'
  };

  const CROP_COLORS = {
    'Maíz': { stroke: '#c9a227', fill: '#e8c85a' },
    'Trigo': { stroke: '#a67c2a', fill: '#d7b56a' },
    'Papa': { stroke: '#8b6b4a', fill: '#c4a37a' },
    'Alfalfa': { stroke: '#3d7a45', fill: '#7fb36a' },
    'Tomate': { stroke: '#b54a3c', fill: '#e08a7a' },
    'Cebolla': { stroke: '#8a7a32', fill: '#d6c07a' }
  };

  const params = new URLSearchParams(location.search);
  let state = AgroService.getState();
  let predioId = params.get('predio') || state.predios[0]?.id;
  let plotId = state.plots.find((plot) => plot.predio === predioId)?.id || null;
  let mode = 'select';
  let draft = [];
  let satellite = true;
  const layers = L.layerGroup();
  const draftLayer = L.layerGroup();

  const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  });
  const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Teselas Esri World Imagery'
  });

  const map = L.map('farm-map', { doubleClickZoom: false }).setView([-33.687, -71.21], 15);
  sat.addTo(map);
  layers.addTo(map);
  draftLayer.addTo(map);

  document.getElementById('predio-zone').innerHTML = AgroService.getZonas().map((name) => '<option>' + name + '</option>').join('');

  function plotsOfPredio() {
    return AgroService.getPlots(predioId);
  }

  function selected() {
    return plotsOfPredio().find((plot) => plot.id === plotId) || null;
  }

  function currentPredio() {
    return state.predios.find((item) => item.id === predioId);
  }

  function toLatLngs(coords) {
    return coords.map((point) => Array.isArray(point) ? [point[1], point[0]] : [point.lat, point.lng]);
  }

  function toLngLat(points) {
    return points.map((point) => [point.lng ?? point[1], point.lat ?? point[0]]);
  }

  function measure(coords) {
    if (!coords || coords.length < 3 || !window.turf) return { areaM2: 0, areaHa: 0 };
    const ring = toLngLat(coords);
    ring.push(ring[0]);
    const areaM2 = Math.abs(turf.area(turf.polygon([ring])));
    return { areaM2, areaHa: areaM2 / 10000 };
  }

  function cropColor(name) {
    return CROP_COLORS[name] || { stroke: '#235d37', fill: '#a6c98c' };
  }

  function fillVarieties(select, crop, current) {
    const zone = currentPredio()?.zone;
    const list = AgroService.getVariedades(crop, zone);
    const options = ['<option value="">Sin variedad</option>'].concat(
      list.map((item) => '<option value="' + item.name + '">' + item.name + (item.zone ? ' · ' + item.zone : '') + '</option>')
    );
    select.innerHTML = options.join('');
    if (current) select.value = current;
    if (current && !select.value) {
      select.insertAdjacentHTML('beforeend', '<option value="' + current + '">' + current + '</option>');
      select.value = current;
    }
  }

  function renderSwitch() {
    document.getElementById('predio-switch').innerHTML = state.predios.map((item) =>
      '<button type="button" class="' + (item.id === predioId ? 'is-active' : '') + '" data-predio="' + item.id + '">' +
      '<strong>' + item.name + '</strong><small>' + (item.zone || item.location || '') + ' · ' + AgroService.fmt(item.area, 1) + ' ha</small></button>'
    ).join('');
  }

  function renderLegend() {
    const used = [...new Set(plotsOfPredio().map((plot) => plot.crop).filter(Boolean))];
    document.getElementById('map-legend').innerHTML = used.map((name) => {
      const color = cropColor(name);
      return '<span><i style="background:' + color.fill + ';border-color:' + color.stroke + '"></i>' + name + '</span>';
    }).join('');
  }

  function renderMap(fit) {
    layers.clearLayers();
    const visible = state.plots.filter((plot) => plot.predio === predioId);
    visible.forEach((plot) => {
      const active = plot.id === plotId;
      const color = cropColor(plot.crop);
      const polygon = L.polygon(toLatLngs(plot.coordinates), {
        color: active ? color.stroke : color.stroke,
        weight: active ? 3.5 : 2,
        fillColor: color.fill,
        fillOpacity: active ? 0.5 : 0.28
      }).addTo(layers);
      polygon.bindTooltip(
        '<strong>' + plot.name + '</strong><br>' + (plot.crop || 'Sin cultivo') +
        (plot.variety ? ' · ' + plot.variety : '') + '<br>' + AgroService.fmt(plot.areaHa, 2) + ' ha',
        { sticky: true, className: 'plot-tip' }
      );
      polygon.on('click', (event) => {
        if (mode === 'select') {
          predioId = plot.predio;
          plotId = plot.id;
          refresh(false);
        } else if (['draw', 'divide', 'measure'].includes(mode)) {
          L.DomEvent.stop(event);
          addPoint(event.latlng);
        }
      });
    });
    const points = visible.flatMap((plot) => toLatLngs(plot.coordinates));
    if (fit && points.length) map.fitBounds(points, { padding: [36, 36], maxZoom: 17 });
  }

  function renderDraft() {
    draftLayer.clearLayers();
    if (!draft.length) return;
    const latlngs = draft.map((point) => [point.lat, point.lng]);
    if (mode === 'measure') {
      L.polyline(latlngs, { color: '#bf8c28' }).addTo(draftLayer);
    } else {
      L.polygon(latlngs, { color: '#bf8c28', fillColor: '#d6e79a', fillOpacity: 0.3 }).addTo(draftLayer);
    }
    draft.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        draggable: mode === 'edit',
        icon: L.divIcon({ className: 'plot-vertex', iconSize: [14, 14] })
      }).addTo(draftLayer);
      marker.on('drag', (event) => {
        const latlng = event.target.getLatLng();
        draft[index] = { lat: latlng.lat, lng: latlng.lng };
        updateLive();
      });
    });
    updateLive();
  }

  function updateLive() {
    const live = document.getElementById('live-area');
    if (mode === 'measure' && draft.length >= 2 && window.turf) {
      const line = turf.lineString(toLngLat(draft));
      live.textContent = 'Distancia: ' + AgroService.fmt(turf.length(line, { units: 'kilometers' }) * 1000) + ' m';
      return;
    }
    if (draft.length >= 3) {
      const metrics = measure(draft);
      live.textContent = 'Área seleccionada: ' + AgroService.fmt(metrics.areaM2) + ' m² · ' + AgroService.fmt(metrics.areaHa, 3) + ' ha';
      return;
    }
    live.textContent = '';
  }

  function renderCropInfo(plot) {
    const box = document.getElementById('crop-info');
    const info = plot?.crop ? AgroService.getCultivo(plot.crop) : null;
    if (!info) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    const cal = AgroService.getCalendario(currentPredio()?.zone, plot.crop)[0];
    box.hidden = false;
    box.innerHTML = '<h3>' + info.name + (plot.variety ? ' · ' + plot.variety : '') + '</h3>' +
      '<p>' + (info.description || '') + '</p>' +
      '<p class="muted">Densidad ' + AgroService.fmt(info.density) + ' ' + (info.unit || 'kg') + '/ha · ' +
      'rendimiento ' + AgroService.fmt(info.yield, 1) + ' t/ha' +
      (info.cycleDays ? ' · ciclo ' + info.cycleDays + ' días' : '') + '</p>' +
      (cal ? '<p class="muted">Siembra ' + AgroService.monthRange(cal.sowStart, cal.sowEnd) + ' · cosecha ' + AgroService.monthRange(cal.harvestStart, cal.harvestEnd) + '</p>' : '');
  }

  function renderSummary() {
    const plot = selected();
    const predio = currentPredio();
    const box = document.getElementById('summary');
    const tools = document.getElementById('plot-tools');
    if (!plot) {
      tools.hidden = true;
      box.innerHTML = '<p class="muted">Toca un potrero en el mapa, o dibuja uno y pulsa Listo.</p>';
      document.getElementById('crop-info').hidden = true;
      return;
    }
    tools.hidden = false;
    const metrics = measure(plot.coordinates);
    const areaHa = plot.areaHa || metrics.areaHa;
    const areaM2 = areaHa * 10000;
    box.innerHTML = '<div class="summary-grid">' +
      [['Nombre', plot.name], ['Predio', predio?.name || ''], ['Zona', predio?.zone || predio?.location || ''],
        ['Superficie m²', AgroService.fmt(areaM2)], ['Superficie ha', AgroService.fmt(areaHa, 3)],
        ['Cultivo', plot.crop || 'Sin cultivo'], ['Variedad', plot.variety || '—'],
        ['Estado', plot.status || '—'], ['Fecha de siembra', plot.sowing || '—']].map(([label, value]) =>
        '<div><span class="muted">' + label + '</span><strong>' + value + '</strong></div>'
      ).join('') + '</div>';
    document.getElementById('plan-crop').value = plot.crop || 'Maíz';
    fillVarieties(document.getElementById('plan-variety'), document.getElementById('plan-crop').value, plot.variety || '');
    document.getElementById('plan-sowing').value = plot.sowing || '';
    document.getElementById('plan-harvest').value = plot.harvest || '';
    document.getElementById('plan-area').value = Number(areaHa).toFixed(3);
    renderCropInfo(plot);
  }

  function renderActions() {
    const plot = selected();
    const actions = [
      ['crop', 'Registrar cultivo', 'Qué hay sembrado en este potrero'],
      ['plan', 'Planificar siembra', 'Fechas de siembra y cosecha'],
      ['calc', 'Calcular insumos y semillas', 'Cuántos kilos o litros necesitas'],
      ['water', 'Registrar riego', 'Deja una nota de riego'],
      ['fert', 'Registrar fertilización', 'Deja una nota de fertilizante'],
      ['pest', 'Reportar plaga o problema', 'Queda en tu lista de Inicio'],
      ['sag', 'Ver ficha de insumo', 'Recomendación del catálogo'],
      ['divide', 'Dividir potrero', 'Dibuja un sector dentro del lote']
    ];
    document.getElementById('zone-actions').innerHTML = actions.map(([id, label, helpText]) =>
      '<button type="button" data-act="' + id + '"' + (plot ? '' : ' disabled') + '><strong>' + label + '</strong><small>' + helpText + '</small></button>'
    ).join('');
  }

  function renderCrops() {
    const options = AgroService.getCultivos().map((name) => '<option>' + name + '</option>').join('');
    document.getElementById('plan-crop').innerHTML = options;
    document.getElementById('crop-select').innerHTML = options;
  }

  function setMode(next) {
    mode = next;
    draft = next === 'edit' && selected() ? selected().coordinates.map((point) => ({ lat: point[1], lng: point[0] })) : [];
    document.querySelectorAll('.map-toolbar [data-mode]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mode === mode);
    });
    document.getElementById('map-help').textContent = help[mode];
    const actions = document.getElementById('draft-actions');
    actions.hidden = true;
    if (mode === 'delete' && selected() && confirm('¿Eliminar el potrero seleccionado?')) {
      AgroService.removePlot(selected().id);
      state = AgroService.getState();
      plotId = plotsOfPredio()[0]?.id || null;
      mode = 'select';
      refresh(false);
      return;
    }
    if (['draw', 'divide', 'measure', 'edit'].includes(mode)) {
      actions.hidden = false;
      document.getElementById('finish').hidden = mode === 'measure';
    }
    renderDraft();
    requestAnimationFrame(function () { map.invalidateSize(); });
  }

  function addPoint(latlng) {
    draft.push({ lat: latlng.lat, lng: latlng.lng });
    renderDraft();
  }

  function finishDraft() {
    if (mode === 'measure') return;
    if (draft.length < 3) {
      alert('Marca al menos tres vértices.');
      return;
    }
    const metrics = measure(draft);
    const coords = toLngLat(draft);
    if (mode === 'draw') {
      const name = prompt('Nombre del potrero', 'Nuevo potrero');
      if (!name) return;
      const plot = {
        id: crypto.randomUUID(),
        predio: predioId,
        name,
        crop: '',
        variety: '',
        status: 'Sin planificar',
        coordinates: coords,
        areaHa: metrics.areaHa
      };
      AgroService.addPlot(plot);
      plotId = plot.id;
    }
    if (mode === 'edit' && selected()) {
      AgroService.updatePlot(plotId, { coordinates: coords, areaHa: metrics.areaHa });
    }
    if (mode === 'divide' && selected()) {
      AgroService.addPlot({
        ...selected(),
        id: crypto.randomUUID(),
        name: selected().name + ' · sector',
        parentId: selected().id,
        coordinates: coords,
        areaHa: metrics.areaHa,
        status: 'Sector planificado'
      });
    }
    state = AgroService.getState();
    mode = 'select';
    draft = [];
    refresh();
  }

  function refresh(fit) {
    state = AgroService.getState();
    renderSwitch();
    renderMap(fit);
    renderLegend();
    renderCrops();
    renderSummary();
    renderActions();
    document.querySelectorAll('.map-toolbar [data-mode]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mode === mode);
    });
    document.getElementById('map-help').textContent = help[mode];
    document.getElementById('draft-actions').hidden = !['draw', 'divide', 'measure', 'edit'].includes(mode);
    renderDraft();
  }

  map.on('click', (event) => {
    if (['draw', 'divide', 'measure'].includes(mode)) addPoint(event.latlng);
  });

  document.getElementById('predio-switch').addEventListener('click', (event) => {
    const button = event.target.closest('[data-predio]');
    if (!button) return;
    predioId = button.dataset.predio;
    plotId = plotsOfPredio()[0]?.id || null;
    refresh(true);
  });
  document.querySelector('.map-toolbar').addEventListener('click', (event) => {
    const modeBtn = event.target.closest('[data-mode]');
    if (modeBtn) setMode(modeBtn.dataset.mode);
  });
  document.getElementById('toggle-base').addEventListener('click', (event) => {
    satellite = !satellite;
    if (satellite) {
      map.removeLayer(streets);
      sat.addTo(map);
      event.currentTarget.textContent = 'Vista mapa';
    } else {
      map.removeLayer(sat);
      streets.addTo(map);
      event.currentTarget.textContent = 'Vista satélite';
    }
  });
  document.getElementById('draft-actions').addEventListener('click', (event) => {
    const id = event.target.closest('button')?.id;
    if (id === 'finish') finishDraft();
    if (id === 'undo') { draft.pop(); renderDraft(); }
    if (id === 'cancel') setMode('select');
  });
  document.getElementById('add-predio').addEventListener('click', () => {
    document.getElementById('predio-dialog').showModal();
  });
  document.getElementById('predio-form').addEventListener('submit', (event) => {
    if (event.submitter?.value !== 'ok') return;
    const data = new FormData(event.currentTarget);
    const area = AgroService.positive(data.get('area'));
    if (!area) { event.preventDefault(); alert('La superficie debe ser mayor a 0.'); return; }
    const predio = {
      id: crypto.randomUUID(),
      name: data.get('name'),
      location: data.get('location'),
      zone: data.get('zone') || 'Metropolitana',
      area
    };
    AgroService.addPredio(predio);
    predioId = predio.id;
    plotId = null;
    refresh(false);
  });
  document.getElementById('plan-crop').addEventListener('change', () => {
    fillVarieties(document.getElementById('plan-variety'), document.getElementById('plan-crop').value, '');
  });
  document.getElementById('crop-select').addEventListener('change', () => {
    fillVarieties(document.getElementById('crop-variety'), document.getElementById('crop-select').value, '');
  });
  document.getElementById('plan-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!selected()) return;
    const areaHa = AgroService.positive(document.getElementById('plan-area').value);
    if (!areaHa) { document.getElementById('plan-msg').textContent = 'La superficie debe ser mayor a 0.'; return; }
    AgroService.updatePlot(plotId, {
      crop: document.getElementById('plan-crop').value,
      variety: document.getElementById('plan-variety').value,
      sowing: document.getElementById('plan-sowing').value,
      harvest: document.getElementById('plan-harvest').value,
      areaHa,
      status: 'Planificado'
    });
    document.getElementById('plan-msg').textContent = 'Planificación guardada.';
    refresh();
  });
  document.getElementById('zone-actions').addEventListener('click', (event) => {
    const button = event.target.closest('[data-act]');
    const act = button?.dataset.act;
    if (!act || !selected()) return;
    if (act === 'crop') {
      fillVarieties(document.getElementById('crop-variety'), document.getElementById('crop-select').value, selected().variety || '');
      document.getElementById('crop-dialog').showModal();
    }
    if (act === 'plan') document.getElementById('plan-crop').focus();
    if (act === 'calc') location.href = '/calculadora/?plot=' + plotId;
    if (act === 'sag') location.href = '/asesor/?crop=' + encodeURIComponent(selected().crop || '');
    if (act === 'divide') setMode('divide');
    if (act === 'water' || act === 'fert' || act === 'pest') {
      const detail = prompt('Detalle de la actividad');
      if (!detail) return;
      const current = AgroService.getState();
      current.activities.push({ id: crypto.randomUUID(), title: button.querySelector('strong')?.textContent || 'Registro', detail, type: 'Registro', done: false });
      AgroService.saveState(current);
      alert('Actividad registrada en Inicio.');
    }
  });
  document.getElementById('crop-form').addEventListener('submit', (event) => {
    if (event.submitter?.value !== 'ok' || !selected()) return;
    const data = new FormData(event.currentTarget);
    AgroService.updatePlot(plotId, { crop: data.get('crop'), variety: data.get('variety'), status: data.get('status') });
    refresh(false);
  });

  function fitMap() {
    map.invalidateSize();
  }
  window.addEventListener('resize', fitMap);
  refresh(true);
  setMode('select');
  requestAnimationFrame(fitMap);
})();
