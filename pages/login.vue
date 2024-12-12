<template>
  <div class="flex flex-col h-screen w-screen">
    <GlobalHeader />
    <div class="flex flex-grow p-1 h-[90%]">
      <div class="flex min-w-[300px] h-full w-1/2 mr-2">
        <LoginForm />
      </div>
      <div class="flex min-w-[300px] w-1/2 overflow-auto">
        <GameScreen />
      </div>
    </div>
  </div>
</template>
