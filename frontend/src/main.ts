import './assets/main.css'
import './api/axios'          // ← loads interceptor
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { isLoggedIn } from './api/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login',      component: () => import('./pages/Login.tsx') },
    { path: '/signup',     component: () => import('./pages/SignUp.tsx') },
    { path: '/onboarding', component: () => import('./pages/Onboarding.tsx') },
    { path: '/',           component: () => import('./pages/Home.tsx') },
    { path: '/ai',         component: () => import('./pages/AI.tsx') },
    { path: '/bills',      component: () => import('./pages/Bills.tsx') },
  ]
})

// Route guard — redirect to login if not authenticated
router.beforeEach((to, from, next) => {
  const publicRoutes = ['/login', '/signup']
  const isPublic     = publicRoutes.includes(to.path)

  if (!isPublic && !isLoggedIn()) {
    next('/login')
  } else if (isPublic && isLoggedIn()) {
    next('/')       // already logged in → go home
  } else {
    next()
  }
})
// Register service worker for PWA
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then(reg => console.log('SW registered:', reg.scope))
//       .catch(err => console.log('SW failed:', err))
//   })
// }

createApp(App).use(router).mount('#app')
