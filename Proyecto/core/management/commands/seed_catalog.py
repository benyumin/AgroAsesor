from django.core.management.base import BaseCommand

from core.models import CalendarioSiembra, Cultivo, Insumo, ProblemaAgricola, TipoInsumo, Variedad, Zona


ZONAS = [
    ('Metropolitana', 'Valle central cercano a Santiago. Riego, hortalizas y maíz de temporada.'),
    ('O’Higgins', 'Cordón hortícola y frutícola. Papa, tomate y maíz dulce.'),
    ('Maule', 'Zona cerealera y forrajera. Trigo, maíz y alfalfa.'),
    ('Ñuble', 'Transición sur. Trigo, papa y praderas.'),
]

CULTIVOS = [
    {
        'nombre': 'Maíz',
        'familia': 'Poáceas',
        'ciclo_dias': 140,
        'epoca': 'Primavera–verano',
        'descripcion': 'Grano y ensilaje de verano en el valle central.',
        'notas_manejo': 'Siembra con suelo templado (sobre 12 °C). Controlar gusano cogollero en las primeras semanas. No saturar el riego en floración.',
        'rendimiento_ton_ha': '9.20',
        'densidad_siembra': '25',
        'unidad_siembra': 'kg',
    },
    {
        'nombre': 'Trigo',
        'familia': 'Poáceas',
        'ciclo_dias': 180,
        'epoca': 'Otoño–invierno',
        'descripcion': 'Cereal de invierno para grano panadero o forraje.',
        'notas_manejo': 'Sembrar en cama firme. Fraccionar el nitrógeno: siembra y macolla. Vigilar roya en primavera húmeda.',
        'rendimiento_ton_ha': '5.50',
        'densidad_siembra': '160',
        'unidad_siembra': 'kg',
    },
    {
        'nombre': 'Papa',
        'familia': 'Solanáceas',
        'ciclo_dias': 120,
        'epoca': 'Primavera',
        'descripcion': 'Tubérculo de consumo fresco o industria.',
        'notas_manejo': 'Usar semilla certificada. Aporcar a tiempo. El tizón tardío aparece con humedad y noches frescas.',
        'rendimiento_ton_ha': '30.00',
        'densidad_siembra': '2500',
        'unidad_siembra': 'kg',
    },
    {
        'nombre': 'Alfalfa',
        'familia': 'Leguminosas',
        'ciclo_dias': 365,
        'epoca': 'Otoño o primavera',
        'descripcion': 'Forraje perenne de varios cortes al año.',
        'notas_manejo': 'Inocular semilla. Primer corte cuando cubre el suelo. Evitar compactar con maquinaria en suelos húmedos.',
        'rendimiento_ton_ha': '12.00',
        'densidad_siembra': '20',
        'unidad_siembra': 'kg',
    },
    {
        'nombre': 'Tomate',
        'familia': 'Solanáceas',
        'ciclo_dias': 110,
        'epoca': 'Primavera–verano',
        'descripcion': 'Hortaliza de invernadero o aire libre en Zona Central.',
        'notas_manejo': 'Tutorado y desbrote. Riego frecuente y corto. Pulgón y mosca minadora son frecuentes en invernadero.',
        'rendimiento_ton_ha': '70.00',
        'densidad_siembra': '0.200',
        'unidad_siembra': 'kg',
    },
    {
        'nombre': 'Cebolla',
        'familia': 'Aliáceas',
        'ciclo_dias': 150,
        'epoca': 'Invierno–primavera',
        'descripcion': 'Hortaliza de bulbo para mercado fresco.',
        'notas_manejo': 'Almácigo o siembra directa. Malezas al inicio. Suspender riego 2–3 semanas antes de cosecha.',
        'rendimiento_ton_ha': '40.00',
        'densidad_siembra': '4',
        'unidad_siembra': 'kg',
    },
]

