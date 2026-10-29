import express from 'express';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import commercialRoutes from './routes/commercial';

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

// Better Auth API routes
app.use('/api/auth', toNodeHandler(auth));

// Business logic routes
app.use('/api', commercialRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
