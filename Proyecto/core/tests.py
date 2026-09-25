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

    def test_admin_hidden_for_farmer(self):
        self.client.post('/login/', {
            'email': 'agricultor@agroasesor.cl',
            'password': '123456',
            'mode': 'login',
        })
        response = self.client.get('/panel-admin/')
        self.assertEqual(response.status_code, 302)
