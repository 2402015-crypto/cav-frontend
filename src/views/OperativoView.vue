<script setup>
import logo from '@/images/Chable_Maroma-01.png'
import avatar from '@/images/Avatar.png'
</script>

<template>
  <div class="operative-shell">
    <header class="operative-header">
      <img class="operative-logo" :src="logo" alt="Chablé Maroma" />
      <button class="operative-profile" type="button" disabled aria-label="Perfil de usuario próximamente disponible">
        <img :src="avatar" alt="" />
      </button>
    </header>

    <main class="operative-main">
      <RouterView />
    </main>

    <nav class="operative-nav" aria-label="Navegación operativa">
      <RouterLink class="operative-nav__item" active-class="operative-nav__item--active" :to="{ name: 'operativo-panel' }">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3.5 10.5 8.5-7 8.5 7v9a1 1 0 0 1-1 1h-5v-5h-5v5h-5a1 1 0 0 1-1-1v-9Z" /></svg>
        <span>Panel</span>
      </RouterLink>
      <RouterLink class="operative-nav__item" active-class="operative-nav__item--active" :to="{ name: 'operativo-entrada' }">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg>
        <span>Entrada</span>
      </RouterLink>
      <RouterLink class="operative-nav__item" active-class="operative-nav__item--active" :to="{ name: 'operativo-salida' }">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5M20 12H10M16 8l4 4-4 4" /></svg>
        <span>Salida</span>
      </RouterLink>
      <RouterLink class="operative-nav__item" active-class="operative-nav__item--active" :to="{ name: 'operativo-activos' }">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16V6a2 2 0 0 1 2-2h10l5 5v7M3 16h18M6 18.5a2 2 0 1 0 4 0M16 18.5a2 2 0 1 0 4 0" /></svg>
        <span>Activos</span>
      </RouterLink>
      <RouterLink class="operative-nav__item" active-class="operative-nav__item--active" :to="{ name: 'operativo-buscar' }">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
        <span>Buscar</span>
      </RouterLink>
    </nav>
  </div>
</template>