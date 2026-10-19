<script setup>
defineProps({
  catalog: {
    type: Object,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  active: Boolean,
})

defineEmits(['select'])
</script>

<template>
  <button
    class="catalog-card"
    :class="{ 'catalog-card--active': active }"
    type="button"
    @click="$emit('select')"
  >
    <span class="catalog-card__icon" :style="{ '--catalog-color': catalog.color }">
      <svg v-if="catalog.icon === 'truck'" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>
      <svg v-else-if="catalog.icon === 'grid'" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></svg>
      <svg v-else-if="catalog.icon === 'document'" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6M9 16h6" /></svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15h14l-1-6H6zM7 15l-1 3M17 15l1 3M8 9l2-3h4l2 3" /><circle cx="8" cy="18" r="1" /><circle cx="16" cy="18" r="1" /></svg>
    </span>
    <span class="catalog-card__count">{{ count }}</span>
    <strong>{{ catalog.label }}</strong>
    <small>{{ catalog.description }}</small>
  </button>
</template>