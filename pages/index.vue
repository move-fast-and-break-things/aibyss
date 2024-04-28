<template>
  <div class="flex flex-col h-screen w-screen">
    <GlobalHeader />
    <div class="flex flex-grow p-4">
      <div class="flex min-w-[600px]">
        <CodeEditor />
      </div>
      <div class="flex flex-grow">
        <GameScreen />
      </div>
    </div>
  </div>
</template>
