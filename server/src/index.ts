import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import commercialRoutes from './routes/commercial';
import operationsRoutes from './routes/operations';
import assistantRoutes from './routes/assistant';

const app = express();
const port = Number(process.env.PORT) || 4000;
const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: clientURL,
    credentials: true,
  })
);

// Better Auth must be mounted before any body parser so it can read the raw request body.
app.use('/api/auth', toNodeHandler(auth));

app.use(express.json());

// Business logic routes
app.use('/api', commercialRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/assistant', assistantRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Central error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
