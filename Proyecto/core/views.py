from django.shortcuts import render, redirect
from django.utils.cache import add_never_cache_headers

from .catalog import catalog_payload

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
        'catalog': catalog_payload(),
    }
    if extra:
        context.update(extra)
    response = render(request, template, context)
    add_never_cache_headers(response)
    return response


def index(request):
    return render(request, 'index.html')


COMUNAS = [
    'Melipilla',
    'San Pedro',
    'Alhué',
    'María Pinto',
    'Curacaví',
    'Talagante',
    'Isla de Maipo',
    'Paine',
]


def login_view(request):
    if _user(request):
        return redirect('dashboard')
    error = ''
    notice = request.session.pop('login_notice', '')
    mode = request.POST.get('mode') or request.GET.get('mode') or 'login'
    if mode not in {'login', 'register', 'recover', 'reset'}:
        mode = 'login'
    form = {
        'email': (request.POST.get('email') or '').strip(),
        'name': (request.POST.get('name') or '').strip(),
        'rut': (request.POST.get('rut') or '').strip(),
        'phone': (request.POST.get('phone') or '').strip(),
        'comuna': request.POST.get('comuna') or 'Melipilla',
    }
    if request.method == 'POST':
        email = form['email'].lower()
        password = request.POST.get('password') or ''
        password2 = request.POST.get('password2') or ''
        if mode == 'recover':
            if '@' not in email:
                error = 'Ingresa un correo electrónico válido.'
            else:
                request.session['reset_email'] = email
                return redirect('/login/?mode=reset')
        elif mode == 'reset':
            email = (request.session.get('reset_email') or email).lower()
            if len(password) < 6:
                error = 'Usa una contraseña de al menos 6 caracteres.'
            elif password != password2:
                error = 'Las contraseñas no coinciden.'
            elif not email:
                error = 'Vuelve a solicitar el restablecimiento.'
                mode = 'recover'
            else:
                accounts = request.session.get('accounts') or {}
                current = _accounts(request).get(email) or {'name': email.split('@')[0], 'role': 'Agricultor'}
                accounts[email] = {**current, 'password': password, 'email': email}
                request.session['accounts'] = accounts
                request.session.pop('reset_email', None)
                request.session['login_notice'] = 'Contraseña actualizada. Ya puedes iniciar sesión.'
                return redirect('/login/')
        elif mode == 'register':
            if not form['name'] or '@' not in email:
                error = 'Revisa el nombre y el correo.'
            elif not form['rut'] or not form['phone']:
                error = 'Completa RUT y teléfono.'
            elif len(password) < 6:
                error = 'Usa una contraseña de al menos 6 caracteres.'
            elif password != password2:
                error = 'Las contraseñas no coinciden.'
            elif email in _accounts(request):
                error = 'Este correo ya tiene una cuenta. Inicia sesión.'
            else:
                accounts = request.session.get('accounts') or {}
                accounts[email] = {
                    'password': password,
                    'name': form['name'],
                    'role': 'Agricultor',
                    'rut': form['rut'],
                    'phone': form['phone'],
                    'comuna': form['comuna'],
                }
                request.session['accounts'] = accounts
                request.session['user'] = {'email': email, 'name': form['name'], 'role': 'Agricultor'}
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
    headlines = {
        'login': 'Optimiza tus decisiones agrícolas con datos reales de tu campo.',
        'register': 'Únete a la red de agricultores líderes de la provincia de Melipilla.',
        'recover': 'Protegemos la seguridad de tus datos y la administración de tus cultivos.',
        'reset': 'Establece un acceso seguro y mantén el control de tus campos.',
    }
    return render(request, 'login.html', {
        'error': error,
        'notice': notice,
        'mode': mode,
        'form': form,
        'comunas': COMUNAS,
        'headline': headlines[mode],
        'reset_email': request.session.get('reset_email', ''),
    })


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
