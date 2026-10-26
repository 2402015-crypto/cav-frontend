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
    <p v-if="loading" class="exit-active-status">Cargando vehículos activos...</p>
    <p v-else-if="!records.length" class="exit-active-status">No hay vehículos dentro del hotel.</p>
    <div v-else class="exit-active-list">
      <div v-for="record in records" :key="record.idRegistro" class="exit-active-row" :class="{ 'exit-active-row--selected': selectedId === record.idRegistro }" role="button" tabindex="0" @click="selectRecord(record)" @keydown.enter="selectRecord(record)">
        <span class="exit-active-row__main"><strong>{{ record.placa }}</strong><small>{{ record.conductor }}<template v-if="record.relacionado"> · {{ record.relacionado }}</template></small></span>
        <span class="exit-active-row__type"><span class="exit-type-icon" aria-hidden="true">{{ record.tipoVisitante?.toLowerCase().includes('taxi') ? '▣' : record.tipoVisitante?.toLowerCase().includes('transportadora') ? '▤' : record.tipoVisitante?.toLowerCase().includes('proveedor') ? '▣' : '♙' }}</span><small>Entrada: {{ new Date(record.fechaEntrada).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }) }}</small></span>
        <button class="exit-active-row__menu" type="button" :disabled="selecting === record.idRegistro" aria-label="Ver detalle del vehículo" @click.stop="openDetails(record)">☰</button>
      </div>
    </div>
    <button v-if="selectedId" class="exit-register-selected" type="button" @click="registerSelected">↪&nbsp; Registrar Salida · {{ new Date().toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }) }}</button>
  </section>
</template>
