# Usar uma versão estável e fixa do Node.js (exemplo: 18 LTS)
FROM node:18

# Definir o diretório de trabalho no contêiner
WORKDIR /usr/src/app

# Copiar os arquivos package.json e package-lock.json (se existir)
COPY package*.json ./

# Instalar as dependências do Node.js
RUN npm install --production

# Copiar todo o código-fonte para o contêiner
COPY . .

# Expor a porta 3000
EXPOSE 3000

# Certificar-se de que o bot escuta todas as interfaces de rede
CMD ["node", "bot.mjs"]
