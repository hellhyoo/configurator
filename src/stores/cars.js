import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'

export const useCarsStore = defineStore('cars', () => {
  const brands = ref([])
  const cars = ref([])
  const sizes = ref([])

  const selectedBrand = ref(null)
  const selectedCar = ref(null)

  const loading = ref(false)
  const error = ref(null)

  // Computed свойства
  const availableCars = computed(() => {
    if (!selectedBrand.value) return []
    return cars.value.filter((car) => car.brand_id === selectedBrand.value.id && car.active)
  })

  const selectedCarImage = computed(() => {
    return selectedCar.value?.image || null
  })

  // Загрузка брендов
  async function fetchBrands() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      brands.value = data || []
    } catch (err) {
      console.error('Error fetching brands:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Загрузка всех автомобилей (активных)
  async function fetchCars() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('cars')
        .select(
          `
          *,
          brand:brands(id, name),
          size:sizes(id, label)
        `,
        )
        .eq('active', true)
        .order('model', { ascending: true })

      if (fetchError) throw fetchError
      cars.value = data || []
    } catch (err) {
      console.error('Error fetching cars:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Загрузка размеров автомобилей (опционально, если нужно)
  async function fetchSizes() {
    try {
      const { data, error: fetchError } = await supabase
        .from('sizes')
        .select('*')
        .order('label', { ascending: true })

      if (fetchError) throw fetchError
      sizes.value = data || []
    } catch (err) {
      console.error('Error fetching sizes:', err)
    }
  }

  // Выбор бренда
  function selectBrand(brand) {
    selectedBrand.value = brand
    selectedCar.value = null
  }

  // Выбор автомобиля
  function selectCar(car) {
    selectedCar.value = car

    // Автоматически устанавливаем бренд если не выбран
    if (!selectedBrand.value && car) {
      const carBrand = brands.value.find((b) => b.id === car.brand_id)
      if (carBrand) {
        selectedBrand.value = carBrand
      }
    }
  }

  // Сброс выбора
  function resetSelection() {
    selectedBrand.value = null
    selectedCar.value = null
  }

  // Инициализация: загружаем все данные
  async function initialize() {
    await Promise.all([fetchBrands(), fetchCars(), fetchSizes()])
  }

  return {
    // State
    brands,
    cars,
    sizes,
    selectedBrand,
    selectedCar,
    loading,
    error,

    // Computed
    availableCars,
    selectedCarImage,

    // Actions
    fetchBrands,
    fetchCars,
    fetchSizes,
    selectBrand,
    selectCar,
    resetSelection,
    initialize,
  }
})
