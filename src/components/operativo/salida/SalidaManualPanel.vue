<script setup>
import { computed, ref } from 'vue'
import { searchActiveExit } from '@/services/api/salidas'

const emit = defineEmits(['found'])
const plate = ref('')
const loading = ref(false)
const errorMessage = ref('')
const canSearch = computed(() => plate.value.trim().length > 0)

async function search() {
  if (!canSearch.value || loading.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await searchActiveExit(plate.value.trim().toUpperCase())
    emit('found', response.data.data)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No hay una entrada activa para esa placa.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="exit-manual-panel">
    <label for="exit-plate">NÚMERO DE PLACA</label>
    <div><input id="exit-plate" v-model="plate" type="text" placeholder="AAA-000-A" @keyup.enter="search" /><button type="button" :disabled="!canSearch || loading" @click="search">{{ loading ? 'Buscando...' : 'Buscar vehículo' }}</button></div>
    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
  </section>
</template>