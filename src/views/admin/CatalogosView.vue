<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import CatalogCard from '@/components/admin/CatalogCard.vue'
import CatalogManager from '@/components/admin/CatalogManager.vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import { catalogDefinitions } from '@/services/api/catalogos'
import { useCatalogosStore } from '@/stores/catalogos'

const store = useCatalogosStore()
const catalogKeys = Object.keys(catalogDefinitions)
const selectedKey = ref(null)
const search = ref('')
const filteredRecords = ref([])
const newName = ref('')
const editingId = ref(null)
const editingName = ref('')
const pendingRecord = ref(null)
const saving = ref(false)
const feedback = ref('')
const searchTimer = ref(null)

const selectedCatalog = computed(() => selectedKey.value ? catalogDefinitions[selectedKey.value] : null)
const selectedRecords = computed(() => selectedKey.value ? filteredRecords.value : [])

function catalogRecords(key) {
  return store.records[key] || []
}

async function selectCatalog(key) {
  selectedKey.value = key
  search.value = ''
  filteredRecords.value = catalogRecords(key)
  feedback.value = ''
  editingId.value = null
  if (!catalogRecords(key).length && !store.error) {
    await store.load(key)
    filteredRecords.value = catalogRecords(key)
  }
}

async function refreshSearch() {
  if (!selectedKey.value) return
  const query = search.value.trim()
  if (!query) {
    filteredRecords.value = catalogRecords(selectedKey.value)
    return
  }
  try {
    filteredRecords.value = await store.suggest(selectedKey.value, query)
  } catch (error) {
    feedback.value = error.response?.data?.message || 'No fue posible buscar registros.'
  }
}

function scheduleSearch() {
  window.clearTimeout(searchTimer.value)
  searchTimer.value = window.setTimeout(refreshSearch, 250)
}

async function addRecord() {
  if (!selectedKey.value || !newName.value.trim()) return
  saving.value = true
  feedback.value = ''
  try {
    await store.create(selectedKey.value, newName.value.trim())
    newName.value = ''
    await refreshSearch()
  } catch (error) {
    feedback.value = error.response?.data?.message || 'No fue posible agregar el registro.'
  } finally {
    saving.value = false
  }
}

function startEdit(record) {
  editingId.value = record.id
  editingName.value = record.nombre
  feedback.value = ''
}

function cancelEdit() {
  editingId.value = null
  editingName.value = ''
}

async function saveEdit() {
  if (!selectedKey.value || !editingId.value || !editingName.value.trim()) return
  saving.value = true
  feedback.value = ''
  try {
    await store.update(selectedKey.value, editingId.value, editingName.value.trim())
    cancelEdit()
    await refreshSearch()
  } catch (error) {
    feedback.value = error.response?.data?.message || 'No fue posible actualizar el registro.'
  } finally {
    saving.value = false
  }
}

function askDelete(record) {
  pendingRecord.value = record
}

async function deleteRecord() {
  if (!selectedKey.value || !pendingRecord.value) return
  saving.value = true
  feedback.value = ''
  try {
    await store.remove(selectedKey.value, pendingRecord.value.id)
    pendingRecord.value = null
    await refreshSearch()
  } catch (error) {
    feedback.value = error.response?.data?.message || 'No fue posible eliminar el registro.'
  } finally {
    saving.value = false
  }
}

watch(search, scheduleSearch)

onMounted(async () => {
  try {
    await store.loadAll()
  } catch {
    feedback.value = store.error
  }
})
</script>

<template>
  <section class="catalogs-page">
    <header class="catalogs-page__header">
      <h1>Catálogos</h1>
      <p>Administración de catálogos del sistema</p>
    </header>

    <section class="catalog-selector">
      <p class="catalog-selector__label">SELECCIONA UN CATÁLOGO</p>
      <div class="catalog-selector__grid">
        <CatalogCard v-for="key in catalogKeys" :key="key" :catalog="catalogDefinitions[key]" :count="store.count(key)" :active="selectedKey === key" @select="selectCatalog(key)" />
      </div>
    </section>

    <p v-if="feedback" class="catalogs-feedback" role="alert">{{ feedback }}</p>

    <CatalogManager
      v-if="selectedCatalog"
      :catalog="selectedCatalog"
      :records="selectedRecords"
      :search="search"
      :new-name="newName"
      :editing-id="editingId"
      :editing-name="editingName"
      :loading="store.loading[selectedKey]"
      :saving="saving"
      @update:search="search = $event"
      @update:new-name="newName = $event"
      @update:editing-name="editingName = $event"
      @add="addRecord"
      @edit="startEdit"
      @save-edit="saveEdit"
      @cancel-edit="cancelEdit"
      @delete="askDelete"
    />

    <section v-else class="catalog-empty-state">
      <span class="catalog-empty-state__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 13.7 5l2.3-.2 1 2.1 2.1 1-.2 2.3 1.6 1.8-1.6 1.8.2 2.3-2.1 1-1 2.1-2.3-.2-1.7 1.5-1.7-1.5-2.3.2-1-2.1-2.1-1 .2-2.3L3.5 12l1.6-1.8-.2-2.3 2.1-1 1-2.1 2.3.2L12 3.5Z" /><circle cx="12" cy="12" r="3" /></svg></span>
      <h2>Selecciona un catálogo para administrarlo</h2>
      <p>Podrás buscar, agregar y eliminar registros.</p>
    </section>

    <ConfirmModal :open="Boolean(pendingRecord)" message="¿Desea eliminar este registro?" @cancel="pendingRecord = null" @confirm="deleteRecord" />
  </section>
</template>