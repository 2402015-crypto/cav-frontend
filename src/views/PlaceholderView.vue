<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <main class="container py-5">
    <h1 class="h3">{{ route.meta.title || 'CAV' }}</h1>
    <p class="text-secondary mb-0">Estructura preparada para desarrollo.</p>
  </main>
</template>
