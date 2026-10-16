<script setup>
defineProps({
  open: Boolean,
  title: {
    type: String,
    default: 'Confirmar acción',
  },
  message: {
    type: String,
    required: true,
  },
})

defineEmits(['cancel', 'confirm'])
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="confirm-modal" role="presentation" @click.self="$emit('cancel')">
      <section class="confirm-modal__dialog" role="dialog" aria-modal="true" :aria-labelledby="'confirm-title'">
        <button class="confirm-modal__close" type="button" aria-label="Cerrar" @click="$emit('cancel')">&times;</button>
        <h2 id="confirm-title">{{ title }}</h2>
        <p>{{ message }}</p>
        <div class="confirm-modal__actions">
          <button class="confirm-button confirm-button--cancel" type="button" @click="$emit('cancel')">Cancelar</button>
          <button class="confirm-button confirm-button--danger" type="button" @click="$emit('confirm')">Eliminar</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
