import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  setupPathsListRoute,
  setupPathsCreateRoute,
  setupPathsGetRoute,
  setupEnrollRoute,
  setupEnrollmentsListRoute,
  setupItemCompleteRoute,
  setupSkillsListRoute,
  setupMySkillsRoute,
  setupSkillAssessRoute,
  setupDevelopmentPlansRoute,
} from './index';

export function setupLearningRoutes(app: Express, prisma: PrismaClient, baseUrl: string = '/api/v1/learning') {
  setupPathsListRoute(app, prisma, baseUrl);
  setupPathsCreateRoute(app, prisma, baseUrl);
  setupPathsGetRoute(app, prisma, baseUrl);
  setupEnrollRoute(app, prisma, baseUrl);
  setupEnrollmentsListRoute(app, prisma, baseUrl);
  setupItemCompleteRoute(app, prisma, baseUrl);
  setupSkillsListRoute(app, prisma, baseUrl);
  setupMySkillsRoute(app, prisma, baseUrl);
  setupSkillAssessRoute(app, prisma, baseUrl);
  setupDevelopmentPlansRoute(app, prisma, baseUrl);
}
