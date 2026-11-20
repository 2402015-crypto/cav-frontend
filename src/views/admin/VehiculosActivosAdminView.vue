<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { listActiveExits } from '@/services/api/salidas'

const router = useRouter()
const records = ref([])
const query = ref('')
const visitorType = ref('')
const loading = ref(false)
const errorMessage = ref('')
let refreshTimer = null
let searchTimer = null

const visitorTypes = [
  { value: 'Colaborador', label: 'Colaborador' },
  { value: 'Proveedor', label: 'Proveedor' },
  { value: 'Transportadora', label: 'Transportadora' },
  { value: 'Taxi', label: 'Taxi' },
]

const filteredRecords = computed(() => {
  if (!visitorType.value) return records.value
  return records.value.filter(record => visitorCategory(record.tipoVisitante) === visitorType.value)
})

function visitorCategory(value) {
  const normalized = (value || '').toLowerCase()
  if (normalized.includes('transport')) return 'Transportadora'
  if (normalized.includes('taxi')) return 'Taxi'
  if (normalized.includes('proveedor')) return 'Proveedor'
  return 'Colaborador'
}

function iconPath(type) {
  if (type === 'Taxi') return '<rect x="4" y="5" width="16" height="12" rx="2"/><path d="M7 17v2m10-2v2M4 12h16M8 5l1-2h6l1 2"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>'
  if (type === 'Proveedor') return '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'
  if (type === 'Colaborador') return '<circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.4 3-5 7-5s6.2 1.6 7 5"/>'
  return '<path d="M3 16V6a2 2 0 0 1 2-2h10l5 5v7M3 16h18M6 18.5a2 2 0 1 0 4 0M16 18.5a2 2 0 1 0 4 0"/>'
}

function formatEntry(value) {
  return value ? new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', ' ·') : '—'
}

async function loadRecords() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await listActiveExits(query.value.trim())
    records.value = response.data.data || []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar los vehículos activos.'
  } finally {
    loading.value = false
  }
}

function onQueryInput() {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(loadRecords, 250)
}

function clearFilters() {
  query.value = ''
  visitorType.value = ''
  loadRecords()
}

function openRecord(record) {
  router.push({ name: 'admin-vehiculo-detalle', params: { id: record.idRegistro } })
}

watch(visitorType, loadRecords)

onMounted(() => {
  loadRecords()
  refreshTimer = window.setInterval(loadRecords, 30000)
})

onBeforeUnmount(() => {
  window.clearInterval(refreshTimer)
  window.clearTimeout(searchTimer)
})
</script>

<template>
  <section class="admin-history-page admin-active-vehicles-page">
    <header class="admin-history-header">
      <h1>Vehículos activos</h1>
      <p>{{ filteredRecords.length }} {{ filteredRecords.length === 1 ? 'vehículo activo' : 'vehículos activos' }} dentro del hotel</p>
    </header>

    <section class="admin-history-panel admin-history-filters">
      <div class="admin-history-panel__title">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" /></svg>
        <strong>FILTROS</strong>
      </div>
      <div class="admin-history-filter-grid admin-active-vehicles-filters">
        <label>BUSCAR<input v-model="query" type="search" placeholder="Placa, conductor o empresa" @input="onQueryInput" /></label>
        <div class="admin-active-vehicles-visitor">
          <label>TIPO DE VISITANTE<select v-model="visitorType"><option value="">Todos</option><option v-for="type in visitorTypes" :key="type.value" :value="type.value">{{ type.label }}</option></select></label>
          <button class="admin-history-clear" type="button" @click="clearFilters">Limpiar filtros</button>
        </div>
      </div>
    </section>

    <p v-if="errorMessage" class="admin-history-feedback admin-history-feedback--error" role="alert">{{ errorMessage }}</p>
    <section class="admin-history-table-wrap">
      <table class="admin-history-table admin-active-vehicles-table">
        <thead>
          <tr><th>PLACA</th><th>CONDUCTOR</th><th>EMPRESA</th><th>TIPO</th><th>ENTRADA</th><th>ESTATUS</th><th>VISITAS</th></tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="admin-history-state">Cargando vehículos activos...</td></tr>
          <tr v-else-if="!filteredRecords.length"><td colspan="7" class="admin-history-state">No hay vehículos activos.</td></tr>
          <tr v-for="record in filteredRecords" v-else :key="record.idRegistro" class="admin-history-table__row--clickable" tabindex="0" @click="openRecord(record)" @keydown.enter="openRecord(record)">
            <td class="admin-history-table__plate">{{ record.placa || '—' }}</td>
            <td class="admin-history-table__driver">{{ record.conductor || '—' }}</td>
            <td>{{ record.relacionado || '—' }}</td>
            <td><span class="admin-history-type"><svg viewBox="0 0 24 24" aria-hidden="true" v-html="iconPath(visitorCategory(record.tipoVisitante))" />{{ visitorCategory(record.tipoVisitante) }}</span></td>
            <td>{{ formatEntry(record.fechaEntrada) }}</td>
            <td><span class="admin-vehicle-status admin-vehicle-status--active"><i />Activo</span></td>
            <td class="admin-history-table__visits">{{ record.totalVisitas ?? 0 }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </section>
</template>
