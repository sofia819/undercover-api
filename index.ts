import wordRoute from './routes/word-route.js';
import gameRoute from './routes/game-route.js';
import * as dotenv from 'dotenv';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { gameDao } from './data/game-data.js';

const fastify = Fastify({
  // logger: true,
});
const port: number =
  Number.parseInt(dotenv.config()?.parsed?.PORT || '') || 5000;

fastify.register(websocket);
fastify.register(wordRoute, { prefix: '/word' });
fastify.register(gameRoute, { prefix: '/game' });

fastify.listen({ port }, (err: Error, address: string) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});

gameDao.createTable();
