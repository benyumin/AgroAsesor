from django.shortcuts import render, redirect
from django.utils.cache import add_never_cache_headers

DEMO_USERS = {
    'agricultor@agroasesor.cl': {
        'password': '123456',
        'name': 'Juan Pérez',
        'role': 'Agricultor',
    },
    'admin@agroasesor.cl': {
        'password': '123456',
        'name': 'Ana González',
        'role': 'Administrador',
    },
}

NAV_GROUPS = [
    ('El campo', [
        ('dashboard', 'Hoy', 'layout-dashboard'),
        ('predios', 'Predios', 'map'),
        ('calendario', 'Siembra', 'calendar-days'),
    ]),
    ('La decisión', [
        ('calculadora', 'Cuánto llevar', 'calculator'),
        ('cobertura', 'Si alcanza', 'grid-2x2'),
        ('predictor', 'Cosecha', 'chart-no-axes-combined'),
        ('asesor', 'Ficha de insumo', 'flask-conical'),
    ]),
    ('Cierre', [
        ('reportes', 'Reporte', 'file-text'),
        ('admin_panel', 'Catálogos', 'shield-check'),
    ]),
]


def _accounts(request):
    extra = request.session.get('accounts') or {}
    merged = {**DEMO_USERS, **extra}
    return merged


def _user(request):
    return request.session.get('user')


def _page(request, template, current, extra=None):
    user = _user(request)
    if not user:
        return redirect('login')
    if current == 'admin_panel' and user.get('role') != 'Administrador':
        return redirect('dashboard')
    parts = [p[0] for p in user.get('name', '').split() if p][:2]
    context = {
        'user': user,
        'first_name': user.get('name', '').split()[0] if user.get('name') else '',
        'initials': ''.join(parts).upper() or 'AA',
        'nav_groups': NAV_GROUPS,
        'current': current,
        'query': request.GET.get('q', ''),
    }
    if extra:
        context.update(extra)
    response = render(request, template, context)
    add_never_cache_headers(response)
    return response


def index(request):
    return render(request, 'index.html')


def login_view(request):
    if _user(request):
        return redirect('dashboard')
    error = ''
    notice = ''
    mode = request.POST.get('mode') or request.GET.get('mode') or 'login'
    if request.method == 'POST':
        email = (request.POST.get('email') or '').strip().lower()
        password = request.POST.get('password') or ''
        name = (request.POST.get('name') or '').strip()
        if mode == 'recover':
            notice = 'Demostración: no se envían correos. Usa las cuentas demo para entrar.'
        elif mode == 'register':
            if not name or '@' not in email:
                error = 'Revisa el nombre y el correo.'
            elif len(password) < 6:
                error = 'Usa una contraseña de al menos 6 caracteres.'
            elif email in _accounts(request):
                error = 'Este correo ya tiene una cuenta. Inicia sesión.'
            else:
                accounts = request.session.get('accounts') or {}
                accounts[email] = {'password': password, 'name': name, 'role': 'Agricultor'}
                request.session['accounts'] = accounts
                request.session['user'] = {'email': email, 'name': name, 'role': 'Agricultor'}
                return redirect('dashboard')
        else:
            found = _accounts(request).get(email)
            if not email or not password:
                error = 'Completa correo y contraseña.'
            elif not found or found['password'] != password:
                error = 'Correo o contraseña incorrectos. Revisa las credenciales demo.'
            else:
                request.session['user'] = {
                    'email': email,
                    'name': found['name'],
                    'role': found['role'],
                }
                return redirect('dashboard')
    return render(request, 'login.html', {'error': error, 'notice': notice, 'mode': mode})


def logout_view(request):
    request.session.pop('user', None)
    return redirect('login')


def enter_as_admin(request):
    if request.method != 'POST':
        return redirect('login')
    admin = DEMO_USERS['admin@agroasesor.cl']
    request.session['user'] = {
        'email': 'admin@agroasesor.cl',
        'name': admin['name'],
        'role': admin['role'],
    }
    return redirect('admin_panel')


def dashboard(request):
    return _page(request, 'dashboard.html', 'dashboard')


def predios(request):
    return _page(request, 'predios.html', 'predios')


def asesor(request):
    return _page(request, 'asesor.html', 'asesor')


def calculadora(request):
    return _page(request, 'calculadora.html', 'calculadora')


def cobertura(request):
    return _page(request, 'cobertura.html', 'cobertura')


def predictor(request):
    return _page(request, 'predictor.html', 'predictor')


def calendario(request):
    return _page(request, 'calendario.html', 'calendario')


def busqueda(request):
    return _page(request, 'busqueda.html', 'busqueda')


def reportes(request):
    return _page(request, 'reportes.html', 'reportes')


def admin_panel(request):
    return _page(request, 'admin.html', 'admin_panel')
