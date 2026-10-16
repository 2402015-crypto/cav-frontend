<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <span class="user-avatar" aria-hidden="true">{{ name.charAt(0).toUpperCase() }}</span>
</template>
