<script setup>
defineProps({
  options: {
    type: Array,
    required: true,
  },
})

defineEmits(['select'])
</script>

<template>
  <section class="entry-type-panel">
    <p class="entry-step-copy">Selecciona el tipo de registro para mostrar el formulario correspondiente.</p>
    <div class="entry-type-grid">
      <button v-for="option in options" :key="option.key" class="entry-type-card" type="button" @click="$emit('select', option)">
        <span class="entry-type-card__icon">
          <svg v-if="option.icon === 'person'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5 20c.8-3.4 3-5 7-5s6.2 1.6 7 5M17 11a3 3 0 0 0 0-6M18 15c1.7.5 2.6 1.9 3 4" /></svg>
          <svg v-else-if="option.icon === 'truck'" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>
          <svg v-else-if="option.icon === 'bus'" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="14" rx="2" /><path d="M4 12h16M8 8h.1M16 8h.1M7 18v2M17 18v2" /><circle cx="8" cy="15" r="1" /><circle cx="16" cy="15" r="1" /></svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15h14l-1-6H6zM7 15l-1 3M17 15l1 3M8 9l2-3h4l2 3" /><circle cx="8" cy="18" r="1" /><circle cx="16" cy="18" r="1" /></svg>
        </span>
        <strong>{{ option.label }}</strong>
      </button>
    </div>
  </section>
</template>