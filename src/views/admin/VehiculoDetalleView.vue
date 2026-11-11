<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DownloadRangePanel from '@/components/admin/DownloadRangePanel.vue'
import { getExitDetails, listAccessHistory } from '@/services/api/salidas'

const route = useRoute()
const router = useRouter()
const detail = ref(null)
const accessRecords = ref([])
const loading = ref(true)
const errorMessage = ref('')

const typeLabel = computed(() => {
  const value = (detail.value?.tipoVisitante || '').toLowerCase()
  if (value.includes('transport')) return 'Transportadora'
  if (value.includes('taxi')) return 'Taxi'
  if (value.includes('proveedor')) return 'Proveedor'
  return 'Colaborador'
})

const isTransporter = computed(() => typeLabel.value === 'Transportadora')
const isTaxi = computed(() => typeLabel.value === 'Taxi')
const isProvider = computed(() => typeLabel.value === 'Proveedor')

function iconPath(type) {
  if (type === 'Taxi') return '<rect x="4" y="5" width="16" height="12" rx="2"/><path d="M7 17v2m10-2v2M4 12h16M8 5l1-2h6l1 2"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>'
  if (type === 'Proveedor') return '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'
  if (type === 'Colaborador') return '<circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.4 3-5 7-5s6.2 1.6 7 5"/>'
  return '<path d="M3 16V6a2 2 0 0 1 2-2h10l5 5v7M3 16h18M6 18.5a2 2 0 1 0 4 0M16 18.5a2 2 0 1 0 4 0"/>'
}

function valueOrNA(value) {
  return value === null || value === undefined || value === '' ? 'N/A' : value
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }) : '—'
}

async function loadAccessRecords(filters = {}) {
  const response = await listAccessHistory({ q: detail.value.placa, ...filters })
  return response.data.data || []
}

async function refreshAccessRecords(filters = {}) {
  try {
    accessRecords.value = await loadAccessRecords(filters)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar los accesos del vehículo.'
  }
}

async function loadDetail() {
  loading.value = true
  try {
    const response = await getExitDetails(Number(route.params.id))
    detail.value = response.data.data.detalle
    await refreshAccessRecords()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar el detalle del vehículo.'
  } finally {
    loading.value = false
  }
}

onMounted(loadDetail)
</script>

<template>
  <section class="admin-vehicle-detail-page">
    <header class="admin-vehicle-detail-header">
      <div><h1>{{ detail?.placa || 'Detalle del vehículo' }}</h1><p>Detalle completo del vehículo</p></div>
      <button type="button" class="admin-vehicle-back" @click="router.back()">‹ <span>Volver</span></button>
    </header>

    <p v-if="loading" class="admin-history-feedback admin-history-feedback--loading">Cargando detalle...</p>
    <p v-else-if="errorMessage && !detail" class="admin-history-feedback admin-history-feedback--error">{{ errorMessage }}</p>

    <template v-else-if="detail">
      <section class="admin-vehicle-summary">
        <div class="admin-vehicle-summary__identity">
          <span class="admin-vehicle-summary__icon"><svg viewBox="0 0 24 24" aria-hidden="true" v-html="iconPath(typeLabel)" /></span>
          <div><h2>{{ valueOrNA(detail.placa) }}</h2><span class="admin-history-type"><svg viewBox="0 0 24 24" aria-hidden="true" v-html="iconPath(typeLabel)" />{{ typeLabel }}</span></div>
        </div>
        <div class="admin-vehicle-summary__fields">
          <span>CONDUCTOR<strong>{{ valueOrNA(detail.conductor) }}</strong></span>
          <span v-if="isProvider || isTransporter">EMPRESA / TRANSPORTADORA<strong>{{ valueOrNA(detail.empresa || detail.transportadora) }}</strong></span>
          <span>TIPO<strong>{{ typeLabel }}</strong></span>
          <span v-if="isTransporter">MARCA<strong>{{ valueOrNA(detail.marca) }}</strong></span>
          <span v-if="isTransporter">TIPO DE MOVIMIENTO<strong>{{ valueOrNA(detail.tipoMovimiento) }}</strong></span>
          <span v-if="isTransporter">VILLA<strong>{{ valueOrNA(detail.villa) }}</strong></span>
          <span v-if="isTransporter">PASAJEROS (PAX)<strong>{{ valueOrNA(detail.numeroPax) }}</strong></span>
          <span v-else-if="isTaxi">MARCA<strong>{{ valueOrNA(detail.marca) }}</strong></span>
          <span v-if="isTaxi">NÚMERO DE UNIDAD<strong>{{ valueOrNA(detail.numeroUnidad) }}</strong></span>
          <span v-if="isTaxi">VILLA<strong>{{ valueOrNA(detail.villa) }}</strong></span>
          <span v-if="isTaxi">DESTINO<strong>{{ valueOrNA(detail.destino) }}</strong></span>
          <span v-if="isProvider">MARCA<strong>{{ valueOrNA(detail.marca) }}</strong></span>
          <span v-if="isProvider">COLOR<strong>{{ valueOrNA(detail.color) }}</strong></span>
          <span v-if="isProvider">ÁREA DE DESTINO<strong>{{ valueOrNA(detail.area) }}</strong></span>
          <span v-if="!isTransporter && !isTaxi && !isProvider">DEPARTAMENTO<strong>{{ valueOrNA(detail.area) }}</strong></span>
          <span v-if="!isTransporter && !isTaxi && !isProvider">MARCA<strong>{{ valueOrNA(detail.marca) }}</strong></span>
          <span v-if="!isTransporter && !isTaxi && !isProvider">COLOR<strong>{{ valueOrNA(detail.color) }}</strong></span>
          <span class="admin-vehicle-summary__observations">OBSERVACIONES<strong>{{ valueOrNA(detail.observaciones || 'Sin observaciones') }}</strong></span>
        </div>
      </section>

      <DownloadRangePanel
        :title="`Descargar accesos de ${valueOrNA(detail.placa)}`"
        :description="`Incluye las entradas y salidas registradas para este vehículo.`"
        :file-prefix="`accesos-${detail.placa || 'vehiculo'}`"
        :load-records="loadAccessRecords"
        @range-change="refreshAccessRecords"
      />

      <section class="admin-vehicle-access-panel">
        <header><h2>Entradas y salidas registradas por día</h2></header>
        <table><thead><tr><th>FECHA</th><th>ENTRADA</th><th>SALIDA</th><th>PERMANENCIA</th><th>ESTADO</th></tr></thead>
          <tbody>
            <tr v-if="!accessRecords.length"><td colspan="5" class="admin-history-state">No hay accesos registrados para este vehículo.</td></tr>
            <tr v-for="record in accessRecords" v-else :key="record.idRegistro">
              <td>{{ formatDate(record.fechaEntrada) }}</td><td class="admin-vehicle-access__entry">{{ formatTime(record.fechaEntrada) }}</td><td class="admin-vehicle-access__exit">{{ formatTime(record.fechaSalida) }}</td><td>{{ record.permanencia || '—' }}</td>
              <td><span class="admin-vehicle-status" :class="{ 'admin-vehicle-status--active': !record.fechaSalida }"><i />{{ record.fechaSalida ? 'Inactivo' : 'Activo' }}</span></td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </section>
</template>
