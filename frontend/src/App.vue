<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProfile } from './api/profile'
import { isLoggedIn } from './api/auth'

const router = useRouter()

onMounted(async () => {
  // Only check profile if logged in
  if (!isLoggedIn()) return

  const profile = await getProfile()
  if (!profile && router.currentRoute.value.path !== '/onboarding') {
    router.push('/onboarding')
  }
})
</script>
