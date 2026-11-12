<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DownloadRangePanel from '@/components/admin/DownloadRangePanel.vue'
import { getAuditRecord, listAuditRecords } from '@/services/api/auditoria'
import { listUsers } from '@/services/api/users'
import { getExitDetails } from '@/services/api/salidas'

const records = ref([])
const users = ref([])
const plate = ref('')
const selectedUser = ref('')
const selectedAction = ref('')
const fromDate = ref('')
const toDate = ref('')
const loading = ref(false)
const errorMessage = ref('')
const selectedRecord = ref(null)

const actionOptions = [
  { value: 'REGISTRO_ENTRADA', label: 'Entradas' },
  { value: 'REGISTRO_SALIDA', label: 'Salidas' },
  { value: 'GESTION_USUARIOS', label: 'Gestión de usuarios' },
  { value: 'OBSERVACIONES', label: 'Observaciones' },
  { value: 'EXPORTO_REPORTE', label: 'Reportes del sistema' },
]

const totalRecords = computed(() => records.value.length)

function params(extra = {}) {
  return {
    placa: plate.value.trim() || undefined,
    usuario: selectedUser.value || undefined,
    accion: selectedAction.value || undefined,
    desde: fromDate.value || undefined,
    hasta: toDate.value || undefined,
    ...extra,
  }
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'
}

function formatDay(value) {
  return value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
}

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'N/A'
}

function auditId(value) {
  return value === null || value === undefined ? 'N/A' : `RE-${String(value).padStart(4, '0')}`
}

function isDetailAction(record) {
  return ['REGISTRO_ENTRADA', 'REGISTRO_SALIDA', 'ANADIO_OBSERVACIONES', 'MODIFICO_OBSERVACIONES', 'ELIMINO_OBSERVACIONES'].includes(record.accion)
}

function actionTitle(record) {
  if (record.accion === 'REGISTRO_ENTRADA') return 'Entrada registrada'
  if (record.accion === 'REGISTRO_SALIDA') return 'Salida registrada'
  return 'Cambio de observaciones'
}

async function loadRecords(extra = {}) {
  const response = await listAuditRecords(params(extra))
  return response.data.data || []
}

async function search() {
  loading.value = true
  errorMessage.value = ''
  try {
    records.value = await loadRecords()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar la bitácora.'
  } finally {
    loading.value = false
  }
}

