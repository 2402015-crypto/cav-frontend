<script setup>
defineProps({
  title: { type: String, required: true },
})

defineEmits(['back'])
</script>

<template>
  <section class="entry-form-placeholder">
    <div class="entry-form-placeholder__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h3" /></svg></div>
    <h2>{{ title }}</h2>
    <p>El formulario de registro estará disponible en el siguiente paso.</p>
  </section>
</template>