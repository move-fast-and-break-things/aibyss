<script setup lang="ts">
const { subtitle } = defineProps<{ subtitle?: string }>();

const { data: user } = await useFetch("/api/auth/user");

const title = subtitle ? `${subtitle} • Aibyss` : "Aibyss";
const description = "Aibyss: code your AI to compete in a survival game";
useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  ogImage: "https://aibyss.mfbt.community/og-image.png?v=2",
  twitterCard: "summary_large_image",
});

const aboutModalOpen = ref(false);
const onCloseAboutModal = () => {
  aboutModalOpen.value = false;
};
</script>

<template>
  <header class="px-4 py-2 flex flex-row items-center justify-between h-18">
    <div class="flex flex-row items-center gap-3 text-slate-900 text-3xl font-['Retropix']">
      <a href="/">
        <img
          src="~/assets/images/logo.png"
          alt="Aibyss logo"
          width="42px"
        >
      </a>
      <div class="flex flex-row items-center gap-2 mt-[8px]">
        <h2 v-if="subtitle">
          {{ subtitle }}
        </h2>
        <div
          v-if="subtitle"
          class="ml-[-4px]"
        >
          •
        </div>
        <a href="/"><h1>Aibyss</h1></a>
      </div>
    </div>
    <div class="flex flex-row gap-2 items-center">
      <div
        v-if="user?.body"
        class="flex flex-row gap-2 items-center"
      >
        <span class="text-slate-700">Hi, <span class="font-semibold">{{ user.body.username }}</span></span>
        <span>•</span>
        <form
          action="/api/auth/logout"
          method="POST"
        >
          <ButtonLink type="submit">
            log out
          </ButtonLink>
        </form>
        <span>•</span>
      </div>
      <AnchorLink href="/rating">
        rating
      </AnchorLink>
      <span>•</span>
      <ButtonLink @click="aboutModalOpen = true">
        ?
      </ButtonLink>
    </div>
  </header>
  <ModalDialog
    :open="aboutModalOpen"
    :on-close="onCloseAboutModal"
    extra-modal-class="h-[400px] max-h-[400px]"
  >
    <div class="flex flex-grow flex-col justify-between">
      <div class="flex flex-col gap-2">
        <p>Aibyss is a survival game where you compete by coding your AI in <span class="font-semibold">JavaScript</span>.</p>

        <p>
          The game is played in real time, and you can see how your AI performs against other players' AIs. It is played in a 2D grid, and your AI can move around, attack other AIs, and collect resources. The game is written in TypeScript. If you want to contribute, check out the list of open issues and the contributing guide <AnchorLink href="https://github.com/move-fast-and-break-things/aibyss">here</AnchorLink>.
        </p>

        <p>Good luck, and have fun!</p>
      </div>

      <div class="flex flex-col text-sm gap-2">
        <p>
          The logo and the art for the social preview image created by <AnchorLink
            href="https://github.com/Bee133"
            rel="nofollow noreferrer"
          >Ivan Pchelka</AnchorLink>.
        </p>
        <p>
          The <AnchorLink
            href="https://fontstruct.com/fontstructions/show/1716995"
            rel="nofollow noreferrer"
          >FontStruction "RetroPix"</AnchorLink> by <AnchorLink
            href="https://brandonkleeman.com/"
            rel="nofollow noreferrer"
          >Brandon Kleeman</AnchorLink> is licensed under a <AnchorLink
            href="http://creativecommons.org/licenses/by/3.0/"
            rel="nofollow noreferrer"
          >Creative Commons Attribution license</AnchorLink>.
        </p>
      </div>
    </div>
  </ModalDialog>
</template>
