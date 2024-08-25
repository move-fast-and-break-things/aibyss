<script setup lang="ts">
const { data: user } = await useFetch("/api/auth/user");
</script>

<template>
  <header class="p-4 flex flex-row items-center justify-between">
    <h1 class="text-slate-900 text-3xl">
      <span class="font-bold">Ai</span>byss
    </h1>
    <div
      v-if="user?.body"
      class="flex flex-row gap-2"
    >
      <span class="text-slate-700">Hi, <span class="font-semibold">{{ user.body.username }}</span></span>
      <span>•</span>
      <form
        action="/api/auth/logout"
        method="POST"
      >
        <button
          type="submit"
          class="text-indigo-600 hover:text-indigo-400"
        >
          Log out
        </button>
      </form>
    </div>
  </header>
</template>
