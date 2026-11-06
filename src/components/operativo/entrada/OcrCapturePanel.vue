<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { recognizePlate } from '@/services/api/entradas'
import { captureVideoView } from '@/utils/captureFrame'

const emit = defineEmits(['back', 'confirm'])

const video = ref(null)
const cameraView = ref(null)
const cameraError = ref('')
const cameraStream = ref(null)
const capturedImage = ref('')
const reading = ref(false)
const detected = ref(false)
const editablePlate = ref('FAP-528-D')
const detectedPlate = ref('')
const ocrId = ref(null)
const ocrError = ref('')
const retryTimer = ref(null)

function normalizeEditablePlate() {
  editablePlate.value = editablePlate.value.toUpperCase()
}

function confirmCapture() {
  normalizeEditablePlate()
  emit('confirm', { plate: editablePlate.value, idOcr: ocrId.value })
}

function captureFrame() {
  return captureVideoView(video.value, cameraView.value)
}

function scheduleCaptureRestart() {
  if (retryTimer.value) clearTimeout(retryTimer.value)
  retryTimer.value = setTimeout(() => {
    retryTimer.value = null
    retake()
  }, 1800)
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = 'La cámara no está disponible en este dispositivo.'
    return
  }
  try {
    if (!cameraStream.value?.getTracks().some((track) => track.readyState === 'live')) {
      cameraStream.value = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
    }
    if (video.value) {
      video.value.srcObject = cameraStream.value
      await video.value.play()
    }
    cameraError.value = ''
  } catch {
    cameraError.value = 'Permite el acceso a la cámara para capturar la placa.'
  }
}

function stopCamera() {
  cameraStream.value?.getTracks().forEach((track) => track.stop())
  cameraStream.value = null
}

async function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    stopCamera()
  } else if (!detected.value && !reading.value) {
    await nextTick()
    await startCamera()
  }
}

async function capturePlate() {
  if (reading.value) return
  capturedImage.value = captureFrame()
  reading.value = true
  ocrError.value = ''
  if (!capturedImage.value) {
    ocrError.value = 'La cámara todavía no tiene una imagen disponible. Intenta nuevamente.'
    reading.value = false
    scheduleCaptureRestart()
    return
  }
  try {
    const blob = await fetch(capturedImage.value).then((response) => response.blob())
    const response = await recognizePlate(blob)
    const result = response.data.data
    ocrId.value = result.idOcr
    if (!result.detectada || !result.placa) {
      ocrError.value = result.mensaje || 'No se detectó una placa en la captura.'
      capturedImage.value = ''
      scheduleCaptureRestart()
      return
    }
    detectedPlate.value = result.placa
    editablePlate.value = result.placa
    detected.value = true
    stopCamera()
  } catch (error) {
    ocrError.value = error.response?.data?.message || 'No fue posible procesar la captura OCR.'
    capturedImage.value = ''
    scheduleCaptureRestart()
  } finally {
    reading.value = false
  }
}

async function retake() {
  stopCamera()
  capturedImage.value = ''
  detected.value = false
  editablePlate.value = 'FAP-528-D'
  detectedPlate.value = ''
  ocrId.value = null
  ocrError.value = ''
  cameraError.value = ''
  await nextTick()
  await startCamera()
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
  <section class="entry-ocr-panel">
    <div class="entry-camera-card" :class="{ 'entry-camera-card--detected': detected }">
      <div ref="cameraView" class="entry-camera-view">
        <video v-if="!capturedImage" ref="video" autoplay muted playsinline aria-label="Vista de cámara para capturar placa" />
        <img v-else :src="capturedImage" alt="Captura temporal de la placa" />
        <div v-if="!capturedImage" class="entry-camera-frame" aria-hidden="true"><i /><i /><i /><i /></div>
        <div v-if="reading" class="entry-camera-reading"><span class="entry-loading-dots">···</span><span>Leyendo placa</span></div>
        <div v-else-if="detected" class="entry-camera-detected"><span>✓</span><strong>Placa detectada</strong></div>
        <p v-else-if="ocrError" class="entry-camera-error">{{ ocrError }}</p>
        <p v-else-if="cameraError" class="entry-camera-error">{{ cameraError }}</p>
        <span v-else class="entry-camera-placeholder" aria-hidden="true">···</span>
      </div>
      <button v-if="!detected" class="entry-camera-button" type="button" :disabled="reading" aria-label="Capturar placa" @click="capturePlate"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M8 7 9.5 4h5L16 7M12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg></button>
    </div>

    <div v-if="detected" class="entry-plate-result">
      <label>PLACA DETECTADA</label>
      <strong>{{ detectedPlate }}</strong>
      <p>Puedes editar la placa si el sistema no fue preciso:</p>
      <label for="editable-plate">PLACA EDITABLE</label>
      <div class="entry-plate-input"><input id="editable-plate" v-model="editablePlate" type="text" maxlength="30" @input="normalizeEditablePlate" /><span aria-hidden="true">↗</span></div>
    </div>

    <div v-if="detected" class="entry-ocr-actions">
      <button class="entry-secondary-button" type="button" @click="retake">‹&nbsp; Retomar</button>
      <button v-if="detected" class="entry-primary-button" type="button" @click="confirmCapture">✓&nbsp; Confirmar</button>
    </div>
  </section>
</template>