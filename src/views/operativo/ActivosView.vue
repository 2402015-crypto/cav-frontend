<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import SalidaSuccessView from '@/components/operativo/salida/SalidaSuccessView.vue'
import VehicleDetailsModal from '@/components/operativo/salida/VehicleDetailsModal.vue'
import { getExitDetails, listActiveExits, registerExit } from '@/services/api/salidas'

const router = useRouter()
const records = ref([])
const selectedFilter = ref('Todos')
const selectedRecord = ref(null)
const confirmRecord = ref(null)
const successRecord = ref(null)
const errorMessage = ref('')
const loading = ref(false)
let refreshTimer = null
let clockTimer = null

const filters = ['Todos', 'Transportadora', 'Taxi', 'Proveedor', 'Colaborador']
const activeRecords = computed(() => {
  if (selectedFilter.value === 'Todos') return records.value
  return records.value.filter(record => typeLabel(record) === selectedFilter.value)
})

function typeLabel(record) {
  const value = (record.tipoVisitante || '').toLowerCase()
  if (value.includes('transport')) return 'Transportadora'
  if (value.includes('taxi')) return 'Taxi'
  if (value.includes('proveedor')) return 'Proveedor'
  return 'Colaborador'
}

function iconPath(record) {
  const type = typeLabel(record)
  if (type === 'Taxi') return '<rect x="4" y="5" width="16" height="12" rx="2"/><path d="M7 17v2m10-2v2M4 12h16M8 5l1-2h6l1 2"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>'
  if (type === 'Proveedor') return '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'
  if (type === 'Colaborador') return '<circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.4 3-5 7-5s6.2 1.6 7 5"/>'
  return '<path d="M3 16V6a2 2 0 0 1 2-2h10l5 5v7M3 16h18M6 18.5a2 2 0 1 0 4 0M16 18.5a2 2 0 1 0 4 0"/>'
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
}

function elapsed(record) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(record.fechaEntrada).getTime()) / 60000))
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function shortObservations(value) {
  if (!value) return ''
  return value.length > 42 ? `${value.slice(0, 42).trim()}...` : value
}

async function loadRecords() {
  try {
    const response = await listActiveExits()
    records.value = response.data.data || []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar los vehículos activos.'
  }
}

async function openDetails(record) {
  errorMessage.value = ''
  try {
    const response = await getExitDetails(record.idRegistro)
    const details = response.data.data
    selectedRecord.value = {
      ...details.detalle,
      historial: details.historial,
      totalVisitas: details.totalVisitas,
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar el detalle.'
  }
}

async function confirmExit() {
  if (!confirmRecord.value) return
  try {
    const response = await registerExit(confirmRecord.value.idRegistro, confirmRecord.value.observaciones)
    successRecord.value = response.data.data
    confirmRecord.value = null
    selectedRecord.value = null
    await loadRecords()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible registrar la salida.'
    confirmRecord.value = null
  }

}

function goToNewEntry() {
  router.push({ name: 'operativo-entrada' })
}

onMounted(async () => {
  loading.value = true
  await loadRecords()
  loading.value = false
  refreshTimer = window.setInterval(loadRecords, 30000)
  clockTimer = window.setInterval(() => {
    records.value = [...records.value]
  }, 60000)
})

onBeforeUnmount(() => {
  window.clearInterval(refreshTimer)
  window.clearInterval(clockTimer)
  document.body.style.overflow = ''
})
</script>

<template>
  <section class="active-vehicles-page">
    <template v-if="!successRecord">
      <header class="active-vehicles-header">
      <div>
        <h1>Vehículos Activos</h1>
        <p>{{ records.length }} {{ records.length === 1 ? 'vehículo activo' : 'vehículos activos' }} en el hotel</p>
      </div>
      <button class="active-new-entry" type="button" @click="goToNewEntry">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg>
        Nueva entrada
      </button>
      </header>

      <div class="active-filters" role="tablist" aria-label="Filtrar vehículos activos">
      <button v-for="filter in filters" :key="filter" type="button" role="tab"
        :aria-selected="selectedFilter === filter" :class="{ 'active-filters__selected': selectedFilter === filter }"
        @click="selectedFilter = filter">{{ filter }}</button>
      </div>

      <p v-if="errorMessage" class="active-vehicles-error" role="alert">{{ errorMessage }}</p>
      <div v-if="loading" class="active-vehicles-state">Cargando vehículos...</div>
      <div v-else-if="!activeRecords.length" class="active-vehicles-state">No hay vehículos activos en esta categoría.</div>
      <div v-else class="active-vehicles-list">
      <article v-for="record in activeRecords" :key="record.idRegistro" class="active-vehicle-card"
        tabindex="0" @click="openDetails(record)" @keydown.enter="openDetails(record)">
        <div class="active-vehicle-card__top">
          <div>
            <h2>{{ record.placa }}</h2>
            <p>{{ record.conductor }}</p>
          </div>
          <span class="active-type-badge">
            <svg viewBox="0 0 24 24" aria-hidden="true" v-html="iconPath(record)" />
            {{ typeLabel(record) }}
          </span>
        </div>
        <div class="active-vehicle-card__meta">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>{{ formatTime(record.fechaEntrada) }}</span>
          <strong>{{ elapsed(record) }}</strong>
          <span v-if="record.relacionado">{{ record.relacionado }}</span>
        </div>
        <p class="active-vehicle-card__observations"><strong>Observaciones:</strong> {{ shortObservations(record.observaciones) }}</p>
        <div class="active-vehicle-card__footer">
          <span class="active-status"><i /> Activo</span>
          <button type="button" class="active-exit-button" @click.stop="confirmRecord = record">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5M20 12H10M16 8l4 4-4 4" /></svg>
            Registrar salida
          </button>
        </div>
      </article>
      </div>

      <VehicleDetailsModal v-if="selectedRecord" :record="selectedRecord"
        @close="selectedRecord = null" />

      <ConfirmModal :open="Boolean(confirmRecord)" variant="operative" title="¿Registrar salida?"
        :message="confirmRecord ? `Se registrará la salida de ${confirmRecord.placa}.` : ''"
        confirm-label="Registrar salida" @cancel="confirmRecord = null" @confirm="confirmExit" />
    </template>

    <SalidaSuccessView v-if="successRecord" class="active-success-screen" :record="successRecord"
      @panel="successRecord = null" />
  </section>
</template>
