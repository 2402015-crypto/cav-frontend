<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import logo from '@/images/Chable_Maroma-02.png'

const authStore = useAuthStore()
const router = useRouter()
const cerrandoSesion = ref(false)
const confirmarCierre = ref(false)

async function cerrarSesion() {
  cerrandoSesion.value = true
  try {
    await authStore.logout()
    await router.push('/login')
  } finally {
    cerrandoSesion.value = false
  }
}

function solicitarCierre() {
  confirmarCierre.value = true
}

function cancelarCierre() {
  confirmarCierre.value = false
}

async function confirmarLogout() {
  confirmarCierre.value = false
  await cerrarSesion()
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-sidebar__brand">
        <img :src="logo" alt="Chablé Maroma" />
        <span>ADMINISTRACIÓN</span>
      </div>

      <div class="admin-sidebar__body">
        <p class="admin-sidebar__label">SISTEMA</p>
        <nav class="admin-menu" aria-label="Navegación administrativa">
          <RouterLink class="admin-menu__item" active-class="admin-menu__item--active" :to="{ name: 'admin-dashboard' }">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>
            <span>Dashboard</span>
          </RouterLink>
          <RouterLink class="admin-menu__item" active-class="admin-menu__item--active" :to="{ name: 'admin-usuarios' }">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.7-3 2.5-4.5 5.5-4.5s4.8 1.5 5.5 4.5M16 11a3 3 0 1 0 0-6M16 14.5c2.5.1 4 1.6 4.5 4.5" /></svg>
            <span>Usuarios</span>
          </RouterLink>
          <RouterLink class="admin-menu__item" active-class="admin-menu__item--active" :to="{ name: 'admin-bitacora' }">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16l-3-2-3 2-3-2-3 2V4Z" /><path d="M9 8h6M9 12h6" /></svg>
            <span>Bitácora</span>
          </RouterLink>
          <RouterLink class="admin-menu__item" active-class="admin-menu__item--active" :to="{ name: 'admin-historial' }">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2M4 12H2.5M5.5 6.5 4.4 5.4" /></svg>
            <span>Historial</span>
          </RouterLink>
          <RouterLink class="admin-menu__item" active-class="admin-menu__item--active" :to="{ name: 'admin-configuracion' }">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 13.7 5l2.3-.2 1 2.1 2.1 1-.2 2.3 1.6 1.8-1.6 1.8.2 2.3-2.1 1-1 2.1-2.3-.2-1.7 1.5-1.7-1.5-2.3.2-1-2.1-2.1-1 .2-2.3L3.5 12l1.6-1.8-.2-2.3 2.1-1 1-2.1 2.3.2L12 3.5Z" /><circle cx="12" cy="12" r="3" /></svg>
            <span>Catálogos</span>
          </RouterLink>
        </nav>
      </div>

      <div class="admin-sidebar__footer">
        <div class="admin-user">
          <span class="admin-user__avatar">{{ (authStore.user?.nombre || 'A').charAt(0).toUpperCase() }}</span>
          <span class="admin-user__details">
            <strong>{{ authStore.user?.usuario || 'Administrador' }}</strong>
            <small>{{ (authStore.user?.rol || 'ADMIN').toLowerCase() }}</small>
          </span>
        </div>
        <button class="admin-logout" type="button" :disabled="cerrandoSesion" @click="solicitarCierre">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5M14 8l4 4-4 4M9 12h9" /></svg>
          <span>{{ cerrandoSesion ? 'Cerrando sesión...' : 'Cerrar sesión' }}</span>
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <RouterView />
    </main>

    <ConfirmModal
      :open="confirmarCierre"
      variant="admin"
      title="Cerrar sesión"
      message="¿Deseas cerrar tu sesión actual?"
      confirm-label="Cerrar Sesión"
      @cancel="cancelarCierre"
      @confirm="confirmarLogout"
    />
  </div>
</template>