<script setup>
import { onMounted, ref } from 'vue'
import { getBackendStatus } from '@/services/api/status'

const status = ref(null)
const errorMessage = ref('')
const isLoading = ref(true)

async function loadBackendStatus() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await getBackendStatus()
    status.value = response.data
  } catch (error) {
    status.value = null
    errorMessage.value = error.response
      ? `El backend respondió con un error (${error.response.status}).`
      : 'No fue posible conectar con el backend. Verifica que esté ejecutándose.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadBackendStatus)
</script>

<template>
  <main class="container py-5">
    <div class="mb-4">
      <p class="text-uppercase text-secondary small fw-semibold mb-2">Integración inicial</p>
      <h1 class="h3 mb-2">Estado de la comunicación</h1>
      <p class="text-secondary mb-0">Prueba temporal de conexión entre Vue y Spring Boot.</p>
    </div>

    <div v-if="isLoading" class="alert alert-info" role="status">
      Consultando el backend...
    </div>

    <div v-else-if="status" class="alert alert-success" role="status">
      <strong>{{ status.status }}</strong>: {{ status.message }}
    </div>

    <div v-else class="alert alert-danger" role="alert">
      {{ errorMessage }}
      <button type="button" class="btn btn-outline-danger btn-sm ms-2" @click="loadBackendStatus">
        Reintentar
      </button>
    </div>
  </main>
</template>