(function () {
  const KEY = 'agroasesor-demo-v1';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readServerCatalog() {
    const node = document.getElementById('agro-catalog');
    if (!node) return null;
    try {
      const data = JSON.parse(node.textContent);
      if (data && data.fromDb) return data;
    } catch (error) {
      console.warn('No se pudo leer el catálogo de la base de datos.', error);
    }
    return null;
  }

  function applyCatalog(state, catalog) {
    if (!catalog || !catalog.fromDb) return state;
    if (catalog.cultivos) state.cultivos = catalog.cultivos;
    if (catalog.insumos) state.insumos = catalog.insumos;
    if (catalog.problemas) state.problemas = catalog.problemas;
    if (catalog.variedades) state.variedades = catalog.variedades;
    if (catalog.calendario) state.calendario = catalog.calendario;
    if (catalog.zonas) {
      state.zonas = catalog.zonas.map((name, index) => ({ id: 'z' + index, name, active: true }));
      window.AGRO_MOCK.zonas = catalog.zonas.slice();
    }
    window.AGRO_MOCK.cultivos = (catalog.cultivos || [])
      .filter((item) => item.active !== false)
      .map((item) => item.name);
    if (catalog.insumos) window.AGRO_MOCK.insumos = catalog.insumos;
    if (catalog.problemas) window.AGRO_MOCK.problemas = catalog.problemas;
    if (catalog.variedades) window.AGRO_MOCK.variedades = catalog.variedades;
    if (catalog.calendario) window.AGRO_MOCK.calendario = catalog.calendario;
    if (catalog.semillas && catalog.semillas.length) window.AGRO_MOCK.semillas = catalog.semillas;
    if (catalog.yields) window.AGRO_MOCK.yields = catalog.yields;
    if (catalog.disclaimer) window.AGRO_MOCK.disclaimer = catalog.disclaimer;
    window.AGRO_CATALOG = catalog;
    return state;
  }

  function seed() {
    return {
      predios: clone(window.AGRO_MOCK.predios),
      plots: clone(window.AGRO_MOCK.plots),
      activities: clone(window.AGRO_MOCK.activities),
      cultivos: clone(window.AGRO_MOCK.cultivos).map((name, i) => ({ id: 'c' + i, name, active: true })),
      variedades: clone(window.AGRO_MOCK.variedades || []).map((item, i) => (
        typeof item === 'string' ? { id: 'v' + i, name: item, active: true } : { active: true, ...item, id: item.id || 'v' + i }
      )),
      zonas: clone(window.AGRO_MOCK.zonas).map((name, i) => ({ id: 'z' + i, name, active: true })),
      insumos: clone(window.AGRO_MOCK.insumos),
      problemas: clone(window.AGRO_MOCK.problemas),
      calendario: clone(window.AGRO_MOCK.calendario).map((item, i) => ({ id: 'cal' + i, active: true, ...item })),
      results: {}
    };
  }

  function load() {
    const fresh = seed();
    try {
      const stored = JSON.parse(localStorage.getItem(KEY));
      if (stored && stored.plots && stored.predios) {
        fresh.predios = stored.predios;
        fresh.plots = stored.plots;
        fresh.activities = stored.activities || fresh.activities;
        fresh.results = stored.results || {};
      }
    } catch (error) {
      console.warn('No se pudo leer el estado local.', error);
    }
    applyCatalog(fresh, readServerCatalog());
    return fresh;
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        predios: state.predios,
        plots: state.plots,
        activities: state.activities,
        results: state.results || {}
      }));
    } catch (error) {
      console.warn('No se pudo guardar el estado local.', error);
    }
  }

  function fmt(value, digits) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    return number.toLocaleString('es-CL', { maximumFractionDigits: digits ?? 2, minimumFractionDigits: 0 });
  }

  function positive(value) {
    const number = Number(String(value).replace(',', '.'));
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function nonNegative(value) {
    const number = Number(String(value).replace(',', '.'));
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function calculateDose(areaHa, dose) {
    const area = positive(areaHa);
    const d = positive(dose);
    if (area === null || d === null) return { ok: false, error: 'Ingresa superficie y dosis mayores a 0.' };
    return { ok: true, amount: area * d, formula: area + ' × ' + d + ' = ' + (area * d) };
  }

  function calculateCoverage(areaHa, dose, available) {
    const area = positive(areaHa);
    const d = positive(dose);
    const stock = nonNegative(available);
    if (area === null || d === null || stock === null) {
      return { ok: false, error: 'Revisa superficie, dosis y cantidad disponible.' };
    }
    const needed = area * d;
    const coveredHa = Math.min(area, stock / d);
    const percent = (coveredHa / area) * 100;
    const missingHa = Math.max(0, area - coveredHa);
    const missingQty = Math.max(0, needed - stock);
    const surplus = Math.max(0, stock - needed);
    return { ok: true, needed, coveredHa, percent, missingHa, missingQty, surplus };
  }

  function predictYield(crop, areaHa) {
    const area = positive(areaHa);
    const info = getCultivo(crop);
    const rate = (info && info.yield) || window.AGRO_MOCK.yields[crop];
    if (area === null) return { ok: false, error: 'La superficie debe ser mayor a 0.' };
    if (!rate) return { ok: false, error: 'Selecciona un cultivo.' };
    return { ok: true, rate, production: rate * area, confidence: 'Media (datos de referencia, no un modelo real).' };
  }

  function sameId(left, right) {
    return String(left) === String(right);
  }

  function getCultivo(name) {
    return load().cultivos.find((item) => (item.name || item) === name) || null;
  }

  function getVariedades(crop, zone) {
    return (load().variedades || []).filter((item) => {
      if (item.active === false) return false;
      if (crop && item.crop && item.crop !== crop) return false;
      if (zone && item.zone && item.zone !== zone) return false;
      return true;
    });
  }

  function getCalendario(zone, crop) {
    return (load().calendario || []).filter((item) => {
      if (item.active === false) return false;
      if (zone && item.zone && item.zone !== zone) return false;
      if (crop && item.crop && item.crop !== crop) return false;
      return true;
    });
  }

  function monthName(month) {
    return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][month - 1] || '';
  }

  function monthRange(start, end) {
    if (!start || !end) return '—';
    if (start === end) return monthName(start);
    return monthName(start) + ' – ' + monthName(end);
  }

  function wrapText(doc, text, x, y, maxWidth, lineHeight) {
    const lines = doc.splitTextToSize(String(text || ''), maxWidth);
    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, x, y);
      y += lineHeight;
    });
    return y;
  }

  function downloadPdf(filename, title, rows) {
    if (!window.jspdf) {
      alert('No se pudo cargar el generador de PDF.');
      return false;
    }
    const doc = new window.jspdf.jsPDF();
    doc.setFillColor(35, 93, 55);
    doc.rect(0, 0, 210, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('AgroAsesor', 14, 14);
    doc.setFontSize(10);
    doc.text('Zona Central · demostración', 150, 14);
    doc.setTextColor(30, 40, 32);
    doc.setFontSize(14);
    let y = 34;
    y = wrapText(doc, title, 14, y, 180, 7);
    doc.setFontSize(10);
    y += 4;
    (rows || []).forEach((row) => {
      if (!row) return;
      if (row.heading) {
        y += 3;
        doc.setFont(undefined, 'bold');
        y = wrapText(doc, row.heading, 14, y, 180, 6);
        doc.setFont(undefined, 'normal');
        return;
      }
      const line = row.label ? (row.label + ': ' + (row.value ?? '')) : String(row.value ?? row);
      y = wrapText(doc, line, 14, y, 180, 6);
    });
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    wrapText(doc, window.AGRO_MOCK.disclaimer, 14, y, 180, 4.5);
    doc.save(filename);
    return true;
  }

  const api = {
    getState: load,
    saveState: save,
    catalogFromDb: () => Boolean(readServerCatalog()),
    getCatalog: () => readServerCatalog() || {},
    getPredios: () => load().predios,
    getPlots: (predioId) => load().plots.filter((plot) => !predioId || plot.predio === predioId),
    getCultivos: () => load().cultivos.filter((item) => item.active !== false).map((item) => item.name || item),
    getCultivo,
    getSemilla(crop) {
      return (window.AGRO_MOCK.semillas || []).find((item) => item.crop === crop) || null;
    },
    getInsumos: (onlyActive) => load().insumos.filter((item) => !onlyActive || item.active),
    getProblemas: () => load().problemas.filter((item) => item.active !== false),
    getVariedades,
    getCalendario,
    getZonas: () => (readServerCatalog()?.zonas || window.AGRO_MOCK.zonas || []),
    monthName,
    monthRange,
    calculateCoverage,
    calculateDose,
    predictYield,
    downloadPdf,
    fmt,
    positive,
    nonNegative,
    sameId,
    updatePlot(id, values) {
      const state = load();
      state.plots = state.plots.map((plot) => plot.id === id ? { ...plot, ...values } : plot);
      save(state);
      return state.plots.find((plot) => plot.id === id);
    },
    addPlot(plot) {
      const state = load();
      state.plots.push(plot);
      save(state);
      return plot;
    },
    removePlot(id) {
      const state = load();
      state.plots = state.plots.filter((plot) => plot.id !== id && plot.parentId !== id);
      save(state);
    },
    addPredio(predio) {
      const state = load();
      state.predios.push(predio);
      save(state);
      return predio;
    },
    toggleActivity(id) {
      const state = load();
      state.activities = state.activities.map((item) => item.id === id ? { ...item, done: !item.done } : item);
      save(state);
    },
    saveResult(key, value) {
      const state = load();
      state.results[key] = value;
      save(state);
    },
    getResult(key) {
      return load().results[key];
    },
    replaceCatalog(section, items) {
      const state = load();
      state[section] = items;
      save(state);
    }
  };

  window.AgroService = api;
})();
