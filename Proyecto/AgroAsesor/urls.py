from django.contrib import admin
from django.urls import path
from core import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('hola-django/', views.index, name='pagina_inicial'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('entrar-admin/', views.enter_as_admin, name='enter_as_admin'),
    path('', views.dashboard, name='dashboard'),
    path('predios/', views.predios, name='predios'),
    path('asesor/', views.asesor, name='asesor'),
    path('calculadora/', views.calculadora, name='calculadora'),
    path('cobertura/', views.cobertura, name='cobertura'),
    path('predictor/', views.predictor, name='predictor'),
    path('calendario/', views.calendario, name='calendario'),
    path('busqueda/', views.busqueda, name='busqueda'),
    path('reportes/', views.reportes, name='reportes'),
    path('panel-admin/', views.admin_panel, name='admin_panel'),
]
