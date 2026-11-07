<script setup>
import { onBeforeUnmount, watch } from 'vue'
import SalidaDetails from './SalidaDetails.vue'

const props = defineProps({
  record: { type: Object, required: true },
})

const emit = defineEmits(['close', 'registered'])

watch(() => props.record, (record) => {
  document.body.style.overflow = record ? 'hidden' : ''
}, { immediate: true })

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="record" class="vehicle-details-modal" role="presentation" @click.self="emit('close')">
      <div class="vehicle-details-modal__card" role="dialog" aria-modal="true" aria-label="Detalle del vehículo">
        <div class="vehicle-details-modal__content">
          <SalidaDetails :record="record" @registered="emit('registered', $event)" />
        </div>
        <button class="vehicle-details-modal__close" type="button" @click="emit('close')">Cerrar</button>
      </div>
    </div>
  </Teleport>
</template>
