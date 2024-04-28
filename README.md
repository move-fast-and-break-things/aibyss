# 🚧 UNDER DEVELOPMENT 🚧 Aibyss: code your AI to compete in a survival game

## Setup

- install [node.js](https://nodejs.org/en)
- **(on Windows and macOS)** install `node-gyp`: `npm install -g node-gyp`
- **(on Windows only)** install `@rollup/rollup-win32-x64-msvc`: `npm install @rollup/rollup-win32-x64-msvc`
- install the dependencies: `npm ci`

## Development server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

## Contributors guide

- we follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/), name your PRs accordingly

## Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
