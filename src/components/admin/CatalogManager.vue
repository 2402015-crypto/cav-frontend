<script setup>
defineProps({
  catalog: { type: Object, required: true },
  records: { type: Array, required: true },
  search: { type: String, default: '' },
  newName: { type: String, default: '' },
  editingId: { type: [Number, String], default: null },
  editingName: { type: String, default: '' },
  loading: Boolean,
  saving: Boolean,
})

defineEmits(['update:search', 'update:newName', 'update:editingName', 'add', 'edit', 'save-edit', 'cancel-edit', 'delete'])
</script>

<template>
  <section class="catalog-manager">
    <header class="catalog-manager__header">
      <div class="catalog-manager__title">
        <span class="catalog-manager__icon" :style="{ '--catalog-color': catalog.color }">
          <svg v-if="catalog.icon === 'truck'" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>
          <svg v-else-if="catalog.icon === 'grid'" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></svg>
          <svg v-else-if="catalog.icon === 'document'" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6M9 16h6" /></svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15h14l-1-6H6zM7 15l-1 3M17 15l1 3M8 9l2-3h4l2 3" /><circle cx="8" cy="18" r="1" /><circle cx="16" cy="18" r="1" /></svg>
        </span>
        <div>
          <h2>{{ catalog.label }}</h2>
          <p>{{ records.length }} {{ records.length === 1 ? 'registro' : 'registros' }} en el catálogo</p>
        </div>
      </div>
    </header>

    <div class="catalog-manager__toolbar">
      <div class="catalog-manager__search">
        <label for="catalog-search">BUSCAR REGISTROS</label>
        <input id="catalog-search" :value="search" type="search" placeholder="Buscar en el catálogo..." @input="$emit('update:search', $event.target.value)" />
      </div>
      <div class="catalog-manager__add">
        <label for="catalog-new-name">AGREGAR NUEVO</label>
        <div class="catalog-manager__add-row">
          <input id="catalog-new-name" :value="newName" type="text" maxlength="150" placeholder="Nombre del nuevo registro" @input="$emit('update:newName', $event.target.value)" @keyup.enter="$emit('add')" />
          <button type="button" :disabled="saving || !newName.trim()" @click="$emit('add')"><span aria-hidden="true">+</span> Agregar</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="catalog-manager__status">Cargando registros...</div>
    <div v-else-if="!records.length" class="catalog-manager__status">No hay registros en este catálogo.</div>
    <div v-else class="catalog-manager__list">
      <div v-for="(record, index) in records" :key="record.id" class="catalog-row">
        <span class="catalog-row__number">{{ String(index + 1).padStart(2, '0') }}</span>
        <template v-if="editingId === record.id">
          <input class="catalog-row__edit-input" :value="editingName" type="text" maxlength="150" @input="$emit('update:editingName', $event.target.value)" @keyup.enter="$emit('save-edit')" />
          <div class="catalog-row__actions">
            <button class="table-action table-action--edit" type="button" :disabled="saving" @click="$emit('save-edit')">Guardar</button>
            <button class="table-action table-action--delete" type="button" :disabled="saving" @click="$emit('cancel-edit')">Cancelar</button>
          </div>
        </template>
        <template v-else>
          <strong>{{ record.nombre }}</strong>
          <div class="catalog-row__actions">
            <button class="table-action table-action--edit" type="button" @click="$emit('edit', record)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4.8L8 20l10.8-10.8a2.8 2.8 0 0 0-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></svg>Editar</button>
            <button class="table-action table-action--delete" type="button" @click="$emit('delete', record)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M7 7l1 13h8l1-13M9 7V4h6v3" /></svg>Eliminar</button>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>