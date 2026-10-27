<script setup>
import { computed, ref } from 'vue'
import { registerExit, updateExitObservations } from '@/services/api/salidas'

const props = defineProps({ record: { type: Object, required: true } })
const emit = defineEmits(['registered', 'back'])
const observations = ref(props.record.observaciones || '')
const observationsEditing = ref(false)
const observationsSaving = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const typeName = computed(() => (props.record.tipoVisitante || '').toLowerCase())
const isTransporter = computed(() => typeName.value.includes('transportadora'))
const isTaxi = computed(() => typeName.value.includes('taxi'))
const isProvider = computed(() => typeName.value.includes('proveedor'))
const isCollaborator = computed(() => !isTransporter.value && !isTaxi.value && !isProvider.value)
const typeLabel = computed(() => typeName.value.includes('general') || typeName.value.includes('colaborador') ? 'Colaborador' : props.record.tipoVisitante || 'Visitante')

const entryTime = computed(() => formatDate(props.record.fechaEntrada))
const exitTime = computed(() => formatDate(new Date().toISOString()))

function formatDate(value) {
  return new Date(value).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
}

async function submit() {
  if (saving.value) return
  saving.value = true
  errorMessage.value = ''
  try {
    const response = await registerExit(props.record.idRegistro, observations.value)
    emit('registered', response.data.data)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible registrar la salida.'
  } finally {
    saving.value = false
  }
}

async function saveObservations() {
  if (observationsSaving.value) return
  observationsSaving.value = true
  errorMessage.value = ''
  try {
    const response = await updateExitObservations(props.record.idRegistro, observations.value)
    observations.value = response.data.data.observaciones || ''
    observationsEditing.value = false
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible actualizar las observaciones.'
  } finally {
    observationsSaving.value = false
  }
}
</script>

<template>
  <section class="exit-details-card">
    <header class="exit-details-card__hero">
      <small>PLACA</small>
      <strong>{{ record.placa }}</strong>
      <div><span>◉&nbsp; {{ typeLabel }}</span><span>●&nbsp; Dentro del hotel</span></div>
    </header>
    <div class="exit-details-card__body">
      <section class="exit-detail-block exit-detail-block--conductor">
        <small>CONDUCTOR</small>
        <div><span>Nombre<strong>{{ record.conductor || 'N/A' }}</strong></span><span v-if="isProvider || isTransporter">Compañía/Agencia<strong>{{ record.empresa || record.transportadora || 'N/A' }}</strong></span></div>
      </section>
      <section class="exit-detail-block exit-detail-block--data">
        <small>DATOS DEL REGISTRO</small>
        <div v-if="isTransporter" class="exit-detail-grid"><span>Marca<strong>{{ record.marca || 'N/A' }}</strong></span><span>Tipo de movimiento<strong>{{ record.tipoMovimiento || 'N/A' }}</strong></span><span>Villa<strong>{{ record.villa || 'N/A' }}</strong></span><span>Pasajeros (PAX)<strong>{{ record.numeroPax ?? 'N/A' }}</strong></span></div>
        <div v-else-if="isTaxi" class="exit-detail-grid"><span>Número de unidad<strong>{{ record.numeroUnidad || 'N/A' }}</strong></span><span>Villa<strong>{{ record.villa || 'N/A' }}</strong></span><span>Destino<strong>{{ record.destino || 'N/A' }}</strong></span></div>
        <div v-else-if="isProvider" class="exit-detail-grid"><span>Marca<strong>{{ record.marca || 'N/A' }}</strong></span><span>Color<strong>{{ record.color || 'N/A' }}</strong></span><span>Área<strong>{{ record.area || 'N/A' }}</strong></span></div>
        <div v-else class="exit-detail-grid"><span>Departamento<strong>{{ record.area || 'N/A' }}</strong></span><span>Marca<strong>{{ record.marca || 'N/A' }}</strong></span><span>Color<strong>{{ record.color || 'N/A' }}</strong></span></div>
      </section>
      <label class="exit-observations"><span>OBSERVACIONES <button type="button" @click="observationsEditing ? saveObservations() : observationsEditing = true">{{ observationsSaving ? 'Guardando...' : observationsEditing ? 'Guardar' : '✎ Añadir' }}</button></span><textarea v-model="observations" :readonly="!observationsEditing" placeholder="Sin observaciones" /></label>
      <section v-if="record.historial?.length" class="exit-history">
        <header><strong>HISTORIAL DE VISITAS</strong><span>{{ record.totalVisitas }} total</span></header>
        <div class="exit-history__latest"><span>ÚLTIMA VISITA</span><div><span>Entrada<strong>{{ entryTime }}</strong></span><span>Salida<strong>{{ record.fechaSalida ? formatDate(record.fechaSalida) : '-' }}</strong></span><span>Duración<strong>{{ record.permanencia || '-' }}</strong></span></div></div>
        <div v-for="(visit, index) in record.historial" :key="index" class="exit-history__row"><span>{{ new Date(visit.entrada).toLocaleDateString('es-MX') }}</span><span class="exit-history__times">{{ formatDate(visit.entrada) }} · {{ visit.salida ? formatDate(visit.salida) : 'Activa' }}</span><span>{{ visit.permanencia }}</span></div>
      </section>
    </div>
    <p v-if="errorMessage" class="exit-form-error" role="alert">{{ errorMessage }}</p>
  </section>
</template>