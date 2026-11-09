<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VehicleDetailsModal from '@/components/operativo/salida/VehicleDetailsModal.vue'
import { getExitDetails, listAccessHistory } from '@/services/api/salidas'

const records = ref([])
const query = ref('')
const filtersOpen = ref(false)
const company = ref('')
const fromDate = ref('')
const toDate = ref('')
const visitorType = ref('')
const selectedRecord = ref(null)
const loading = ref(false)
const errorMessage = ref('')
let refreshTimer = null
let searchTimer = null

const visitorTypes = ['Colaborador', 'Proveedor', 'Transportadora', 'Taxi']
const totalRecords = computed(() => records.value.length)

function requestParams() {
  return { q: query.value.trim(), empresa: company.value.trim(), desde: fromDate.value, hasta: toDate.value }
}

function visitorCategory(value) {
  const normalized = (value || '').toLowerCase()
  if (normalized.includes('transport')) return 'Transportadora'
  if (normalized.includes('taxi')) return 'Taxi'
  if (normalized.includes('proveedor')) return 'Proveedor'
  if (normalized.includes('colaborador') || normalized.includes('general')) return 'Colaborador'
  return ''
}

function typeLabel(record) {
  const category = visitorCategory(record.tipoVisitante)
  if (category) return category
  return 'Colaborador'
}

function matchesVisitorType(record) {
  return !visitorType.value || visitorCategory(record.tipoVisitante) === visitorType.value
}

function filterRecords(data) {
  return data.filter(matchesVisitorType)
}

function iconPath(record) {
  const type = typeLabel(record)
  if (type === 'Taxi') return '<rect x="4" y="5" width="16" height="12" rx="2"/><path d="M7 17v2m10-2v2M4 12h16M8 5l1-2h6l1 2"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>'
  if (type === 'Proveedor') return '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'
  if (type === 'Colaborador') return '<circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.4 3-5 7-5s6.2 1.6 7 5"/>'
  return '<path d="M3 16V6a2 2 0 0 1 2-2h10l5 5v7M3 16h18M6 18.5a2 2 0 1 0 4 0M16 18.5a2 2 0 1 0 4 0"/>'
}

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }) : '—'
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
}

function shortObservations(value) {
  if (!value) return 'Sin observaciones'
  return value.length > 50 ? `${value.slice(0, 50).trim()}...` : value
}

async function loadHistory() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await listAccessHistory(requestParams())
    records.value = filterRecords(response.data.data || [])
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar el historial.'
  } finally {
    loading.value = false
  }
}

function onQueryInput() {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(loadHistory, 250)
}

function clearFilters() {
  company.value = ''
  fromDate.value = ''
  toDate.value = ''
  visitorType.value = ''
  loadHistory()
}

function openDatePicker(event) {
  if (typeof event.currentTarget.showPicker === 'function') {
    event.currentTarget.showPicker()
  }
}

async function openDetails(record) {
  try {
    const response = await getExitDetails(record.idRegistro)
    const details = response.data.data
    selectedRecord.value = { ...details.detalle, historial: details.historial, totalVisitas: details.totalVisitas }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar el detalle.'
  }
}

function handleRecordUpdated(updatedRecord) {
  const index = records.value.findIndex(record => record.idRegistro === updatedRecord.idRegistro)
  if (index === -1) return
  records.value[index] = { ...records.value[index], ...updatedRecord }
  selectedRecord.value = { ...selectedRecord.value, ...updatedRecord }
}

watch([company, fromDate, toDate, visitorType], loadHistory)

onMounted(async () => {
  await loadHistory()
  refreshTimer = window.setInterval(loadHistory, 180000)
})

onBeforeUnmount(() => {
  window.clearInterval(refreshTimer)
  window.clearTimeout(searchTimer)
  document.body.style.overflow = ''
})
</script>

<template>
  <section class="access-history-page">
    <header class="access-history-header">
      <h1>Historial de Accesos</h1>
      <p>{{ totalRecords }} {{ totalRecords === 1 ? 'registro' : 'registros' }}</p>
    </header>

    <section class="access-history-search">
      <label for="history-search">BUSCAR POR PLACA O CONDUCTOR</label>
      <div class="access-history-search__input">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
        <input id="history-search" v-model="query" type="search" placeholder="Placa o nombre..." @input="onQueryInput" />
        </div>
    </section>

    <section class="access-history-list">
      <button class="access-history-filter-toggle" type="button" :aria-expanded="filtersOpen" @click="filtersOpen = !filtersOpen">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" /></svg>
        <strong>FILTROS</strong>
        <svg class="access-history-filter-toggle__chevron" :class="{ 'access-history-filter-toggle__chevron--up': filtersOpen }" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      <form v-if="filtersOpen" class="access-history-filters" @submit.prevent>
        <label>EMPRESA<input v-model="company" type="search" placeholder="Empresa" /></label>
        <label>TIPO DE VISITANTE<select v-model="visitorType"><option value="">Todos</option><option v-for="type in visitorTypes" :key="type" :value="type">{{ type }}</option></select></label>
        <label>DESDE<input v-model="fromDate" type="date" @click="openDatePicker" /></label>
        <label>HASTA<input v-model="toDate" type="date" @click="openDatePicker" /></label>
        <div class="access-history-filters__actions">
          <button class="access-history-filter-clear" type="button" @click="clearFilters">Limpiar</button>
        </div>
      </form>

      <p v-if="errorMessage" class="active-vehicles-error" role="alert">{{ errorMessage }}</p>
      <div v-if="loading" class="active-vehicles-state">Cargando historial...</div>
      <div v-else-if="!records.length" class="active-vehicles-state">No hay registros con los criterios seleccionados.</div>
      <article v-for="record in records" v-else :key="record.idRegistro" class="access-history-card" tabindex="0" @click="openDetails(record)" @keydown.enter="openDetails(record)">
        <div class="access-history-card__top">
          <div class="access-history-card__identity"><h2>{{ record.placa || 'Sin placa' }}</h2><p><span>{{ record.conductor || 'N/A' }}</span><span v-if="record.empresa || record.transportadora"> · {{ record.empresa || record.transportadora }}</span></p></div>
          <span class="active-type-badge"><svg viewBox="0 0 24 24" aria-hidden="true" v-html="iconPath(record)" />{{ typeLabel(record) }}</span>
        </div>
        <div class="access-history-card__times">
          <span>Entrada<strong>{{ formatTime(record.fechaEntrada) }}</strong></span>
          <span>Salida<strong :class="{ 'access-history-card__exit--pending': !record.fechaSalida }">{{ formatTime(record.fechaSalida) }}</strong></span>
          <span>Duración<strong>{{ record.permanencia || '—' }}</strong></span>
        </div>
        <p class="access-history-card__date">{{ formatDate(record.fechaEntrada) }}</p>
        <p class="access-history-card__observations"><strong>Observaciones:</strong> {{ shortObservations(record.observaciones) }}</p>
      </article>
    </section>

    <VehicleDetailsModal v-if="selectedRecord" :record="selectedRecord" @close="selectedRecord = null" @registered="handleRecordUpdated" />
  </section>
</template>
