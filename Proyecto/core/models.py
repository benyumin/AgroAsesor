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


class Insumo(models.Model):
    tipo = models.ForeignKey(TipoInsumo, on_delete=models.PROTECT, related_name='insumos')
    cultivo = models.ForeignKey(Cultivo, on_delete=models.SET_NULL, null=True, blank=True, related_name='insumos')
    zona = models.ForeignKey(Zona, on_delete=models.SET_NULL, null=True, blank=True, related_name='insumos')
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    dosis_hectarea = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    unidad_dosis = models.CharField(max_length=50, blank=True)
    vigente = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre
