from django.db.models import Case, IntegerField, When

from .models import CalendarioSiembra, Cultivo, Insumo, ProblemaAgricola, TipoInsumo, Variedad, Zona


MESES = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]


def _num(value, fallback=0):
    if value is None:
        return fallback
    return float(value)


def catalog_payload():
    if not Cultivo.objects.exists():
        return {}

    cultivos = []
    semillas = []
    yields = {}
    for cultivo in Cultivo.objects.filter(activo=True).order_by('nombre'):
        cultivos.append({
            'id': cultivo.id,
            'name': cultivo.nombre,
            'description': cultivo.descripcion,
            'family': cultivo.familia,
            'cycleDays': cultivo.ciclo_dias,
            'season': cultivo.epoca,
            'notes': cultivo.notas_manejo,
            'yield': _num(cultivo.rendimiento_ton_ha),
            'density': _num(cultivo.densidad_siembra),
            'unit': cultivo.unidad_siembra or 'kg',
            'active': cultivo.activo,
        })
        if cultivo.densidad_siembra is not None:
            semillas.append({
                'crop': cultivo.nombre,
                'density': _num(cultivo.densidad_siembra),
                'unit': cultivo.unidad_siembra or 'kg',
            })
        if cultivo.rendimiento_ton_ha is not None:
            yields[cultivo.nombre] = _num(cultivo.rendimiento_ton_ha)

    insumos = []
    for insumo in Insumo.objects.select_related('tipo', 'cultivo', 'zona', 'problema').order_by('nombre'):
        insumos.append({
            'id': insumo.id,
            'name': insumo.nombre,
            'active': insumo.vigente,
            'crop': insumo.cultivo.nombre if insumo.cultivo else '',
            'problem': insumo.problema.nombre if insumo.problema else '',
            'problemType': insumo.problema.tipo if insumo.problema else '',
            'type': insumo.tipo.nombre if insumo.tipo else '',
            'dose': _num(insumo.dosis_hectarea),
            'unit': insumo.unidad_dosis or '',
            'zone': insumo.zona.nombre if insumo.zona else '',
            'description': insumo.descripcion,
            'ingredient': insumo.ingrediente_activo,
            'application': insumo.modo_aplicacion,
            'safety': insumo.consideraciones_seguridad,
            'waitDays': insumo.carencia_dias,
            'source': insumo.fuente or 'Catálogo demostrativo AgroAsesor',
            'updated': 'septiembre 2026',
        })

    problemas = []
    for problema in ProblemaAgricola.objects.filter(activo=True).order_by('nombre'):
        problemas.append({
            'id': problema.id,
            'name': problema.nombre,
            'type': problema.get_tipo_display(),
            'typeKey': problema.tipo,
            'description': problema.descripcion,
            'symptoms': problema.sintomas,
            'management': problema.manejo,
        })

    variedades = []
    for variedad in Variedad.objects.select_related('cultivo', 'zona').filter(activo=True).order_by('nombre'):
        variedades.append({
            'id': variedad.id,
            'name': variedad.nombre,
            'crop': variedad.cultivo.nombre,
            'zone': variedad.zona.nombre if variedad.zona else '',
            'description': variedad.descripcion,
            'cycleDays': variedad.ciclo_dias,
        })

    calendario = []
    for fila in CalendarioSiembra.objects.select_related('cultivo', 'variedad', 'zona').filter(activo=True):
        calendario.append({
            'id': fila.id,
            'crop': fila.cultivo.nombre,
            'variety': fila.variedad.nombre if fila.variedad else '',
            'zone': fila.zona.nombre if fila.zona else '',
            'sowStart': fila.mes_siembra_inicio,
            'sowEnd': fila.mes_siembra_fin,
            'harvestStart': fila.mes_cosecha_inicio,
            'harvestEnd': fila.mes_cosecha_fin,
            'notes': fila.observaciones,
        })

    zonas = list(
        Zona.objects.filter(activo=True).order_by(
            Case(When(nombre='Metropolitana', then=0), default=1, output_field=IntegerField()),
            'nombre',
        ).values_list('nombre', flat=True)
    )

    return {
        'fromDb': True,
        'meses': MESES,
        'zonas': zonas,
        'tiposInsumo': list(TipoInsumo.objects.order_by('nombre').values_list('nombre', flat=True)),
        'cultivos': cultivos,
        'insumos': insumos,
        'semillas': semillas,
        'problemas': problemas,
        'variedades': variedades,
        'calendario': calendario,
        'yields': yields,
        'disclaimer': (
            'Información demostrativa de AgroAsesor. No reemplaza una recomendación '
            'oficial del SAG, ODEPA, INIA ni de un asesor de campo.'
        ),
    }
