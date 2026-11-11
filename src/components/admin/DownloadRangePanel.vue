<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Descargar registros' },
  description: { type: String, default: 'Selecciona un rango de fechas de registro.' },
  filePrefix: { type: String, default: 'registros' },
  loadRecords: { type: Function, required: true },
})

const emit = defineEmits(['range-change'])
const fromDate = ref('')
const toDate = ref('')
const activeDateField = ref('')
const calendarMonth = ref(new Date())
const exporting = ref(false)
const errorMessage = ref('')
const calendarTitle = computed(() => calendarMonth.value.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }))
const weekdayLabels = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const calendarDays = computed(() => {
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()
  return [...Array(offset).fill(null), ...Array.from({ length: totalDays }, (_, index) => index + 1)]
})
const hasDateRange = computed(() => Boolean(fromDate.value && toDate.value && !errorMessage.value))

function dateDisplay(value) {
  if (!value) return 'dd/mm/aaaa'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function clearDateRange() {
  fromDate.value = ''
  toDate.value = ''
  activeDateField.value = ''
  errorMessage.value = ''
  emit('range-change', {})
}

function openCalendar(field) {
  activeDateField.value = field
  const value = field === 'from' ? fromDate.value : toDate.value
  calendarMonth.value = value ? new Date(`${value}T00:00:00`) : new Date()
}

function changeCalendarMonth(amount) {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + amount, 1)
}

function selectDate(day) {
  if (!day) return
  const year = calendarMonth.value.getFullYear()
  const month = String(calendarMonth.value.getMonth() + 1).padStart(2, '0')
  const date = `${year}-${month}-${String(day).padStart(2, '0')}`
  if (activeDateField.value === 'to' && fromDate.value && date < fromDate.value) return
  if (activeDateField.value === 'from') fromDate.value = date
  else toDate.value = date
  activeDateField.value = ''
  validateDates()
  if (!errorMessage.value) emit('range-change', { desde: fromDate.value, hasta: toDate.value })
}

function validateDates() {
  errorMessage.value = fromDate.value && toDate.value && toDate.value < fromDate.value
    ? 'La fecha Hasta no puede ser anterior a la fecha Desde.'
    : ''
}

function isSelected(day) {
  if (!day) return false
  const year = calendarMonth.value.getFullYear()
  const month = String(calendarMonth.value.getMonth() + 1).padStart(2, '0')
  const date = `${year}-${month}-${String(day).padStart(2, '0')}`
  return date === (activeDateField.value === 'from' ? fromDate.value : toDate.value)
}

function isDisabled(day) {
  if (!day || activeDateField.value !== 'to' || !fromDate.value) return false
  const year = calendarMonth.value.getFullYear()
  const month = String(calendarMonth.value.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-${String(day).padStart(2, '0')}` < fromDate.value
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

function escapeHtml(value) {
  return String(value ?? '—').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('es-MX') : '—'
}

function exportValue(value, fallback = 'N/A') {
  return value === null || value === undefined || String(value).trim() === '' ? fallback : value
}

function typeLabel(value) {
  const normalized = (value || '').toLowerCase()
  if (normalized.includes('transport')) return 'Transportadora'
  if (normalized.includes('taxi')) return 'Taxi'
  if (normalized.includes('proveedor')) return 'Proveedor'
  return 'Colaborador'
}

function createPdf(records) {
  const text = value => String(value ?? '—').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '').replace(/([\\()])/g, '\\$1')
  const lines = [
    props.title.toUpperCase(),
    `Periodo: ${fromDate.value} a ${toDate.value}`,
    '',
    'PLACA | CONDUCTOR | EMPRESA | TIPO | ENTRADA | SALIDA',
    ...records.map(record => [
      exportValue(record.placa),
      exportValue(record.conductor),
      exportValue(record.empresa || record.transportadora),
      exportValue(typeLabel(record.tipoVisitante)),
      formatDate(record.fechaEntrada || record.entrada),
      formatDate(record.fechaSalida || record.salida),
    ].map(text).join(' | ')),
  ]
  const content = ['BT', '/F1 8 Tf', '40 800 Td', ...lines.flatMap((line, index) => [index ? '0 -14 Td' : '', `(${text(line)}) Tj`]), 'ET'].filter(Boolean).join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n` })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return pdf
}

