import route from './routes/route.js';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import 'dotenv/config';

const fastify = Fastify({
  logger: true,
});
const port = Number.parseInt(process.env.PORT) || 5000;
const allowedUrls = (process.env.ALLOWED_URLS || '').split(',');
const host = 'RENDER' in process.env ? `0.0.0.0` : `localhost`;

fastify.register(websocket);
fastify.register(cors, {
  origin: (origin, callback) => {
    //  Request from allowed URLs will pass
    if (!origin || allowedUrls.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed'), false);
    }
  },
});
fastify.register(route, { prefix: '/' });

fastify.listen({ port, host }, (err: Error, address: string) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