async function openRecord(record) {
  if (!isDetailAction(record)) return
  try {
    const response = await getAuditRecord(record.id)
    const audit = response.data.data
    if (audit.idRegistro) {
      const detailResponse = await getExitDetails(audit.idRegistro)
      selectedRecord.value = { ...audit, vehicle: detailResponse.data.data.detalle }
    } else {
      selectedRecord.value = audit
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible consultar el detalle.'
  }
}

watch(selectedRecord, (record) => {
  document.body.style.overflow = record ? 'hidden' : ''
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

function clearFilters() {
  plate.value = ''
  selectedUser.value = ''
  selectedAction.value = ''
  search()
}

function onRangeChange(range) {
  fromDate.value = range.desde || ''
  toDate.value = range.hasta || ''
  search()
}

onMounted(async () => {
  try {
    const response = await listUsers()
    users.value = response.data.data || []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible cargar los usuarios.'
  }
  search()
})
</script>

<template>
  <main class="admin-history-page admin-audit-page">
    <header class="admin-history-header">
      <div>
        <h1>Bitácora del sistema</h1>
      </div>
      <div class="admin-history-counter"><strong>{{ totalRecords }}</strong><span>acciones registradas</span></div>
    </header>

    <section class="admin-history-panel admin-audit-filters">
      <div class="admin-audit-filter">
        <label for="audit-plate">Buscar por placa</label>
        <input id="audit-plate" v-model="plate" type="search" placeholder="Número de placa" @keyup.enter="search">
      </div>
      <div class="admin-audit-filter">
        <label for="audit-user">Usuario</label>
        <select id="audit-user" v-model="selectedUser" @change="search">
          <option value="">Todos los usuarios</option>
          <option v-for="user in users" :key="user.id" :value="user.id">{{ user.nombreCompleto || user.usuario }}</option>
        </select>
      </div>
      <div class="admin-audit-filter">
        <label for="audit-action">Tipo de acción</label>
        <select id="audit-action" v-model="selectedAction" @change="search">
          <option value="">Todas las acciones</option>
          <option v-for="action in actionOptions" :key="action.value" :value="action.value">{{ action.label }}</option>
        </select>
      </div>
      <button class="admin-audit-search" type="button" @click="search">Buscar</button>
      <button class="admin-history-download__clear" type="button" @click="clearFilters">Limpiar</button>
    </section>

    <DownloadRangePanel
      title="Descargar bitácora"
      description="Selecciona un rango para consultar y exportar las acciones."
      file-prefix="bitacora"
      export-mode="audit"
      :load-records="(range) => loadRecords(range)"
      @range-change="onRangeChange"
    />

    <p v-if="errorMessage" class="admin-history-feedback admin-history-feedback--error">{{ errorMessage }}</p>
    <section class="admin-history-table-wrap admin-audit-table-panel">
      <div v-if="loading" class="admin-history-loading">Cargando bitácora...</div>
      <table v-else class="admin-history-table admin-audit-table">
        <thead><tr><th>ID</th><th>Usuario</th><th>Acción</th><th>Fecha</th><th>Hora</th></tr></thead>
        <tbody>
          <tr v-for="record in records" :key="record.id" :class="{ 'admin-history-table__row--clickable': isDetailAction(record) }" @click="openRecord(record)">
            <td>{{ auditId(record.id) }}</td>
            <td>{{ record.usuario || 'N/A' }}</td>
            <td>{{ record.descripcion || record.accion }}</td>
            <td>{{ formatDay(record.fecha) }}</td>
            <td>{{ formatTime(record.fecha) }}</td>
          </tr>
          <tr v-if="!records.length"><td colspan="5" class="admin-history-empty">No hay acciones para los filtros seleccionados.</td></tr>
        </tbody>
      </table>
    </section>

    <div v-if="selectedRecord" class="admin-audit-modal-backdrop" @click.self="selectedRecord = null">
      <section class="admin-audit-modal" role="dialog" aria-modal="true">
        <button class="admin-audit-modal__close" type="button" aria-label="Cerrar" @click="selectedRecord = null">×</button>
        <p class="admin-audit-modal__eyebrow">DETALLE DE LA ACCIÓN</p>
        <h2>{{ actionTitle(selectedRecord) }}</h2>
        <dl>
          <dt>Usuario</dt><dd>{{ selectedRecord.usuario || 'N/A' }}</dd>
          <dt>Acción realizada</dt><dd>{{ selectedRecord.descripcion || 'N/A' }}</dd>
          <dt>Fecha y hora</dt><dd>{{ formatDate(selectedRecord.fecha) }}</dd>
          <dt>Identificador</dt><dd>{{ auditId(selectedRecord.id) }}</dd>
        </dl>
        <div v-if="selectedRecord.vehicle" class="admin-audit-modal__vehicle">
          <div class="admin-audit-modal__vehicle-heading">
            <div>
              <p class="admin-audit-modal__eyebrow">DATOS REGISTRADOS DEL VEHÍCULO</p>
              <h3>{{ selectedRecord.vehicle.placa || selectedRecord.placa || 'N/A' }}</h3>
            </div>
            <span class="admin-history-type">{{ selectedRecord.vehicle.tipoVisitante || 'N/A' }}</span>
          </div>
          <div class="admin-audit-modal__vehicle-grid">
            <p><strong>NOMBRE COMPLETO</strong>{{ selectedRecord.vehicle.conductor || 'N/A' }}</p>
            <p><strong>EMPRESA / TRANSPORTADORA</strong>{{ selectedRecord.vehicle.empresa || selectedRecord.vehicle.transportadora || 'N/A' }}</p>
            <p><strong>TIPO DE REGISTRO</strong>{{ selectedRecord.vehicle.tipoVisitante || 'N/A' }}</p>
            <p><strong>MARCA</strong>{{ selectedRecord.vehicle.marca || 'N/A' }}</p>
            <p><strong>COLOR</strong>{{ selectedRecord.vehicle.color || 'N/A' }}</p>
            <p><strong>VILLA / DESTINO</strong>{{ selectedRecord.vehicle.villa || selectedRecord.vehicle.destino || 'N/A' }}</p>
          </div>
          <div class="admin-audit-modal__times">
            <p><strong>Entrada registrada</strong>{{ formatDate(selectedRecord.vehicle.fechaEntrada) }}</p>
            <p><strong>Salida registrada</strong>{{ selectedRecord.vehicle.fechaSalida ? formatDate(selectedRecord.vehicle.fechaSalida) : 'Sin salida' }}</p>
          </div>
          <div class="admin-audit-modal__observations">
            <strong>OBSERVACIONES</strong>
            <span>{{ selectedRecord.accion.includes('OBSERVACIONES') ? (selectedRecord.observacion || 'Sin observaciones') : (selectedRecord.vehicle.observaciones || 'Sin observaciones') }}</span>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
