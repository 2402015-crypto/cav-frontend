<script setup>
import { ref } from 'vue'
import SalidaCameraPanel from '@/components/operativo/salida/SalidaCameraPanel.vue'
import SalidaDetails from '@/components/operativo/salida/SalidaDetails.vue'
import SalidaManualPanel from '@/components/operativo/salida/SalidaManualPanel.vue'
import SalidaSuccessView from '@/components/operativo/salida/SalidaSuccessView.vue'

const mode = ref('automatic')
const stage = ref('capture')
const record = ref(null)
const errorMessage = ref('')

function setMode(value) {
  mode.value = value
  stage.value = 'capture'
  record.value = null
  errorMessage.value = ''
}

function showRecord(value) {
  record.value = value
  stage.value = 'details'
}

function reset() {
  record.value = null
  errorMessage.value = ''
  stage.value = 'capture'
}
</script>

<template>
  <section class="exit-page">
    <header v-if="stage !== 'success'" class="exit-page__header">
      <div>
        <h1>Registrar Salida</h1>
        <p>{{ stage === 'details' ? 'Detalle del vehículo' : 'Captura la placa para comenzar' }}</p>
      </div>
      <button v-if="stage !== 'capture'" class="exit-page__back" type="button" @click="reset">‹&nbsp; Volver</button>
    </header>

    <template v-if="stage !== 'success'">
      <div v-if="stage !== 'details'" class="exit-mode-tabs">
        <button type="button" :class="{ 'exit-mode-tabs__active': mode === 'automatic' }"
          @click="setMode('automatic')">Capturar Placa</button>
        <button type="button" :class="{ 'exit-mode-tabs__active': mode === 'manual' }" @click="setMode('manual')">Buscar
          Visitante</button>
      </div>
      <SalidaCameraPanel v-if="stage === 'capture' && mode === 'automatic'" @back="reset" />
      <SalidaManualPanel v-else-if="stage === 'capture'" @found="showRecord" />
      <SalidaDetails v-else :record="record" @back="reset" @registered="record = $event; stage = 'success'" />
    </template>
    <SalidaSuccessView v-else :record="record" @panel="reset" />
  </section>
</template>