<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const usuario = ref('')
const contrasena = ref('')
const error = ref('')
const enviando = ref(false)

async function iniciarSesion() {
  error.value = ''
  enviando.value = true
  try {
    await authStore.login({ usuario: usuario.value, contrasena: contrasena.value })
    await router.push(route.query.redirect || '/operativo')
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No fue posible iniciar sesión'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <main class="container py-5" style="max-width: 480px">
    <h1 class="h3 mb-4">Iniciar sesión</h1>
    <form @submit.prevent="iniciarSesion">
      <div class="mb-3">
        <label class="form-label" for="usuario">Usuario</label>
        <input id="usuario" v-model.trim="usuario" class="form-control" autocomplete="username" required />
      </div>
      <div class="mb-3">
        <label class="form-label" for="contrasena">Contraseña</label>
        <input id="contrasena" v-model="contrasena" class="form-control" type="password" autocomplete="current-password" required />
      </div>
      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
      <button class="btn btn-primary w-100" type="submit" :disabled="enviando">
        {{ enviando ? 'Validando...' : 'Entrar' }}
      </button>
    </form>
  </main>
</template>