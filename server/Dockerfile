FROM oven/bun

WORKDIR /app

COPY server/package*.json ./

RUN bun install

COPY server .

COPY interface ./src/interface

RUN bun run build

EXPOSE 4000

CMD ["bun", "run", "start"]