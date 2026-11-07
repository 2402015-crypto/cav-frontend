<script setup>
import { ref } from 'vue'
import SalidaCameraPanel from '@/components/operativo/salida/SalidaCameraPanel.vue'
import SalidaManualPanel from '@/components/operativo/salida/SalidaManualPanel.vue'
import SalidaSuccessView from '@/components/operativo/salida/SalidaSuccessView.vue'
import VehicleDetailsModal from '@/components/operativo/salida/VehicleDetailsModal.vue'

const mode = ref('automatic')
const stage = ref('capture')
const record = ref(null)
const detailsOpen = ref(false)
const errorMessage = ref('')

function setMode(value) {
  mode.value = value
  stage.value = 'capture'
  record.value = null
  errorMessage.value = ''
}

function showRecord(value) {
  record.value = value
  detailsOpen.value = true
}

function reset() {
  record.value = null
  detailsOpen.value = false
  errorMessage.value = ''
  stage.value = 'capture'
}

function returnFromDetails() {
  detailsOpen.value = false
}
</script>

<template>
  <section class="exit-page">
    <header v-if="stage !== 'success'" class="exit-page__header">
      <div>
        <h1>Registrar Salida</h1>
        <p>Captura la placa para comenzar</p>
      </div>
      <button v-if="stage !== 'capture'" class="exit-page__back" type="button" @click="returnFromDetails">‹&nbsp; Volver</button>
    </header>

    <template v-if="stage !== 'success'">
      <div class="exit-mode-tabs">
        <button type="button" :class="{ 'exit-mode-tabs__active': mode === 'automatic' }"
          @click="setMode('automatic')">Capturar Placa</button>
        <button type="button" :class="{ 'exit-mode-tabs__active': mode === 'manual' }" @click="setMode('manual')">Buscar
          Visitante</button>
      </div>
      <SalidaCameraPanel v-if="mode === 'automatic'" :initial-record="record" @back="reset"
        @found="showRecord" @registered="record = $event; stage = 'success'" />
      <SalidaManualPanel v-else @found="showRecord"
        @registered="record = $event; stage = 'success'" />
    </template>
    <SalidaSuccessView v-else :record="record" @panel="reset" />
    <VehicleDetailsModal v-if="detailsOpen && record" :record="record"
      @close="returnFromDetails" @registered="record = $event; detailsOpen = false; stage = 'success'" />
  </section>
</template>