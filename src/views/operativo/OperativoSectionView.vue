<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const cerrandoSesion = ref(false)

async function cerrarSesion() {
  cerrandoSesion.value = true
  try {
    await authStore.logout()
    await router.push('/login')
  } finally {
    cerrandoSesion.value = false
  }
}
</script>

<template>
  <section class="operative-section">
    <h1>{{ $route.meta.sectionTitle }}</h1>
    <button v-if="$route.name === 'operativo-panel'" class="temporary-logout" type="button" :disabled="cerrandoSesion" @click="cerrarSesion">
      {{ cerrandoSesion ? 'Cerrando sesión...' : 'Cerrar sesión' }}
    </button>
  </section>
</template>