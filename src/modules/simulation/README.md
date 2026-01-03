# 🎓 Simulation Module

Training simulations with AI-powered persona interactions and skill evaluations.

## Overview

The Simulation module provides:
- **Scenario Management**: Create and manage training scenarios
- **AI Personas**: Realistic training interactions with LLM-powered personas
- **Session Management**: Track user progress through scenarios
- **Skill Evaluation**: Automatic assessment of session performance using AI
- **Learning Integration**: Automatic knowledge zettels from evaluation results

## API Routes

### 1. List Scenarios
Get all available training scenarios.

```http
GET /api/v1/simulation/scenarios
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `difficulty` (optional): Filter by difficulty level (beginner, intermediate, advanced)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Customer Service Training",
      "description": "Training scenario for handling difficult customers",
      "difficulty": "intermediate",
      "duration": 15,
      "learningObjectives": ["Empathy", "Problem solving"],
      "createdAt": "2025-01-03T00:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 2. Create Scenario
Create a new training scenario.

```http
POST /api/v1/simulation/scenarios
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Customer Service Training",
  "description": "Training scenario for handling difficult customers",
  "difficulty": "intermediate",
  "duration": 15,
  "learningObjectives": ["Empathy", "Problem solving", "Communication"]
}
```

**Required Fields:**
- `title` (string): Scenario title
- `description` (string): Scenario description
- `difficulty` (string): beginner | intermediate | advanced
- `duration` (number): Duration in minutes
- `learningObjectives` (array): Array of learning objectives

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Customer Service Training",
    "description": "Training scenario for handling difficult customers",
    "difficulty": "intermediate",
    "duration": 15,
    "learningObjectives": ["Empathy", "Problem solving", "Communication"],
    "createdAt": "2025-01-03T00:00:00Z"
  }
}
```

### 3. Start Session
Start a new training session.

```http
POST /api/v1/simulation/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "scenarioId": "uuid",
  "userId": "uuid"
}
```

**Features:**
- Initializes AI persona for realistic interaction
- Creates learning interaction record
- Starts session timer

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "scenarioId": "uuid",
    "userId": "uuid",
    "personaMessage": "Hello! I'm here to help with your training scenario...",
    "startedAt": "2025-01-03T10:00:00Z"
  }
}
```

### 4. End Session
Complete a training session and get evaluation.

```http
POST /api/v1/simulation/:id/end
Authorization: Bearer <token>
Content-Type: application/json

{
  "performance": "excellent",
  "feedbackNotes": "Great job handling the scenario"
}
```

**Parameters:**
- `id` (path): Session ID

**Performance Levels:**
- `poor`: Score 0-25%
- `fair`: Score 25-50%
- `good`: Score 50-75%
- `excellent`: Score 75-100%

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "scenarioId": "uuid",
    "performance": "excellent",
    "evaluationScore": 92,
    "evaluationFeedback": "Excellent handling of customer emotions and problem-solving approach",
    "learningGaps": [
      {
        "skill": "Negotiation",
        "gap": 15,
        "recommendedPaths": ["Negotiation Basics"]
      }
    ],
    "createdZettelId": "uuid",
    "completedAt": "2025-01-03T10:15:00Z"
  }
}
```

## Services

### PersonaService
Generates realistic AI-powered persona messages.

```typescript
generatePersonaMessage(
  scenario: Scenario,
  conversationHistory: Message[]
): Promise<string>
```

### EvaluationService
Evaluates session performance against learning objectives.

```typescript
evaluateSession(
  session: LearningInteraction,
  scenario: Scenario
): Promise<EvaluationResult>
```

### LearningService
Creates knowledge zettels from evaluation results.

```typescript
createLearningZettel(
  evaluation: EvaluationResult,
  userId: string
): Promise<KnowledgeNode>
```

## Database Models

- `Scenario` - Training scenario definitions
- `LearningInteraction` - Session records
- `LearningGap` - Identified skill gaps
- `Message` - Chat conversation history
- `KnowledgeNode` - Generated learning zettels

## Dependencies

- **OpenAI API** - For persona interactions and evaluations
- **Prisma Client** - ORM for database access
- **People Growth Module** - For gap detection and recommendations

## Testing

See `teste.http` for complete testing examples.

**Quick Test:**
```bash
# Start a session
curl -X POST http://localhost:3000/api/v1/simulation/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"scenarioId": "uuid", "userId": "uuid"}'
```

## Error Handling

```json
{
  "success": false,
  "error": "Scenario not found",
  "code": "SCENARIO_NOT_FOUND",
  "details": []
}
```

Common errors:
- `SCENARIO_NOT_FOUND`: Scenario ID is invalid
- `SESSION_NOT_FOUND`: Session ID is invalid
- `UNAUTHORIZED`: Missing or invalid token
- `OPENAI_ERROR`: Issue with AI persona generation

## Environment Variables

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
```

## Version

v1.0.0

## Last Updated

January 3, 2026
