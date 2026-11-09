<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getOperationalDashboard } from '@/services/api/entradas'

const router = useRouter()
const dashboard = ref({ fecha: '', entradas: 0, salidas: 0, activos: 0, movimientos: [] })
const loading = ref(true)
const errorMessage = ref('')
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

function goTo(name) {
  router.push({ name })
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
        <button class="dashboard-stat dashboard-stat--entry" type="button" @click="goTo('operativo-entrada')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg>
          <span><strong>Entradas hoy</strong><small>Movimientos de entrada</small></span><b>{{ dashboard.entradas }}</b>
        </button>
        <button class="dashboard-stat dashboard-stat--exit" type="button" @click="goTo('operativo-salida')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5M20 12H10M16 8l4 4-4 4" /></svg>
          <span><strong>Salidas hoy</strong><small>Movimientos de salida</small></span><b>{{ dashboard.salidas }}</b>
        </button>
        <button class="dashboard-stat dashboard-stat--active" type="button" @click="goTo('operativo-activos')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16V6a2 2 0 0 1 2-2h10l5 5v7M3 16h18M6 18.5a2 2 0 1 0 4 0M16 18.5a2 2 0 1 0 4 0" /></svg>
          <span><strong>Vehículos activos</strong><small>Dentro del hotel</small></span><b>{{ dashboard.activos }}</b>
        </button>
        <button class="dashboard-stat dashboard-stat--search" type="button" @click="goTo('operativo-historial')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
          <span><strong>Buscar visitante</strong><small>Placa o conductor</small></span><b>→</b>
        </button>
      </section>

      <section class="operative-dashboard__actions">
        <button class="dashboard-action dashboard-action--entry" type="button" @click="goTo('operativo-entrada')">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg></span>
          <strong>Registrar entrada</strong><small>Capturar un nuevo acceso</small>
        </button>
        <button class="dashboard-action dashboard-action--exit" type="button" @click="goTo('operativo-salida')">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5M20 12H10M16 8l4 4-4 4" /></svg></span>
          <strong>Registrar salida</strong><small>Cerrar un acceso activo</small>
        </button>
      </section>

      <section class="operative-dashboard__movements">
        <header><h2>Últimos movimientos</h2></header>
        <div v-if="!dashboard.movimientos?.length" class="dashboard-empty">No hay movimientos registrados hoy.</div>
        <article v-for="record in dashboard.movimientos" v-else :key="`${record.idRegistro}-${record.fecha}`" class="dashboard-movement">
          <svg :class="{ 'dashboard-movement__exit': movement(record).isExit }" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg>
          <div><strong>{{ record.placa || 'Sin placa' }}</strong><span><em>{{ movement(record).type }}</em>{{ record.conductor || 'N/A' }}<template v-if="movement(record).related"> · {{ movement(record).related }}</template></span></div>
          <time><strong>{{ formatTime(movement(record).timestamp) }}</strong><span>{{ movement(record).isExit ? 'Salida' : 'Entrada' }}</span></time>
        </article>
        <button class="dashboard-more" type="button" @click="goTo('operativo-historial')">Ver más <span>›</span></button>
      </section>
    </template>
  </section>
</template>
