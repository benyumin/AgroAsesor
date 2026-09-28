from .models import Cultivo, Insumo, TipoInsumo, Zona


def _num(value):
    if value is None:
        return None
    return float(value)


def catalog_payload():
    if not Cultivo.objects.exists():
        return {}

    cultivos = list(Cultivo.objects.order_by('nombre'))
    insumos = list(Insumo.objects.select_related('tipo', 'cultivo', 'zona').order_by('nombre'))
    zonas = list(Zona.objects.order_by('nombre'))

    return {
        'fromDb': True,
        'zonas': [
            {'id': str(zona.pk), 'name': zona.nombre, 'description': zona.descripcion, 'active': zona.activo}
            for zona in zonas
        ],
        'cultivos': [
            {
                'id': str(cultivo.pk),
                'name': cultivo.nombre,
                'description': cultivo.descripcion,
                'yield': _num(cultivo.rendimiento_ton_ha),
                'density': _num(cultivo.densidad_siembra),
                'unit': cultivo.unidad_siembra or 'kg',
                'active': cultivo.activo,
            }
            for cultivo in cultivos
        ],
        'insumos': [
            {
                'id': str(insumo.pk),
                'name': insumo.nombre,
                'active': insumo.vigente,
                'crop': insumo.cultivo.nombre if insumo.cultivo else '',
                'type': insumo.tipo.nombre,
                'dose': _num(insumo.dosis_hectarea),
                'unit': insumo.unidad_dosis,
                'zone': insumo.zona.nombre if insumo.zona else '',
                'description': insumo.descripcion,
            }
            for insumo in insumos
        ],
        'semillas': [
            {
                'id': str(cultivo.pk),
                'name': cultivo.nombre,
                'crop': cultivo.nombre,
                'density': _num(cultivo.densidad_siembra) or 25,
                'unit': cultivo.unidad_siembra or 'kg',
            }
            for cultivo in cultivos
            if cultivo.activo and cultivo.densidad_siembra
        ],
        'yields': {
            cultivo.nombre: _num(cultivo.rendimiento_ton_ha)
            for cultivo in cultivos
            if cultivo.rendimiento_ton_ha is not None
        },
    }
