<script setup>
import { onMounted, ref, watch } from 'vue'
import { getExitDetails, listActiveExits } from '@/services/api/salidas'

const emit = defineEmits(['found'])
const query = ref('')
const records = ref([])
const loading = ref(true)
const selecting = ref(null)
const selectedId = ref(null)
const errorMessage = ref('')
let searchTimer = null

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await listActiveExits(query.value.trim())
    records.value = response.data.data || []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible cargar los vehículos activos.'
  } finally {
    loading.value = false
  }
}

function selectRecord(record) {
  selectedId.value = record.idRegistro
}

async function openDetails(record) {
  selecting.value = record.idRegistro
  try {
    const response = await getExitDetails(record.idRegistro)
    emit('found', { ...response.data.data.detalle, historial: response.data.data.historial, totalVisitas: response.data.data.totalVisitas })
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible cargar el detalle.'
  } finally {
    selecting.value = null
  }
}

async function registerSelected() {
  const record = records.value.find((item) => item.idRegistro === selectedId.value)
  if (record) await openDetails(record)
}

watch(query, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(load, 250)
})

onMounted(load)
</script>

<template>
  <section class="exit-active-panel">
    <label for="active-exit-search">BUSCAR POR PLACA O CONDUCTOR</label>
    <input id="active-exit-search" v-model="query" type="search" placeholder="Placa o nombre..." />
    <p v-if="errorMessage" class="exit-form-error" role="alert">{{ errorMessage }}</p>
    <button v-if="selectedId" class="exit-register-selected" type="button" @click="registerSelected">&nbsp; Registrar
      Salida · {{ new Date().toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }) }}</button>
    <p v-if="loading" class="exit-active-status">Cargando vehículos activos...</p>
    <p v-else-if="!records.length" class="exit-active-status">No hay vehículos dentro del hotel.</p>
    <div v-else class="exit-active-list">
      <div v-for="record in records" :key="record.idRegistro" class="exit-active-row"
        :class="{ 'exit-active-row--selected': selectedId === record.idRegistro }" role="button" tabindex="0"
        @click="selectRecord(record)" @keydown.enter="selectRecord(record)">
        <span class="exit-active-row__main"><strong>{{ record.placa }}</strong><small>{{ record.conductor }}<template
              v-if="record.relacionado"> · {{ record.relacionado }}</template></small></span>
        <span class="exit-active-row__type"><span class="exit-type-icon" aria-hidden="true">
            <svg v-if="record.tipoVisitante?.toLowerCase().includes('taxi')" viewBox="0 0 24 24">
              <path d="M5 15h14l-1-6H6zM7 15l-1 3M17 15l1 3M8 9l2-3h4l2 3" />
              <circle cx="8" cy="18" r="1" />
              <circle cx="16" cy="18" r="1" />
            </svg>
            <svg v-else-if="record.tipoVisitante?.toLowerCase().includes('transportadora')" viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="14" rx="2" />
              <path d="M4 12h16M7 18v2M17 18v2" />
              <circle cx="8" cy="15" r="1" />
              <circle cx="16" cy="15" r="1" />
            </svg>
            <svg v-else-if="record.tipoVisitante?.toLowerCase().includes('proveedor')" viewBox="0 0 24 24">
              <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="18" cy="18" r="2" />
            </svg>
            <svg v-else viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="3" />
              <path d="M5 20c.8-3.4 3-5 7-5s6.2 1.6 7 5" />
            </svg>
          </span><small>Entrada: {{ new
            Date(record.fechaEntrada).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
          }}</small></span>
        <button class="exit-active-row__menu" type="button" :disabled="selecting === record.idRegistro"
          aria-label="Ver detalle del vehículo" @click.stop="openDetails(record)">☰</button>
      </div>
    </div>
  </section>
</template>
