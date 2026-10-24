<script setup>
import { computed } from 'vue'

const props = defineProps({
  plate: { type: String, required: true },
  registeredAt: { type: Date, required: true },
})

defineEmits(['panel'])

const registeredDate = computed(() => {
  const time = props.registeredAt.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
  const date = props.registeredAt.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
  return `${time} · ${date}`
})
</script>

<template>
  <section class="entry-success-view">
    <div class="entry-success-view__check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg></div>
    <h2>Entrada Registrada</h2>
    <p>Placa: <strong>{{ plate }}</strong></p>
    <small>{{ registeredDate }}</small>
    <button class="entry-success-view__button" type="button" @click="$emit('panel')">Volver al panel</button>
  </section>
</template>