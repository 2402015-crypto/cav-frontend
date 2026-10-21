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
    <div class="entry-success-view__check" aria-hidden="true">✓</div>
    <h2>Entrada Registrada</h2>
    <p>Placa: <strong>{{ plate }}</strong></p>
    <small>{{ registeredDate }}</small>
    <button class="entry-success-view__button" type="button" @click="$emit('panel')">Volver al panel</button>
  </section>
</template>