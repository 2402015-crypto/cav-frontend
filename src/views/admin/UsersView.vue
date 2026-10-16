<script setup>
import { computed, onMounted, ref } from 'vue'
import { createUser, deleteUser as deleteUserRequest, listUsers, setUserStatus, updateUser } from '@/services/api/users'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import UserForm from '@/components/admin/UserForm.vue'
import UsersTable from '@/components/admin/UsersTable.vue'

const users = ref([])
const loading = ref(true)
const errorMessage = ref('')
const pendingUser = ref(null)
const updatingUserId = ref(null)
const formMode = ref(null)
const formUser = ref(null)
const formSubmitting = ref(false)
const formError = ref('')
const successMessage = ref('')

const userCountLabel = computed(() => `${users.value.length} ${users.value.length === 1 ? 'usuario registrado' : 'usuarios registrados'}`)

async function loadUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await listUsers()
    users.value = response.data.data || []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible cargar los usuarios.'
  } finally {
    loading.value = false
  }
}

async function toggleStatus(user) {
  updatingUserId.value = user.id
  errorMessage.value = ''
  try {
    await setUserStatus(user.id, user.estado !== 'ACTIVO')
    user.estado = user.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible actualizar el estado.'
  } finally {
    updatingUserId.value = null
  }
}

function askToDelete(user) {
  pendingUser.value = user
}

function openCreateForm() {
  successMessage.value = ''
  formError.value = ''
  formUser.value = null
  formMode.value = 'create'
}

function openEditForm(user) {
  successMessage.value = ''
  formError.value = ''
  formUser.value = user
  formMode.value = 'edit'
}

function closeForm() {
  formMode.value = null
  formUser.value = null
  formError.value = ''
}

async function saveUser(payload) {
  formSubmitting.value = true
  formError.value = ''
  try {
    const response = formMode.value === 'create'
      ? await createUser(payload)
      : await updateUser(formUser.value.id, payload)
    const savedUser = response.data.data

    if (formMode.value === 'create') {
      users.value = [...users.value, savedUser]
      successMessage.value = 'Usuario creado correctamente'
    } else {
      const index = users.value.findIndex((user) => user.id === savedUser.id)
      if (index !== -1) users.value[index] = savedUser
      successMessage.value = 'Usuario modificado correctamente'
    }
    closeForm()
  } catch (error) {
    formError.value = error.response?.data?.message || 'No fue posible guardar el usuario.'
  } finally {
    formSubmitting.value = false
  }
}

async function deleteUser() {
  if (!pendingUser.value) return
  const userId = pendingUser.value.id
  errorMessage.value = ''
  try {
    await deleteUserRequest(userId)
    users.value = users.value.filter((user) => user.id !== userId)
    pendingUser.value = null
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible eliminar el usuario.'
  }
}

onMounted(loadUsers)
</script>

<template>
  <section class="users-page">
    <header class="users-page__header">
      <div>
        <h1>Gestión de Usuarios</h1>
        <p>{{ userCountLabel }}</p>
      </div>
      <button class="create-user-button" type="button" @click="openCreateForm">
        <span aria-hidden="true">+</span>
        Crear usuario
      </button>
    </header>

    <p v-if="successMessage" class="users-feedback users-feedback--success" role="status">{{ successMessage }}</p>
    <p v-if="errorMessage" class="users-feedback users-feedback--error" role="alert">{{ errorMessage }}</p>
    <p v-if="loading" class="users-feedback">Cargando usuarios...</p>

    <UserForm
      v-if="formMode"
      :mode="formMode"
      :user="formUser"
      :submitting="formSubmitting"
      :server-error="formError"
      @submit="saveUser"
      @cancel="closeForm"
    />

    <UsersTable
      v-if="!loading"
      :users="users"
      :updating-user-id="updatingUserId"
      @toggle-status="toggleStatus"
      @edit="openEditForm"
      @delete="askToDelete"
    />

    <ConfirmModal
      :open="Boolean(pendingUser)"
      message="¿Desea eliminar este usuario?"
      @cancel="pendingUser = null"
      @confirm="deleteUser"
    />
  </section>
</template>
