<script setup>
import { nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

function resetInterfaceScroll() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

onMounted(() => {
  nextTick(resetInterfaceScroll)
})

watch(() => route.fullPath, () => {
  nextTick(resetInterfaceScroll)
})
</script>

<template>
  <RouterView />
</template>

