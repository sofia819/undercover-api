import { service } from '../services/service.js';
import { FastifyInstance, FastifyRequest } from 'fastify';
import WebSocket from 'ws';

const gameIdClients: { [gameId: string]: WebSocket[] } = {};

const routes = (fastify: FastifyInstance) => {
  const broadcast = (gameId: string, message: any) => {
    for (let client of gameIdClients[gameId]) {
      client.send(JSON.stringify(message));
    }
  };

  const addClient = (gameId: string, client: WebSocket) => {
    gameId in gameIdClients
      ? gameIdClients[gameId].push(client)
      : (gameIdClients[gameId] = [client]);
  };

  const sendGameInfo = (gameId: string) => {
    broadcast(gameId, service.getGameInfo(gameId));
  };

  // game creation
  fastify.post('/create', (request, reply) => {
    reply.send(service.createGame());
  });

  // join game
  fastify.post(
    '/:gameId/:playerName',
    (
      request: FastifyRequest<{
        Params: { gameId: string; playerName: string };
      }>,
      reply
    ) => {
      const { gameId, playerName } = request.params;
      service.joinGame(gameId, playerName);
      reply.status(200);
    }
  );

  // websocket
  fastify.get(
    '/:gameId/:playerName',
    { websocket: true },
    (
      socket,
      request: FastifyRequest<{
        Params: { gameId: string; playerName: string };
      }>
    ) => {
      const { gameId, playerName } = request.params;
      addClient(gameId, socket);
      sendGameInfo(gameId);

      // Client sends data - update as needed
      socket.on('message', (message) => {
        const body = JSON.parse(message.toString());
        socket.send(JSON.stringify(body));
      });

      // Client disconnect - remove player
      // if removed player is a spy and no spies left - broadcast declare winner
      socket.on('close', () => {
        service.leaveGame(gameId, playerName);
        sendGameInfo(gameId);
      });
    }
  );

  // game starts - broadcast necessary info to players
  fastify.post(
    '/:gameId/start',
    (request: FastifyRequest<{ Params: { gameId: string } }>, reply) => {
      const { gameId } = request.params;
      service.startGame(gameId);
      reply.status(200);
      sendGameInfo(gameId);
    }
  );

  fastify.get(
    '/:gameId/word/:playerName',
    (
      request: FastifyRequest<{
        Params: { gameId: string; playerName: string };
      }>,
      reply
    ) => {
      const { gameId, playerName } = request.params;
      reply.send(service.getWord(gameId, playerName));
    }
  );

  fastify.post(
    '/:gameId/clue/:playerName/:text',
    (
      request: FastifyRequest<{
        Params: {
          gameId: string;
          playerName: string;
          text: string;
        };
      }>,
      reply
    ) => {
      const { gameId, playerName, text } = request.params;
      service.submitClue(gameId, playerName, text);
      reply.status(200);
      sendGameInfo(gameId);
    }
  );

  fastify.post(
    '/:gameId/vote/:playerName/:votedPlayerName',
    (
      request: FastifyRequest<{
        Params: {
          gameId: string;
          playerName: string;
          votedPlayerName: string;
        };
      }>,
      reply
    ) => {
      const { gameId, playerName, votedPlayerName } = request.params;
      service.submitVote(gameId, playerName, votedPlayerName);
      reply.status(200);
      sendGameInfo(gameId);
    }
  );

  // debug endpoint for game info
  fastify.get(
    '/:gameId',
    (request: FastifyRequest<{ Params: { gameId: string } }>, reply) => {
      const { gameId } = request.params;
      reply.send(service.getGameInfo(gameId));
    }
  );
};

export default routes;
