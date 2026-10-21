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
  confirmLabel: {
    type: String,
    default: 'Eliminar',
  },
  variant: {
    type: String,
    default: 'default',
  },
})

defineEmits(['cancel', 'confirm'])
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="confirm-modal" :class="`confirm-modal--${variant}`" role="presentation" @click.self="$emit('cancel')">
      <section class="confirm-modal__dialog" role="dialog" aria-modal="true" :aria-labelledby="'confirm-title'">
        <button class="confirm-modal__close" type="button" aria-label="Cerrar" @click="$emit('cancel')">&times;</button>
        <span v-if="variant !== 'default'" class="confirm-modal__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 5H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5M14 8l4 4-4 4M9 12h9" /></svg></span>
        <h2 id="confirm-title">{{ title }}</h2>
        <p>{{ message }}</p>
        <div class="confirm-modal__actions">
          <button class="confirm-button confirm-button--cancel" type="button" @click="$emit('cancel')">Cancelar</button>
          <button class="confirm-button confirm-button--danger" type="button" @click="$emit('confirm')">{{ confirmLabel }}</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
