import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import Antd, { message } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import router from './router'
import './assets/global.css'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.config.errorHandler = (error, instance, info) => {
  console.error('[PulseRead Admin Error]', error, info, instance)
  message.error('页面运行时出现异常，请刷新后重试')
}

app.use(pinia)
app.use(router)
app.use(Antd)

router.isReady().finally(() => {
  app.mount('#app')
})
