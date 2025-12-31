# Tests Documentation

This directory contains automated tests for the OMNI Platform.

## Test Structure

```
src/__tests__/
├── setup.ts                    # Test environment setup
├── helpers/
│   └── test-helpers.ts         # Helper functions for creating test data
├── mocks/
│   └── event-bus.mock.ts       # Mock implementations
├── unit/                       # Unit tests (isolated service logic)
│   ├── gatekeeper.service.test.ts
│   ├── curator.service.test.ts
│   ├── workflow-executor.test.ts
│   └── people-growth.service.test.ts
├── integration/                # Integration tests (API endpoints)
│   ├── gatekeeper-api.test.ts
│   ├── workflows-api.test.ts
│   └── people-growth-api.test.ts
└── e2e/                        # End-to-end tests (complete workflows)
    └── complete-workflow.test.ts
```

## Running Tests

### Prerequisites

1. **PostgreSQL database** for testing:
```bash
# Create test database
createdb omni_test

# Or use Docker
docker run -d \
  --name postgres-test \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=omni_test \
  -p 5433:5432 \
  postgres:15
```

2. **Environment variables** in `.env`:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/omni_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-secret-key-min-32-characters-long
OPENAI_API_KEY=sk-... # Optional for AI-powered tests
```

### Run All Tests

```bash
npm test
```

### Run Tests by Type

**Unit Tests** (fast, isolated):
```bash
npm run test:unit
```

**Integration Tests** (API endpoints):
```bash
npm run test:integration
```

**E2E Tests** (complete workflows):
```bash
npm run test:e2e
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

This generates a coverage report in `coverage/` directory.

## Test Coverage

### Unit Tests

**Gatekeeper Service** (`gatekeeper.service.test.ts`)
- ✅ EXECUTE decision for company_admin
- ✅ EXECUTE for agent on allowed actions
- ✅ SUGGEST for restricted actions
- ✅ BLOCK for forbidden actions
- ✅ Quiet hours enforcement
- ✅ VIP contact prioritization
- ✅ Attention score calculation (anti-spam)
- ✅ Decision logging

**Curator Service** (`curator.service.test.ts`)
- ✅ Auto-create CLIENT and NEGOTIATION zettels on conversation
- ✅ Detect commitments from messages
- ✅ Create TASK zettels from commitments
- ✅ Generate LEARNING zettels from deal stages
- ✅ Analyze won/lost deals with AI
- ✅ Link related zettels
- ✅ Error handling for AI failures

**Workflow Executor** (`workflow-executor.test.ts`)
- ✅ Execute simple trigger → action workflows
- ✅ Handle conditional nodes (if/else)
- ✅ Template variable substitution
- ✅ Delay nodes
- ✅ Error handling and logging
- ✅ Gatekeeper integration
- ✅ Execution logging

**People Growth Service** (`people-growth.service.test.ts`)
- ✅ Detect gaps from interactions using AI
- ✅ Avoid duplicate gaps
- ✅ Detect gaps from simulations
- ✅ Suggest learning paths
- ✅ Close gaps
- ✅ Generate team reports
- ✅ Error handling for AI failures

### Integration Tests

**Gatekeeper API** (`gatekeeper-api.test.ts`)
- ✅ GET /api/v1/gatekeeper/profile
- ✅ PATCH /api/v1/gatekeeper/profile
- ✅ GET /api/v1/gatekeeper/policy (admin only)
- ✅ PATCH /api/v1/gatekeeper/policy (admin only)
- ✅ GET /api/v1/gatekeeper/logs
- ✅ GET /api/v1/gatekeeper/pending-actions
- ✅ POST /api/v1/gatekeeper/test
- ✅ Authentication and authorization

**Workflows API** (`workflows-api.test.ts`)
- ✅ POST /api/v1/automations/workflows (create)
- ✅ GET /api/v1/automations/workflows (list with filters)
- ✅ GET /api/v1/automations/workflows/:id (details)
- ✅ PATCH /api/v1/automations/workflows/:id (update)
- ✅ DELETE /api/v1/automations/workflows/:id (delete)
- ✅ POST /api/v1/automations/workflows/:id/activate
- ✅ POST /api/v1/automations/workflows/:id/pause
- ✅ POST /api/v1/automations/workflows/:id/test
- ✅ GET /api/v1/automations/executions (list)
- ✅ GET /api/v1/automations/executions/:id/logs

