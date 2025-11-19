<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="logo-section">
          <img src="/logo.svg" alt="Logo" class="logo" />
          <h1 class="title">Конфигуратор услуг</h1>
        </div>

        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="your@email.com"
              required
              autocomplete="email"
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Пароль</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              required
              autocomplete="current-password"
              :disabled="loading"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="submit-button" :disabled="loading">
            <span v-if="!loading">Войти</span>
            <span v-else>Загрузка...</span>
          </button>
        </form>

        <div class="footer-text">
          <p>Нет аккаунта? Обратитесь к администратору</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  if (!email.value || !password.value) {
    error.value = 'Заполните все поля'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { error: signInError } = await authStore.signIn(email.value, password.value)

    if (signInError) {
      // Обработка различных ошибок
      if (signInError.message.includes('Invalid login credentials')) {
        error.value = 'Неверный email или пароль'
      } else if (signInError.message.includes('Email not confirmed')) {
        error.value = 'Email не подтверждён. Проверьте почту'
      } else {
        error.value = signInError.message
      }
      return
    }

    // Успешный вход - редирект на главную
    router.push({ name: 'configurator' })
  } catch (err) {
    console.error('Login error:', err)
    error.value = 'Произошла ошибка при входе'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 440px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.form-input::placeholder {
  color: #9ca3af;
}

.error-message {
  padding: 12px 16px;
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
  font-weight: 500;
}

.submit-button {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.footer-text {
  margin-top: 32px;
  text-align: center;
}

.footer-text p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }

  .title {
    font-size: 24px;
  }

  .logo {
    width: 64px;
    height: 64px;
  }
}
</style>
