<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getOperationalDashboard } from '@/services/api/entradas'
import { getExitDetails } from '@/services/api/salidas'
import VehicleDetailsModal from '@/components/operativo/salida/VehicleDetailsModal.vue'

const router = useRouter()
const dashboard = ref({ fecha: '', entradas: 0, salidas: 0, activos: 0, movimientos: [] })
const loading = ref(true)
const errorMessage = ref('')
const selectedRecord = ref(null)
const showAllMovements = ref(false)
let refreshTimer = null

function formatToday(value) {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace('.', '')
}

function visitorType(value) {
  const type = (value || '').toLowerCase()
  if (type.includes('transport')) return 'Transportadora'
  if (type.includes('proveedor')) return 'Proveedor'
  if (type.includes('taxi')) return 'Taxi'
  return 'Colaborador'
}

function movement(record) {
  return {
    ...record,
    type: visitorType(record.tipoVisitante),
    related: record.empresa || record.transportadora || '',
    isExit: record.salida,
    timestamp: record.fecha,
  }
}

function visibleMovements() {
  return showAllMovements.value ? dashboard.value.movimientos : dashboard.value.movimientos.slice(0, 5)
}

watch(() => dashboard.value.fecha, () => {
  showAllMovements.value = false
})

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }) : '—'
}

async function loadDashboard() {
  try {
    const response = await getOperationalDashboard()
    dashboard.value = response.data.data || dashboard.value
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar el panel operativo.'
  } finally {
    loading.value = false
  }
}

function goTo(name, query) {
  router.push({ name, query })
}

async function openMovement(record) {
  try {
    const response = await getExitDetails(record.idRegistro)
    const details = response.data.data
    selectedRecord.value = {
      ...details.detalle,
      historial: details.historial,
      totalVisitas: details.totalVisitas,
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar el detalle del vehículo.'
  }
}

onMounted(async () => {
  await loadDashboard()
  refreshTimer = window.setInterval(loadDashboard, 30000)
})

onBeforeUnmount(() => window.clearInterval(refreshTimer))
</script>

<template>
  <section class="operative-dashboard">
    <header class="operative-dashboard__header">
      <h1>Panel Operativo</h1>
      <p>{{ formatToday(dashboard.fecha) }}</p>
    </header>

    <p v-if="errorMessage" class="active-vehicles-error" role="alert">{{ errorMessage }}</p>
    <div v-if="loading" class="active-vehicles-state">Cargando panel...</div>

    <template v-else>
      <section class="operative-dashboard__stats" aria-label="Resumen del día">
        <article class="dashboard-stat dashboard-stat--entry">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg>
          <span><strong>Entradas hoy</strong><small>Movimientos de entrada</small></span><b>{{ dashboard.entradas }}</b>
        </article>
        <article class="dashboard-stat dashboard-stat--exit">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5M20 12H10M16 8l4 4-4 4" /></svg>
          <span><strong>Salidas hoy</strong><small>Movimientos de salida</small></span><b>{{ dashboard.salidas }}</b>
        </article>
        <article class="dashboard-stat dashboard-stat--active">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16V6a2 2 0 0 1 2-2h10l5 5v7M3 16h18M6 18.5a2 2 0 1 0 4 0M16 18.5a2 2 0 1 0 4 0" /></svg>
          <span><strong>Vehículos activos</strong><small>Dentro del hotel</small></span><b>{{ dashboard.activos }}</b>
        </article>
        <article class="dashboard-stat dashboard-stat--search" tabindex="0" role="link" @click="goTo('operativo-historial')" @keydown.enter="goTo('operativo-historial')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
          <span><strong>Buscar visitante</strong><small>Buscar por placa o conductor</small></span>
        </article>
      </section>

      <section class="operative-dashboard__actions">
        <button class="dashboard-action dashboard-action--entry" type="button" @click="goTo('operativo-entrada')">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg></span>
          <strong>Registrar<br />entrada</strong>
        </button>
        <button class="dashboard-action dashboard-action--exit" type="button" @click="goTo('operativo-salida', { mode: 'manual' })">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5M20 12H10M16 8l4 4-4 4" /></svg></span>
          <strong>Registrar<br />salida</strong>
        </button>
      </section>

      <section class="operative-dashboard__movements">
        <header><h2>Últimos movimientos</h2></header>
        <div v-if="!dashboard.movimientos?.length" class="dashboard-empty">No hay movimientos registrados hoy.</div>
        <article v-for="record in visibleMovements()" v-else :key="`${record.idRegistro}-${record.fecha}`" class="dashboard-movement" tabindex="0" @click="openMovement(record)" @keydown.enter="openMovement(record)">
          <svg v-if="movement(record).isExit" class="dashboard-movement__exit" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5M20 12H10M16 8l4 4-4 4" /></svg>
          <svg v-else class="dashboard-movement__entry" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg>
          <div><div class="dashboard-movement__title"><strong>{{ record.placa || 'Sin placa' }}</strong><em>{{ movement(record).type }}</em></div><span>{{ record.conductor || 'N/A' }}<template v-if="movement(record).related"> · {{ movement(record).related }}</template></span></div>
          <time><strong>{{ formatTime(movement(record).timestamp) }}</strong><span>{{ movement(record).isExit ? 'Salida' : 'Entrada' }}</span></time>
        </article>
        <button v-if="dashboard.movimientos?.length > 5" class="dashboard-more" type="button" @click="showAllMovements = !showAllMovements">
          {{ showAllMovements ? 'Ver menos' : 'Ver más' }} <span>{{ showAllMovements ? '⌃' : '›' }}</span>
        </button>
      </section>
    </template>
    <VehicleDetailsModal v-if="selectedRecord" :record="selectedRecord" @close="selectedRecord = null" />
  </section>
</template>
