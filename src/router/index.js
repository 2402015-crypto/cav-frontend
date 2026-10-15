import { createRouter, createWebHistory } from 'vue-router'
import PlaceholderView from '@/views/PlaceholderView.vue'
import IntegrationStatusView from '@/views/IntegrationStatusView.vue'
import LoginView from '@/views/LoginView.vue'
import UnauthorizedView from '@/views/UnauthorizedView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/integration-status',
    },
    {
      path: '/integration-status',
      component: IntegrationStatusView,
      meta: { public: true, title: 'Estado de integración' },
    },
    {
      path: '/login',
      component: LoginView,
      meta: { public: true, title: 'Iniciar sesión' },
    },
    {
      path: '/operativo',
      component: PlaceholderView,
      meta: { requiresAuth: true, roles: ['OPERATIVO', 'ADMIN'], title: 'Área operativa' },
    },
    {
      path: '/admin',
      component: PlaceholderView,
      meta: { requiresAuth: true, roles: ['ADMIN'], title: 'Administración' },
    },
    {
      path: '/unauthorized',
      component: UnauthorizedView,
      meta: { public: true, title: 'Acceso denegado' },
    },
    {
      path: '/:pathMatch(.*)*',
      component: PlaceholderView,
      meta: { title: 'Página no encontrada' },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  document.title = to.meta.title || 'CAV'

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles?.length && !to.meta.roles.includes(authStore.user?.rol)) {
    return authStore.isAuthenticated ? '/unauthorized' : '/login'
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    return authStore.user?.rol === 'ADMIN' ? '/admin' : '/operativo'
  }
})

export default router
