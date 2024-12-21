import route from './routes/route.js';
import * as dotenv from 'dotenv';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';

const fastify = Fastify({
  // logger: true,
});
const port: number =
  Number.parseInt(dotenv.config()?.parsed?.PORT || '') || 5000;

fastify.register(websocket);
fastify.register(cors);
fastify.register(route, { prefix: '/' });

fastify.listen({ port }, (err: Error, address: string) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
