import { createRouter, createWebHistory } from 'vue-router'
import PlaceholderView from '@/views/PlaceholderView.vue'
import LoginView from '@/views/LoginView.vue'
import OperativoView from '@/views/OperativoView.vue'
import AdminView from '@/views/AdminView.vue'
import OperativoSectionView from '@/views/OperativoSectionView.vue'
import UnauthorizedView from '@/views/UnauthorizedView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      component: LoginView,
      meta: { public: true, title: 'Iniciar sesión' },
    },
    {
      path: '/operativo',
      component: OperativoView,
      meta: { requiresAuth: true, roles: ['OPERATIVO', 'ADMIN'], title: 'Área operativa' },
      redirect: { name: 'operativo-panel' },
      children: [
        { path: 'panel', name: 'operativo-panel', component: OperativoSectionView, meta: { title: 'Panel operativo', sectionTitle: 'Panel Operativo' } },
        { path: 'entrada', name: 'operativo-entrada', component: OperativoSectionView, meta: { title: 'Entrada', sectionTitle: 'Entrada' } },
        { path: 'salida', name: 'operativo-salida', component: OperativoSectionView, meta: { title: 'Salida', sectionTitle: 'Salida' } },
        { path: 'activos', name: 'operativo-activos', component: OperativoSectionView, meta: { title: 'Activos', sectionTitle: 'Activos' } },
        { path: 'buscar', name: 'operativo-buscar', component: OperativoSectionView, meta: { title: 'Buscar', sectionTitle: 'Buscar' } },
      ],
    },
    {
      path: '/admin',
      component: AdminView,
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
