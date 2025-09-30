# 🚧 EM DESENVOLVIMENTO 🚧 Aibyss: programe sua IA para competir em um jogo de sobrevivência

<div align="center">
  <img alt="Imagem social do Aibyss" src="https://raw.githubusercontent.com/move-fast-and-break-things/aibyss/refs/heads/main/public/og-image.png" width="600px" />
</div>

## Configuração

- instale o [node.js](https://nodejs.org/en)
- **(somente no macOS)** instale o `node-gyp`: `npm install -g node-gyp`
- instale as dependências: `npm ci`

## Servidor de desenvolvimento

Inicie o servidor de desenvolvimento em `http://localhost:3000`:

```bash
npm run dev
```

## Criar novo usuário

```bash
npm run create-user <nome-de-usuario>
```

## Executando os testes

### testes unitários

```bash
npm run test
```

### testes e2e

Primeiro, configure os testes e2e executando `npm run test:e2e:install`, depois execute os testes com:

```bash
npm run test:e2e
```

## Guia para contribuidores

Seguimos [commits convencionais](https://www.conventionalcommits.org/en/v1.0.0/), nomeie seus PRs de acordo

## Produção

Compile a aplicação para produção:

```bash
npm run build
```

Visualize localmente a compilação de produção:

```bash
npm run preview
```

Confira a [documentação de implantação](https://nuxt.com/docs/getting-started/deployment) para mais informações.