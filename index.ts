import wordRoute from './routes/word-route.js';
import * as dotenv from 'dotenv';
import Fastify from 'fastify';

const fastify = Fastify({
  logger: true,
});
const port: number =
  Number.parseInt(dotenv.config()?.parsed?.PORT || '') || 5000;

fastify.register(wordRoute);

fastify.listen({ port }, (err: Error, address: string) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
