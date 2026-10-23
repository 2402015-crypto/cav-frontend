<script setup>
import { computed, ref } from 'vue'
import { createManualEntry, suggestBrands, suggestColors, suggestCompanies, suggestTransporters } from '@/services/api/entradas'

const props = defineProps({
  typeKey: { type: String, required: true },
  typeLabel: { type: String, required: true },
  plate: { type: String, required: true },
  initialData: { type: Object, default: null },
})

const emit = defineEmits(['back', 'registered'])
const isProvider = computed(() => props.typeKey === 'proveedores')
const isTransporter = computed(() => props.typeKey === 'transportadoras')
const now = new Date()
const fechaEntradaInicio = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
const form = ref({
  nombreCompleto: props.initialData?.nombreCompleto || '',
  area: props.initialData?.area || '',
  empresa: props.initialData?.empresa || '',
  transportadora: props.initialData?.transportadora || '',
  marca: props.initialData?.marca || (isProvider.value || isTransporter.value ? 'N/A' : ''),
  placa: props.initialData?.placa || props.plate,
  color: isTransporter.value ? 'N/A' : props.initialData?.color || (isProvider.value ? 'N/A' : ''),
  tipoMovimiento: isTransporter.value ? '' : props.initialData?.tipoMovimiento || '',
  villa: isTransporter.value ? '' : props.initialData?.villa || '',
  numeroPax: isTransporter.value ? null : props.initialData?.numeroPax ?? null,
  observaciones: '',
})
const fecha = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
const brandSuggestions = ref([])
const colorSuggestions = ref([])
const companySuggestions = ref([])
const transporterSuggestions = ref([])
const activeSuggestion = ref('')
const saving = ref(false)
const errorMessage = ref('')

const valid = computed(() => form.value.nombreCompleto.trim() && form.value.placa.trim()
  && (isProvider.value ? form.value.empresa.trim()
    : isTransporter.value ? form.value.transportadora.trim() && form.value.tipoMovimiento
    : form.value.marca.trim() && form.value.color.trim()))

