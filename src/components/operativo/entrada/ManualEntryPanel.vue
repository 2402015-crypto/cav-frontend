<script setup>
import { computed, ref } from 'vue'

const emit = defineEmits(['back', 'complete'])

const plate = ref('')
const searched = ref(false)
const vehicleFound = ref(false)

const canSearch = computed(() => plate.value.trim().length > 0)

function searchVehicle() {
  if (!canSearch.value) return
  searched.value = true
  vehicleFound.value = plate.value.trim().toUpperCase() === 'FAP-528-D'
}

function continueToForm() {
  if (searched.value) emit('complete', plate.value.trim().toUpperCase())
}
</script>

<template>
  <section class="entry-manual-panel">
    <p>Ingresa la placa del vehículo manualmente.</p>
    <label for="manual-plate">NÚMERO DE PLACA</label>
    <div class="entry-manual-search">
      <input id="manual-plate" v-model="plate" type="text" maxlength="30" placeholder="AAA-000-A" @keyup.enter="searchVehicle" />
      <button type="button" :disabled="!canSearch" @click="searchVehicle">Buscar</button>
    </div>

    <template v-if="searched">
      <div v-if="vehicleFound" class="entry-manual-notice entry-manual-notice--found"><span aria-hidden="true">☆</span> Vehículo reconocido · datos autocompletados</div>
      <div v-else class="entry-manual-notice entry-manual-notice--new">Vehículo nuevo — completa el formulario de registro</div>
      <button class="entry-manual-continue" type="button" @click="continueToForm"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg>{{ vehicleFound ? 'Comprobar datos' : 'Completar registro' }}</button>
    </template>
  </section>
</template>