PROBLEMAS = [
    {
        'nombre': 'Gusano cogollero',
        'tipo': 'plaga',
        'descripcion': 'Larva que se alimenta del cogollo del maíz y deja aserrín húmedo.',
        'sintomas': 'Hojas con orificios irregulares, cogollo dañado y excremento fresco.',
        'manejo': 'Revisar plantas jóvenes. Aplicar de tarde, apuntando al cogollo. Rotar modo de acción.',
    },
    {
        'nombre': 'Pulgón',
        'tipo': 'plaga',
        'descripcion': 'Insecto chupador en brotes de tomate, alfalfa y hortalizas.',
        'sintomas': 'Hojas enrolladas, mielecilla y plantas debilitadas.',
        'manejo': 'Monitorear el envés. Preferir jabones o aceites si la presión es baja.',
    },
    {
        'nombre': 'Mosca minadora',
        'tipo': 'plaga',
        'descripcion': 'Larva que traza galerías en hojas de tomate y hortalizas.',
        'sintomas': 'Líneas claras serpentinas en la hoja y pérdida de área foliar.',
        'manejo': 'Retirar hojas muy dañadas. Evitar exceso de nitrógeno que ablanda el tejido.',
    },
    {
        'nombre': 'Gusano de alambre',
        'tipo': 'plaga',
        'descripcion': 'Larva de suelo que perfora tubérculos de papa.',
        'sintomas': 'Galerías en papa, plantas que no emergen bien.',
        'manejo': 'Rotación con cereales. Evitar siembras en potreros con historial reciente.',
    },
    {
        'nombre': 'Tizón tardío',
        'tipo': 'enfermedad',
        'descripcion': 'Hongo que ataca papa y tomate con humedad alta.',
        'sintomas': 'Manchas oscuras en hojas, olor a podrido y tubérculos blandos.',
        'manejo': 'Variedades más tolerantes, riego por surco o goteo, no mojar el follaje de noche.',
    },
    {
        'nombre': 'Roya del trigo',
        'tipo': 'enfermedad',
        'descripcion': 'Pústulas naranjas en hoja y tallo del trigo.',
        'sintomas': 'Polvo naranja al frotar la hoja y senescencia anticipada.',
        'manejo': 'Variedad adecuada a la zona. Fungicida demostrativo si hay presión en primavera.',
    },
    {
        'nombre': 'Malezas de hoja ancha',
        'tipo': 'maleza',
        'descripcion': 'Yuyo, mostaza y otras de hoja ancha en cereales.',
        'sintomas': 'Competencia temprana, potrero sucio a macolla.',
        'manejo': 'Control en post-emergencia temprana. No esperar a que cierren el surco.',
    },
    {
        'nombre': 'Carencia de nitrógeno',
        'tipo': 'nutricion',
        'descripcion': 'Falta de N: plantas pálidas y menor crecimiento.',
        'sintomas': 'Hojas viejas amarillas, menor tallo y mazorca o espiga chica.',
        'manejo': 'Fraccionar urea o fertilizante nitrogenado según etapa y riego.',
    },
    {
        'nombre': 'Carencia de fósforo',
        'tipo': 'nutricion',
        'descripcion': 'Poco P al establecimiento: raíces débiles y coloración púrpura.',
        'sintomas': 'Plantas chicas, hojas con tinte morado, retraso de floración.',
        'manejo': 'Fósforo a la siembra, cerca de la semilla, en suelos fríos de primavera.',
    },
]

VARIEDADES = [
    ('Maíz', 'Metropolitana', 'DK 670 demostrativa', 'Ciclo intermedio para grano en riego.', 135),
    ('Maíz', 'O’Higgins', 'P 3527 demostrativa', 'Ensilaje y grano en valle hortícola.', 140),
    ('Maíz', 'Maule', 'NK 840 demostrativa', 'Adaptada a Maule con riego.', 145),
    ('Trigo', 'Maule', 'Pantera demostrativa', 'Trigo de invierno panadero.', 185),
    ('Trigo', 'Ñuble', 'Kalyansona demostrativa', 'Ciclo largo para Ñuble.', 190),
    ('Papa', 'O’Higgins', 'Patagonia demostrativa', 'Consumo fresco, piel clara.', 115),
    ('Papa', 'Metropolitana', 'Asterix demostrativa', 'Industria y mercado interno.', 120),
    ('Alfalfa', 'Maule', 'WL 903 demostrativa', 'Dormancia intermedia.', 365),
    ('Tomate', 'Metropolitana', 'Cal Ace demostrativa', 'Industria / pasta.', 105),
    ('Tomate', 'O’Higgins', 'Híbrido 7707 demostrativa', 'Ensalada de invernadero.', 100),
    ('Cebolla', 'O’Higgins', 'Valenciana demostrativa', 'Día largo, guarda.', 155),
    ('Cebolla', 'Metropolitana', 'Grano de Oro demostrativa', 'Mercado fresco.', 145),
]

