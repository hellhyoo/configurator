import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Инициализируем auth store перед монтированием
const authStore = useAuthStore()
authStore.initialize().then(() => {
  // После инициализации auth подключаем роутер и монтируем приложение
  app.use(router)
  app.mount('#app')
})
