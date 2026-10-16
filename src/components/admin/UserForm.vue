<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'create',
  },
  user: {
    type: Object,
    default: null,
  },
  submitting: Boolean,
  serverError: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['submit', 'cancel'])

const form = ref(emptyForm())
const touched = ref({})

function emptyForm() {
  return {
    nombreCompleto: '',
    usuario: '',
    rol: 'OPERATIVO',
    contrasena: '',
  }
}

function resetForm(user) {
  form.value = user
    ? {
        nombreCompleto: user.nombreCompleto || '',
        usuario: user.usuario || '',
        rol: user.rol || 'OPERATIVO',
        contrasena: '',
      }
    : emptyForm()
  touched.value = {}
}

watch(() => props.user, resetForm, { immediate: true })

const errors = computed(() => ({
  nombreCompleto: !form.value.nombreCompleto.trim() ? 'Ingrese todos los datos.' : '',
  usuario: !form.value.usuario.trim() ? 'Ingrese todos los datos.' : '',
  rol: !form.value.rol ? 'Ingrese todos los datos.' : '',
  contrasena: props.mode === 'create' && !form.value.contrasena
    ? 'Ingrese todos los datos.'
    : form.value.contrasena && form.value.contrasena.length < 8
      ? 'La contraseña debe tener mínimo 8 caracteres.'
      : '',
}))

const isValid = computed(() => Object.values(errors.value).every((error) => !error))
const title = computed(() => props.mode === 'create' ? 'Nuevo usuario' : 'Editar usuario')
const submitLabel = computed(() => props.mode === 'create' ? 'Crear' : 'Guardar cambios')

function fieldInvalid(field) {
  return touched.value[field] && errors.value[field]
}

function touch(field) {
  touched.value[field] = true
}

function submitForm() {
  Object.keys(errors.value).forEach((field) => touch(field))
  if (!isValid.value) return
  emit('submit', { ...form.value, contrasena: form.value.contrasena || null })
}
</script>

<template>
  <form class="user-form" novalidate @submit.prevent="submitForm">
    <div class="user-form__heading">
      <h2>{{ title }}</h2>
      <p v-if="mode === 'edit'">Deja la contraseña vacía para conservar la actual.</p>
    </div>

    <div class="user-form__fields">
      <label class="user-form__field">
        <span>Nombre completo</span>
        <input v-model="form.nombreCompleto" type="text" placeholder="Nombre" maxlength="150" @blur="touch('nombreCompleto')" />
        <small v-if="fieldInvalid('nombreCompleto')">{{ errors.nombreCompleto }}</small>
      </label>
      <label class="user-form__field">
        <span>Nombre de usuario</span>
        <input v-model="form.usuario" type="text" placeholder="usuario.apellido" maxlength="50" @blur="touch('usuario')" />
        <small v-if="fieldInvalid('usuario')">{{ errors.usuario }}</small>
      </label>
      <label class="user-form__field">
        <span>Rol</span>
        <select v-model="form.rol" @blur="touch('rol')">
          <option value="ADMIN">Administrador</option>
          <option value="OPERATIVO">Guardia</option>
        </select>
        <small v-if="fieldInvalid('rol')">{{ errors.rol }}</small>
      </label>
      <label class="user-form__field">
        <span>Contraseña</span>
        <input v-model="form.contrasena" type="password" :placeholder="mode === 'edit' ? 'Nueva contraseña' : 'Contraseña segura'" autocomplete="new-password" @blur="touch('contrasena')" />
        <small v-if="fieldInvalid('contrasena')">{{ errors.contrasena }}</small>
      </label>
    </div>

    <p v-if="serverError" class="user-form__error" role="alert">{{ serverError }}</p>

    <div class="user-form__actions">
      <button class="user-form__submit" type="submit" :disabled="!isValid || submitting">
        <span aria-hidden="true">{{ mode === 'create' ? '+' : '✓' }}</span>
        {{ submitting ? 'Guardando...' : submitLabel }}
      </button>
      <button class="user-form__cancel" type="button" :disabled="submitting" @click="$emit('cancel')">Cancelar</button>
    </div>
  </form>
</template>
