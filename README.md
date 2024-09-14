# 🚧 UNDER DEVELOPMENT 🚧 Aibyss: code your AI to compete in a survival game

## Setup

- install [node.js](https://nodejs.org/en)
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
