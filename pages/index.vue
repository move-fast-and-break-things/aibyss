<script setup lang="ts">
// Default initial split percentage (50% for code editor, 50% for game screen)
const initialSplit = 50;
</script>

<template>
  <div class="flex flex-col h-screen w-screen">
    <GlobalHeader />
    <div class="flex flex-grow p-1 h-[90%]">
      <SplitPane
        :initial-split="initialSplit"
        :min-left="20"
        :min-right="20"
        storage-key="code-game-split-position"
      >
        <template #left>
          <CodeEditor />
        </template>
        <template #right>
          <GameScreen />
        </template>
      </SplitPane>
    </div>
  </div>
</template>
