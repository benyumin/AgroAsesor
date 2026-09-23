(function () {
  const KEY = 'agroasesor-demo-v1';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function seed() {
    return {
      predios: clone(window.AGRO_MOCK.predios),
      plots: clone(window.AGRO_MOCK.plots),
      activities: clone(window.AGRO_MOCK.activities),
      cultivos: clone(window.AGRO_MOCK.cultivos).map((name, i) => ({ id: 'c' + i, name, active: true })),
      variedades: [
        { id: 'v1', name: 'Híbrido demo', active: true },
        { id: 'v2', name: 'Industrial demo', active: true },
        { id: 'v3', name: 'Demo invierno', active: true }
      ],
      zonas: clone(window.AGRO_MOCK.zonas).map((name, i) => ({ id: 'z' + i, name, active: true })),
      insumos: clone(window.AGRO_MOCK.insumos),
      problemas: clone(window.AGRO_MOCK.problemas),
      calendario: clone(window.AGRO_MOCK.calendario).map((item, i) => ({ id: 'cal' + i, active: true, ...item })),
      results: {}
    };
  }

  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY));
      if (stored && stored.plots && stored.predios) return stored;
    } catch (error) {
      console.warn('No se pudo leer el estado local.', error);
    }
    const fresh = seed();
    save(fresh);
    return fresh;
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
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
    const rate = window.AGRO_MOCK.yields[crop];
    if (area === null) return { ok: false, error: 'La superficie debe ser mayor a 0.' };
    if (!rate) return { ok: false, error: 'Selecciona un cultivo.' };
    return { ok: true, rate, production: rate * area, confidence: 'Media (datos de referencia, no un modelo real).' };
  }

  const api = {
    getState: load,
    saveState: save,
    getPredios: () => load().predios,
    getPlots: (predioId) => load().plots.filter((plot) => !predioId || plot.predio === predioId),
    getCultivos: () => load().cultivos.filter((item) => item.active !== false).map((item) => item.name || item),
    getInsumos: (onlyActive) => load().insumos.filter((item) => !onlyActive || item.active),
    getProblemas: () => load().problemas.filter((item) => item.active !== false),
    calculateCoverage,
    calculateDose,
    predictYield,
    fmt,
    positive,
    nonNegative,
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
