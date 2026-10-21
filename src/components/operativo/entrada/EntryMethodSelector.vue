<script setup>
defineEmits(['automatic', 'manual', 'back'])
</script>

<template>
  <section class="entry-method-panel">
    <button class="entry-method-card entry-method-card--automatic" type="button" @click="$emit('automatic')">
      <span class="entry-method-card__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M8 7 9.5 4h5L16 7M12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg></span>
      <strong>Capturar Placa Automáticamente</strong>
      <small>Reconocimiento OCR mediante cámara</small>
    </button>
    <button class="entry-method-card entry-method-card--manual" type="button" @click="$emit('manual')">
      <span class="entry-method-card__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 18-.7 3.7L8 21l10.5-10.5a2.5 2.5 0 0 0-3.5-3.5L4.5 17.5M13.5 8.5l3 3" /><path d="M5 5h7M5 9h4" /></svg></span>
      <strong>Registro Manual</strong>
      <small>Ingresar placa manualmente</small>
    </button>
  </section>
</template>