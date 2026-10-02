from django.db import models


class Zona(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


class Cultivo(models.Model):
    nombre = models.CharField(max_length=150, unique=True)
    descripcion = models.TextField(blank=True)
    familia = models.CharField(max_length=100, blank=True)
    ciclo_dias = models.PositiveSmallIntegerField(null=True, blank=True)
    epoca = models.CharField(max_length=80, blank=True)
    notas_manejo = models.TextField(blank=True)
    rendimiento_ton_ha = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    densidad_siembra = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    unidad_siembra = models.CharField(max_length=20, default='kg')
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


class TipoInsumo(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre


class ProblemaAgricola(models.Model):
    TIPO_CHOICES = [
        ('plaga', 'Plaga'),
        ('enfermedad', 'Enfermedad'),
        ('maleza', 'Maleza'),
        ('nutricion', 'Nutrición'),
    ]
    nombre = models.CharField(max_length=150, unique=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='plaga')
    descripcion = models.TextField(blank=True)
    sintomas = models.TextField(blank=True)
    manejo = models.TextField(blank=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


class Variedad(models.Model):
    cultivo = models.ForeignKey(Cultivo, on_delete=models.CASCADE, related_name='variedades')
    zona = models.ForeignKey(Zona, on_delete=models.SET_NULL, null=True, blank=True, related_name='variedades')
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    ciclo_dias = models.PositiveSmallIntegerField(null=True, blank=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.nombre} ({self.cultivo.nombre})'


class CalendarioSiembra(models.Model):
    cultivo = models.ForeignKey(Cultivo, on_delete=models.CASCADE, related_name='calendarios')
    variedad = models.ForeignKey(Variedad, on_delete=models.SET_NULL, null=True, blank=True, related_name='calendarios')
    zona = models.ForeignKey(Zona, on_delete=models.SET_NULL, null=True, blank=True, related_name='calendarios')
    mes_siembra_inicio = models.PositiveSmallIntegerField()
    mes_siembra_fin = models.PositiveSmallIntegerField()
    mes_cosecha_inicio = models.PositiveSmallIntegerField()
    mes_cosecha_fin = models.PositiveSmallIntegerField()
    observaciones = models.TextField(blank=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        zona = self.zona.nombre if self.zona else 'sin zona'
        return f'{self.cultivo.nombre} · {zona}'


class Insumo(models.Model):
    tipo = models.ForeignKey(TipoInsumo, on_delete=models.PROTECT, related_name='insumos')
    cultivo = models.ForeignKey(Cultivo, on_delete=models.SET_NULL, null=True, blank=True, related_name='insumos')
    problema = models.ForeignKey(ProblemaAgricola, on_delete=models.SET_NULL, null=True, blank=True, related_name='insumos')
    zona = models.ForeignKey(Zona, on_delete=models.SET_NULL, null=True, blank=True, related_name='insumos')
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    ingrediente_activo = models.CharField(max_length=200, blank=True)
    dosis_hectarea = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    unidad_dosis = models.CharField(max_length=50, blank=True)
    modo_aplicacion = models.CharField(max_length=200, blank=True)
    consideraciones_seguridad = models.TextField(blank=True)
    carencia_dias = models.PositiveSmallIntegerField(null=True, blank=True)
    fuente = models.CharField(max_length=200, blank=True)
    vigente = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre
