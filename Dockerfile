FROM node:20-slim

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Build de Next.js
RUN npm run build

# Exposer le port (Railway injecte $PORT automatiquement)
EXPOSE ${PORT:-3000}

# Démarrer Next.js
CMD ["npm", "start"]
