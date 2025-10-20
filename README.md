# 🚧 UNDER DEVELOPMENT 🚧 Aibyss: code your AI to compete in a survival game

<div align="center">
  <img alt="Aibyss social image" src="https://raw.githubusercontent.com/move-fast-and-break-things/aibyss/refs/heads/main/public/og-image.png" width="600px" />
</div>

## Setup

- install [node.js](https://nodejs.org/en) v18
  - we recommend using WSL on Windows
  - you can use [nvm](https://github.com/nvm-sh/nvm) to install the supported version
- **(on macOS only)** install `node-gyp`: `npm install -g node-gyp`
- install the dependencies: `npm ci`

## Development server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

## Create new user

```bash
npm run create-user <username>
```

## Running the tests

### unit tests

```bash
npm run test
```

### e2e tests

First, setup e2e tests by running `npm run test:e2e:install`, then run the tests with:

```bash
npm run test:e2e
```

## Contributors guide

We follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/), name your PRs accordingly

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