**People Growth API** (`people-growth-api.test.ts`)
- ✅ GET /api/v1/people-growth/gaps (own and team)
- ✅ GET /api/v1/people-growth/gaps/:id (details)
- ✅ POST /api/v1/people-growth/gaps/:id/close
- ✅ GET /api/v1/people-growth/gaps/:id/learning-paths
- ✅ GET /api/v1/people-growth/team/report (supervisor only)
- ✅ GET /api/v1/people-growth/team/heatmap (supervisor only)
- ✅ GET /api/v1/people-growth/my-profile
- ✅ RBAC enforcement

### E2E Tests

**Complete Workflow** (`complete-workflow.test.ts`)
- ✅ Create company policy
- ✅ Create attention profiles
- ✅ Create and activate workflow
- ✅ Trigger workflow via conversation
- ✅ Auto-create zettels
- ✅ Detect gaps from interactions
- ✅ Suggest learning paths
- ✅ Create simulation scenarios
- ✅ Test gatekeeper decisions
- ✅ Verify execution logs

**Simulation Training Flow** (`complete-workflow.test.ts`)
- ✅ Create simulation scenario
- ✅ Start session
- ✅ Send messages to AI persona
- ✅ End session with evaluation
- ✅ Create gaps from evaluation
- ✅ View history

## Helper Functions

### `createTestCompany()`
Creates a test company with random domain.

### `createTestUser(companyId, role)`
Creates a test user with JWT token. Roles: `company_admin`, `supervisor`, `agent`, `viewer`.

### `createTestContext()`
Creates complete test context: company + admin + agent + viewer.

### `createTestContact(companyId, data?)`
Creates a test contact.

### `createTestDeal(companyId, contactId, ownerId, data?)`
Creates a test deal.

### `createTestInteraction(companyId, userId, contactId, data?)`
Creates a test interaction.

### `createTestKnowledgeNode(companyId, createdById, data?)`
Creates a test knowledge node (zettel).

### `createTestCompanyPolicy(companyId, data?)`
Creates a company policy with default autonomy rules.

### `createTestAttentionProfile(userId, data?)`
Creates an attention profile for user.

## Mocks

### `eventBusMock`
Mock event bus for testing event-driven functionality:
```typescript
eventBusMock.emit('conversation.created', data);
eventBusMock.hasEvent('conversation.created'); // true
eventBusMock.getEventData('conversation.created'); // [data]
eventBusMock.clear(); // Reset
```

### `mockOpenAI()`
Mock OpenAI client that returns predefined responses.

## Writing New Tests

### Unit Test Template

```typescript
import { YourService } from '../../modules/your-module/service';
import { createTestCompany, createTestUser } from '../helpers/test-helpers';

describe('YourService', () => {
  let service: YourService;
  let company: any;
  let user: any;

  beforeEach(async () => {
    service = new YourService();
    company = await createTestCompany();
    user = await createTestUser(company.id, 'agent');
  });

  describe('yourMethod', () => {
    it('should do something', async () => {
      const result = await service.yourMethod(user.id, company.id);

      expect(result).toBeDefined();
      // More assertions...
    });
  });
});
```

### Integration Test Template

```typescript
import request from 'supertest';
import { createApp } from '../../app';
import { createTestCompany, createTestUser } from '../helpers/test-helpers';

let app: Express;
let company: any;
let user: any;

beforeAll(async () => {
  const context = await createApp();
  app = context.app;
});

beforeEach(async () => {
  company = await createTestCompany();
  user = await createTestUser(company.id, 'agent');
});

describe('Your API Tests', () => {
  it('should return 200', async () => {
    const response = await request(app)
      .get('/api/v1/your-endpoint')
      .set('Authorization', `Bearer ${user.token}`);

    expect(response.status).toBe(200);
  });
});
```

## CI/CD Integration

Tests run automatically on GitHub Actions:
- On every push to `main` and `develop`
- On every pull request

See `.github/workflows/ci.yml` for configuration.

## Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical business flows

## Troubleshooting

### Database Connection Issues

If tests fail with database connection errors:
```bash
# Check if database exists
psql -l | grep omni_test

# Create if missing
createdb omni_test

# Run migrations
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omni_test" \
  npx prisma migrate deploy
```

### OpenAI API Errors

Some tests use OpenAI API. If you don't have API key:
- Tests will gracefully skip AI-powered features
- Or mock responses will be used

### Port Already in Use

If port 3000 is busy:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` to clean state
3. **Mocks**: Mock external services (OpenAI, etc)
4. **Fast**: Unit tests should run in < 5s
5. **Descriptive**: Use clear test names
6. **AAA Pattern**: Arrange, Act, Assert

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
