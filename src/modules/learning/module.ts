import { Express } from 'express';
import { PrismaClient } from '@prisma/client';

export function learningModule(app: Express, prisma: PrismaClient) {
  // Learning module placeholder
  app.get('/api/v1/learning/health', (req, res) => {
    res.json({ status: 'ok', module: 'learning' });
  });
}
