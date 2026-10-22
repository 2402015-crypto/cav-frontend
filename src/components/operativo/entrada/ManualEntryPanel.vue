<script setup>
import { computed, ref } from 'vue'
import { searchManualEntry } from '@/services/api/entradas'

const emit = defineEmits(['back', 'complete'])

const plate = ref('')
const searched = ref(false)
const vehicleFound = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const lookup = ref(null)

const canSearch = computed(() => plate.value.trim().length > 0)

async function searchVehicle() {
  if (!canSearch.value) return
  loading.value = true
  errorMessage.value = ''
  lookup.value = null
  searched.value = false
  try {
    const response = await searchManualEntry(plate.value.trim().toUpperCase())
    lookup.value = response.data.data
    vehicleFound.value = lookup.value.vehiculoRegistrado
    searched.value = true
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar la placa.'
  } finally {
    loading.value = false
  }
}

function continueToForm() {
  if (searched.value) emit('complete', { plate: plate.value.trim().toUpperCase(), lookup: lookup.value })
}
</script>

<template>
  <section class="entry-manual-panel">
    <p>Ingresa la placa del vehículo manualmente.</p>
    <label for="manual-plate">NÚMERO DE PLACA</label>
    <div class="entry-manual-search">
      <input id="manual-plate" v-model="plate" type="text" maxlength="30" placeholder="AAA-000-A" @keyup.enter="searchVehicle" />
      <button type="button" :disabled="!canSearch || loading" @click="searchVehicle">{{ loading ? 'Buscando...' : 'Buscar' }}</button>
    </div>

    <p v-if="errorMessage" class="entry-manual-error" role="alert">{{ errorMessage }}</p>

    <template v-if="searched">
      <div v-if="vehicleFound" class="entry-manual-notice entry-manual-notice--found"><span aria-hidden="true">☆</span> Vehículo reconocido · datos autocompletados</div>
      <div v-else class="entry-manual-notice entry-manual-notice--new">Vehículo nuevo — completa el formulario de registro</div>
      <button class="entry-manual-continue" type="button" @click="continueToForm"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg>{{ vehicleFound ? 'Comprobar datos' : 'Completar registro' }}</button>
    </template>
  </section>
</template>