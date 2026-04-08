FROM node:20

# Встановлюємо необхідні утиліти
RUN apt-get update && apt-get install -y \
    util-linux \
    lm-sensors \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Завантажуємо офіційний speedtest CLI (не snap)
RUN curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | bash \
    && apt-get install -y speedtest

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npm", "run", "dev"]