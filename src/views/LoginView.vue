<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import logo from '@/logos/Chable_Maroma-01.png'

const authStore = useAuthStore()
const router = useRouter()
const usuario = ref('')
const contrasena = ref('')
const error = ref('')
const enviando = ref(false)

async function iniciarSesion() {
  error.value = ''
  enviando.value = true
  try {
    await authStore.login({ usuario: usuario.value, contrasena: contrasena.value })
    await router.push(authStore.user.rol === 'ADMIN' ? '/admin' : '/operativo')
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
          <input id="contrasena" v-model="contrasena" type="password" autocomplete="current-password" placeholder="••••••••" required />
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