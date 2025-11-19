import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/',
      name: 'configurator',
      component: () => import('@/views/ConfiguratorView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Ждём инициализации auth если ещё не инициализирован
  if (authStore.loading) {
    await new Promise((resolve) => {
      const unwatch = router.app.$watch(
        () => authStore.loading,
        (newVal) => {
          if (!newVal) {
            unwatch()
            resolve()
          }
        },
      )
    })
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest)

  if (requiresAuth && !authStore.isAuthenticated) {
    // Требуется авторизация, но пользователь не залогинен
    next({ name: 'login' })
  } else if (requiresGuest && authStore.isAuthenticated) {
    // Страница для гостей, но пользователь залогинен
    next({ name: 'configurator' })
  } else {
    next()
  }
})

export default router
