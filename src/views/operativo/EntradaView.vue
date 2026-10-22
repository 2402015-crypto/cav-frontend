<script setup>
import { computed, ref } from 'vue'
import EntradaForm from '@/components/operativo/entrada/FormularioEntrada.vue'
import EntrySuccessView from '@/components/operativo/entrada/EntrySuccessView.vue'
import EntryMethodSelector from '@/components/operativo/entrada/EntryMethodSelector.vue'
import ManualEntryPanel from '@/components/operativo/entrada/ManualEntryPanel.vue'
import OcrCapturePanel from '@/components/operativo/entrada/OcrCapturePanel.vue'
import RegistroTypeSelector from '@/components/operativo/entrada/RegistroTypeSelector.vue'

const registrationTypes = [
  { key: 'general', label: 'Colaborador', formTitle: 'Registro general', icon: 'person' },
  { key: 'proveedores', label: 'Proveedor', formTitle: 'Registro de proveedores', icon: 'truck' },
  { key: 'transportadoras', label: 'Transportadora', formTitle: 'Registro de transportadoras', icon: 'bus' },
  { key: 'taxis', label: 'Taxi', formTitle: 'Registro de taxis', icon: 'taxi' },
]

const step = ref('type')
const selectedType = ref(null)
const selectedMethod = ref(null)
const capturedPlate = ref('')
const manualLookup = ref(null)
const registeredAt = ref(null)

const stepLabel = computed(() => step.value === 'type' ? 'Paso 1 de 3' : 'Paso 2 de 3')
const canGoBack = computed(() => step.value !== 'type')

function selectType(type) {
  selectedType.value = type
  selectedMethod.value = null
  capturedPlate.value = ''
  manualLookup.value = null
  step.value = 'method'
}

function selectAutomatic() {
  selectedMethod.value = 'automatic'
  step.value = 'capture'
}

function selectManual() {
  selectedMethod.value = 'manual'
  step.value = 'manual'
}

function returnToTypes() {
  selectedType.value = null
  selectedMethod.value = null
  capturedPlate.value = ''
  step.value = 'type'
}

function returnToMethod() {
  selectedMethod.value = null
  capturedPlate.value = ''
  step.value = 'method'
}

function confirmPlate(plate) {
  capturedPlate.value = plate
  step.value = 'form'
}

function completeManual(payload) {
  capturedPlate.value = payload.plate
  manualLookup.value = payload.lookup
  step.value = 'form'
}

function completeRegistration(response) {
  capturedPlate.value = response.placa
  registeredAt.value = new Date(response.fechaEntrada)
  step.value = 'success'
}

function returnToPanel() {
  selectedType.value = null
  selectedMethod.value = null
  capturedPlate.value = ''
  manualLookup.value = null
  registeredAt.value = null
  step.value = 'type'
}

function goBack() {
  if (step.value === 'method') returnToTypes()
  else if (step.value === 'capture') returnToMethod()
  else if (capturedPlate.value) returnToMethod()
  else returnToTypes()
}
</script>

<template>
  <section class="entry-page">
    <header v-if="step !== 'success'" class="entry-page__header">
      <div>
        <h1>Registrar Entrada</h1>
        <p>{{ stepLabel }}</p>
      </div>
      <button v-if="canGoBack" class="entry-page__back" type="button" @click="goBack">‹&nbsp; Volver</button>
    </header>

    <RegistroTypeSelector v-if="step === 'type'" :options="registrationTypes" @select="selectType" />
    <EntryMethodSelector v-else-if="step === 'method'" @automatic="selectAutomatic" @manual="selectManual" @back="returnToTypes" />
    <ManualEntryPanel v-else-if="step === 'manual'" @back="returnToMethod" @complete="completeManual" />
    <OcrCapturePanel v-else-if="step === 'capture'" @back="returnToMethod" @confirm="confirmPlate" />
    <EntradaForm v-else-if="step === 'form'" :type-key="selectedType?.key || 'general'" :type-label="selectedType?.label || 'Colaborador'" :plate="capturedPlate" :initial-data="manualLookup" @back="capturedPlate ? returnToMethod : returnToTypes" @registered="completeRegistration" />
    <EntrySuccessView v-else :plate="capturedPlate" :registered-at="registeredAt" @panel="returnToPanel" />
  </section>
</template>