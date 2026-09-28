from django.contrib import admin

from .models import Cultivo, Insumo, TipoInsumo, Zona


@admin.register(Zona)
class ZonaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'activo')
    search_fields = ('nombre',)


@admin.register(Cultivo)
class CultivoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'rendimiento_ton_ha', 'densidad_siembra', 'unidad_siembra', 'activo')
    list_filter = ('activo',)
    search_fields = ('nombre',)


@admin.register(TipoInsumo)
class TipoInsumoAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)


@admin.register(Insumo)
class InsumoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'cultivo', 'zona', 'dosis_hectarea', 'unidad_dosis', 'vigente')
    list_filter = ('tipo', 'zona', 'vigente')
    search_fields = ('nombre',)
