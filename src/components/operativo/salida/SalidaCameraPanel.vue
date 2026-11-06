<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { recognizePlate } from '@/services/api/entradas'
import { getExitDetails, registerExit, searchActiveExit } from '@/services/api/salidas'
import { captureVideoView } from '@/utils/captureFrame'

const emit = defineEmits(['back', 'registered', 'found'])
const props = defineProps({ initialRecord: { type: Object, default: null } })
const video = ref(null)
const cameraView = ref(null)
const reading = ref(false)
const captured = ref(Boolean(props.initialRecord))
const cameraError = ref('')
const errorMessage = ref('')
const ocrError = ref('')
const stream = ref(null)
const capturedImage = ref('')
const detectedPlate = ref('')
const activeRecord = ref(props.initialRecord)
const ocrId = ref(null)
const captureTime = ref(props.initialRecord?.capturedAt || props.initialRecord?.fechaSalida || null)
const registering = ref(false)
const retryTimer = ref(null)
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
    if (!stream.value?.getTracks().some((track) => track.readyState === 'live')) {
      stream.value = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
    }
    if (video.value) {
      video.value.srcObject = stream.value
      await video.value.play()
    }
    cameraError.value = ''
  } catch {
    cameraError.value = 'Permite el acceso a la cámara para capturar la placa.'
  }
}

function stopCamera() {
  stream.value?.getTracks().forEach((track) => track.stop())
  stream.value = null
}

function scheduleCaptureRestart() {
  if (retryTimer.value) clearTimeout(retryTimer.value)
  retryTimer.value = setTimeout(() => {
    retryTimer.value = null
    retake()
  }, 1800)
}

async function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    stopCamera()
  } else if (!captured.value && !reading.value) {
    await nextTick()
    await startCamera()
  }
}

function captureFrame() {
  return captureVideoView(video.value, cameraView.value)
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message
    || error.response?.data?.error
    || error.message
    || fallback
}

async function capture() {
  if (reading.value) return
  capturedImage.value = captureFrame()
  captureTime.value = new Date().toISOString()
  reading.value = true
  ocrError.value = ''
  if (!capturedImage.value) {
    ocrError.value = 'La cámara todavía no tiene una imagen disponible. Intenta nuevamente.'
    reading.value = false
    scheduleCaptureRestart()
    return
  }
  errorMessage.value = ''
  try {
    const blob = await fetch(capturedImage.value).then((response) => response.blob())
    const ocrResponse = await recognizePlate(blob)
    const result = ocrResponse.data?.data
    ocrId.value = result?.idOcr || null
    if (!result?.detectada || !result.placa) {
      throw new Error(result?.mensaje || 'No se detectó una placa en la captura.')
    }
    detectedPlate.value = result.placa.trim().toUpperCase()
    const activeResponse = await searchActiveExit(detectedPlate.value)
    const record = activeResponse.data?.data
    if (!record || Array.isArray(record) || !record.idRegistro || !record.placa) {
      throw new Error(`La placa ${detectedPlate.value} no tiene un registro de entrada activo.`)
    }
    activeRecord.value = record
    captured.value = true
  } catch (error) {
    ocrError.value = getErrorMessage(error, 'No fue posible procesar la captura.')
    capturedImage.value = ''
    captured.value = false
    activeRecord.value = null
    ocrId.value = null
    scheduleCaptureRestart()
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
  ocrError.value = ''
  cameraError.value = ''
  await nextTick()
  await startCamera()
}

async function registerCapturedExit() {
  if (!activeRecord.value || registering.value) return
  registering.value = true
  errorMessage.value = ''
  try {
    const response = await registerExit(activeRecord.value.idRegistro, '', captureTime.value, ocrId.value)
    emit('registered', response.data.data)
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'No fue posible registrar la salida.')
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
    errorMessage.value = getErrorMessage(error, 'No fue posible cargar los detalles del vehículo.')
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  startCamera()
})
onBeforeUnmount(() => {
  if (retryTimer.value) clearTimeout(retryTimer.value)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopCamera()
})
</script>

<template>
  <section class="exit-camera-panel">
    <div class="exit-camera-card" :class="{ 'exit-camera-card--detected': captured }">
      <div ref="cameraView" class="exit-camera-view">
        <video v-if="!capturedImage" ref="video" autoplay muted playsinline aria-label="Cámara para salida" />
        <img v-else :src="capturedImage" alt="Captura temporal de la placa" />
        <div v-if="!capturedImage" class="exit-camera-frame" aria-hidden="true"><i /><i /><i /><i /></div>
        <div v-if="reading" class="exit-camera-reading"><span class="exit-loading-dots">···</span><span>Leyendo placa</span></div>
        <div v-else-if="captured" class="exit-camera-detected"><span>✓</span><strong>Placa capturada</strong></div>
        <p v-else-if="ocrError" class="exit-camera-error" role="alert">{{ ocrError }}</p>
        <p v-else-if="cameraError" class="exit-camera-error">{{ cameraError }}</p>
        <span v-else class="exit-camera-placeholder" aria-hidden="true">···</span>
      </div>
      <button v-if="!captured" class="exit-camera-button" type="button" :disabled="reading" aria-label="Capturar placa" @click="capture"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M8 7 9.5 4h5L16 7M12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg></button>
    </div>
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