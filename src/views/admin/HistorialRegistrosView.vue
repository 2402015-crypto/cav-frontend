<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { listAccessHistory } from '@/services/api/salidas'

const records = ref([])
const query = ref('')
const visitorType = ref('')
const fromDate = ref('')
const toDate = ref('')
const loading = ref(false)
const exporting = ref(false)
const errorMessage = ref('')
const activeDateField = ref('')
const calendarMonth = ref(new Date())
let searchTimer = null

const visitorTypes = [
  { value: 'Colaborador', label: 'Colaborador' },
  { value: 'Proveedor', label: 'Proveedor' },
  { value: 'Transportadora', label: 'Transportadora' },
  { value: 'Taxi', label: 'Taxi' },
]

const totalRecords = computed(() => records.value.length)
const hasDateRange = computed(() => Boolean(fromDate.value && toDate.value && !errorMessage.value))
const visitsByPlate = computed(() => records.value.reduce((counts, record) => {
  const plate = record.placa || 'sin-placa'
  counts[plate] = (counts[plate] || 0) + 1
  return counts
}, {}))
const calendarTitle = computed(() => calendarMonth.value.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }))
const calendarDays = computed(() => {
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const offset = (firstDay + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()
  return [...Array(offset).fill(null), ...Array.from({ length: totalDays }, (_, index) => index + 1)]
})
const weekdayLabels = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

function requestParams() {
  return {
    q: query.value.trim(),
    desde: fromDate.value,
    hasta: toDate.value,
    tipo: visitorType.value,
  }
}

function visitorCategory(value) {
  const normalized = (value || '').toLowerCase()
  if (normalized.includes('transport')) return 'Transportadora'
  if (normalized.includes('taxi')) return 'Taxi'
  if (normalized.includes('proveedor')) return 'Proveedor'
  if (normalized.includes('colaborador') || normalized.includes('general')) return 'Colaborador'
  return 'Colaborador'
}

function iconPath(type) {
  if (type === 'Taxi') return '<rect x="4" y="5" width="16" height="12" rx="2"/><path d="M7 17v2m10-2v2M4 12h16M8 5l1-2h6l1 2"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>'
  if (type === 'Proveedor') return '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'
  if (type === 'Colaborador') return '<circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.4 3-5 7-5s6.2 1.6 7 5"/>'
  return '<path d="M3 16V6a2 2 0 0 1 2-2h10l5 5v7M3 16h18M6 18.5a2 2 0 1 0 4 0M16 18.5a2 2 0 1 0 4 0"/>'
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', ' ·')
}

function formatExportDate(value) {
  return value ? new Date(value).toLocaleString('es-MX') : '—'
}

function validateDates() {
  if (fromDate.value && toDate.value && toDate.value < fromDate.value) {
    errorMessage.value = 'La fecha Hasta no puede ser anterior a la fecha Desde.'
    return false
  }
  if (errorMessage.value === 'La fecha Hasta no puede ser anterior a la fecha Desde.') {
    errorMessage.value = ''
  }
  return true
}

async function loadHistory() {
  if (!validateDates()) {
    records.value = []
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const response = await listAccessHistory(requestParams())
    records.value = response.data.data || []
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

function onDateChange() {
  if (validateDates()) loadHistory()
  else records.value = []
}

function dateDisplay(value) {
  if (!value) return 'dd/mm/aaaa'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function openCalendar(field) {
  activeDateField.value = field
  const value = field === 'from' ? fromDate.value : toDate.value
  calendarMonth.value = value ? new Date(`${value}T00:00:00`) : new Date()
}

function changeCalendarMonth(amount) {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + amount, 1)
}

function selectCalendarDate(day) {
  if (!day) return
  const year = calendarMonth.value.getFullYear()
  const month = String(calendarMonth.value.getMonth() + 1).padStart(2, '0')
  const date = `${year}-${month}-${String(day).padStart(2, '0')}`
  if (activeDateField.value === 'to' && fromDate.value && date < fromDate.value) return
  if (activeDateField.value === 'from') fromDate.value = date
  else toDate.value = date
  activeDateField.value = ''
  onDateChange()
}

function isSelectedDate(day) {
  if (!day) return false
  const year = calendarMonth.value.getFullYear()
  const month = String(calendarMonth.value.getMonth() + 1).padStart(2, '0')
  const date = `${year}-${month}-${String(day).padStart(2, '0')}`
  return date === (activeDateField.value === 'from' ? fromDate.value : toDate.value)
}

function isDisabledDate(day) {
  if (!day || activeDateField.value !== 'to' || !fromDate.value) return false
  const year = calendarMonth.value.getFullYear()
  const month = String(calendarMonth.value.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-${String(day).padStart(2, '0')}` < fromDate.value
}

function closeCalendarOnOutsideClick(event) {
  if (!event.target.closest('.admin-history-date-field')) {
    activeDateField.value = ''
  }
}

function clearFilters() {
  query.value = ''
  visitorType.value = ''
  fromDate.value = ''
  toDate.value = ''
  activeDateField.value = ''
  loadHistory()
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function pdfText(value) {
  return String(value ?? '—')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/([\\()])/g, '\\$1')
}

function createPdf(recordsToExport) {
  const lines = [
    'HISTORIAL DE REGISTROS',
    `Periodo: ${fromDate.value} a ${toDate.value}`,
    '',
    'PLACA | CONDUCTOR | EMPRESA | TIPO | ENTRADA | SALIDA',
    ...recordsToExport.map(record => [
      record.placa || '—',
      record.conductor || '—',
      record.empresa || record.transportadora || '—',
      visitorCategory(record.tipoVisitante),
      formatExportDate(record.fechaEntrada),
      formatExportDate(record.fechaSalida),
    ].join(' | ')),
  ]
  const content = [
    'BT',
    '/F1 8 Tf',
    '40 800 Td',
    ...lines.flatMap((line, index) => [index ? '0 -14 Td' : '', `(${pdfText(line)}) Tj`]),
    'ET',
  ].filter(Boolean).join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return pdf
}

function escapeHtml(value) {
  return String(value ?? '—')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

async function recordsForExport() {
  const response = await listAccessHistory({ desde: fromDate.value, hasta: toDate.value })
  return response.data.data || []
}

async function downloadExcel() {
  if (!hasDateRange.value) return
  exporting.value = true
  errorMessage.value = ''
  try {
    const exportRecords = await recordsForExport()
    const rows = exportRecords.map(record => `<tr><td>${escapeHtml(record.placa)}</td><td>${escapeHtml(record.conductor)}</td><td>${escapeHtml(record.empresa || record.transportadora)}</td><td>${escapeHtml(visitorCategory(record.tipoVisitante))}</td><td>${escapeHtml(formatExportDate(record.fechaEntrada))}</td><td>${escapeHtml(formatExportDate(record.fechaSalida))}</td></tr>`).join('')
    const table = `<table><thead><tr><th>Placa</th><th>Conductor</th><th>Empresa o transportadora</th><th>Tipo</th><th>Entrada</th><th>Salida</th></tr></thead><tbody>${rows}</tbody></table>`
    downloadFile(`<html><meta charset="UTF-8"><body>${table}</body></html>`, `historial-registros-${fromDate.value}-${toDate.value}.xls`, 'application/vnd.ms-excel;charset=utf-8')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible generar el archivo de Excel.'
  } finally {
    exporting.value = false
  }
}

async function downloadPdf() {
  if (!hasDateRange.value) return
  exporting.value = true
  errorMessage.value = ''
  try {
    const exportRecords = await recordsForExport()
    downloadFile(createPdf(exportRecords), `historial-registros-${fromDate.value}-${toDate.value}.pdf`, 'application/pdf')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible generar el archivo PDF.'
  } finally {
    exporting.value = false
  }
}

watch(visitorType, loadHistory)

onMounted(() => {
  loadHistory()
  document.addEventListener('click', closeCalendarOnOutsideClick)
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
  document.removeEventListener('click', closeCalendarOnOutsideClick)
})
</script>

<template>
  <section class="admin-history-page">
    <header class="admin-history-header">
      <h1>Historial de registros</h1>
      <p>{{ totalRecords }} {{ totalRecords === 1 ? 'registro' : 'registros' }}</p>
    </header>

    <section class="admin-history-panel admin-history-filters">
      <div class="admin-history-panel__title">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" /></svg>
        <strong>FILTROS</strong>
      </div>
      <div class="admin-history-filter-grid">
        <label>BUSCAR<input v-model="query" type="search" placeholder="Placa, conductor o empresa" @input="onQueryInput" /></label>
        <label>TIPO DE VISITANTE<select v-model="visitorType"><option value="">Todos</option><option v-for="type in visitorTypes" :key="type.value" :value="type.value">{{ type.label }}</option></select></label>
      </div>
      <button class="admin-history-clear" type="button" @click="clearFilters">Limpiar filtros</button>
    </section>

    <section class="admin-history-panel admin-history-download">
      <div class="admin-history-download__copy">
        <span class="admin-history-download__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6zM15 3v5h5M9 13h6M9 17h6" /></svg></span>
        <div><h2>Descargar lista de vehículos registrados</h2><p>Selecciona un rango de fechas de registro.</p></div>
      </div>
      <div class="admin-history-date-fields">
        <div class="admin-history-date-field">
          <label for="history-from">DESDE</label>
          <button id="history-from" class="admin-history-date-input" type="button" :class="{ 'admin-history-date-input--placeholder': !fromDate }" @click="openCalendar('from')">
            <span>{{ dateDisplay(fromDate) }}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /></svg>
          </button>
          <div v-if="activeDateField === 'from'" class="admin-history-calendar" role="dialog" aria-label="Seleccionar fecha desde">
            <header><button type="button" aria-label="Mes anterior" @click="changeCalendarMonth(-1)">‹</button><strong>{{ calendarTitle }}</strong><button type="button" aria-label="Mes siguiente" @click="changeCalendarMonth(1)">›</button></header>
            <div class="admin-history-calendar__weekdays"><span v-for="day in weekdayLabels" :key="day">{{ day }}</span></div>
            <div class="admin-history-calendar__days"><button v-for="(day, index) in calendarDays" :key="`${day}-${index}`" type="button" :disabled="!day" :class="{ 'is-selected': isSelectedDate(day) }" @click="selectCalendarDate(day)">{{ day || '' }}</button></div>
          </div>
        </div>
        <div class="admin-history-date-field">
          <label for="history-to">HASTA</label>
          <button id="history-to" class="admin-history-date-input" type="button" :class="{ 'admin-history-date-input--placeholder': !toDate }" @click="openCalendar('to')">
            <span>{{ dateDisplay(toDate) }}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /></svg>
          </button>
          <div v-if="activeDateField === 'to'" class="admin-history-calendar" role="dialog" aria-label="Seleccionar fecha hasta">
            <header><button type="button" aria-label="Mes anterior" @click="changeCalendarMonth(-1)">‹</button><strong>{{ calendarTitle }}</strong><button type="button" aria-label="Mes siguiente" @click="changeCalendarMonth(1)">›</button></header>
            <div class="admin-history-calendar__weekdays"><span v-for="day in weekdayLabels" :key="day">{{ day }}</span></div>
            <div class="admin-history-calendar__days"><button v-for="(day, index) in calendarDays" :key="`${day}-${index}`" type="button" :disabled="!day || isDisabledDate(day)" :class="{ 'is-selected': isSelectedDate(day) }" @click="selectCalendarDate(day)">{{ day || '' }}</button></div>
          </div>
        </div>
      </div>
      <div class="admin-history-download__actions">
        <button type="button" :disabled="!hasDateRange || exporting" @click="downloadPdf"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6zM15 3v5h5M9 13h6M9 17h4" /></svg> PDF</button>
        <button type="button" :disabled="!hasDateRange || exporting" @click="downloadExcel"><span>▤</span> Excel</button>
      </div>
    </section>

    <p v-if="errorMessage" class="admin-history-feedback admin-history-feedback--error" role="alert">{{ errorMessage }}</p>
    <section class="admin-history-table-wrap">
      <table class="admin-history-table">
        <thead><tr><th>PLACA</th><th>CONDUCTOR</th><th>EMPRESA</th><th>TIPO</th><th>ENTRADA</th><th>SALIDA</th><th>VISITAS</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="admin-history-state">Cargando historial...</td></tr>
          <tr v-else-if="!records.length"><td colspan="7" class="admin-history-state">No hay registros con los criterios seleccionados.</td></tr>
          <tr v-for="record in records" v-else :key="record.idRegistro">
            <td class="admin-history-table__plate">{{ record.placa || '—' }}</td>
            <td class="admin-history-table__driver">{{ record.conductor || '—' }}</td>
            <td>{{ record.empresa || record.transportadora || '—' }}</td>
            <td><span class="admin-history-type"><svg viewBox="0 0 24 24" aria-hidden="true" v-html="iconPath(visitorCategory(record.tipoVisitante))" />{{ visitorCategory(record.tipoVisitante) }}</span></td>
            <td>{{ formatDateTime(record.fechaEntrada) }}</td>
            <td>{{ formatDateTime(record.fechaSalida) }}</td>
            <td class="admin-history-table__visits">{{ visitsByPlate[record.placa || 'sin-placa'] }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </section>
</template>
