import express from 'express';
import cors from 'cors';
import wordRoute from './routes/word-route.js';

// Middleware
const app = express(); // Express server ran as "app"
app.use(cors());
app.use(express.json());

// Routes
app.use('/word', wordRoute);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server has started on port ${port}`);
});
