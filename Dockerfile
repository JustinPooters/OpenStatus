FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=80
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN apt-get update \
    && apt-get install -y --no-install-recommends libcap2-bin \
    && setcap 'cap_net_bind_service=+ep' /usr/local/bin/node \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/data \
    && chown -R node:node /app
USER node
EXPOSE 80
VOLUME ["/app/data"]
CMD ["node", "server.js"]

