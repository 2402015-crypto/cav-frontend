<script setup>
import UserAvatar from './UserAvatar.vue'

defineProps({
  users: {
    type: Array,
    required: true,
  },
  updatingUserId: {
    type: [Number, String],
    default: null,
  },
})

defineEmits(['toggle-status', 'delete', 'edit'])

function roleLabel(role) {
  return role === 'ADMIN' ? 'Administrador' : 'Guardia'
}
</script>

<template>
  <div class="users-table-wrap">
    <table class="users-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Usuario</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>
            <div class="user-name">
              <UserAvatar :name="user.nombreCompleto" />
              <span>{{ user.nombreCompleto }}</span>
            </div>
          </td>
          <td><code>{{ user.usuario }}</code></td>
          <td>{{ roleLabel(user.rol) }}</td>
          <td>
            <span class="user-status" :class="{ 'user-status--inactive': user.estado !== 'ACTIVO' }">
              <span class="user-status__dot" />
              {{ user.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td>
            <div class="user-actions">
              <button class="table-action table-action--edit" type="button" aria-label="Editar usuario" @click="$emit('edit', user)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4.8L8 20l10.8-10.8a2.8 2.8 0 0 0-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></svg>
                Editar
              </button>
              <button class="table-action table-action--toggle" type="button" :disabled="updatingUserId === user.id" @click="$emit('toggle-status', user)">
                {{ updatingUserId === user.id ? 'Actualizando...' : user.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
              </button>
              <button class="table-action table-action--delete" type="button" @click="$emit('delete', user)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M7 7l1 13h8l1-13M9 7V4h6v3" /></svg>
                Eliminar
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!users.length">
          <td class="users-table__empty" colspan="5">No hay usuarios registrados.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
