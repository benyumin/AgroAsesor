from django.core.management import call_command
from django.test import TestCase


class AgroPagesTests(TestCase):
    def test_login_required(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 302)

    def test_login_demo(self):
        response = self.client.post('/login/', {
            'email': 'agricultor@agroasesor.cl',
            'password': '123456',
            'mode': 'login',
        })
        self.assertEqual(response.status_code, 302)
        follow = self.client.get('/')
        self.assertEqual(follow.status_code, 200)

    def test_enter_as_admin_button(self):
        response = self.client.post('/entrar-admin/')
        self.assertRedirects(response, '/panel-admin/')
        panel = self.client.get('/panel-admin/')
        self.assertEqual(panel.status_code, 200)
        self.assertContains(panel, 'Panel admin')

    def test_recover_goes_to_reset(self):
        response = self.client.post('/login/', {
            'email': 'agricultor@agroasesor.cl',
            'mode': 'recover',
        })
        self.assertRedirects(response, '/login/?mode=reset')
        self.client.post('/login/', {
            'email': 'agricultor@agroasesor.cl',
            'password': '123456',
            'mode': 'login',
        })
        response = self.client.get('/panel-admin/')
        self.assertEqual(response.status_code, 302)


class CatalogSliceTests(TestCase):
    def setUp(self):
        call_command('seed_catalog', verbosity=0)
        self.client.post('/login/', {
            'email': 'agricultor@agroasesor.cl',
            'password': '123456',
            'mode': 'login',
        })

    def test_dashboard_gets_catalog_from_database(self):
        response = self.client.get('/')
        self.assertContains(response, 'dash-hero')
        catalog = response.context['catalog']
        self.assertTrue(catalog['fromDb'])
        names = [item['name'] for item in catalog['cultivos']]
        self.assertIn('Maíz', names)
        maize = next(item for item in catalog['cultivos'] if item['name'] == 'Maíz')
        self.assertEqual(maize['density'], 25.0)

    def test_catalog_includes_pests_calendar_and_inputs(self):
        response = self.client.get('/asesor/')
        catalog = response.context['catalog']
        problems = [item['name'] for item in catalog['problemas']]
        self.assertIn('Gusano cogollero', problems)
        self.assertIn('Tizón tardío', problems)
        crops = [item['crop'] for item in catalog['calendario']]
        self.assertIn('Maíz', crops)
        names = [item['name'] for item in catalog['insumos']]
        self.assertIn('Urea 46% demostrativa', names)
        self.assertIn('Insecticida cogollero demostrativo', names)

    def test_calculator_page_receives_seed_catalog(self):
        response = self.client.get('/calculadora/')
        self.assertEqual(response.status_code, 200)
        payload = response.context['catalog']
        self.assertTrue(payload['fromDb'])
        seeds = {item['crop']: item['density'] for item in payload['semillas']}
        self.assertEqual(seeds['Maíz'], 25.0)
        self.assertEqual(seeds['Trigo'], 160.0)

    def test_calendar_and_ficha_pages_load(self):
        for path in ('/calendario/', '/asesor/', '/predios/', '/cobertura/', '/reportes/', '/busqueda/'):
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200, path)
            self.assertTrue(response.context['catalog']['fromDb'])