async function suggest(kind, value) {
  activeSuggestion.value = kind
  if (!value.trim()) {
    if (kind === 'marca') brandSuggestions.value = []
    else if (kind === 'color') colorSuggestions.value = []
    else if (kind === 'empresa') companySuggestions.value = []
    else transporterSuggestions.value = []
    return
  }
  try {
    const response = kind === 'marca'
      ? await suggestBrands(value.trim())
      : kind === 'color' ? await suggestColors(value.trim())
        : kind === 'empresa' ? await suggestCompanies(value.trim()) : await suggestTransporters(value.trim())
    if (kind === 'marca') brandSuggestions.value = response.data.data || []
    else if (kind === 'color') colorSuggestions.value = response.data.data || []
    else if (kind === 'empresa') companySuggestions.value = response.data.data || []
    else transporterSuggestions.value = response.data.data || []
  } catch {
    if (kind === 'marca') brandSuggestions.value = []
    else if (kind === 'color') colorSuggestions.value = []
    else if (kind === 'empresa') companySuggestions.value = []
    else transporterSuggestions.value = []
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
    const response = await createManualEntry({
      tipoRegistro: props.typeKey,
      ...form.value,
      fechaEntrada: fechaEntradaInicio,
      transportadora: isTransporter.value ? form.value.transportadora : null,
      tipoMovimiento: isTransporter.value ? form.value.tipoMovimiento : null,
      villa: isTransporter.value ? form.value.villa : null,
      numeroPax: isTransporter.value ? form.value.numeroPax : null,
      marca: isProvider.value && form.value.marca === 'N/A' ? null : form.value.marca,
      color: isProvider.value && form.value.color === 'N/A' ? null : form.value.color,
      destino: isProvider.value ? form.value.area : null,
    })
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
      <span class="entry-form-type__icon"><svg v-if="isTransporter" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="14" rx="2" /><path d="M4 12h16M8 8h.1M16 8h.1M7 18v2M17 18v2" /><circle cx="8" cy="15" r="1" /><circle cx="16" cy="15" r="1" /></svg><svg v-else-if="isProvider" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg><svg v-else viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5 20c.8-3.4 3-5 7-5s6.2 1.6 7 5" /></svg></span>
      <div><label>TIPO DE REGISTRO</label><strong>{{ typeKey === 'general' ? 'Colaborador' : typeLabel }}</strong></div>
    </div>
    <div class="entry-form-fields">
      <label>FECHA<input :value="fecha" type="text" readonly /></label>
      <label>HORA DE ENTRADA<input :value="hora" type="text" readonly /></label>
      <label>NOMBRE COMPLETO<input v-model="form.nombreCompleto" type="text" placeholder="Nombre completo" /></label>
      <label v-if="isProvider" class="entry-autocomplete">NOMBRE DE LA EMPRESA<input v-model="form.empresa" type="text" placeholder="Escribe para buscar o crear una empresa" @input="suggest('empresa', form.empresa)" @focus="suggest('empresa', form.empresa)" /><small class="entry-field-help">Si la empresa no existe, se guardará automáticamente para futuras sugerencias.</small><span v-if="activeSuggestion === 'empresa' && companySuggestions.length" class="entry-suggestions"><button v-for="item in companySuggestions" :key="item.id" type="button" @mousedown.prevent="chooseSuggestion('empresa', item)">{{ item.nombre }}</button></span></label>
      <label v-if="isTransporter" class="entry-autocomplete">COMPAÑÍA O AGENCIA<input v-model="form.transportadora" type="text" placeholder="Nombre de la compañía" @input="suggest('transportadora', form.transportadora)" @focus="suggest('transportadora', form.transportadora)" /><small class="entry-field-help">Si la transportadora no existe, se guardará automáticamente para futuras sugerencias.</small><span v-if="activeSuggestion === 'transportadora' && transporterSuggestions.length" class="entry-suggestions"><button v-for="item in transporterSuggestions" :key="item.id" type="button" @mousedown.prevent="chooseSuggestion('transportadora', item)">{{ item.nombre }}</button></span></label>
      <label v-if="!isTransporter">{{ isProvider ? 'ÁREA DE DESTINO' : 'ÁREA' }}<input v-model="form.area" type="text" :placeholder="isProvider ? 'Área de destino' : 'Nombre del área'" /></label>
      <label class="entry-autocomplete">MARCA DEL VEHÍCULO<input v-model="form.marca" type="text" :placeholder="isProvider ? 'N/A' : 'Marca'" @input="suggest('marca', form.marca)" @focus="suggest('marca', form.marca)" /><span v-if="activeSuggestion === 'marca' && brandSuggestions.length" class="entry-suggestions"><button v-for="item in brandSuggestions" :key="item.id" type="button" @mousedown.prevent="chooseSuggestion('marca', item)">{{ item.nombre }}</button></span></label>
      <label>PLACA VEHICULAR<input v-model="form.placa" type="text" readonly /></label>
      <label v-if="!isTransporter" class="entry-autocomplete">COLOR<input v-model="form.color" type="text" :placeholder="isProvider ? 'N/A' : 'Color'" @input="suggest('color', form.color)" @focus="suggest('color', form.color)" /><span v-if="activeSuggestion === 'color' && colorSuggestions.length" class="entry-suggestions"><button v-for="item in colorSuggestions" :key="item.id" type="button" @mousedown.prevent="chooseSuggestion('color', item)">{{ item.nombre }}</button></span></label>
      <label v-if="isTransporter">TIPO DE MOVIMIENTO
        <span class="entry-movement-options"><button type="button" :class="{ 'entry-movement-option--active': form.tipoMovimiento === 'IN' }" @click="form.tipoMovimiento = 'IN'">▣&nbsp; IN</button><button type="button" :class="{ 'entry-movement-option--active': form.tipoMovimiento === 'OUT' }" @click="form.tipoMovimiento = 'OUT'">□&nbsp; OUT</button></span>
      </label>
      <label v-if="isTransporter">VILLA<input v-model="form.villa" type="text" placeholder="Número de villa" /></label>
      <label v-if="isTransporter">NÚMERO DE PASAJEROS (PAX)<input v-model.number="form.numeroPax" type="number" min="0" placeholder="N/A" /></label>
      <label>OBSERVACIONES<textarea v-model="form.observaciones" placeholder="Notas adicionales" /></label>
    </div>
    <p v-if="errorMessage" class="entry-form-error" role="alert">{{ errorMessage }}</p>
    <button class="entry-form-submit" type="button" :disabled="!valid || saving" @click="submit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5M4 12h10M10 8l4 4-4 4" /></svg>Registrar Entrada · {{ hora }}</button>
  </section>
</template>