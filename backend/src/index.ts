import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import rateLimit from 'express-rate-limit';
import rateLimiter from './middleware/rateLimiter';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import rosterRoutes from './routes/roster.routes';
import userRoutes from './routes/user.routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const port = process.env.PORT || 3000;

// Initialize Prisma Client
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('combined'));

// Routes
app.use(rateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api', rosterRoutes);
app.use('/api', userRoutes);

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Restaurant API',
      version: '1.0.0',
      description: 'API documentation for the restaurant backend',
    },
  },
  apis: ['./src/routes/*.ts'], // Path to your route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Basic route for testing
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Restaurant Management API is running' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Explicitly connect to the database before starting the server
async function startServer() {
  try {
    await prisma.$connect();
    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}

startServer(); 