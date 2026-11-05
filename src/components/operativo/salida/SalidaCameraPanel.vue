<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { recognizePlate } from '@/services/api/entradas'
import { getExitDetails, registerExit, searchActiveExit } from '@/services/api/salidas'

const emit = defineEmits(['back', 'registered', 'found'])
const props = defineProps({ initialRecord: { type: Object, default: null } })
const video = ref(null)
const reading = ref(false)
const captured = ref(Boolean(props.initialRecord))
const cameraError = ref('')
const errorMessage = ref('')
const stream = ref(null)
const capturedImage = ref('')
const detectedPlate = ref('')
const activeRecord = ref(props.initialRecord)
const ocrId = ref(null)
const captureTime = ref(props.initialRecord?.capturedAt || props.initialRecord?.fechaSalida || null)
const registering = ref(false)
const recordType = computed(() => (activeRecord.value?.tipoVisitante || '').toLowerCase())
const isTaxi = computed(() => recordType.value.includes('taxi'))
const isTransporter = computed(() => recordType.value.includes('transportadora'))
const relatedLabel = computed(() => isTaxi.value ? 'Número de unidad' : isTransporter.value ? 'Transportadora' : 'Compañía')
const relatedValue = computed(() => isTaxi.value
  ? activeRecord.value?.numeroUnidad
  : isTransporter.value
    ? activeRecord.value?.transportadora
    : activeRecord.value?.empresa)
const displayType = computed(() => {
  const type = (activeRecord.value?.tipoVisitante || '').toLowerCase()
  if (type.includes('transportadora')) return 'Transportadora'
  if (type.includes('proveedor')) return 'Proveedor'
  if (type.includes('taxi')) return 'Taxi'
  if (type.includes('colaborador') || type.includes('general')) return 'Colaborador'
  return 'N/A'
})
const captureLabel = computed(() => captureTime.value
  ? new Date(captureTime.value).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
  : '')

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = 'La cámara no está disponible.'
    return
  }
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
    if (video.value) video.value.srcObject = stream.value
  } catch {
    cameraError.value = 'Permite el acceso a la cámara para capturar la placa.'
  }
}

function stopCamera() {
  stream.value?.getTracks().forEach((track) => track.stop())
  stream.value = null
}

function captureFrame() {
  const source = video.value
  if (!source?.videoWidth || !source.videoHeight) return ''
  const canvas = document.createElement('canvas')
  canvas.width = source.videoWidth
  canvas.height = source.videoHeight
  const context = canvas.getContext('2d')
  if (!context) return ''
  context.drawImage(source, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.92)
}

async function capture() {
  if (reading.value) return
  capturedImage.value = captureFrame()
  captureTime.value = new Date().toISOString()
  if (!capturedImage.value) {
    errorMessage.value = 'La cámara todavía no tiene una imagen disponible. Intenta nuevamente.'
    return
  }
  reading.value = true
  errorMessage.value = ''
  try {
    const blob = await fetch(capturedImage.value).then((response) => response.blob())
    const ocrResponse = await recognizePlate(blob)
    const result = ocrResponse.data.data
    ocrId.value = result.idOcr
    if (!result.detectada || !result.placa) {
      throw new Error(result.mensaje || 'No se detectó una placa en la captura.')
    }
    detectedPlate.value = result.placa.toUpperCase()
    const activeResponse = await searchActiveExit(detectedPlate.value)
    activeRecord.value = activeResponse.data.data
    captured.value = true
    stopCamera()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'No fue posible procesar la captura.'
    capturedImage.value = ''
    activeRecord.value = null
    ocrId.value = null
  } finally {
    reading.value = false
  }
}

async function retake() {
  reading.value = false
  captured.value = false
  capturedImage.value = ''
  detectedPlate.value = ''
  activeRecord.value = null
  ocrId.value = null
  captureTime.value = null
  errorMessage.value = ''
  cameraError.value = ''
  await nextTick()
  startCamera()
}

async function registerCapturedExit() {
  if (!activeRecord.value || registering.value) return
  registering.value = true
  errorMessage.value = ''
  try {
    const response = await registerExit(activeRecord.value.idRegistro, '', captureTime.value, ocrId.value)
    emit('registered', response.data.data)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible registrar la salida.'
  } finally {
    registering.value = false
  }
}

async function showDetails() {
  if (!activeRecord.value) return
  try {
    const response = await getExitDetails(activeRecord.value.idRegistro)
    const details = response.data.data
    emit('found', {
      ...details.detalle,
      historial: details.historial,
      totalVisitas: details.totalVisitas,
      capturedAt: captureTime.value,
    })
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible cargar los detalles del vehículo.'
  }
}

onMounted(startCamera)
onBeforeUnmount(stopCamera)
</script>

<template>
  <section class="exit-camera-panel">
    <div class="exit-camera-view">
      <video v-if="!captured" ref="video" autoplay muted playsinline aria-label="Cámara para salida" />
      <img v-else :src="capturedImage" alt="" />
      <div v-if="!captured" class="exit-camera-frame"><i /><i /><i /><i /></div>
      <div v-if="captured" class="exit-camera-detected"><span>✓</span><strong>Placa capturada</strong></div>
      <div v-else-if="reading" class="exit-camera-reading"><span>···</span><strong>Leyendo placa...</strong></div>
      <p v-else-if="cameraError">{{ cameraError }}</p>
      <span v-else class="exit-camera-placeholder">···</span>
    </div>
    <button v-if="!captured" class="exit-camera-button" type="button" :disabled="reading" aria-label="Capturar placa" @click="capture"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M8 7 9.5 4h5L16 7M12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg></button>
    <div v-if="captured" class="exit-captured-card">
      <div class="exit-captured-card__plate-row">
        <strong class="exit-captured-card__plate">{{ activeRecord.placa }}</strong>
        <button class="exit-details-menu" type="button" aria-label="Ver detalles del vehículo" @click="showDetails">
          <span /><span /><span />
        </button>
      </div>
      <div v-if="activeRecord.conductor"><span>Conductor</span><strong>{{ activeRecord.conductor }}</strong></div>
      <div v-if="displayType !== 'N/A'"><span>Tipo</span><strong class="exit-captured-card__type-value">{{ displayType }}</strong></div>
      <div v-if="relatedValue"><span>{{ isTaxi ? 'Número de unidad' : 'Empresa' }}</span><strong>{{ relatedValue }}</strong></div>
      <div><span>Hora entrada</span><strong>{{ new Date(activeRecord.fechaEntrada).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }) }}</strong></div>
      <div v-if="activeRecord.marca || activeRecord.color"><span>Vehículo</span><strong>{{ [activeRecord.marca, activeRecord.color].filter(Boolean).join(' · ') }}</strong></div>
      <div v-if="activeRecord.permanencia"><span>Tiempo dentro</span><strong>{{ activeRecord.permanencia }}</strong></div>
      <p v-if="errorMessage" class="exit-form-error" role="alert">{{ errorMessage }}</p>
      <div class="exit-captured-card__actions"><button class="entry-secondary-button" type="button" @click="retake">‹&nbsp; Retomar</button><button class="entry-primary-button" type="button" :disabled="registering" @click="registerCapturedExit">{{ registering ? 'Registrando...' : `Registrar salida · ${captureLabel}` }}</button></div>
    </div>
  </section>
</template>