# mes_siembra_inicio, fin, cosecha_inicio, fin (1-12)
CALENDARIOS = [
    ('Maíz', 'DK 670 demostrativa', 'Metropolitana', 9, 11, 2, 4, 'Siembra cuando el suelo supera ~12 °C. Cosecha de grano de febrero a abril.'),
    ('Maíz', 'P 3527 demostrativa', 'O’Higgins', 9, 11, 2, 4, 'Evitar siembras tardías de diciembre: el grano no alcanza a secar.'),
    ('Maíz', 'NK 840 demostrativa', 'Maule', 10, 11, 3, 5, 'En Maule conviene partir un poco más tarde por heladas de septiembre.'),
    ('Trigo', 'Pantera demostrativa', 'Maule', 5, 7, 12, 1, 'Siembra de otoño–invierno. Cosecha de grano en diciembre–enero.'),
    ('Trigo', 'Kalyansona demostrativa', 'Ñuble', 5, 7, 12, 2, 'Ñuble: ventana de siembra similar, cosecha un poco más tarde.'),
    ('Papa', 'Patagonia demostrativa', 'O’Higgins', 8, 10, 12, 2, 'Papa de primavera. Cosecha de verano según ciclo de 110–120 días.'),
    ('Papa', 'Asterix demostrativa', 'Metropolitana', 8, 10, 12, 2, 'No sembrar con suelo frío: retrasa la emergencia y favorece pudriciones.'),
    ('Alfalfa', 'WL 903 demostrativa', 'Maule', 3, 5, 1, 12, 'Establecimiento en otoño. Cortes de primavera a otoño del año siguiente.'),
    ('Tomate', 'Cal Ace demostrativa', 'Metropolitana', 8, 10, 12, 3, 'Trasplante de primavera. Cosecha escalonada en verano.'),
    ('Tomate', 'Híbrido 7707 demostrativa', 'O’Higgins', 8, 10, 12, 3, 'En invernadero se adelanta 3–4 semanas respecto al aire libre.'),
    ('Cebolla', 'Valenciana demostrativa', 'O’Higgins', 6, 8, 1, 3, 'Almácigo de invierno y trasplante. Cosecha de verano.'),
    ('Cebolla', 'Grano de Oro demostrativa', 'Metropolitana', 6, 8, 1, 3, 'Suspender riego 15–20 días antes de arrancar.'),
]

