import { wordService } from '../services/word-service.js';
import { FastifyInstance } from 'fastify';

const routes = async (fastify: FastifyInstance) => {
  fastify.get('/', async (request, reply) => {
    reply.send('hello');
  });

  fastify.get('/word', async (request, reply) =>
    wordService
      .getWords()
      .then((words) => reply.send(words.replace(' ', '').split(',')))
      .catch((err) => {
        console.error(err.message);
        return reply.send([]);
      })
  );
};

export default routes;
