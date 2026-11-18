<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { getAdminDashboard } from '@/services/api/dashboardAdmin'

const period = ref(7)
const dashboard = ref(null)
const loading = ref(true)
const error = ref('')
let refreshTimer

const summary = computed(() => dashboard.value?.resumen || {})
const entries = computed(() => dashboard.value?.entradas || [])
const ocr = computed(() => dashboard.value?.ocr || [])
const providers = computed(() => dashboard.value?.proveedores || [])
const transporters = computed(() => dashboard.value?.transportadoras || [])

const dateLabel = computed(() => {
  const date = dashboard.value?.fecha ? new Date(`${dashboard.value.fecha}T12:00:00`) : new Date()
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
})

const lineOptions = (color, max = null) => ({
  chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: true, speed: 500 } },
  colors: [color],
  stroke: { curve: 'smooth', width: 3 },
  fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
  dataLabels: { enabled: false },
  grid: { borderColor: '#4b4642', strokeDashArray: 4 },
  xaxis: { categories: entries.value.map((point) => point.etiqueta), labels: { style: { colors: '#8f8984' } }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { max, labels: { style: { colors: '#8f8984' } } },
  tooltip: { theme: 'dark' },
})

const entriesSeries = computed(() => [{ name: 'Accesos', data: entries.value.map((point) => Number(point.valor)) }])
const ocrSeries = computed(() => [{ name: 'Precisión', data: ocr.value.map((point) => Number(point.valor)) }])
const entriesOptions = computed(() => ({ ...lineOptions('#8fbead'), xaxis: { ...lineOptions('#8fbead').xaxis, categories: entries.value.map((point) => point.etiqueta) } }))
const ocrOptions = computed(() => ({ ...lineOptions('#69a4ae', 100), xaxis: { ...lineOptions('#69a4ae').xaxis, categories: ocr.value.map((point) => point.etiqueta) }, yaxis: { min: 0, max: 100, labels: { style: { colors: '#8f8984' } } } }))

const barOptions = (color) => ({
  chart: { type: 'bar', toolbar: { show: false }, animations: { enabled: true, speed: 500 } },
  colors: [color],
  plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '42%' } },
  dataLabels: { enabled: false },
  grid: { borderColor: '#4b4642', strokeDashArray: 4 },
  xaxis: { labels: { style: { colors: '#8f8984' } }, categories: providers.value.map((item) => item.nombre) },
  yaxis: { labels: { style: { colors: '#adabaa' } } },
  tooltip: { theme: 'dark' },
})

const providerSeries = computed(() => [{ name: 'Accesos', data: providers.value.map((item) => item.accesos) }])
const providerOptions = computed(() => ({
  ...barOptions('#c6a463'),
  xaxis: {
    ...barOptions('#c6a463').xaxis,
    min: 0,
    max: 35,
    tickAmount: 4,
  },
}))
const transportOptions = computed(() => ({
  chart: { type: 'donut', toolbar: { show: false }, animations: { enabled: true, speed: 500 } },
  labels: transporters.value.map((item) => item.nombre),
  colors: ['#aa95bd', '#8dc1c9', '#c6a463', '#8fbead', '#b48f9a', '#7c9fb0'],
  dataLabels: { enabled: true, style: { colors: ['#f6f1e7'] } },
  legend: { position: 'bottom', labels: { colors: '#adabaa' } },
  plotOptions: { pie: { donut: { size: '66%' } } },
  tooltip: { theme: 'dark' },
}))

async function loadDashboard() {
  loading.value = !dashboard.value
  error.value = ''
  try {
    dashboard.value = (await getAdminDashboard(period.value)).data.data
  } catch {
    error.value = 'No fue posible consultar las métricas administrativas.'
  } finally {
    loading.value = false
  }
}

function startRefresh() {
  refreshTimer = window.setInterval(loadDashboard, 30000)
}

watch(period, loadDashboard)
onMounted(() => {
  loadDashboard()
  startRefresh()
})
onBeforeUnmount(() => window.clearInterval(refreshTimer))
</script>

