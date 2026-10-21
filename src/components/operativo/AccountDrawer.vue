<script setup>
import { ref } from 'vue'
import avatar from '@/images/Avatar.png'

defineProps({
  open: Boolean,
  user: {
    type: Object,
    default: null,
  },
  signingOut: Boolean,
})

defineEmits(['close', 'history', 'about', 'logout-request'])

const dailyStatsOpen = ref(false)
</script>

<template>
  <div v-if="open" class="account-drawer-layer" role="presentation" @click.self="$emit('close')">
    <aside class="account-drawer" role="dialog" aria-modal="true" aria-labelledby="account-drawer-title">
      <header class="account-drawer__header">
        <span id="account-drawer-title">MI CUENTA</span>
        <button class="account-drawer__close" type="button" aria-label="Cerrar menú de cuenta" @click="$emit('close')">×</button>
      </header>

      <div class="account-drawer__body">
        <section class="account-profile">
          <img class="account-profile__avatar" :src="avatar" alt="" />
          <strong>{{ user?.usuario || 'Usuario' }}</strong>
          <span>{{ user?.nombre || 'Nombre completo' }}</span>
          <small><span aria-hidden="true">◉</span> {{ user?.rol === 'ADMIN' ? 'Administrador' : 'Guardia' }}</small>
        </section>

        <button class="account-drawer__link" type="button" @click="$emit('history')">
          <span class="account-drawer__link-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2M4 12H2.5" /></svg></span>
          <span><strong>Historial de accesos</strong><small>Ver todos los registros</small></span>
          <span class="account-drawer__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg></span>
        </button>

        <button class="account-drawer__link account-drawer__link--expandable" :class="{ 'account-drawer__link--expanded': dailyStatsOpen }" type="button" :aria-expanded="dailyStatsOpen" @click="dailyStatsOpen = !dailyStatsOpen">
          <span class="account-drawer__link-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12M6 12h12M6 17h12" /></svg></span>
          <span><strong>Registros del día</strong><small>Estadísticas de hoy</small></span>
          <span class="account-drawer__chevron" :class="{ 'account-drawer__chevron--up': dailyStatsOpen }" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg></span>
        </button>

        <div v-if="dailyStatsOpen" class="account-daily-stats" aria-live="polite">
          <div><strong>--</strong><small>Registros<br />hoy</small></div>
          <div><strong>--</strong><small>Entradas</small></div>
          <div><strong>--</strong><small>Salidas</small></div>
        </div>
        <p v-if="dailyStatsOpen" class="account-daily-stats__note">Datos disponibles cuando se habilite el servicio de estadísticas.</p>
      </div>

      <footer class="account-drawer__footer">
        <button class="account-about" type="button" @click="$emit('about')"><span aria-hidden="true">ⓘ</span> Acerca de</button>
        <button class="account-logout" type="button" :disabled="signingOut" @click="$emit('logout-request')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5M14 8l4 4-4 4M9 12h9" /></svg>{{ signingOut ? 'Cerrando sesión...' : 'Cerrar sesión' }}</button>
      </footer>
    </aside>
  </div>
</template>