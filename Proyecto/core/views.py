from django.shortcuts import render, redirect

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

NAV_ITEMS = [
    ('dashboard', 'Inicio', 'layout-dashboard'),
    ('predios', 'Mis predios y potreros', 'map'),
    ('asesor', 'Asesor de insumos', 'flask-conical'),
    ('calculadora', 'Calculadora agrícola', 'calculator'),
    ('cobertura', 'Cobertura del terreno', 'grid-2x2'),
    ('predictor', 'Predictor de cosecha', 'chart-no-axes-combined'),
    ('calendario', 'Calendario de siembra', 'calendar-days'),
    ('busqueda', 'Búsqueda', 'search'),
    ('reportes', 'Reportes PDF', 'file-text'),
    ('admin_panel', 'Panel admin', 'shield-check'),
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
        'nav_items': NAV_ITEMS,
        'current': current,
        'query': request.GET.get('q', ''),
    }
    if extra:
        context.update(extra)
    return render(request, template, context)


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
