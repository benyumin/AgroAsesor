#!/usr/bin/env python3
"""Diagramas 4+1 de AgroAsesor — PNG listos para la entrega CAPSTONE."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

INK = (15, 23, 42)
MUTED = (71, 85, 105)
LINE = (51, 65, 85)
WHITE = (255, 255, 255)
BG = (248, 250, 252)


def font(size, bold=False):
    return ImageFont.truetype(FONT_B if bold else FONT, size)


def tw(d, text, f):
    return d.textbbox((0, 0), text, font=f)[2]


def wrap(d, text, f, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if tw(d, t, f) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [text]


def canvas(w, h, title, subtitle, accent):
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, w, 92), fill=accent)
    d.text((36, 18), title, font=font(28, True), fill=WHITE)
    d.text((36, 56), subtitle, font=font(15), fill=(226, 232, 240))
    return img, d


def rrect(d, box, fill, outline, width=2, radius=12):
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def cls(d, x, y, w, title, attrs, fill, border, badge=None):
    h = 44 + 20 * len(attrs) + 14
    box = (x, y, x + w, y + h)
    rrect(d, box, fill, border, 3, 10)
    d.line((x + 10, y + 36, x + w - 10, y + 36), fill=border, width=1)
    d.text((x + 14, y + 10), title, font=font(15, True), fill=INK)
    yy = y + 44
    for a in attrs:
        d.text((x + 14, yy), a, font=font(12), fill=MUTED)
        yy += 20
    if badge:
        bf = font(10, True)
        bw = tw(d, badge, bf) + 14
        bx1, by1 = x + w - bw - 10, y + 8
        rrect(d, (bx1, by1, bx1 + bw, by1 + 18), WHITE, border, 1, 8)
        d.text((bx1 + 7, by1 + 2), badge, font=bf, fill=border)
    return box


def side(box, s):
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return {"n": (cx, y0), "s": (cx, y1), "e": (x1, cy), "w": (x0, cy)}[s]


def line(d, a, b, width=2):
    d.line([a, b], fill=LINE, width=width)


def ortho(d, box_a, sa, box_b, sb, m_a="", m_b="", label=""):
    p1, p2 = side(box_a, sa), side(box_b, sb)
    if abs(p1[0] - p2[0]) < 2 or abs(p1[1] - p2[1]) < 2:
        pts = [p1, p2]
    elif sa in "ns" and sb in "we":
        pts = [p1, (p1[0], p2[1]), p2]
    elif sa in "we" and sb in "ns":
        pts = [p1, (p2[0], p1[1]), p2]
    elif sa in "ns" and sb in "ns":
        mid = (p1[1] + p2[1]) / 2
        pts = [p1, (p1[0], mid), (p2[0], mid), p2]
    else:
        mid = (p1[0] + p2[0]) / 2
        pts = [p1, (mid, p1[1]), (mid, p2[1]), p2]
    d.line(pts, fill=LINE, width=2)
    if m_a:
        ox, oy = {"e": (8, -18), "w": (-42, -18), "s": (8, 4), "n": (8, -20)}[sa]
        d.text((p1[0] + ox, p1[1] + oy), m_a, font=font(12, True), fill=INK)
    if m_b:
        ox, oy = {"e": (8, -18), "w": (-42, -18), "s": (8, 4), "n": (8, -20)}[sb]
        d.text((p2[0] + ox, p2[1] + oy), m_b, font=font(12, True), fill=INK)
    if label:
        mx = sum(p[0] for p in pts) / len(pts)
        my = sum(p[1] for p in pts) / len(pts)
        d.text((mx + 8, my - 8), label, font=font(11), fill=MUTED)


def note(d, x, y, w, h, text):
    rrect(d, (x, y, x + w, y + h), WHITE, (148, 163, 184), 1, 10)
    yy = y + 12
    for line_t in wrap(d, text, font(13), w - 24):
        d.text((x + 12, yy), line_t, font=font(13), fill=MUTED)
        yy += 18


def actor(d, x, y, name):
    d.ellipse((x + 16, y, x + 44, y + 28), outline=INK, width=3)
    d.line((x + 30, y + 28, x + 30, y + 64), fill=INK, width=3)
    d.line((x + 8, y + 42, x + 52, y + 42), fill=INK, width=3)
    d.line((x + 30, y + 64, x + 10, y + 96), fill=INK, width=3)
    d.line((x + 30, y + 64, x + 50, y + 96), fill=INK, width=3)
    f = font(14, True)
    d.text((x + 30 - tw(d, name, f) / 2, y + 104), name, font=f, fill=INK)
    return (x, y, x + 60, y + 124)


def oval(d, x, y, w, h, text):
    d.ellipse((x, y, x + w, y + h), fill=WHITE, outline=(37, 99, 235), width=2)
    lines = wrap(d, text, font(13), w - 28)
    total = 17 * len(lines)
    yy = y + (h - total) / 2
    for t in lines:
        d.text((x + (w - tw(d, t, font(13))) / 2, yy), t, font=font(13), fill=INK)
        yy += 17
    return (x, y, x + w, y + h)


def cyl(d, x, y, w, h, title, lines):
    fill, border = (254, 243, 199), (180, 83, 9)
    d.ellipse((x, y, x + w, y + 26), fill=fill, outline=border, width=3)
    d.rectangle((x, y + 13, x + w, y + h - 13), fill=fill)
    d.line((x, y + 13, x, y + h - 13), fill=border, width=3)
    d.line((x + w, y + 13, x + w, y + h - 13), fill=border, width=3)
    d.ellipse((x, y + h - 26, x + w, y + h), fill=fill, outline=border, width=3)
    d.text((x + 18, y + 36), title, font=font(15, True), fill=INK)
    yy = y + 60
    for t in lines:
        d.text((x + 18, yy), t, font=font(13), fill=MUTED)
        yy += 18
    return (x, y, x + w, y + h)


def arrow_h(d, x1, y, x2, text=""):
    d.line((x1, y, x2, y), fill=LINE, width=2)
    if x2 > x1:
        d.polygon([(x2, y), (x2 - 10, y - 6), (x2 - 10, y + 6)], fill=LINE)
    else:
        d.polygon([(x2, y), (x2 + 10, y - 6), (x2 + 10, y + 6)], fill=LINE)
    if text:
        d.text(((x1 + x2) / 2 - tw(d, text, font(12)) / 2, y - 22), text, font=font(12), fill=INK)


def arrow_v(d, x, y1, y2, text=""):
    d.line((x, y1, x, y2), fill=LINE, width=2)
    if y2 > y1:
        d.polygon([(x, y2), (x - 6, y2 - 10), (x + 6, y2 - 10)], fill=LINE)
    else:
        d.polygon([(x, y2), (x - 6, y2 + 10), (x + 6, y2 + 10)], fill=LINE)
    if text:
        d.text((x + 8, (y1 + y2) / 2 - 8), text, font=font(12), fill=INK)


def save(img, name):
    path = OUT / name
    img.save(path, "PNG")
    print(path)


def vista_clases():
    img, d = canvas(
        1680, 1000,
        "1. Vista lógica — Diagrama de clases",
        "Izquierda: predios (diseño). Derecha: catálogo. Verde = tabla actual en core.models. Ámbar = aún no persistido.",
        (30, 64, 175),
    )
    G, GB = (220, 252, 231), (22, 163, 74)
    A, AB = (254, 243, 199), (217, 119, 6)

    usuario = cls(d, 40, 130, 260, "Usuario",
                  ["id", "nombre", "correo", "rol", "estado", "credencial: hash Django"], A, AB, "diseño")
    predio = cls(d, 40, 340, 260, "Predio",
                 ["id", "nombre", "ubicacion", "superficie_m2", "geometria GeoJSON"], A, AB, "diseño")
    potrero = cls(d, 40, 560, 260, "Potrero",
                  ["id", "nombre", "superficie_m2", "geometria", "estado"], A, AB, "diseño")
    sector = cls(d, 40, 780, 260, "Sector",
                 ["id", "nombre", "superficie_m2", "geometria"], A, AB, "diseño")

    planif = cls(d, 360, 560, 280, "PlanificacionSiembra",
                 ["id", "potrero_id", "cultivo_id", "fecha_siembra", "fecha_cosecha_est", "superficie_usada"], A, AB, "diseño")
    act = cls(d, 360, 780, 280, "ActividadAgricola",
              ["id", "potrero_id", "tipo", "fecha", "cantidad", "unidad"], A, AB, "diseño")
    calc = cls(d, 360, 340, 280, "CalculoAgricola",
               ["id", "usuario_id", "tipo", "parametros", "resultado", "fecha"], A, AB, "diseño")

    cultivo = cls(d, 760, 130, 280, "Cultivo",
                  ["id", "nombre", "descripcion", "rendimiento_ton_ha", "densidad_siembra", "unidad_siembra", "activo"],
                  G, GB, "implementado")
    variedad = cls(d, 1100, 130, 240, "Variedad",
                   ["id", "cultivo_id", "nombre", "caracteristicas"], A, AB, "diseño")
    zona = cls(d, 1400, 130, 230, "Zona",
               ["id", "nombre", "descripcion", "activo"], G, GB, "implementado")
    tipo = cls(d, 1100, 380, 240, "TipoInsumo",
               ["id", "nombre"], G, GB, "implementado")
    insumo = cls(d, 760, 380, 280, "Insumo",
                 ["id", "nombre", "cultivo_id", "zona_id", "tipo_id", "dosis_hectarea", "unidad_dosis", "vigente"],
                 G, GB, "implementado")
    rec = cls(d, 760, 680, 280, "RecomendacionTecnica",
              ["id", "cultivo_id", "insumo_id", "problema_agricola", "dosis_verificable", "fuente", "estado"], A, AB, "diseño")
    cal = cls(d, 1100, 680, 280, "CalendarioSiembra",
              ["id", "cultivo_id", "zona_id", "periodo_siembra", "periodo_desarrollo", "periodo_cosecha", "fuente"], A, AB, "diseño")

    ortho(d, usuario, "s", predio, "n", "1", "0..*")
    ortho(d, predio, "s", potrero, "n", "1", "0..*")
    ortho(d, potrero, "s", sector, "n", "1", "0..*")
    ortho(d, usuario, "e", calc, "w", "1", "0..*")
    ortho(d, potrero, "e", planif, "w", "1", "0..*")
    ortho(d, potrero, "e", act, "w", "1", "0..*")
    ortho(d, cultivo, "e", variedad, "w", "1", "0..*")
    ortho(d, insumo, "e", tipo, "w", "0..*", "1")
    ortho(d, insumo, "s", rec, "n", "1", "0..*")
    ortho(d, cultivo, "s", insumo, "n", "1", "0..*")
    ortho(d, zona, "s", insumo, "e")
    ortho(d, rec, "e", cal, "w")

    rrect(d, (1400, 380, 1640, 620), WHITE, (148, 163, 184), 1, 10)
    d.text((1420, 400), "Leyenda", font=font(14, True), fill=INK)
    rrect(d, (1420, 440, 1440, 456), G, GB, 2, 4)
    d.text((1450, 438), "Tabla actual (SQLite)", font=font(13), fill=MUTED)
    rrect(d, (1420, 475, 1440, 491), A, AB, 2, 4)
    d.text((1450, 473), "Diseño CAPSTONE", font=font(13), fill=MUTED)
    d.text((1420, 520), "Sin contraseña en claro:", font=font(12), fill=MUTED)
    d.text((1420, 540), "se usa el hasher de Django.", font=font(12), fill=MUTED)
    d.text((1420, 575), "Planificacion.cultivo_id", font=font(12), fill=MUTED)
    d.text((1420, 593), "referencia a Cultivo.", font=font(12), fill=MUTED)
    save(img, "01_vista_logica_clases.png")


def vista_comunicacion():
    img, d = canvas(
        1600, 720,
        "1. Vista lógica — Diagrama de comunicación",
        "Escenario: consultar asesoría de insumos. Colaboración real del monolito (sin microservicios ni API SAG).",
        (30, 64, 175),
    )
    actor(d, 30, 250, "Agricultor")
    ui = cls(d, 180, 230, 240, "Interfaz Web",
             ["asesor.html + asesor.js", "requiere sesión"], (224, 242, 254), (2, 132, 199))
    vista = cls(d, 520, 230, 250, "Vista Django",
                ["views.asesor()", "catalog_payload()"], (243, 232, 255), (147, 51, 234))
    cat = cls(d, 870, 230, 250, "Catálogo / ORM",
              ["catalog.py", "Insumo vigente"], (220, 252, 231), (22, 163, 74))
    db = cyl(d, 1240, 220, 300, 170, "SQLite", ["Proyecto/db.sqlite3"])

    arrow_h(d, 90, 270, 180, "1. Abre /asesor/")
    arrow_h(d, 420, 270, 520, "2. GET sesión")
    arrow_h(d, 770, 270, 870, "3. Lee catálogo")
    arrow_h(d, 1120, 290, 1240, "4. SELECT")
    arrow_h(d, 1240, 360, 1120, "5. Filas")
    arrow_h(d, 870, 420, 770, "6. Contexto")
    arrow_h(d, 520, 420, 420, "7. HTML")
    arrow_h(d, 180, 420, 90, "8. Ficha demo")

    note(d, 200, 500, 1340, 160,
         "El JavaScript filtra cultivo → problema → tipo sobre el catálogo que Django ya envió. No hay servicio de recomendación aparte. La ficha se marca como demostrativa. Los insumos no vigentes no se ofrecen. La dosis no se presenta como receta oficial ni como dato SAG.")
    save(img, "02_vista_logica_comunicacion.png")


def vista_componentes():
    img, d = canvas(
        1560, 920,
        "2. Vista de desarrollo — Diagrama de componentes",
        "Módulos de software de un único proceso Django. Esta vista NO es de despliegue.",
        (185, 28, 28),
    )
    rrect(d, (40, 120, 1520, 880), WHITE, (185, 28, 28), 3, 16)
    d.text((64, 140), "Aplicación AgroAsesor  ·  paquete Proyecto  ·  app core", font=font(18, True), fill=INK)

    items = [
        (70, 200, "Interfaz de usuario", "Templates Django + CSS + JS"),
        (450, 200, "Autenticación", "Sesión demo en views.py"),
        (830, 200, "Gestión de predios", "Vista + mapa Leaflet (cliente)"),
        (1210, 200, "Asesor de insumos", "Wizard JS + catálogo"),
        (70, 340, "Calculadora", "Semillas e insumos"),
        (450, 340, "Cobertura", "Cálculo proporcional en JS"),
        (830, 340, "Predictor de cosecha", "Estimador demostrativo"),
        (1210, 340, "Calendario", "Zona Central de Chile"),
        (70, 480, "Búsqueda", "Filtro sobre catálogo"),
        (450, 480, "Reportes", "Salida PDF / impresión"),
        (830, 480, "Panel de catálogos", "Solo rol Administrador"),
        (1210, 480, "Django Admin", "Ruta /admin/"),
    ]
    bottoms = []
    for x, y, t, s in items:
        rrect(d, (x, y, x + 280, y + 100), (224, 242, 254), (2, 132, 199), 2, 10)
        d.text((x + 16, y + 22), t, font=font(15, True), fill=INK)
        d.text((x + 16, y + 52), s, font=font(12), fill=MUTED)
        bottoms.append((x + 140, y + 100))

    d.line((210, 620, 1350, 620), fill=(186, 230, 253), width=4)
    for bx, by in bottoms:
        d.line((bx, by, bx, 620), fill=(186, 230, 253), width=2)

    dal = cls(d, 280, 660, 620, "Capa de acceso a datos",
              ["core/catalog.py   ·   Django ORM   ·   core/models.py"],
              (220, 252, 231), (22, 163, 74))
    db = cyl(d, 980, 650, 300, 160, "SQLite", ["db.sqlite3 en el mismo host"])
    d.line((590, 620, 590, 660), fill=(186, 230, 253), width=3)
    arrow_h(d, dal[2], 730, db[0], "ORM")
    note(d, 70, 780, 380, 70, "Un ejecutable: python manage.py runserver. No hay API REST ni frontend React en esta versión.")
    save(img, "03_vista_desarrollo_componentes.png")


def vista_paquetes():
    img, d = canvas(
        1400, 860,
        "2. Vista de desarrollo — Diagrama de paquetes",
        "Estructura real del repositorio. No se inventan apps (usuarios, terrenos…) que no existen.",
        (185, 28, 28),
    )
    rrect(d, (40, 120, 1360, 820), WHITE, (185, 28, 28), 3, 16)
    d.text((64, 140), "AgroAsesor / Proyecto", font=font(20, True), fill=INK)
    d.text((64, 172), "Django 6  ·  Python 3.12", font=font(13), fill=MUTED)

    rrect(d, (64, 220, 400, 780), (241, 245, 249), (71, 85, 105), 2, 12)
    d.text((84, 240), "AgroAsesor/  (config)", font=font(16, True), fill=INK)
    for i, name in enumerate(["settings.py", "urls.py", "wsgi.py", "asgi.py"]):
        rrect(d, (84, 290 + i * 90, 380, 358 + i * 90), WHITE, LINE, 1, 8)
        d.text((104, 312 + i * 90), name, font=font(15), fill=INK)

    rrect(d, (440, 220, 1320, 780), (220, 252, 231), (22, 163, 74), 2, 12)
    d.text((460, 240), "core/  — única app en INSTALLED_APPS", font=font(16, True), fill=INK)
    pkgs = [
        (470, 290, "models.py", "Zona, Cultivo, TipoInsumo, Insumo"),
        (470, 385, "views.py", "login, dashboard y páginas"),
        (470, 480, "catalog.py", "payload del catálogo hacia el JS"),
        (470, 575, "admin.py", "registro en Django Admin"),
        (470, 670, "management/", "comando seed_catalog"),
        (900, 290, "templates/", "login, body, módulos"),
        (900, 385, "static/css", "identidad visual agrícola"),
        (900, 480, "static/js", "asesor, mapa, cálculos"),
        (900, 575, "migrations/", "0001_catalogo_calculadora"),
        (900, 670, "tests.py", "pruebas (por completar)"),
    ]
    for x, y, t, s in pkgs:
        rrect(d, (x, y, x + 380, y + 78), WHITE, (22, 163, 74), 2, 8)
        d.text((x + 16, y + 14), t, font=font(15, True), fill=INK)
        d.text((x + 16, y + 42), s, font=font(12), fill=MUTED)
    save(img, "04_vista_desarrollo_paquetes.png")


def vista_procesos_runtime():
    img, d = canvas(
        1400, 620,
        "3. Vista de procesos — Tiempo de ejecución",
        "4+1 estricto: procesos e hilos reales. Un solo proceso de aplicación, SQLite embebido, sin colas.",
        (21, 128, 61),
    )
    rrect(d, (60, 160, 430, 380), (224, 242, 254), (2, 132, 199), 3, 14)
    d.text((80, 185), "Proceso navegador", font=font(18, True), fill=INK)
    d.text((80, 230), "Chrome / Edge / Firefox", font=font(14), fill=MUTED)
    d.text((80, 258), "HTML, CSS y JavaScript", font=font(14), fill=MUTED)
    d.text((80, 286), "Un hilo de UI", font=font(14), fill=MUTED)

    rrect(d, (515, 160, 885, 380), (243, 232, 255), (147, 51, 234), 3, 14)
    d.text((535, 185), "Proceso aplicación", font=font(18, True), fill=INK)
    d.text((535, 230), "python manage.py runserver", font=font(14), fill=MUTED)
    d.text((535, 258), "WSGI de desarrollo", font=font(14), fill=MUTED)
    d.text((535, 286), "Peticiones HTTP síncronas", font=font(14), fill=MUTED)

    rrect(d, (970, 160, 1340, 380), (254, 243, 199), (180, 83, 9), 3, 14)
    d.text((990, 185), "Motor SQLite", font=font(18, True), fill=INK)
    d.text((990, 230), "Librería embebida", font=font(14), fill=MUTED)
    d.text((990, 258), "No hay proceso postgres", font=font(14), fill=MUTED)
    d.text((990, 286), "Archivo db.sqlite3", font=font(14), fill=MUTED)

    arrow_h(d, 430, 270, 515, "HTTP")
    arrow_h(d, 885, 270, 970, "API C de SQLite")
    note(d, 60, 430, 1280, 120,
         "No hay workers, brokers ni microservicios. La concurrencia es la del servidor de desarrollo de Django. El navegador y Django pueden correr en el mismo computador académico.")
    save(img, "05_vista_procesos_ejecucion.png")


def vista_actividad():
    img, d = canvas(
        1580, 980,
        "3. Vista de procesos — Actividad: consultar asesoría",
        "Flujo de negocio del escenario (uso académico Duoc). Complementa el diagrama de procesos de ejecución.",
        (21, 128, 61),
    )
    lanes = [("Agricultor", 40), ("Interfaz", 430), ("Lógica Django", 820), ("Base de datos", 1210)]
    for name, x in lanes:
        rrect(d, (x, 120, x + 370, 940), (241, 245, 249), (203, 213, 225), 1, 10)
        rrect(d, (x, 120, x + 370, 160), (15, 23, 42), (15, 23, 42), 1, 10)
        d.text((x + 16, 130), name, font=font(15, True), fill=WHITE)

    def box(x, y, w, h, text, fill=WHITE, border=LINE):
        rrect(d, (x, y, x + w, y + h), fill, border, 2, 8)
        lines = wrap(d, text, font(13), w - 18)
        yy = y + (h - 17 * len(lines)) / 2
        for t in lines:
            d.text((x + 10, yy), t, font=font(13), fill=INK)
            yy += 17
        return (x, y, x + w, y + h)

    def diamond(cx, cy, text):
        d.polygon([(cx, cy - 36), (cx + 86, cy), (cx, cy + 36), (cx - 86, cy)],
                  fill=(254, 243, 199), outline=(217, 119, 6), width=2)
        f = font(12, True)
        d.text((cx - tw(d, text, f) / 2, cy - 8), text, font=f, fill=INK)
        return (cx - 86, cy - 36, cx + 86, cy + 36)

    a1 = box(70, 190, 310, 56, "Inicia sesión (precondición)")
    a2 = box(70, 290, 310, 56, "Elige cultivo, problema y tipo")
    s1 = box(460, 290, 310, 56, "Valida sesión y selección")
    l1 = box(850, 290, 310, 56, "Filtra insumos vigentes")
    db1 = box(1240, 290, 310, 56, "Lee Cultivo e Insumo", (254, 243, 199), (180, 83, 9))
    dia = diamond(1005, 430, "¿Hay ficha?")
    no = box(70, 500, 310, 56, "Mensaje: sin resultados vigentes", (254, 226, 226), (185, 28, 28))
    d.ellipse((40, 512, 68, 540), fill=INK)
    d.line((70, 526, 40 + 28, 526), fill=LINE, width=2)
    yes = box(850, 500, 310, 56, "Muestra ficha demostrativa", (187, 247, 208), (21, 128, 61))
    a3 = box(70, 620, 310, 56, "Revisa dosis y advertencia")
    l2 = box(850, 620, 310, 56, "Compara con máximo de ficha")
    dia2 = diamond(1005, 760, "¿Supera máximo?")
    warn = box(460, 850, 310, 56, "Alerta de dosis (si hay máximo real)", (254, 226, 226), (185, 28, 28))
    end = box(850, 850, 310, 56, "Resultado orientativo + disclaimer", (187, 247, 208), (21, 128, 61))
    d.ellipse((195, 890, 225, 920), fill=INK)

    arrow_v(d, 225, a1[3], a2[1])
    arrow_h(d, a2[2], 318, s1[0])
    arrow_h(d, s1[2], 318, l1[0])
    arrow_h(d, l1[2], 318, db1[0])
    arrow_v(d, 1005, l1[3], dia[1])
    d.line((919, 430, 225, 430), fill=LINE, width=2)
    arrow_v(d, 225, 430, no[1])
    d.text((250, 408), "No", font=font(13, True), fill=(185, 28, 28))
    arrow_v(d, 1005, dia[3], yes[1])
    d.text((1020, 468), "Sí", font=font(13, True), fill=(21, 128, 61))
    d.line((1005, yes[3], 1005, 590), fill=LINE, width=2)
    d.line((1005, 590, 225, 590), fill=LINE, width=2)
    arrow_v(d, 225, 590, a3[1])
    arrow_h(d, a3[2], 648, l2[0])
    arrow_v(d, 1005, l2[3], dia2[1])
    d.line((919, 760, 615, 760), fill=LINE, width=2)
    arrow_v(d, 615, 760, warn[1])
    d.text((640, 736), "Sí (máximo verificado)", font=font(12), fill=(185, 28, 28))
    arrow_v(d, 1005, dia2[3], end[1])
    d.text((1020, 800), "No", font=font(13, True), fill=(21, 128, 61))
    d.line((end[0], 905, 225, 905), fill=LINE, width=2)
    save(img, "06_vista_procesos_actividad.png")


def vista_fisica():
    img, d = canvas(
        1480, 780,
        "4. Vista física — Diagrama de despliegue",
        "As-is académico: navegador, Django y SQLite en el entorno local. Sin inventar nodos que no existen.",
        (126, 34, 206),
    )
    rrect(d, (50, 130, 680, 720), WHITE, (126, 34, 206), 3, 16)
    d.text((74, 150), "Nodo: dispositivo del usuario", font=font(18, True), fill=INK)
    d.text((74, 182), "PC / notebook / tablet", font=font(13), fill=MUTED)
    rrect(d, (80, 230, 650, 430), (224, 242, 254), (2, 132, 199), 2, 12)
    d.text((100, 255), "Artefacto: navegador web", font=font(16, True), fill=INK)
    d.text((100, 295), "Chrome, Edge o Firefox", font=font(14), fill=MUTED)
    d.text((100, 323), "Ejecuta HTML, CSS y JavaScript", font=font(14), fill=MUTED)
    d.text((100, 351), "No hay aplicación móvil nativa", font=font(14), fill=MUTED)
    note(d, 80, 470, 570, 200,
         "Vista del sistema construido hoy. PostgreSQL, PostGIS, React y JWT son evolución futura y no se dibujan aquí para no contradecir el código.")

    rrect(d, (800, 130, 1430, 720), WHITE, (126, 34, 206), 3, 16)
    d.text((824, 150), "Nodo: servidor de aplicación", font=font(18, True), fill=INK)
    d.text((824, 182), "Mismo equipo local / Codespace", font=font(13), fill=MUTED)
    rrect(d, (830, 230, 1400, 430), (243, 232, 255), (147, 51, 234), 2, 12)
    d.text((850, 250), "Artefacto: AgroAsesor Django", font=font(16, True), fill=INK)
    d.text((850, 290), "python3 manage.py runserver 0.0.0.0:8000", font=font(13), fill=MUTED)
    d.text((850, 318), "Templates + estáticos + views.py", font=font(13), fill=MUTED)
    d.text((850, 346), "Sin Nginx y sin Docker en esta versión", font=font(13), fill=MUTED)
    cyl(d, 880, 480, 420, 190, "Artefacto: SQLite",
        ["Proyecto/db.sqlite3", "Mismo disco, sin servidor de BD"])

    d.line((680, 300, 800, 300), fill=LINE, width=3)
    d.polygon([(800, 300), (790, 294), (790, 306)], fill=LINE)
    d.text((695, 268), "HTTP", font=font(13, True), fill=INK)
    d.text((678, 312), "localhost:8000", font=font(12), fill=MUTED)
    save(img, "07_vista_fisica_despliegue.png")


def vista_casos_uso():
    img, d = canvas(
        1680, 1080,
        "5. Vista +1 de escenarios — Casos de uso",
        "Los escenarios unen las otras vistas. Iniciar sesión se incluye en los casos protegidos.",
        (180, 83, 9),
    )
    actor(d, 40, 470, "Agricultor")
    actor(d, 1580, 470, "Administrador")
    rrect(d, (180, 120, 1500, 1020), WHITE, (180, 83, 9), 3, 18)
    title = "AgroAsesor"
    d.text((840 - tw(d, title, font(20, True)) / 2, 140), title, font=font(20, True), fill=INK)

    left = [
        (240, 200, "Crear cuenta"),
        (240, 280, "Iniciar sesión"),
        (240, 380, "Gestionar predios y potreros"),
        (240, 460, "Planificar siembra"),
        (240, 540, "Consultar asesoría de insumos"),
        (240, 620, "Calcular semillas e insumos"),
        (240, 700, "Consultar cobertura"),
        (240, 780, "Estimar cosecha (demostrativo)"),
        (240, 860, "Consultar calendario"),
        (240, 940, "Buscar información / reporte"),
    ]
    right = [
        (980, 380, "Administrar catálogos"),
        (980, 480, "Gestionar vigencia de insumos"),
        (980, 580, "Usar Django Admin"),
    ]
    boxes = {}
    for x, y, t in left:
        boxes[t] = oval(d, x, y, 300, 62, t)
    for x, y, t in right:
        boxes[t] = oval(d, x, y, 320, 70, t)

    agr = (100, 510)
    for t, y in [
        ("Crear cuenta", 231),
        ("Iniciar sesión", 311),
        ("Gestionar predios y potreros", 411),
        ("Planificar siembra", 491),
        ("Consultar asesoría de insumos", 571),
        ("Calcular semillas e insumos", 651),
        ("Consultar cobertura", 731),
        ("Estimar cosecha (demostrativo)", 811),
        ("Consultar calendario", 891),
        ("Buscar información / reporte", 971),
    ]:
        d.line((agr[0], agr[1], 240, y), fill=LINE, width=2)

    adm = (1580, 510)
    for t in ["Administrar catálogos", "Gestionar vigencia de insumos", "Usar Django Admin"]:
        b = boxes[t]
        d.line((adm[0], adm[1], b[2], (b[1] + b[3]) / 2), fill=LINE, width=2)

    # include dashed from protected cluster to login
    d.line((540, 411, 540, 342), fill=(37, 99, 235), width=2)
    d.text((552, 360), "<<include>>", font=font(12, True), fill=(37, 99, 235))
    note(d, 900, 720, 540, 250,
         "Los casos protegidos incluyen Iniciar sesión (se dibuja una vez). El administrador también inicia sesión. Estimar cosecha es un cálculo de referencia, no un modelo de IA. Administrar catálogos cubre cultivos, insumos, zonas y tipos.")
    save(img, "08_vista_escenarios_casos_de_uso.png")


if __name__ == "__main__":
    vista_clases()
    vista_comunicacion()
    vista_componentes()
    vista_paquetes()
    vista_procesos_runtime()
    vista_actividad()
    vista_fisica()
    vista_casos_uso()
