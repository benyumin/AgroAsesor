window.AGRO_MOCK = {
  disclaimer: 'Esta recomendación es orientativa y no reemplaza la evaluación de un ingeniero agrónomo certificado.',
  version: 'demo-1.0',
  users: [
    { email: 'agricultor@agroasesor.cl', name: 'Juan Pérez', role: 'Agricultor' },
    { email: 'admin@agroasesor.cl', name: 'Ana González', role: 'Administrador' }
  ],
  predios: [
    { id: 'p1', name: 'Santa Rita', location: 'Melipilla, Región Metropolitana', zone: 'Metropolitana', area: 12.5 },
    { id: 'p2', name: 'La Esperanza', location: 'Melipilla, Región Metropolitana', zone: 'Metropolitana', area: 8.2 },
    { id: 'p3', name: 'Los Aromos', location: 'Melipilla, Región Metropolitana', zone: 'Metropolitana', area: 6 }
  ],
  plots: [
    {
      id: 't1', predio: 'p1', name: 'Potrero Norte', crop: 'Maíz', variety: 'Híbrido demo',
      status: 'En crecimiento', sowing: '2026-09-01', harvest: '2027-03-01', areaHa: 4.8,
      coordinates: [[-71.216, -33.692], [-71.209, -33.692], [-71.209, -33.6878], [-71.216, -33.6878]]
    },
    {
      id: 't2', predio: 'p1', name: 'Potrero La Esperanza', crop: 'Tomate', variety: 'Industrial demo',
      status: 'Planificado', sowing: '2026-10-01', harvest: '2027-02-01', areaHa: 1.245,
      coordinates: [[-71.216, -33.6876], [-71.2124, -33.6876], [-71.2124, -33.6854], [-71.216, -33.6854]]
    },
    {
      id: 't3', predio: 'p2', name: 'Sector B', crop: 'Trigo', variety: 'Demo invierno',
      status: 'En crecimiento', sowing: '2026-06-01', harvest: '2026-12-01', areaHa: 3.2,
      coordinates: [[-71.2086, -33.692], [-71.2036, -33.692], [-71.2036, -33.6876], [-71.2086, -33.6876]]
    },
    {
      id: 't4', predio: 'p2', name: 'Potrero Sur', crop: 'Alfalfa', variety: 'Demo',
      status: 'En crecimiento', sowing: '2026-08-15', harvest: '2027-01-15', areaHa: 2.6,
      coordinates: [[-71.2086, -33.6874], [-71.2036, -33.6874], [-71.2036, -33.6846], [-71.2086, -33.6846]]
    },
    {
      id: 't5', predio: 'p3', name: 'Lote Maicero', crop: 'Maíz', variety: 'Híbrido demo',
      status: 'Planificado', sowing: '2026-10-10', harvest: '2027-04-01', areaHa: 5.1,
      coordinates: [[-71.216, -33.685], [-71.208, -33.685], [-71.208, -33.6814], [-71.216, -33.6814]]
    }
  ],
  activities: [
    { id: 'a1', title: 'Revisar cultivo de maíz', detail: 'Potrero Norte · Santa Rita', type: 'Revisión', done: false },
    { id: 'a2', title: 'Planificar siembra de tomate', detail: 'Potrero La Esperanza', type: 'Planificación', done: false },
    { id: 'a3', title: 'Calcular cobertura de fertilizante', detail: 'Sector B · La Esperanza', type: 'Recomendación', done: true }
  ],
  cultivos: ['Maíz', 'Trigo', 'Papa', 'Alfalfa', 'Tomate', 'Cebolla'],
  zonas: ['Metropolitana', 'O’Higgins', 'Maule', 'Ñuble'],
  problemas: [
    { id: 'pr1', name: 'Gusano cogollero', type: 'Plaga', typeKey: 'plaga', description: 'Larva del cogollo del maíz.', symptoms: 'Hojas agujereadas.', management: 'Revisar plantas jóvenes.', active: true },
    { id: 'pr2', name: 'Carencia de nitrógeno', type: 'Nutrición', typeKey: 'nutricion', description: 'Plantas pálidas.', active: true },
    { id: 'pr3', name: 'Malezas de hoja ancha', type: 'Maleza', typeKey: 'maleza', description: 'Competencia en cereal.', active: true },
    { id: 'pr4', name: 'Tizón tardío', type: 'Enfermedad', typeKey: 'enfermedad', description: 'Hongo en papa.', active: true }
  ],
  variedades: [
    { id: 'v1', name: 'Híbrido demo', crop: 'Maíz', zone: 'Metropolitana', description: 'Ciclo intermedio.', cycleDays: 135 },
    { id: 'v2', name: 'Industrial demo', crop: 'Tomate', zone: 'Metropolitana', description: 'Industria.', cycleDays: 105 },
    { id: 'v3', name: 'Demo invierno', crop: 'Trigo', zone: 'Maule', description: 'Trigo de invierno.', cycleDays: 185 }
  ],
  insumos: [
    {
      id: 'i1', name: 'Insecticida cogollero demostrativo', active: true, crop: 'Maíz', problem: 'Gusano cogollero',
      type: 'Insecticida', ingredient: 'Lambda-cihalotrina (demostrativo)', dose: 0.2, unit: 'L', zone: 'Metropolitana',
      application: 'Mojar el cogollo al atardecer.',
      safety: 'Usar guantes y mascarilla.',
      description: 'Uso demostrativo contra larva de cogollero.',
      source: 'Catálogo demostrativo AgroAsesor', updated: 'septiembre 2026'
    },
    {
      id: 'i2', name: 'Urea 46% demostrativa', active: true, crop: 'Maíz', problem: 'Carencia de nitrógeno',
      type: 'Fertilizante', ingredient: 'Nitrógeno ureico 46%', dose: 200, unit: 'kg', zone: 'Maule',
      application: 'Al voleo e incorporar con riego.',
      safety: 'No mezclar con semilla.',
      description: 'Fertilización nitrogenada de referencia.',
      source: 'Catálogo demostrativo AgroAsesor', updated: 'septiembre 2026'
    },
    {
      id: 'i3', name: 'Fungicida tizón demostrativo', active: true, crop: 'Papa', problem: 'Tizón tardío',
      type: 'Fungicida', ingredient: 'Mancozeb (demostrativo)', dose: 2, unit: 'kg', zone: 'O’Higgins',
      application: 'Preventivo con humedad alta.',
      safety: 'Usar overol y lentes.',
      description: 'Protección foliar demostrativa.',
      source: 'Catálogo demostrativo AgroAsesor', updated: 'septiembre 2026'
    },
    {
      id: 'i4', name: 'Semilla de maíz demostrativa', active: true, crop: 'Maíz', problem: '',
      type: 'Semilla', ingredient: 'Híbrido de grano', dose: 25, unit: 'kg', zone: 'Metropolitana',
      application: 'Siembra a 70–75 cm entre hileras.',
      safety: 'Semilla tratada: no consumir.',
      description: 'Dosis alineada con el catálogo de cultivos.',
      source: 'Catálogo demostrativo AgroAsesor', updated: 'septiembre 2026'
    }
  ],
  semillas: [
    { id: 's1', name: 'Maíz híbrido demo', crop: 'Maíz', density: 25, unit: 'kg' },
    { id: 's2', name: 'Trigo demo', crop: 'Trigo', density: 160, unit: 'kg' },
    { id: 's3', name: 'Papa semilla demo', crop: 'Papa', density: 2500, unit: 'kg' }
  ],
  calendario: [
    { crop: 'Maíz', variety: 'Híbrido demo', zone: 'Metropolitana', sowStart: 9, sowEnd: 11, harvestStart: 2, harvestEnd: 4, notes: 'Siembra de primavera en Zona Central.' },
    { crop: 'Trigo', variety: 'Demo invierno', zone: 'Maule', sowStart: 5, sowEnd: 7, harvestStart: 12, harvestEnd: 1, notes: 'Siembra de otoño-invierno.' },
    { crop: 'Papa', variety: '', zone: 'O’Higgins', sowStart: 8, sowEnd: 10, harvestStart: 12, harvestEnd: 2, notes: 'Papa de primavera.' },
    { crop: 'Alfalfa', variety: '', zone: 'Maule', sowStart: 3, sowEnd: 5, harvestStart: 9, harvestEnd: 4, notes: 'Establecimiento en otoño.' },
    { crop: 'Tomate', variety: 'Industrial demo', zone: 'Metropolitana', sowStart: 8, sowEnd: 10, harvestStart: 12, harvestEnd: 3, notes: 'Trasplante de primavera.' },
    { crop: 'Cebolla', variety: '', zone: 'O’Higgins', sowStart: 6, sowEnd: 8, harvestStart: 1, harvestEnd: 3, notes: 'Almácigo de invierno.' }
  ],
  yields: { Maíz: 9.2, Trigo: 5.5, Papa: 30, Alfalfa: 12, Tomate: 70, Cebolla: 40 },
  adminStats: { agricultores: 18, cultivos: 6, insumos: 12, consultas: 47 }
};
