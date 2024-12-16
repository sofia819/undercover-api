import { gameService } from '../services/game-service.js';
import { FastifyInstance, FastifyRequest } from 'fastify';

const routes = async (fastify: FastifyInstance) => {
  // websocket
  fastify.get(
    '/:roomId/:playerName',
    { websocket: true },
    (
      socket,
      request: FastifyRequest<{
        Params: { roomId: string; playerName: string };
      }>
    ) => {
      const { roomId, playerName } = request.params;

      // Client connects / player joins
      gameService.joinGame(roomId, playerName);

      // Client sends data - update as needed
      socket.on('message', (message) => {
        const body = JSON.parse(message.toString());
        socket.send(JSON.stringify(gameService.getPlayers(body.roomId)));
      });

      // Client disconnect - remove player
      // if removed player is a spy and no spies left - declare winner
      socket.on('close', () => {
        gameService.removePlayer(roomId, playerName);
      });
    }
  );

  // game creation
  fastify.post('/create', async (request, reply) => {
    return gameService.createRoom().then((roomId) => reply.send(roomId));
  });

  // game starts - broadcast necessary info to players
  fastify.post(
    '/start/:roomId',
    async (request: FastifyRequest<{ Params: { roomId: string } }>, reply) => {
      const { roomId } = request.params;
      broadcast('game is starting');
      return gameService.startGame(roomId).then((bool) => reply.send(bool));
    }
  );

  // debug endpoint for game info
  fastify.get(
    '/:roomId',
    async (request: FastifyRequest<{ Params: { roomId: string } }>, reply) => {
      const { roomId } = request.params;
      return gameService.getGame(roomId).then((room) => reply.send(room));
    }
  );

  // when game starts, each client should call this endpoint to get word
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

  // player completes turn - current player changes
  // broadcast submitted clue
  fastify.post('/clue', async (request, reply) => {});

  // player voting - keep track of this somewhere
  // broadcast status when player votes
  // if everyone has voted - broadcast results
  fastify.post('/vote', async (request, reply) => {});

  // spy submits word guess if they get voted out
  fastify.post('/guess', async (request, reply) => {});

  const broadcast = (message: string) => {
    for (let client of fastify.websocketServer.clients) {
      client.send(JSON.stringify(message));
    }
  };
};

export default routes;
