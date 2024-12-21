import { service } from '../services/service.js';
import { FastifyInstance, FastifyRequest } from 'fastify';
import {
  CreateGameRequest,
  JoinGameRequest,
  StartGameRequest,
  ClueRequest,
  VoteRequest,
  MessageType,
  PlayerClient,
  GameConnectedRequest,
  ErrorType,
} from '../types.js';
import WebSocket from 'ws';

const gameIdToClients: { [gameId: string]: WebSocket[] } = {};
const clientIdToGameId: { [clientId: string]: PlayerClient } = {};

const routes = (fastify: FastifyInstance) => {
  const broadcast = (gameId: string, message: any) => {
    for (let client of gameIdToClients[gameId]) {
      client.send(JSON.stringify(message));
    }
  };

  const addClient = (
    gameId: string,
    clientId: string,
    playerName: string,
    client: WebSocket
  ) => {
    gameId in gameIdToClients
      ? gameIdToClients[gameId].push(client)
      : (gameIdToClients[gameId] = [client]);
    clientIdToGameId[clientId] = {
      gameId: gameId,
      playerName: playerName,
    };
  };

  const sendGameInfo = (gameId: string) => {
    broadcast(gameId, service.getGameInfo(gameId));
  };

  // create a game and join
  fastify.post(
    '/create',
    (request: FastifyRequest<{ Body: CreateGameRequest }>, reply) => {
      const { playerName } = request.body;
      const gameId = service.createGame();
      service.joinGame(gameId, playerName);
      reply.send(gameId);
    }
  );

  // join game
  fastify.post(
    '/join',
    (
      request: FastifyRequest<{
        Body: JoinGameRequest;
      }>,
      reply
    ) => {
      const { gameId, playerName } = request.body;
      const game = service.getGameInfo(gameId);

      if (!game) {
        reply.code(400).send({
          type: ErrorType.INVALID_GAME_ID,
        });
      } else if (game && playerName in game.players) {
        reply.code(400).send({
          type: ErrorType.PLAYER_EXISTS,
        });
      } else {
        service.joinGame(gameId, playerName);
        reply.code(200).send();
      }
    }
  );

  // websocket - create or join game
  fastify.get('', { websocket: true }, (socket, request: FastifyRequest) => {
    const clientId = request.id;

    // Client sends data - update as needed
    socket.on('message', (rawData) => {
      const message: GameConnectedRequest = JSON.parse(rawData.toString());

      if (message.type == MessageType.CONNECTED) {
        const { gameId, playerName } = message;
        addClient(gameId, clientId, playerName, socket);
        const playerClient = clientIdToGameId[clientId];
        sendGameInfo(playerClient.gameId);
      }
    });

    // Client disconnect - remove player

    socket.on('close', () => {
      if (clientId in clientIdToGameId) {
        const playerClient = clientIdToGameId[clientId];
        service.leaveGame(playerClient.gameId, playerClient.playerName);
        sendGameInfo(playerClient.gameId);
      }

      // TODO: if removed player is a spy and no spies left - broadcast declare winner
      // TODO: if no more players in game, remove references
    });
  });

  // game starts - broadcast necessary info to players
  fastify.post(
    '/start',
    (request: FastifyRequest<{ Body: StartGameRequest }>, reply) => {
      const { gameId } = request.body;
      service.startGame(gameId);
      reply.send();
      sendGameInfo(gameId);
    }
  );

  fastify.get(
    '/:gameId/:playerName/word',
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
    '/clue',
    (
      request: FastifyRequest<{
        Body: ClueRequest;
      }>,
      reply
    ) => {
      const { gameId, playerName, clue } = request.body;
      service.submitClue(gameId, playerName, clue);
      reply.send();
      sendGameInfo(gameId);
    }
  );

  fastify.post(
    '/vote',
    (
      request: FastifyRequest<{
        Body: VoteRequest;
      }>,
      reply
    ) => {
      const { gameId, playerName, vote } = request.body;
      service.submitVote(gameId, playerName, vote);
      reply.send();
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