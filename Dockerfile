# Dockerfile para o serviço bot (Node.js)
FROM node:latest

# Definir o diretório de trabalho no contêiner
WORKDIR /usr/src/app

# Copiar o package.json e o package-lock.json para o contêiner
COPY package*.json ./

# Instalar as dependências do Node.js
RUN npm install

# Copiar todo o código-fonte para o contêiner
COPY . .

# Comando para iniciar o bot
CMD ["node", "bot.mjs"]
