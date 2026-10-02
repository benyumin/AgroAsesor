from django.contrib import admin

from .models import CalendarioSiembra, Cultivo, Insumo, ProblemaAgricola, TipoInsumo, Variedad, Zona


@admin.register(Zona)
class ZonaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'activo')
    list_filter = ('activo',)
    search_fields = ('nombre',)


@admin.register(Cultivo)
class CultivoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'familia', 'ciclo_dias', 'densidad_siembra', 'unidad_siembra', 'rendimiento_ton_ha', 'activo')
    list_filter = ('activo', 'familia')
    search_fields = ('nombre', 'descripcion')


@admin.register(TipoInsumo)
class TipoInsumoAdmin(admin.ModelAdmin):
    search_fields = ('nombre',)


@admin.register(ProblemaAgricola)
class ProblemaAgricolaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'activo')
    list_filter = ('tipo', 'activo')
    search_fields = ('nombre', 'descripcion')


@admin.register(Variedad)
class VariedadAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'cultivo', 'zona', 'ciclo_dias', 'activo')
    list_filter = ('cultivo', 'zona', 'activo')
    search_fields = ('nombre',)


@admin.register(CalendarioSiembra)
class CalendarioSiembraAdmin(admin.ModelAdmin):
    list_display = ('cultivo', 'variedad', 'zona', 'mes_siembra_inicio', 'mes_siembra_fin', 'activo')
    list_filter = ('zona', 'cultivo', 'activo')


@admin.register(Insumo)
class InsumoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'cultivo', 'problema', 'zona', 'dosis_hectarea', 'unidad_dosis', 'vigente')
    list_filter = ('tipo', 'zona', 'vigente')
    search_fields = ('nombre', 'ingrediente_activo')
