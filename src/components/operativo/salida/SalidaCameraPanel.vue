<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

defineEmits(['back', 'confirm'])
const video = ref(null)
const reading = ref(false)
const captured = ref(false)
const cameraError = ref('')
const stream = ref(null)

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

function capture() {
  if (reading.value) return
  reading.value = true
  window.setTimeout(() => { reading.value = false; captured.value = true; stopCamera() }, 1000)
}

async function retake() {
  reading.value = false
  captured.value = false
  cameraError.value = ''
  await nextTick()
  startCamera()
}

onMounted(startCamera)
onBeforeUnmount(stopCamera)
</script>

<template>
  <section class="exit-camera-panel">
    <div class="exit-camera-view">
      <video ref="video" autoplay muted playsinline aria-label="Cámara para salida" />
      <div class="exit-camera-frame"><i /><i /><i /><i /></div>
      <div v-if="captured" class="exit-camera-detected"><span>✓</span><strong>Placa detectada</strong></div>
      <div v-else-if="reading" class="exit-camera-reading"><span>···</span><strong>Leyendo placa...</strong></div>
      <p v-else-if="cameraError">{{ cameraError }}</p>
      <span v-else class="exit-camera-placeholder">···</span>
    </div>
    <button v-if="!captured" class="exit-camera-button" type="button" :disabled="reading" aria-label="Capturar placa" @click="capture"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M8 7 9.5 4h5L16 7M12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg></button>
    <div v-if="captured" class="exit-captured-card">
      <strong class="exit-captured-card__plate">FAP-528-D</strong>
      <div><span>Conductor</span><strong>Datos pendientes de OCR</strong></div>
      <div><span>Hora entrada</span><strong>--</strong></div>
      <div><span>Hora salida</span><strong>--</strong></div>
      <div><span>Permanencia</span><strong>--</strong></div>
      <div class="exit-captured-card__actions"><button class="entry-secondary-button" type="button" @click="retake">‹&nbsp; Retomar</button><button class="entry-primary-button" type="button" @click="$emit('confirm', 'FAP-528-D')">Registrar salida</button></div>
    </div>
  </section>
</template>