async function exportRecords(format) {
  if (!hasDateRange.value || exporting.value) return
  validateDates()
  if (errorMessage.value) return
  exporting.value = true
  errorMessage.value = ''
  try {
    const records = await props.loadRecords({ desde: fromDate.value, hasta: toDate.value })
    if (format === 'excel') {
      const rows = records.map(record => `<tr><td>${escapeHtml(exportValue(record.placa))}</td><td>${escapeHtml(exportValue(record.conductor))}</td><td>${escapeHtml(exportValue(record.empresa || record.transportadora))}</td><td>${escapeHtml(exportValue(typeLabel(record.tipoVisitante)))}</td><td>${escapeHtml(formatDate(record.fechaEntrada || record.entrada))}</td><td>${escapeHtml(formatDate(record.fechaSalida || record.salida))}</td></tr>`).join('')
      downloadFile(`<table><thead><tr><th>Placa</th><th>Conductor</th><th>Empresa</th><th>Tipo</th><th>Entrada</th><th>Salida</th></tr></thead><tbody>${rows}</tbody></table>`, `${props.filePrefix}-${fromDate.value}-${toDate.value}.xls`, 'application/vnd.ms-excel;charset=utf-8')
    } else {
      downloadFile(createPdf(records), `${props.filePrefix}-${fromDate.value}-${toDate.value}.pdf`, 'application/pdf')
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible generar la descarga.'
  } finally {
    exporting.value = false
  }
}

function closeCalendarOnOutsideClick(event) {
  if (!event.target.closest('.admin-history-date-field')) activeDateField.value = ''
}

document.addEventListener('click', closeCalendarOnOutsideClick)
onBeforeUnmount(() => document.removeEventListener('click', closeCalendarOnOutsideClick))
</script>

<template>
  <section class="admin-history-panel admin-history-download">
    <div class="admin-history-download__copy">
      <span class="admin-history-download__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6zM15 3v5h5M9 13h6M9 17h6" /></svg></span>
      <div><h2>{{ title }}</h2><p>{{ description }}</p></div>
    </div>
    <div class="admin-history-date-fields">
      <div class="admin-history-date-field"><label>DESDE</label><button class="admin-history-date-input" :class="{ 'admin-history-date-input--placeholder': !fromDate }" type="button" @click="openCalendar('from')"><span>{{ dateDisplay(fromDate) }}</span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /></svg></button><div v-if="activeDateField === 'from'" class="admin-history-calendar"><header><button type="button" @click="changeCalendarMonth(-1)">‹</button><strong>{{ calendarTitle }}</strong><button type="button" @click="changeCalendarMonth(1)">›</button></header><div class="admin-history-calendar__weekdays"><span v-for="day in weekdayLabels" :key="day">{{ day }}</span></div><div class="admin-history-calendar__days"><button v-for="(day, index) in calendarDays" :key="`${day}-${index}`" type="button" :disabled="!day" :class="{ 'is-selected': isSelected(day) }" @click="selectDate(day)">{{ day || '' }}</button></div></div></div>
      <div class="admin-history-date-field"><label>HASTA</label><button class="admin-history-date-input" :class="{ 'admin-history-date-input--placeholder': !toDate }" type="button" @click="openCalendar('to')"><span>{{ dateDisplay(toDate) }}</span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /></svg></button><div v-if="activeDateField === 'to'" class="admin-history-calendar"><header><button type="button" @click="changeCalendarMonth(-1)">‹</button><strong>{{ calendarTitle }}</strong><button type="button" @click="changeCalendarMonth(1)">›</button></header><div class="admin-history-calendar__weekdays"><span v-for="day in weekdayLabels" :key="day">{{ day }}</span></div><div class="admin-history-calendar__days"><button v-for="(day, index) in calendarDays" :key="`${day}-${index}`" type="button" :disabled="!day || isDisabled(day)" :class="{ 'is-selected': isSelected(day) }" @click="selectDate(day)">{{ day || '' }}</button></div></div></div>
    </div>
    <div class="admin-history-download__actions"><button class="admin-history-download__clear" type="button" :disabled="(!fromDate && !toDate) || exporting" @click="clearDateRange">Limpiar</button><button type="button" :disabled="!hasDateRange || exporting" @click="exportRecords('pdf')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6zM15 3v5h5M9 13h6M9 17h4" /></svg> PDF</button><button type="button" :disabled="!hasDateRange || exporting" @click="exportRecords('excel')">▤ Excel</button></div>
    <p v-if="errorMessage" class="admin-history-feedback admin-history-feedback--error">{{ errorMessage }}</p>
  </section>
</template>
