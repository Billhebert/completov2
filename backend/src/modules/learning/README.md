# 📚 Learning Module

Learning management system for learning paths, skill development, and progress tracking.

## Overview

The Learning module provides:
- **Learning Paths**: Structured learning curricula with difficulty levels
- **Enrollments**: User enrollment and progress tracking
- **Skill Management**: Skill catalog and proficiency assessments
- **Progress Tracking**: Item completion and enrollment progress
- **Development Plans**: Long-term skill development goals
- **Auto-Calculation**: Automatic progress percentage calculation

## API Routes (10 total)

### Learning Paths (3 routes)

#### 1. List Learning Paths
Get all available learning paths.

```http
GET /api/v1/learning/paths?page=1&limit=20&difficulty=intermediate
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `difficulty` (optional): beginner, intermediate, advanced, expert
- `targetRole` (optional): Filter by target role

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Advanced TypeScript Mastery",
      "description": "Master advanced TypeScript concepts and patterns",
      "difficulty": "advanced",
      "estimatedDuration": 40,
      "skills": ["typescript", "oop", "design-patterns"],
      "targetRole": "senior-developer",
      "enrollmentCount": 127,
      "averageCompletionTime": 45,
      "createdAt": "2024-06-15T00:00:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### 2. Get Learning Path Details
Get detailed information about a specific learning path.

```http
GET /api/v1/learning/paths/:pathId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Advanced TypeScript Mastery",
    "description": "Master advanced TypeScript concepts and patterns",
    "difficulty": "advanced",
    "estimatedDuration": 40,
    "skills": ["typescript", "oop", "design-patterns"],
    "targetRole": "senior-developer",
    "items": [
      {
        "id": "uuid",
        "title": "Generic Types",
        "description": "Understanding generics in TypeScript",
        "duration": 8,
        "order": 1
      }
    ],
    "prerequisites": ["Intermediate TypeScript"],
    "enrollmentCount": 127,
    "createdAt": "2024-06-15T00:00:00Z"
  }
}
```

#### 3. Create Learning Path
Create a new learning path.

```http
POST /api/v1/learning/paths
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Advanced TypeScript Mastery",
  "description": "Master advanced TypeScript concepts and patterns",
  "difficulty": "advanced",
  "estimatedDuration": 40,
  "skills": ["typescript", "oop", "design-patterns"],
  "targetRole": "senior-developer"
}
```

**Difficulty Levels:**
- `beginner`, `intermediate`, `advanced`, `expert`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Advanced TypeScript Mastery",
    ...
  }
}
```

### Enrollments (2 routes)

#### 4. Enroll User in Path
Create a new learning enrollment.

```http
POST /api/v1/learning/enroll
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "pathId": "path-uuid",
  "startDate": "2025-01-03"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "pathId": "path-uuid",
    "startDate": "2025-01-03",
    "completionPercentage": 0,
    "status": "in-progress",
    "createdAt": "2025-01-03T10:00:00Z"
  }
}
```

#### 5. List User Enrollments
Get all enrollments for a user.

```http
GET /api/v1/learning/enrollments?userId=user-uuid&status=in-progress
Authorization: Bearer <token>
```

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `status` (optional): in-progress, completed, paused
- `page` (optional): Page number

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "path": {
        "id": "uuid",
        "title": "Advanced TypeScript Mastery",
        "difficulty": "advanced"
      },
      "startDate": "2025-01-03",
      "completionPercentage": 35,
      "completedItems": 14,
      "totalItems": 40,
      "status": "in-progress",
      "estimatedCompletionDate": "2025-03-01",
      "createdAt": "2025-01-03T10:00:00Z"
    }
  ],
  "meta": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Progress Tracking (1 route)

#### 6. Complete Learning Item
Mark a learning item as completed.

```http
POST /api/v1/learning/items/:itemId/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "score": 85,
  "timeSpent": 120,
  "notes": "Good understanding of concepts"
}
```

**Parameters:**
- `score` (optional): Completion score (0-100)
- `timeSpent` (optional): Time spent in minutes
- `notes` (optional): Completion notes

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "completed": true,
    "completedAt": "2025-01-03T11:00:00Z",
    "score": 85,
    "enrollmentProgress": {
      "completionPercentage": 38,
      "completedItems": 15,
      "totalItems": 40
    }
  }
}
```

### Skill Management (3 routes)

#### 7. List Available Skills
Get all available skills in the catalog.

```http
GET /api/v1/learning/skills?page=1&limit=20&category=technical
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `category` (optional): Filter by category

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "TypeScript",
      "category": "technical",
      "description": "Proficiency in TypeScript programming language",
      "proficiencyLevels": ["beginner", "intermediate", "advanced", "expert"],
      "relatedPaths": ["Advanced TypeScript Mastery"],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 20,
    "totalPages": 6
  }
}
```

#### 8. Get My Skills
Get current user's skill profile.

```http
GET /api/v1/learning/my-skills
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "skills": [
      {
        "id": "uuid",
        "name": "TypeScript",
        "proficiencyLevel": "intermediate",
        "yearsOfExperience": 3,
        "assessmentScore": 75,
        "lastAssessedDate": "2025-01-02T00:00:00Z"
      }
    ],
    "totalSkills": 12,
    "lastUpdated": "2025-01-02T00:00:00Z"
  }
}
```

#### 9. Assess Skill
Add or update skill assessment.

```http
POST /api/v1/learning/skills/:skillId/assess
Authorization: Bearer <token>
Content-Type: application/json

{
  "proficiencyLevel": "intermediate",
  "yearsOfExperience": 5,
  "assessmentScore": 75
}
```

**Proficiency Levels:**
- `beginner`, `intermediate`, `advanced`, `expert`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "skillId": "uuid",
    "proficiencyLevel": "intermediate",
    "yearsOfExperience": 5,
    "assessmentScore": 75,
    "assessedAt": "2025-01-03T10:00:00Z"
  }
}
```

### Development Plans (1 route)

#### 10. Create Development Plan
Create a personal development plan.

```http
POST /api/v1/learning/development-plans
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "title": "Frontend Development Roadmap",
  "targetSkills": ["react", "typescript", "testing"],
  "timeline": 6,
  "notes": "Personal development plan for Q1 2025"
}
```

**Timeline:** Duration in months

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "title": "Frontend Development Roadmap",
    "targetSkills": ["react", "typescript", "testing"],
    "timeline": 6,
    "status": "active",
    "createdAt": "2025-01-03T10:00:00Z",
    "targetCompletionDate": "2025-07-03"
  }
}
```

## Database Models

- `LearningPath` - Learning curriculum definitions
- `LearningItem` - Individual learning items
- `LearningEnrollment` - User enrollments with progress
- `EmployeeSkill` - User skill assessments
- `SkillDevelopmentPlan` - Development plans

## Features

- **Auto Progress Calculation**: Completion % updated automatically
- **Prerequisites**: Path prerequisites validation
- **Skill Recommendations**: Learning path suggestions based on skills
- **Progress Tracking**: Detailed item completion history

## Testing

See `teste.http` for complete testing examples.

## Error Handling

```json
{
  "success": false,
  "error": "Learning path not found",
  "code": "PATH_NOT_FOUND"
}
```

Common errors:
- `PATH_NOT_FOUND`
- `ITEM_NOT_FOUND`
- `ENROLLMENT_NOT_FOUND`
- `SKILL_NOT_FOUND`
- `UNAUTHORIZED`
- `ALREADY_ENROLLED`

## Version

v1.0.0

## Last Updated

January 3, 2026
