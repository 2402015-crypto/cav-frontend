import http from './http'

export const catalogDefinitions = {
  marcas: {
    key: 'marcas',
    label: 'Marcas',
    singular: 'marca',
    description: 'Fabricantes de vehículos',
    endpoint: '/catalogos/marcas',
    icon: 'truck',
    color: '#327094',
  },
  colores: {
    key: 'colores',
    label: 'Colores',
    singular: 'color',
    description: 'Colores disponibles',
    endpoint: '/catalogos/colores',
    icon: 'grid',
    color: '#7CB09D',
  },
  empresas: {
    key: 'empresas',
    label: 'Empresas',
    singular: 'empresa',
    description: 'Proveedores, contratistas y paqueterías',
    endpoint: '/empresas',
    icon: 'document',
    color: '#9BAAA4',
  },
  transportadoras: {
    key: 'transportadoras',
    label: 'Transportadoras',
    singular: 'transportadora',
    description: 'Agencias transportadoras',
    endpoint: '/transportadoras',
    icon: 'car',
    color: '#6B7E8F',
  },
}

function definitionFor(key) {
  return catalogDefinitions[key]
}

export function listCatalog(key) {
  return http.get(definitionFor(key).endpoint)
}

export function suggestCatalog(key, query) {
  return http.get(`${definitionFor(key).endpoint}/sugerencias`, { params: { q: query } })
}

export function createCatalog(key, payload) {
  return http.post(definitionFor(key).endpoint, payload)
}

export function updateCatalog(key, id, payload) {
  return http.put(`${definitionFor(key).endpoint}/${id}`, payload)
}

export function deleteCatalog(key, id) {
  return http.delete(`${definitionFor(key).endpoint}/${id}`)
}