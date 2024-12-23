import route from './routes/route.js';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';

const fastify = Fastify({
  // logger: true,
});
const port = Number.parseInt(process.env.PORT) || 5000;
const appUrl = process.env.APP_URL;
const host = 'RENDER' in process.env ? `0.0.0.0` : `localhost`;

fastify.register(websocket);
fastify.register(cors);
fastify.register(route, { prefix: '/' });

fastify.listen({ port, host }, (err: Error, address: string) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
