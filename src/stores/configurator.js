import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { useCarsStore } from './cars'

export const useConfiguratorStore = defineStore('configurator', () => {
  const carsStore = useCarsStore()

  // State
  const categories = ref([])
  const options = ref([])
  const packages = ref([])
  const accordions = ref([])

  const selectedOptions = ref(new Map()) // Map<optionId, { option, category }>
  const selectedPackage = ref(null)

  const loading = ref(false)
  const error = ref(null)

  // Computed - итоговая стоимость
  const totalPrice = computed(() => {
    let total = 0

    selectedOptions.value.forEach((item) => {
      const option = item.option
      const carId = carsStore.selectedCar?.id

      if (!carId) {
        // Если машина не выбрана, используем базовую цену
        total += parseFloat(option.base_price || 0)
      } else {
        // Ищем специальную цену для выбранной машины
        const carPrice = option.car_prices?.find((cp) => cp.car_id === carId)

        if (carPrice && carPrice.price !== null) {
          total += parseFloat(carPrice.price)
        } else {
          // Если нет спец. цены, ищем цену по размеру
          const car = carsStore.selectedCar
          if (car?.size_id) {
            const sizePrice = option.size_prices?.find((sp) => sp.size_id === car.size_id)
            if (sizePrice) {
              total += parseFloat(sizePrice.price)
            } else {
              total += parseFloat(option.base_price || 0)
            }
          } else {
            total += parseFloat(option.base_price || 0)
          }
        }
      }
    })

    return total
  })

  // Computed - список выбранных опций для отображения
  const selectedOptionsList = computed(() => {
    return Array.from(selectedOptions.value.values()).map((item) => ({
      ...item.option,
      categoryName: item.category?.label || 'Без категории',
      price: getOptionPrice(item.option),
    }))
  })

  // Получить цену опции для текущей машины
  function getOptionPrice(option) {
    const carId = carsStore.selectedCar?.id

    if (!carId) {
      return parseFloat(option.base_price || 0)
    }

    // Проверяем специальную цену для машины
    const carPrice = option.car_prices?.find((cp) => cp.car_id === carId)
    if (carPrice && carPrice.price !== null) {
      return parseFloat(carPrice.price)
    }

    // Проверяем цену по размеру
    const car = carsStore.selectedCar
    if (car?.size_id) {
      const sizePrice = option.size_prices?.find((sp) => sp.size_id === car.size_id)
      if (sizePrice) {
        return parseFloat(sizePrice.price)
      }
    }

    return parseFloat(option.base_price || 0)
  }

  // Загрузка категорий
  async function fetchCategories() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError

      // Строим дерево категорий
      categories.value = buildCategoryTree(data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Загрузка опций с ценами
  async function fetchOptions() {
    loading.value = true
    error.value = null

    try {
      // Загружаем опции
      const { data: optionsData, error: optionsError } = await supabase
        .from('options')
        .select('*')
        .order('sort_order', { ascending: true })

      if (optionsError) throw optionsError

      // Загружаем цены для машин
      const { data: carPrices, error: carPricesError } = await supabase
        .from('car_option_prices')
        .select('*')

      if (carPricesError) throw carPricesError

      // Загружаем цены по размерам
      const { data: sizePrices, error: sizePricesError } = await supabase
        .from('size_option_prices')
        .select('*')

      if (sizePricesError) throw sizePricesError

      // Загружаем связи опций с категориями
      const { data: categoryOptions, error: categoryOptionsError } = await supabase
        .from('category_options')
        .select('*')

      if (categoryOptionsError) throw categoryOptionsError

      // Обогащаем опции данными
      options.value = optionsData.map((option) => ({
        ...option,
        car_prices: carPrices.filter((cp) => cp.option_id === option.id),
        size_prices: sizePrices.filter((sp) => sp.option_id === option.id),
        categories: categoryOptions
          .filter((co) => co.option_id === option.id)
          .map((co) => co.category_id),
      }))
    } catch (err) {
      console.error('Error fetching options:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Загрузка пакетов
  async function fetchPackages() {
    try {
      const { data, error: fetchError } = await supabase
        .from('packages')
        .select(
          `
          *,
          package_categories(
            category_id,
            enabled,
            sort_order
          )
        `,
        )
        .eq('active', true)
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError
      packages.value = data || []
    } catch (err) {
      console.error('Error fetching packages:', err)
    }
  }

  // Загрузка настроек аккордеонов
  async function fetchAccordions() {
    try {
      const { data, error: fetchError } = await supabase.from('accordions').select('*')

      if (fetchError) throw fetchError
      accordions.value = data || []
    } catch (err) {
      console.error('Error fetching accordions:', err)
    }
  }

  // Построение дерева категорий
  function buildCategoryTree(flatCategories) {
    const categoryMap = new Map()
    const rootCategories = []

    // Создаём map для быстрого доступа
    flatCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [], options: [] })
    })

    // Строим дерево
    flatCategories.forEach((cat) => {
      const category = categoryMap.get(cat.id)

      // Добавляем опции в категорию
      category.options = options.value.filter((opt) => opt.categories.includes(cat.id))

      // Строим иерархию
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id)
        if (parent) {
          parent.children.push(category)
        }
      } else {
        rootCategories.push(category)
      }
    })

    return rootCategories
  }

  // Переключение выбора опции
  function toggleOption(option, category) {
    const optionId = option.id

    if (selectedOptions.value.has(optionId)) {
      selectedOptions.value.delete(optionId)
    } else {
      selectedOptions.value.set(optionId, { option, category })
    }
  }

  // Проверка, выбрана ли опция
  function isOptionSelected(optionId) {
    return selectedOptions.value.has(optionId)
  }

  // Очистка выбора
  function clearSelection() {
    selectedOptions.value.clear()
    selectedPackage.value = null
  }

  // Выбор пакета
  function selectPackage(pkg) {
    selectedPackage.value = pkg
    // Здесь можно добавить логику автоматического выбора опций из пакета
  }

  // Инициализация
  async function initialize() {
    await Promise.all([fetchCategories(), fetchOptions(), fetchPackages(), fetchAccordions()])

    // Перестраиваем дерево категорий после загрузки опций
    if (categories.value.length > 0) {
      const flatCategories = flattenCategories(categories.value)
      categories.value = buildCategoryTree(flatCategories)
    }
  }

  // Вспомогательная функция для преобразования дерева в плоский список
  function flattenCategories(tree) {
    const result = []

    function traverse(node) {
      result.push({
        id: node.id,
        label: node.label,
        info: node.info,
        multiple: node.multiple,
        sort_order: node.sort_order,
        dealer_accordion: node.dealer_accordion,
        parent_id: node.parent_id,
      })

      if (node.children) {
        node.children.forEach(traverse)
      }
    }

    tree.forEach(traverse)
    return result
  }

  return {
    // State
    categories,
    options,
    packages,
    accordions,
    selectedOptions,
    selectedPackage,
    loading,
    error,

    // Computed
    totalPrice,
    selectedOptionsList,

    // Actions
    fetchCategories,
    fetchOptions,
    fetchPackages,
    fetchAccordions,
    toggleOption,
    isOptionSelected,
    clearSelection,
    selectPackage,
    getOptionPrice,
    initialize,
  }
})
