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
  OtherRequest,
  RestartGameRequest,
  Status,
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
      service.createGame().then((gameId) => {
        service.joinGame(gameId, playerName);
        reply.send(gameId);
      });
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

      if (!game || game.gameStatus !== Status.WAITING) {
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
      const message: GameConnectedRequest | OtherRequest = JSON.parse(
        rawData.toString()
      );

      if (message?.type == MessageType.CONNECTED) {
        const { gameId, playerName } = message;
        addClient(gameId, clientId, playerName, socket);
        const playerClient = clientIdToGameId[clientId];
        sendGameInfo(playerClient.gameId);
      } else {
        console.log(clientIdToGameId);
      }
    });

    // Client disconnect - remove player
    socket.on('close', () => {
      if (clientId in clientIdToGameId) {
        const playerClient = clientIdToGameId[clientId];
        const gameId = playerClient.gameId;

        service.leaveGame(gameId, playerClient.playerName);
        delete clientIdToGameId[clientId];

        const clients = gameIdToClients[gameId].filter(
          (client) => client !== socket
        );
        gameIdToClients[gameId] = clients;

        if (clients.length === 0) {
          delete gameIdToClients[gameId];
        } else {
          sendGameInfo(playerClient.gameId);
        }
      }
    });
  });

  // game starts
  fastify.post(
    '/start',
    (request: FastifyRequest<{ Body: StartGameRequest }>, reply) => {
      const { gameId } = request.body;
      service.startGame(gameId);
      reply.send();
      sendGameInfo(gameId);
    }
  );

  // game restarts
  fastify.post(
    '/restart',
    (request: FastifyRequest<{ Body: RestartGameRequest }>, reply) => {
      const { gameId } = request.body;
      service.restartGame(gameId);
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