INSUMOS = [
    {
        'nombre': 'Insecticida cogollero demostrativo',
        'tipo': 'Insecticida',
        'cultivo': 'Maíz',
        'problema': 'Gusano cogollero',
        'zona': 'Metropolitana',
        'dosis': '0.200',
        'unidad': 'L',
        'ingrediente': 'Lambda-cihalotrina (demostrativo)',
        'aplicacion': 'Mojar el cogollo al atardecer, 200 L de caldo/ha.',
        'seguridad': 'Usar guantes y mascarilla. No entrar al potrero hasta que seque el caldo.',
        'carencia': 14,
        'descripcion': 'Uso demostrativo contra larva de cogollero en maíz joven.',
    },
    {
        'nombre': 'Insecticida pulgón demostrativo',
        'tipo': 'Insecticida',
        'cultivo': 'Tomate',
        'problema': 'Pulgón',
        'zona': 'O’Higgins',
        'dosis': '0.400',
        'unidad': 'L',
        'ingrediente': 'Imidacloprid (demostrativo)',
        'aplicacion': 'Cubrir envés de la hoja. Repetir solo si el monitoreo lo justifica.',
        'seguridad': 'Tóxico para abejas: no aplicar en floración con pecoreo.',
        'carencia': 7,
        'descripcion': 'Control demostrativo de pulgón en tomate de invernadero o aire libre.',
    },
    {
        'nombre': 'Insecticida minadora demostrativo',
        'tipo': 'Insecticida',
        'cultivo': 'Tomate',
        'problema': 'Mosca minadora',
        'zona': 'Metropolitana',
        'dosis': '0.300',
        'unidad': 'L',
        'ingrediente': 'Abamectina (demostrativo)',
        'aplicacion': 'Caldo fino sobre el follaje. Mejor con baja radiación.',
        'seguridad': 'Evitar deriva a canales. Lavar equipo al terminar.',
        'carencia': 7,
        'descripcion': 'Ficha demostrativa para minadora en tomate.',
    },
    {
        'nombre': 'Fungicida tizón demostrativo',
        'tipo': 'Fungicida',
        'cultivo': 'Papa',
        'problema': 'Tizón tardío',
        'zona': 'O’Higgins',
        'dosis': '2.000',
        'unidad': 'kg',
        'ingrediente': 'Mancozeb (demostrativo)',
        'aplicacion': 'Preventivo cada 7–10 días con humedad alta.',
        'seguridad': 'No mezclar con cal. Usar overol y lentes.',
        'carencia': 14,
        'descripcion': 'Protección foliar demostrativa contra tizón en papa.',
    },
    {
        'nombre': 'Fungicida roya demostrativo',
        'tipo': 'Fungicida',
        'cultivo': 'Trigo',
        'problema': 'Roya del trigo',
        'zona': 'Maule',
        'dosis': '0.500',
        'unidad': 'L',
        'ingrediente': 'Tebuconazol (demostrativo)',
        'aplicacion': 'Enmacollado a hoja bandera, según monitoreo.',
        'seguridad': 'Respetar carencia antes de pastoreo o cosecha.',
        'carencia': 35,
        'descripcion': 'Uso demostrativo en trigo de invierno.',
    },
    {
        'nombre': 'Herbicida hoja ancha demostrativo',
        'tipo': 'Herbicida',
        'cultivo': 'Trigo',
        'problema': 'Malezas de hoja ancha',
        'zona': 'Ñuble',
        'dosis': '1.200',
        'unidad': 'L',
        'ingrediente': '2,4-D (demostrativo)',
        'aplicacion': 'Post-emergencia temprana, sin viento.',
        'seguridad': 'Deriva peligrosa para hortalizas vecinas. No aplicar con calor extremo.',
        'carencia': 21,
        'descripcion': 'Control demostrativo de malezas de hoja ancha en cereal.',
    },
    {
        'nombre': 'Urea 46% demostrativa',
        'tipo': 'Fertilizante',
        'cultivo': 'Maíz',
        'problema': 'Carencia de nitrógeno',
        'zona': 'Maule',
        'dosis': '200',
        'unidad': 'kg',
        'ingrediente': 'Nitrógeno ureico 46%',
        'aplicacion': 'Al voleo e incorporar con riego. Fraccionar 50% a siembra y 50% a 6–8 hojas.',
        'seguridad': 'No mezclar con semilla. Guardar seco y cubierto.',
        'carencia': 0,
        'descripcion': 'Fertilización nitrogenada de referencia para maíz de grano.',
    },
    {
        'nombre': 'Superfosfato triple demostrativo',
        'tipo': 'Fertilizante',
        'cultivo': 'Trigo',
        'problema': 'Carencia de fósforo',
        'zona': 'Maule',
        'dosis': '150',
        'unidad': 'kg',
        'ingrediente': 'P2O5 46%',
        'aplicacion': 'Localizado a la siembra, 5 cm al lado de la semilla.',
        'seguridad': 'Polvo irritante: usar mascarilla en días secos.',
        'carencia': 0,
        'descripcion': 'Fósforo de establecimiento para trigo de invierno.',
    },
    {
        'nombre': 'Fertilizante foliar demostrativo',
        'tipo': 'Fertilizante',
        'cultivo': 'Tomate',
        'problema': 'Carencia de nitrógeno',
        'zona': 'Metropolitana',
        'dosis': '3',
        'unidad': 'L',
        'ingrediente': 'N-P-K foliar 20-20-20 (demostrativo)',
        'aplicacion': 'Mojar follaje en la mañana, 300 L de agua/ha.',
        'seguridad': 'No aplicar con calor sobre 28 °C: puede quemar hoja.',
        'carencia': 0,
        'descripcion': 'Complemento foliar demostrativo en tomate.',
    },
    {
        'nombre': 'Semilla de maíz demostrativa',
        'tipo': 'Semilla',
        'cultivo': 'Maíz',
        'problema': '',
        'zona': 'Metropolitana',
        'dosis': '25',
        'unidad': 'kg',
        'ingrediente': 'Híbrido de grano (lote demostrativo)',
        'aplicacion': 'Siembra a 70–75 cm entre hileras, 5–6 cm de profundidad.',
        'seguridad': 'Semilla tratada: no consumir ni dar a animales.',
        'carencia': 0,
        'descripcion': 'Dosis de siembra alineada con el catálogo de cultivos.',
    },
    {
        'nombre': 'Semilla de trigo demostrativa',
        'tipo': 'Semilla',
        'cultivo': 'Trigo',
        'problema': '',
        'zona': 'Maule',
        'dosis': '160',
        'unidad': 'kg',
        'ingrediente': 'Trigo de invierno certificado (demostrativo)',
        'aplicacion': 'Siembra en línea, 15–18 cm entre hileras.',
        'seguridad': 'Tratada con fungicida de semilla. Usar guantes.',
        'carencia': 0,
        'descripcion': 'Dosis típica de 160 kg/ha para el valle central.',
    },
    {
        'nombre': 'Semilla de papa demostrativa',
        'tipo': 'Semilla',
        'cultivo': 'Papa',
        'problema': '',
        'zona': 'O’Higgins',
        'dosis': '2500',
        'unidad': 'kg',
        'ingrediente': 'Tubérculo-semilla certificado (demostrativo)',
        'aplicacion': 'Surcos a 70–80 cm. Semilla de 40–60 g por golpe.',
        'seguridad': 'No usar papa de consumo como semilla: sube el riesgo de virus.',
        'carencia': 0,
        'descripcion': 'Dosis de 2,5 t/ha de semilla certificada.',
    },
]


