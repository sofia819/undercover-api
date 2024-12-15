import { gameService } from '../services/game-service.js';
import { FastifyInstance, FastifyRequest } from 'fastify';

const routes = async (fastify: FastifyInstance) => {
  fastify.get('/', { websocket: true }, (socket, req) => {
    socket.on('message', (message) => {
      const body = JSON.parse(message.toString());
      socket.send(JSON.stringify(gameService.getPlayers(body.roomId)));
    });
  });

  fastify.post('/create', async (request, reply) => {
    return gameService.createRoom().then((roomId) => reply.send(roomId));
  });

  fastify.post(
    '/join/:roomId/:playerName',
    async (
      request: FastifyRequest<{
        Params: { roomId: string; playerName: string };
      }>,
      reply
    ) => {
      const { roomId, playerName } = request.params;
      return gameService
        .joinGame(roomId, playerName)
        .then((bool) => reply.send(bool));
    }
  );

  fastify.post(
    '/start/:roomId',
    async (request: FastifyRequest<{ Params: { roomId: string } }>, reply) => {
      const { roomId } = request.params;
      return gameService.startGame(roomId).then((bool) => reply.send(bool));
    }
  );

  fastify.get(
    '/:roomId',
    async (request: FastifyRequest<{ Params: { roomId: string } }>, reply) => {
      const { roomId } = request.params;
      return gameService.getGame(roomId).then((room) => reply.send(room));
    }
  );

  fastify.get(
    '/word/:roomId/:playerName',
    async (
      request: FastifyRequest<{
        Params: { roomId: string; playerName: string };
      }>,
      reply
    ) => {
      const { roomId, playerName } = request.params;
      return gameService
        .getWord(roomId, playerName)
        .then((word) => reply.send(word));
    }
  );
};

export default routes;
