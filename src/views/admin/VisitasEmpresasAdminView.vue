<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import DownloadRangePanel from '@/components/admin/DownloadRangePanel.vue'
import { listAccessHistory } from '@/services/api/salidas'

const router = useRouter()
const records = ref([])
const query = ref('')
const visitorType = ref('')
const fromDate = ref('')
const toDate = ref('')
const loading = ref(false)
const errorMessage = ref('')
let refreshTimer = null
let searchTimer = null

const visitorTypes = [
  { value: 'Proveedor', label: 'Empresas proveedoras' },
  { value: 'Transportadora', label: 'Transportadoras' },
]

const filteredRecords = computed(() => records.value.filter(record => {
  const type = visitorCategory(record.tipoVisitante)
  return type === 'Proveedor' || type === 'Transportadora'
}).filter(record => {
  if (!visitorType.value) return true
  return visitorCategory(record.tipoVisitante) === visitorType.value
}))

function visitorCategory(value) {
  const normalized = (value || '').toLowerCase()
  if (normalized.includes('transport')) return 'Transportadora'
  if (normalized.includes('proveedor')) return 'Proveedor'
  return ''
}

function formatDateTime(value) {
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
    const response = await listAccessHistory({
      q: query.value.trim(),
      tipo: visitorType.value,
      desde: fromDate.value,
      hasta: toDate.value,
    })
    records.value = response.data.data || []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar las visitas.'
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
  fromDate.value = ''
  toDate.value = ''
  loadRecords()
}

function onRangeChange(range) {
  fromDate.value = range.desde || ''
  toDate.value = range.hasta || ''
  loadRecords()
}

function openRecord(record) {
  router.push({ name: 'admin-vehiculo-detalle', params: { id: record.idRegistro } })
}

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
  <section class="admin-history-page admin-company-visits-page">
    <header class="admin-history-header">
      <h1>Visitas de empresas y compañías</h1>
      <p>{{ filteredRecords.length }} {{ filteredRecords.length === 1 ? 'registro' : 'registros' }}</p>
    </header>

    <section class="admin-history-panel admin-history-filters">
      <div class="admin-history-panel__title">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" /></svg>
        <strong>FILTROS</strong>
      </div>
      <div class="admin-history-filter-grid admin-company-visits-filters">
        <label>BUSCAR<input v-model="query" type="search" placeholder="Placa, conductor o empresa" @input="onQueryInput" /></label>
        <div class="admin-company-visits-visitor">
          <label>TIPO DE VISITANTE<select v-model="visitorType" @change="loadRecords"><option value="">Todos</option><option v-for="type in visitorTypes" :key="type.value" :value="type.value">{{ type.label }}</option></select></label>
          <button class="admin-history-clear" type="button" @click="clearFilters">Limpiar filtros</button>
        </div>
      </div>
    </section>

    <DownloadRangePanel
      title="Descargar visitas de empresas"
      description="Selecciona un rango de fechas."
      file-prefix="visitas-empresas"
      :load-records="(range) => listAccessHistory({ ...range, q: query, tipo: visitorType }).then(response => (response.data.data || []).filter(record => ['Proveedor', 'Transportadora'].includes(visitorCategory(record.tipoVisitante))))"
      @range-change="onRangeChange"
    />

    <p v-if="errorMessage" class="admin-history-feedback admin-history-feedback--error">{{ errorMessage }}</p>
    <section class="admin-history-table-wrap">
      <table class="admin-history-table admin-company-visits-table">
        <thead><tr><th>PLACA</th><th>CONDUCTOR</th><th>EMPRESA</th><th>TIPO</th><th>ENTRADA</th><th>SALIDA</th><th>VISITAS</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="admin-history-state">Cargando visitas...</td></tr>
          <tr v-else-if="!filteredRecords.length"><td colspan="7" class="admin-history-state">No hay visitas de empresas o transportadoras.</td></tr>
          <tr v-for="record in filteredRecords" v-else :key="record.idRegistro" class="admin-history-table__row--clickable" tabindex="0" @click="openRecord(record)" @keydown.enter="openRecord(record)">
            <td class="admin-history-table__plate">{{ record.placa || '—' }}</td>
            <td class="admin-history-table__driver"><span class="admin-history-driver-text">{{ record.conductor || '—' }}</span></td>
            <td>{{ record.empresa || record.transportadora || '—' }}</td>
            <td><span class="admin-history-type">{{ visitorCategory(record.tipoVisitante) }}</span></td>
            <td>{{ formatDateTime(record.fechaEntrada) }}</td>
            <td>{{ formatDateTime(record.fechaSalida) }}</td>
            <td class="admin-history-table__visits">{{ record.totalVisitas ?? 0 }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </section>
</template>
