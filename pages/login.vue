<template>
    <div class="flex flex-col h-screen w-screen">
        <Header />
        <div class="flex flex-grow p-4 justify-center">
            <form method="post" action="/api/auth/login" class="flex flex-col items-center gap-2 mt-[15%]">
                <div class="sm:col-span-3 flex flex-col gap-1">
                    <label for="username" class="block text-sm font-medium leading-6 text-gray-900">Username</label>
                        <input type="text" name="username" id="username" autocomplete="username" required
                            class="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
                <div class="sm:col-span-3 flex flex-col gap-1">
                    <label for="password" class="block text-sm font-medium leading-6 text-gray-900">Password</label>
                        <input type="password" name="password" id="password" autocomplete="password" required
                            class="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
                <button type="submit"
                    class="rounded-md bg-indigo-600 px-3 py-2 mt-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Log
                    in</button>
            </form>
        </div>
    </div>
</template>
  