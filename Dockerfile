FROM node:18.20.4

WORKDIR /aibyss

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build

CMD ["sh", "-c", "npm run prisma:migrate && npm run start"]
