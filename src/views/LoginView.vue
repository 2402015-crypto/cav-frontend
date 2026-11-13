<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import logo from '@/images/Chable_Maroma-01.png'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const usuario = ref('')
const contrasena = ref('')
const mostrarContrasena = ref(false)
const error = ref(route.query.sessionExpired ? 'Tu sesión expiró. Inicia sesión nuevamente para continuar.' : '')
const enviando = ref(false)

async function iniciarSesion() {
  error.value = ''
  enviando.value = true
  try {
    await authStore.login({ usuario: usuario.value, contrasena: contrasena.value })
    const redirect = !route.query.sessionExpired && typeof route.query.redirect === 'string'
      && route.query.redirect.startsWith('/')
      && !route.query.redirect.startsWith('//')
      ? route.query.redirect
      : null
    await router.push(redirect || (authStore.user.rol === 'ADMIN' ? '/admin' : '/operativo'))
  } catch (exception) {
    error.value = exception.response?.data?.message || 'Usuario o contraseña incorrectos'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <div class="login-decoration login-decoration--top" aria-hidden="true"></div>
    <div class="login-decoration login-decoration--bottom" aria-hidden="true"></div>

    <section class="login-content" aria-labelledby="login-title">
      <header class="brand" aria-label="Chablé Maroma, Control de Acceso Vehicular">
        <img class="brand-logo" :src="logo" alt="Chablé Maroma" />
        <h1 id="login-title">CONTROL DE ACCESO VEHICULAR</h1>
      </header>

      <form class="login-card" @submit.prevent="iniciarSesion" novalidate>
        <div class="field-group">
          <label for="usuario">USUARIO</label>
          <input id="usuario" v-model.trim="usuario" autocomplete="username" placeholder="nombre de usuario" required />
        </div>

        <div class="field-group">
          <label for="contrasena">CONTRASEÑA</label>
          <div class="password-field">
            <input id="contrasena" v-model="contrasena" :type="mostrarContrasena ? 'text' : 'password'" autocomplete="current-password" placeholder="••••••••" required />
            <button
              class="password-toggle"
              type="button"
              :aria-label="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              :aria-pressed="mostrarContrasena"
              :title="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="mostrarContrasena = !mostrarContrasena"
            >
              <svg v-if="mostrarContrasena" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.7 10.7 0 0 1 12 5c5.4 0 9.2 4.2 10 7a10.7 10.7 0 0 1-3.1 4.8M6.2 6.2C3.9 7.7 2.5 10 2 12c.8 2.8 4.6 7 10 7 1.1 0 2.1-.2 3-.5" />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="error" class="login-error" role="alert">{{ error }}</p>

        <button class="login-button" type="submit" :disabled="enviando">
          {{ enviando ? 'Validando...' : 'Iniciar sesión' }}
        </button>
      </form>

      <p class="login-version">Chablé Maroma · CAV v1.1</p>
    </section>
  </main>
</template>