<template>
  <section class="admin-dashboard">
    <header class="admin-dashboard__header">
      <div>
        <p class="admin-dashboard__eyebrow"><span /> OPERACIÓN EN TIEMPO REAL</p>
        <h1>Panel administrativo</h1>
        <p class="admin-dashboard__date">{{ dateLabel }} · Chablé Maroma</p>
      </div>
    </header>

    <p v-if="error" class="admin-dashboard__error">{{ error }}</p>
    <div v-if="loading && !dashboard" class="admin-dashboard__loading">Cargando métricas...</div>

    <template v-else>
      <section class="admin-dashboard__summary" aria-label="Indicadores del día">
        <article class="admin-metric admin-metric--lead">
          <div class="admin-metric__icon admin-metric__icon--jade">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h12v10H3zM15 10h3l3 3v4h-6zM7 17a2 2 0 1 1-4 0M18 17a2 2 0 1 1-4 0" /></svg>
          </div><span class="admin-metric__chevron">›</span>
          <p>Registros realizados en el día</p><small>Entradas y salidas registradas</small>
          <strong>{{ summary.registros ?? 0 }}</strong>
        </article>
        <article v-for="metric in [
          ['vehiculosActivos', 'Vehículos activos', 'Dentro de las instalaciones', 'clock'],
          ['entradas', 'Entradas hoy', 'Accesos registrados', 'entry'],
          ['salidas', 'Salidas hoy', 'Movimientos completados', 'exit'],
          ['empresasTransportadoras', 'Visitas de empresas / compañías', 'Registros únicos', 'document'],
          ['precisionOcr', 'Precisión OCR', 'Reconocimiento de placas', 'scan'],
          ['registrosPorUsuario', 'Registros por usuario', 'Promedio diario', 'users'],
        ]" :key="metric[0]" class="admin-metric">
          <div class="admin-metric__icon" :class="`admin-metric__icon--${metric[3]}`">
            <svg v-if="metric[3] === 'clock'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></svg>
            <svg v-else-if="metric[3] === 'entry'" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h12M12 8l4 4-4 4M16 5h4v14h-4" /></svg>
            <svg v-else-if="metric[3] === 'exit'" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H8M12 8l-4 4 4 4M8 5H4v14h4" /></svg>
            <svg v-else-if="metric[3] === 'document'" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6zM9 11h6M9 15h6" /></svg>
            <svg v-else-if="metric[3] === 'scan'" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M8 20H5a1 1 0 0 1-1-1v-3M16 20h3a1 1 0 0 0 1-1v-3" /></svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.7-3 2.5-4.5 5.5-4.5s4.8 1.5 5.5 4.5M16 11a3 3 0 1 0 0-6M16 14.5c2.5.1 4 1.6 4.5 4.5" /></svg>
          </div>
          <strong>{{ summary[metric[0]] ?? 0 }}{{ metric[0] === 'precisionOcr' ? '%' : '' }}</strong>
          <p>{{ metric[1] }}</p><small>{{ metric[2] }}</small>
        </article>
      </section>

      <div class="admin-dashboard__section-heading">
        <div><p class="admin-dashboard__eyebrow">ANALYTICS CORE</p><h2>Inteligencia operativa</h2><p>Explora el comportamiento de accesos y reconocimiento vehicular.</p></div>
        <div class="admin-period" role="group" aria-label="Periodo de consulta">
          <button :class="{ active: period === 7 }" @click="period = 7">7 días</button>
          <button :class="{ active: period === 30 }" @click="period = 30">30 días</button>
        </div>
      </div>

      <section class="admin-dashboard__charts">
        <article class="admin-chart-card admin-chart-card--wide">
          <div class="admin-chart-card__heading"><div class="admin-chart-card__title"><span class="admin-chart-card__icon admin-chart-card__icon--jade"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h12M12 8l4 4-4 4M16 5h4v14h-4" /></svg></span><div><p class="admin-chart-card__tag">DATA/01 <span>— EN VIVO</span></p><h3>Entradas por día</h3><p>Actividad acumulada · últimos {{ period }} días</p></div></div><strong>{{ summary.entradas ?? 0 }}</strong></div>
          <VueApexCharts type="area" height="270" :options="entriesOptions" :series="entriesSeries" />
        </article>
        <article class="admin-chart-card">
          <div class="admin-chart-card__heading"><div class="admin-chart-card__title"><span class="admin-chart-card__icon admin-chart-card__icon--cyan"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M8 20H5a1 1 0 0 1-1-1v-3M16 20h3a1 1 0 0 0 1-1v-3" /></svg></span><div><p class="admin-chart-card__tag admin-chart-card__tag--cyan">DATA/02 <span>— EN VIVO</span></p><h3>Desempeño OCR</h3><p>Precisión del reconocimiento de placas</p></div></div><strong>{{ summary.precisionOcr ?? 0 }}%</strong></div>
          <VueApexCharts type="area" height="270" :options="ocrOptions" :series="ocrSeries" />
        </article>
        <article class="admin-chart-card admin-chart-card--providers">
          <div class="admin-chart-card__heading"><div class="admin-chart-card__title"><span class="admin-chart-card__icon admin-chart-card__icon--gold"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6zM9 11h6M9 15h6" /></svg></span><div><p class="admin-chart-card__tag admin-chart-card__tag--gold">DATA/03 <span>— EN VIVO</span></p><h3>Proveedores frecuentes</h3><p>Proveedores con más de 3 visitas</p></div></div><strong>{{ providers.length }}</strong></div>
          <div class="admin-chart-card__provider-chart">
            <VueApexCharts type="bar" height="270" :options="providerOptions" :series="providerSeries" />
          </div>
        </article>
        <article class="admin-chart-card">
          <div class="admin-chart-card__heading"><div class="admin-chart-card__title"><span class="admin-chart-card__icon admin-chart-card__icon--lilac"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h12v10H3zM15 10h3l3 3v4h-6zM7 17a2 2 0 1 1-4 0M18 17a2 2 0 1 1-4 0" /></svg></span><div><p class="admin-chart-card__tag admin-chart-card__tag--lilac">DATA/04 <span>— EN VIVO</span></p><h3>Transportadoras frecuentes</h3><p>Participación por cantidad de accesos</p></div></div><strong>{{ transporters.length }}</strong></div>
          <VueApexCharts type="donut" height="270" :options="transportOptions" :series="transporters.map((item) => item.accesos)" />
        </article>
      </section>
    </template>
  </section>
</template>
