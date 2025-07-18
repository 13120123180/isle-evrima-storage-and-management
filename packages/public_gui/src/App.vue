<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './store/auth';

onMounted(() => {
  const authStore = useAuthStore();
  authStore.fetchUser();
});
</script>

<style>
body {
  margin: 0;
}
</style>