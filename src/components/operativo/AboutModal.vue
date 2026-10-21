<script setup>
import aboutIcon from '@/images/Avatar1.1.png'

defineProps({
  open: Boolean,
})

defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="about-modal-layer" role="presentation" @click.self="$emit('close')">
      <section class="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
        <header class="about-modal__header">
          <span>ACERCA DE</span>
          <button type="button" aria-label="Cerrar acerca de" @click="$emit('close')">×</button>
        </header>
        <div class="about-modal__body">
          <img :src="aboutIcon" alt="" />
          <h2 id="about-modal-title">Control de Acceso<br />Vehicular (CAV)</h2>
          <p>Versión 1.1</p>
          <em>By Bryan Martínez Jiménez</em>
          <small>2026</small>
        </div>
      </section>
    </div>
  </Teleport>
</template>