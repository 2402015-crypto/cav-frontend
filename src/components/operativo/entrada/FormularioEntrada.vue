<script setup>
import { computed, ref } from 'vue'
import { createManualEntry, suggestBrands, suggestColors } from '@/services/api/entradas'

const props = defineProps({
  typeKey: { type: String, required: true },
  typeLabel: { type: String, required: true },
  plate: { type: String, required: true },
  initialData: { type: Object, default: null },
})

const emit = defineEmits(['back', 'registered'])
const now = new Date()
const form = ref({
  nombreCompleto: props.initialData?.nombreCompleto || '',
  area: props.initialData?.area || '',
  marca: props.initialData?.marca || '',
  placa: props.initialData?.placa || props.plate,
  color: props.initialData?.color || '',
  observaciones: '',
})
const fecha = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
const brandSuggestions = ref([])
const colorSuggestions = ref([])
const activeSuggestion = ref('')
const saving = ref(false)
const errorMessage = ref('')

const valid = computed(() => form.value.nombreCompleto.trim() && form.value.marca.trim() && form.value.placa.trim() && form.value.color.trim())

async function suggest(kind, value) {
  activeSuggestion.value = kind
  if (!value.trim()) {
    if (kind === 'marca') brandSuggestions.value = []
    else colorSuggestions.value = []
    return
  }
  try {
    const response = kind === 'marca' ? await suggestBrands(value.trim()) : await suggestColors(value.trim())
    if (kind === 'marca') brandSuggestions.value = response.data.data || []
    else colorSuggestions.value = response.data.data || []
  } catch {
    if (kind === 'marca') brandSuggestions.value = []
    else colorSuggestions.value = []
  }
}

function chooseSuggestion(kind, item) {
  form.value[kind] = item.nombre
  activeSuggestion.value = ''
}

async function submit() {
  if (!valid.value || saving.value) return
  saving.value = true
  errorMessage.value = ''
  try {
    const response = await createManualEntry({ tipoRegistro: props.typeKey, ...form.value })
    emit('registered', response.data.data)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No fue posible registrar la entrada.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="entry-form-card">
    <div class="entry-form-type">
      <span class="entry-form-type__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5 20c.8-3.4 3-5 7-5s6.2 1.6 7 5" /></svg></span>
      <div><label>TIPO DE REGISTRO</label><strong>{{ typeKey === 'general' ? 'Colaborador' : typeLabel }}</strong></div>
    </div>
    <div class="entry-form-fields">
      <label>FECHA<input :value="fecha" type="text" readonly /></label>
      <label>HORA DE ENTRADA<input :value="hora" type="text" readonly /></label>
      <label>NOMBRE COMPLETO<input v-model="form.nombreCompleto" type="text" placeholder="Nombre completo" /></label>
      <label>ÁREA<input v-model="form.area" type="text" placeholder="Nombre del área" /></label>
      <label class="entry-autocomplete">MARCA DEL VEHÍCULO<input v-model="form.marca" type="text" placeholder="Marca" @input="suggest('marca', form.marca)" @focus="suggest('marca', form.marca)" /><span v-if="activeSuggestion === 'marca' && brandSuggestions.length" class="entry-suggestions"><button v-for="item in brandSuggestions" :key="item.id" type="button" @mousedown.prevent="chooseSuggestion('marca', item)">{{ item.nombre }}</button></span></label>
      <label>PLACA VEHICULAR<input v-model="form.placa" type="text" readonly /></label>
      <label class="entry-autocomplete">COLOR<input v-model="form.color" type="text" placeholder="Color" @input="suggest('color', form.color)" @focus="suggest('color', form.color)" /><span v-if="activeSuggestion === 'color' && colorSuggestions.length" class="entry-suggestions"><button v-for="item in colorSuggestions" :key="item.id" type="button" @mousedown.prevent="chooseSuggestion('color', item)">{{ item.nombre }}</button></span></label>
      <label>OBSERVACIONES<textarea v-model="form.observaciones" placeholder="Notas adicionales" /></label>
    </div>
    <p v-if="errorMessage" class="entry-form-error" role="alert">{{ errorMessage }}</p>
    <button class="entry-form-submit" type="button" :disabled="!valid || saving" @click="submit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg>Registrar Entrada · {{ hora }}</button>
  </section>
</template>