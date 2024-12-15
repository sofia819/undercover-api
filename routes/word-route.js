const express = require('express');
const router = express.Router();
const wordService = require('../services/word-service');

router.route('').post((req, res) =>
  wordService
    .getWords()
    .then((words) => res.json(words.replace(' ', '').split(',')))
    .catch((err) => {
      console.error(err.message);
      res.json([]);
    })
);

module.exports = router;
