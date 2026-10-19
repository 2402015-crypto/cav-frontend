import { defineStore } from 'pinia'
import {
  catalogDefinitions,
  createCatalog,
  deleteCatalog,
  listCatalog,
  suggestCatalog,
  updateCatalog,
} from '@/services/api/catalogos'

export const useCatalogosStore = defineStore('catalogos', {
  state: () => ({
    records: Object.fromEntries(Object.keys(catalogDefinitions).map((key) => [key, []])),
    loading: Object.fromEntries(Object.keys(catalogDefinitions).map((key) => [key, false])),
    error: '',
  }),

  getters: {
    count: (state) => (key) => state.records[key]?.length || 0,
  },

  actions: {
    async load(key) {
      this.loading[key] = true
      this.error = ''
      try {
        const response = await listCatalog(key)
        this.records[key] = response.data.data || []
      } catch (error) {
        this.error = error.response?.data?.message || 'No fue posible cargar los catálogos.'
        throw error
      } finally {
        this.loading[key] = false
      }
    },

    async loadAll() {
      await Promise.all(Object.keys(catalogDefinitions).map((key) => this.load(key)))
    },

    async suggest(key, query) {
      const response = await suggestCatalog(key, query)
      return response.data.data || []
    },

    async create(key, name) {
      const response = await createCatalog(key, { nombre: name })
      await this.load(key)
      return response.data.data
    },

    async update(key, id, name) {
      const response = await updateCatalog(key, id, { nombre: name })
      await this.load(key)
      return response.data.data
    },

    async remove(key, id) {
      await deleteCatalog(key, id)
      await this.load(key)
    },
  },
})