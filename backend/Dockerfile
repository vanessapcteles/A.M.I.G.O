# Usar a imagem oficial do Node.js
FROM node:18

# Definir o diretório de trabalho dentro do contentor
WORKDIR /app

# Copiar os ficheiros de dependências 
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o resto do código do backend
COPY . .

# Expor a porta que a app usa
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["npm", "run", "dev"]