class Command(BaseCommand):
    help = 'Carga catálogo demostrativo: zonas, cultivos, plagas, variedades, calendarios e insumos.'

    def handle(self, *args, **options):
        zonas = {}
        for nombre, descripcion in ZONAS:
            zona, _ = Zona.objects.get_or_create(nombre=nombre, defaults={'descripcion': descripcion})
            zona.descripcion = descripcion
            zona.activo = True
            zona.save()
            zonas[nombre] = zona

        Zona.objects.exclude(nombre__in=zonas).update(activo=False)

        cultivos = {}
        for data in CULTIVOS:
            cultivo, _ = Cultivo.objects.get_or_create(nombre=data['nombre'], defaults=data)
            for key, value in data.items():
                setattr(cultivo, key, value)
            cultivo.activo = True
            cultivo.save()
            cultivos[cultivo.nombre] = cultivo

        tipos = {}
        for nombre in ['Insecticida', 'Fungicida', 'Herbicida', 'Fertilizante', 'Semilla']:
            tipos[nombre], _ = TipoInsumo.objects.get_or_create(nombre=nombre)

        problemas = {}
        for data in PROBLEMAS:
            problema, _ = ProblemaAgricola.objects.get_or_create(nombre=data['nombre'], defaults=data)
            for key, value in data.items():
                setattr(problema, key, value)
            problema.activo = True
            problema.save()
            problemas[problema.nombre] = problema

        variedades = {}
        for cultivo_nombre, zona_nombre, nombre, descripcion, ciclo in VARIEDADES:
            variedad, _ = Variedad.objects.get_or_create(
                nombre=nombre,
                cultivo=cultivos[cultivo_nombre],
                defaults={
                    'zona': zonas[zona_nombre],
                    'descripcion': descripcion,
                    'ciclo_dias': ciclo,
                    'activo': True,
                },
            )
            variedad.zona = zonas[zona_nombre]
            variedad.descripcion = descripcion
            variedad.ciclo_dias = ciclo
            variedad.activo = True
            variedad.save()
            variedades[nombre] = variedad

        CalendarioSiembra.objects.all().delete()
        for cultivo_nombre, variedad_nombre, zona_nombre, s1, s2, c1, c2, notas in CALENDARIOS:
            CalendarioSiembra.objects.create(
                cultivo=cultivos[cultivo_nombre],
                variedad=variedades.get(variedad_nombre),
                zona=zonas[zona_nombre],
                mes_siembra_inicio=s1,
                mes_siembra_fin=s2,
                mes_cosecha_inicio=c1,
                mes_cosecha_fin=c2,
                observaciones=notas,
                activo=True,
            )

        for data in INSUMOS:
            insumo, _ = Insumo.objects.get_or_create(
                nombre=data['nombre'],
                defaults={'tipo': tipos[data['tipo']]},
            )
            insumo.tipo = tipos[data['tipo']]
            insumo.cultivo = cultivos.get(data['cultivo'])
            insumo.problema = problemas.get(data['problema']) if data['problema'] else None
            insumo.zona = zonas.get(data['zona'])
            insumo.dosis_hectarea = data['dosis']
            insumo.unidad_dosis = data['unidad']
            insumo.ingrediente_activo = data['ingrediente']
            insumo.modo_aplicacion = data['aplicacion']
            insumo.consideraciones_seguridad = data['seguridad']
            insumo.carencia_dias = data['carencia']
            insumo.descripcion = data['descripcion']
            insumo.fuente = 'Catálogo demostrativo AgroAsesor · no es registro SAG'
            insumo.vigente = True
            insumo.save()

        known = {item['nombre'] for item in INSUMOS}
        Insumo.objects.exclude(nombre__in=known).delete()

        self.stdout.write(self.style.SUCCESS(
            f'Catálogo: {Cultivo.objects.count()} cultivos, {ProblemaAgricola.objects.count()} problemas, '
            f'{Insumo.objects.count()} insumos, {CalendarioSiembra.objects.count()} calendarios.'
        ))
