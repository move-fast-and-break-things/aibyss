<script setup lang="ts">
const { subtitle } = defineProps<{ subtitle?: string }>();

const { data: user } = await useFetch("/api/auth/user");

useHead({
  title: subtitle ? `${subtitle} • Aibyss` : "Aibyss",
});
</script>

<template>
  <header class="p-4 flex flex-row items-center justify-between">
    <div class="flex flex-row items-center gap-2 text-slate-900 text-3xl">
      <h2 v-if="subtitle">
        {{ subtitle }}
      </h2>
      <div v-if="subtitle">
        •
      </div>
      <a href="/">
        <h1 class="text-3xl">
          <span class="font-bold">Ai</span>byss
        </h1>
      </a>
    </div>
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
        <ButtonLink type="submit">
          Log out
        </ButtonLink>
      </form>
    </div>
  </header>
</template>
