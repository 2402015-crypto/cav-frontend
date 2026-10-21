<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

defineEmits(['back', 'confirm'])

const video = ref(null)
const cameraError = ref('')
const cameraStream = ref(null)
const capturedImage = ref('')
const reading = ref(false)
const detected = ref(false)
const editablePlate = ref('FAP-528-D')

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = 'La cámara no está disponible en este dispositivo.'
    return
  }
  try {
    cameraStream.value = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
    if (video.value) video.value.srcObject = cameraStream.value
  } catch {
    cameraError.value = 'Permite el acceso a la cámara para capturar la placa.'
  }
}

function stopCamera() {
  cameraStream.value?.getTracks().forEach((track) => track.stop())
  cameraStream.value = null
}

function capturePlate() {
  if (reading.value) return
  if (video.value?.videoWidth) {
    const canvas = document.createElement('canvas')
    canvas.width = video.value.videoWidth
    canvas.height = video.value.videoHeight
    canvas.getContext('2d').drawImage(video.value, 0, 0)
    capturedImage.value = canvas.toDataURL('image/jpeg', 0.85)
  }
  reading.value = true
  window.setTimeout(() => {
    reading.value = false
    detected.value = true
    stopCamera()
  }, 900)
}

async function retake() {
  capturedImage.value = ''
  detected.value = false
  editablePlate.value = 'FAP-528-D'
  cameraError.value = ''
  await nextTick()
  startCamera()
}

onMounted(startCamera)
onBeforeUnmount(stopCamera)
</script>

<template>
  <section class="entry-ocr-panel">
    <div class="entry-camera-card" :class="{ 'entry-camera-card--detected': detected }">
      <div class="entry-camera-view">
        <video v-if="!capturedImage" ref="video" autoplay muted playsinline aria-label="Vista de cámara para capturar placa" />
        <img v-else :src="capturedImage" alt="Captura temporal de la placa" />
        <div class="entry-camera-frame" aria-hidden="true"><i /><i /><i /><i /></div>
        <div v-if="reading" class="entry-camera-reading"><span class="entry-loading-dots">···</span><span>Leyendo placa</span></div>
        <div v-else-if="detected" class="entry-camera-detected"><span>✓</span><strong>Placa detectada</strong></div>
        <p v-else-if="cameraError" class="entry-camera-error">{{ cameraError }}</p>
        <span v-else class="entry-camera-placeholder" aria-hidden="true">···</span>
      </div>
      <button v-if="!detected" class="entry-camera-button" type="button" :disabled="reading" aria-label="Capturar placa" @click="capturePlate"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M8 7 9.5 4h5L16 7M12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg></button>
    </div>

    <div v-if="detected" class="entry-plate-result">
      <label>PLACA DETECTADA</label>
      <strong>FAP-528-D</strong>
      <p>Puedes editar la placa si el sistema no fue preciso:</p>
      <label for="editable-plate">PLACA EDITABLE</label>
      <div class="entry-plate-input"><input id="editable-plate" v-model="editablePlate" type="text" maxlength="30" /><span aria-hidden="true">↗</span></div>
    </div>

    <div v-if="detected" class="entry-ocr-actions">
      <button class="entry-secondary-button" type="button" @click="retake">‹&nbsp; Retomar</button>
      <button v-if="detected" class="entry-primary-button" type="button" @click="$emit('confirm', editablePlate)">✓&nbsp; Confirmar</button>
    </div>
  </section>
</template>