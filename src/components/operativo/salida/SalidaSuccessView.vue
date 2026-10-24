<script setup>
import { computed } from 'vue'

const props = defineProps({ record: { type: Object, required: true } })
defineEmits(['panel'])
const exitTime = computed(() => new Date(props.record.fechaSalida).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }))
const permanence = computed(() => props.record.permanencia || 'N/A')
</script>

<template>
  <section class="exit-success-view">
    <div class="exit-success-view__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5M14 8l4 4-4 4M9 12h9" /></svg></div>
    <h2>Salida Registrada</h2>
    <p>Placa: <strong>{{ record.placa }}</strong></p>
    <p>Permanencia: <strong>{{ permanence }}</strong></p>
    <small>{{ exitTime }}</small>
    <button type="button" @click="$emit('panel')">Volver al panel</button>
  </section>
</template>