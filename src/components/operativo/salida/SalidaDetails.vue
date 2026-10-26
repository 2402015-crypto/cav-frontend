<script setup>
import { computed, ref } from 'vue'
import { registerExit } from '@/services/api/salidas'

const props = defineProps({ record: { type: Object, required: true } })
const emit = defineEmits(['registered', 'back'])
const observations = ref(props.record.observaciones || '')
const saving = ref(false)
const errorMessage = ref('')
const typeName = computed(() => (props.record.tipoVisitante || '').toLowerCase())
const isTransporter = computed(() => typeName.value.includes('transportadora'))
const isTaxi = computed(() => typeName.value.includes('taxi'))
const isProvider = computed(() => typeName.value.includes('proveedor'))

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
</script>

<template>
  <section class="exit-details-card">
    <strong class="exit-details-card__plate">{{ record.placa }}</strong>
    <div class="exit-details-grid">
      <div><small>Conductor</small><strong>{{ record.conductor || 'N/A' }}</strong></div>
      <div><small>Tipo</small><strong>{{ record.tipoVisitante || 'N/A' }}</strong></div>
      <div><small>Hora entrada</small><strong>{{ entryTime }}</strong></div>
      <div><small>Hora salida</small><strong>{{ exitTime }}</strong></div>
      <div><small>Empresa</small><strong>{{ record.empresa || record.transportadora || 'N/A' }}</strong></div>
      <div><small>Marca</small><strong>{{ record.marca || 'N/A' }}</strong></div>
      <div v-if="isTransporter"><small>Movimiento</small><strong>{{ record.tipoMovimiento || 'N/A' }}</strong></div>
      <div v-if="isTransporter"><small>Villa</small><strong>{{ record.villa || 'N/A' }}</strong></div>
      <div v-if="isTransporter"><small>Pasajeros</small><strong>{{ record.numeroPax ?? 'N/A' }}</strong></div>
      <div v-if="isTaxi"><small>Unidad</small><strong>{{ record.numeroUnidad || 'N/A' }}</strong></div>
      <div v-if="isTaxi"><small>Destino</small><strong>{{ record.destino || 'N/A' }}</strong></div>
      <div v-if="isProvider"><small>Área</small><strong>{{ record.area || 'N/A' }}</strong></div>
      <div v-if="!isTaxi && !isTransporter && !isProvider"><small>Área</small><strong>{{ record.area || 'N/A' }}</strong></div>
      <label class="exit-observations">OBSERVACIONES<textarea v-model="observations" placeholder="Notas adicionales" /></label>
    </div>
    <section v-if="record.historial?.length" class="exit-history">
      <header><strong>Historial de visitas</strong><span>{{ record.totalVisitas }} total</span></header>
      <div v-for="(visit, index) in record.historial" :key="index" class="exit-history__row"><span>{{ new Date(visit.entrada).toLocaleDateString('es-MX') }}</span><span class="exit-history__times">{{ formatDate(visit.entrada) }} · {{ visit.salida ? formatDate(visit.salida) : 'Activa' }}</span><span>{{ visit.permanencia }}</span></div>
    </section>
    <p v-if="errorMessage" class="exit-form-error" role="alert">{{ errorMessage }}</p>
    <div class="exit-details-actions"><button type="button" @click="$emit('back')">‹&nbsp; Retomar</button><button type="button" :disabled="saving" @click="submit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg>{{ saving ? 'Registrando...' : 'Registrar Salida · ' + exitTime }}</button></div>
  </section>
</template>