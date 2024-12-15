import express from 'express';
import { wordService } from '../services/word-service.js';

const router = express.Router();

router.route('').post((req, res) =>
  wordService
    .getWords()
    .then((words) => res.json(words.replace(' ', '').split(',')))
    .catch((err) => {
      console.error(err.message);
      res.json([]);
    })
);

export default router;
