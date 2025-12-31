# Completo V2 - API Documentation

## Table of Contents
1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [Jobs API](#jobs-api)
4. [Services API](#services-api)
5. [Partnerships API](#partnerships-api)
6. [System Settings API](#system-settings-api)
7. [Zettels (Knowledge) API](#zettels-knowledge-api)
8. [Webhooks API](#webhooks-api)
9. [CMMS (Asset Management) API](#cmms-asset-management-api)
10. [FSM (Field Service Management) API](#fsm-field-service-management-api)
11. [MCP (Multi-Channel Processing) API](#mcp-multi-channel-processing-api)
12. [Error Handling](#error-handling)

---

## Base Information

### Base URL
```
http://localhost:3000/api/v1
```

### Headers
All requests should include:
```
Content-Type: application/json
```

Authenticated requests require:
```
Authorization: Bearer <your_jwt_token>
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": []
}
```

---

## Authentication

### Register
Create a new user and company account.

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "SecurePass123!",
  "companyName": "Acme Corp",
  "companyDomain": "acme"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "john@company.com",
      "name": "John Doe",
      "role": "admin_empresa",
      "companyId": "uuid"
    }
  }
}
```

### Login
Authenticate with email and password.

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@company.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "john@company.com",
      "name": "John Doe",
      "role": "admin_empresa",
      "companyId": "uuid"
    }
  }
}
```

### Get Current User
Get information about the currently authenticated user.

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john@company.com",
    "name": "John Doe",
    "role": "admin_empresa",
    "companyId": "uuid",
    "company": {
      "id": "uuid",
      "name": "Acme Corp",
      "domain": "acme"
    }
  }
}
```

---

## Jobs API

### List Jobs
Get all jobs with optional filtering.

```http
GET /api/v1/jobs?status=open&types=public&page=1&limit=10
Authorization: Bearer <token> (optional for public jobs)
```

**Query Parameters:**
- `status` (optional): Filter by status (`open`, `closed`, `draft`)
- `types` (optional): Filter by type (`public`, `internal`, `partners`)
- `search` (optional): Search in title and description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Senior Full Stack Developer",
      "description": "We are looking for an experienced developer...",
      "types": ["public", "partners"],
      "isSpecialized": true,
      "requiredSkills": ["JavaScript", "React", "Node.js"],
      "requiredDocuments": ["diploma", "portfolio"],
      "status": "open",
      "vacancies": 2,
      "location": "Remote",
      "salary": "USD 80,000 - 120,000",
      "benefits": "Health insurance, flexible hours",
      "companyId": "uuid",
      "company": {
        "name": "Acme Corp",
        "domain": "acme"
      },
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**CURL Example:**
```bash
# List all public jobs (no authentication)
curl -X GET "http://localhost:3000/api/v1/jobs?types=public"

# List jobs with authentication
curl -X GET "http://localhost:3000/api/v1/jobs" \
  -H "Authorization: Bearer <token>"
```

### Get Single Job
Get details of a specific job.

```http
GET /api/v1/jobs/:id
Authorization: Bearer <token> (optional for public jobs)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Senior Full Stack Developer",
    "description": "Full job description...",
    "types": ["public"],
    "isSpecialized": true,
    "requiredSkills": ["JavaScript", "React", "Node.js"],
    "requiredDocuments": ["diploma", "portfolio"],
    "status": "open",
    "vacancies": 2,
    "location": "Remote",
    "salary": "USD 80,000 - 120,000",
    "benefits": "Health insurance, flexible hours",
    "companyId": "uuid",
    "company": {
      "name": "Acme Corp",
      "domain": "acme"
    },
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### Create Job
Create a new job posting.

```http
POST /api/v1/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Senior Full Stack Developer",
  "description": "We are looking for an experienced developer...",
  "types": ["public", "partners"],
  "isSpecialized": true,
  "requiredSkills": ["JavaScript", "React", "Node.js"],
  "requiredDocuments": ["diploma", "portfolio"],
  "vacancies": 2,
  "location": "Remote",
  "salary": "USD 80,000 - 120,000",
  "benefits": "Health insurance, flexible hours",
  "status": "open"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Senior Full Stack Developer",
    ...
  }
}
```

**CURL Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/jobs" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Full Stack Developer",
    "description": "We are looking for an experienced developer...",
    "types": ["public"],
    "isSpecialized": true,
    "requiredSkills": ["JavaScript", "React", "Node.js"],
    "vacancies": 2
  }'
```

### Update Job
Update an existing job.

```http
PATCH /api/v1/jobs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "closed",
  "vacancies": 0
}
```

### Delete Job
Delete a job posting.

```http
DELETE /api/v1/jobs/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

### Apply to Job
Submit an application for a job.

```http
POST /api/v1/jobs/:id/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "coverLetter": "I am very interested in this position...",
  "documents": ["https://example.com/resume.pdf", "https://example.com/diploma.pdf"],
  "expectedSalary": "USD 100,000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "jobId": "uuid",
    "employeeId": "uuid",
    "coverLetter": "I am very interested...",
    "documents": [...],
    "status": "pending",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**CURL Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/jobs/<job-id>/apply" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "coverLetter": "I am very interested in this position...",
    "documents": ["https://example.com/resume.pdf"]
  }'
```

### Mark Job Interest
Mark interest in a job without applying.

```http
POST /api/v1/jobs/:id/interest
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "I'm interested but need to gain more skills first"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "jobId": "uuid",
    "employeeId": "uuid",
    "notes": "I'm interested but need to gain more skills first",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### Get Job Suggestions
Get Zettel suggestions to help reach the required skill level for a job.

```http
GET /api/v1/jobs/:id/suggestions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "jobId": "uuid",
      "employeeId": "uuid",
      "zettelId": "uuid",
      "zettel": {
        "id": "uuid",
        "title": "Introduction to React Hooks",
        "description": "Learn React Hooks fundamentals",
        "type": "course"
      },
      "reason": "This course will help you master React, which is required for this position",
      "priority": "high",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Get Job Applications (Admin)
Get all applications for a job (company admins only).

```http
GET /api/v1/jobs/:id/applications
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "jobId": "uuid",
      "employee": {
        "id": "uuid",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "coverLetter": "I am very interested...",
      "documents": [...],
      "status": "pending",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Review Application (Admin)
Accept or reject a job application.

```http
PATCH /api/v1/jobs/applications/:id/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "accepted",
  "feedback": "Your application has been accepted. We'll contact you soon."
}
```

---

## Services API

### List Services
Get all accessible services.

```http
GET /api/v1/services?status=open&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (`open`, `in_progress`, `completed`, `cancelled`)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Website Development",
      "description": "Need a modern e-commerce website...",
      "budget": 5000,
      "acceptCompanies": true,
      "acceptIndividuals": false,
      "status": "open",
      "companyId": "uuid",
      "company": {
        "name": "Acme Corp",
        "domain": "acme"
      },
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 20,
    "page": 1,
    "limit": 10
  }
}
```

**CURL Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/services?status=open" \
  -H "Authorization: Bearer <token>"
```

### Get Single Service
Get details of a specific service.

```http
GET /api/v1/services/:id
Authorization: Bearer <token>
```

### Create Service
Create a new service request.

```http
POST /api/v1/services
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Website Development",
  "description": "Need a modern e-commerce website with payment integration...",
  "requirements": "React, Node.js, Payment gateway integration",
  "budget": 5000,
  "deadline": "2025-12-31",
  "acceptCompanies": true,
  "acceptIndividuals": false,
  "status": "open"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Website Development",
    "budget": 5000,
    ...
  }
}
```

**CURL Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/services" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Website Development",
    "description": "Need a modern e-commerce website...",
    "budget": 5000,
    "acceptCompanies": true,
    "acceptIndividuals": false
  }'
```

### Update Service
Update an existing service.

```http
PATCH /api/v1/services/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "budget": 6000
}
```

### Delete Service
Delete a service request.

```http
DELETE /api/v1/services/:id
Authorization: Bearer <token>
```

### Submit Service Proposal
Submit a proposal to fulfill a service.

```http
POST /api/v1/services/:id/proposals
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "I can complete this project with high quality...",
  "portfolio": "https://example.com/portfolio",
  "estimatedCompletion": "2025-06-30"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "serviceId": "uuid",
    "providerId": "uuid",
    "providerType": "company",
    "message": "I can complete this project...",
    "status": "pending",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**CURL Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/services/<service-id>/proposals" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I can complete this project with high quality...",
    "portfolio": "https://example.com/portfolio"
  }'
```

### Get Service Proposals
Get all proposals for a service (service creator only).

```http
GET /api/v1/services/:id/proposals
Authorization: Bearer <token>
```

### Accept Service Proposal
Accept a proposal and create a transaction.

```http
PATCH /api/v1/services/proposals/:id/accept
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "proposal": {
      "id": "uuid",
      "status": "accepted",
      "reviewedAt": "2025-01-01T00:00:00Z"
    },
    "transaction": {
      "id": "uuid",
      "amount": 5000,
      "serviceFee": 500,
      "providerReceives": 4500,
      "status": "pending"
    }
  }
}
```

### Reject Service Proposal
Reject a proposal.

```http
PATCH /api/v1/services/proposals/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "rejectionReason": "Budget constraints"
}
```

### Complete Service
Mark a service as completed.

```http
PATCH /api/v1/services/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "deliverables": "https://example.com/final-website"
}
```

### Rate Service
Rate a completed service.

```http
PATCH /api/v1/services/:id/rate
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "feedback": "Excellent work, delivered on time!"
}
```

---

## Partnerships API

### List Partnerships
Get all active partnerships for your company.

```http
GET /api/v1/partnerships?status=active
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `suspended`, `terminated`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "companyAId": "uuid",
      "companyBId": "uuid",
      "companyA": {
        "id": "uuid",
        "name": "Acme Corp",
        "domain": "acme"
      },
      "companyB": {
        "id": "uuid",
        "name": "Beta Inc",
        "domain": "beta"
      },
      "shareJobs": true,
      "shareServices": true,
      "shareResources": false,
      "status": "active",
      "terms": "Mutual collaboration agreement...",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**CURL Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/partnerships" \
  -H "Authorization: Bearer <token>"
```

### Get Single Partnership
Get details of a specific partnership.

```http
GET /api/v1/partnerships/:id
Authorization: Bearer <token>
```

### Create Partnership
Create a new partnership (direct creation without invite).

```http
POST /api/v1/partnerships
Authorization: Bearer <token>
Content-Type: application/json

{
  "partnerCompanyId": "uuid",
  "shareJobs": true,
  "shareServices": true,
  "shareResources": false,
  "terms": "Mutual collaboration agreement..."
}
```

### Update Partnership
Update partnership permissions.

```http
PATCH /api/v1/partnerships/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "shareJobs": false,
  "shareServices": true,
  "shareResources": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "shareJobs": false,
    "shareServices": true,
    "shareResources": true,
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**CURL Example:**
```bash
curl -X PATCH "http://localhost:3000/api/v1/partnerships/<partnership-id>" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shareServices": true,
    "shareResources": false
  }'
```

### Terminate Partnership
Terminate an existing partnership.

```http
DELETE /api/v1/partnerships/:id
Authorization: Bearer <token>
```

### Send Partnership Invite
Send an invitation to form a partnership.

```http
POST /api/v1/partnerships/invites
Authorization: Bearer <token>
Content-Type: application/json

{
  "toCompanyId": "uuid",
  "shareJobs": true,
  "shareServices": true,
  "shareResources": false,
  "proposedTerms": "We propose a mutual partnership to share resources...",
  "message": "We would like to partner with your company..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fromCompanyId": "uuid",
    "toCompanyId": "uuid",
    "shareJobs": true,
    "shareServices": true,
    "shareResources": false,
    "status": "pending",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**CURL Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/partnerships/invites" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "uuid",
    "shareJobs": true,
    "shareServices": true,
    "message": "We would like to partner with your company..."
  }'
```

### List Partnership Invites
Get all partnership invites (sent and received).

```http
GET /api/v1/partnerships/invites?status=pending
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `accepted`, `rejected`)
- `type` (optional): Filter by type (`sent`, `received`)

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": [
      {
        "id": "uuid",
        "fromCompany": { "name": "Acme Corp" },
        "toCompany": { "name": "Beta Inc" },
        "status": "pending",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "received": [
      {
        "id": "uuid",
        "fromCompany": { "name": "Gamma LLC" },
        "toCompany": { "name": "Acme Corp" },
        "status": "pending",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

### Accept Partnership Invite
Accept a partnership invitation.

```http
PATCH /api/v1/partnerships/invites/:id/accept
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invite": {
      "id": "uuid",
      "status": "accepted",
      "respondedAt": "2025-01-01T00:00:00Z"
    },
    "partnership": {
      "id": "uuid",
      "status": "active",
      "shareJobs": true,
      "shareServices": true
    }
  }
}
```

**CURL Example:**
```bash
curl -X PATCH "http://localhost:3000/api/v1/partnerships/invites/<invite-id>/accept" \
  -H "Authorization: Bearer <token>"
```

### Reject Partnership Invite
Reject a partnership invitation.

```http
PATCH /api/v1/partnerships/invites/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "rejectionReason": "Not aligned with our current strategy"
}
```

---

## System Settings API

### Get System Settings
Get current system settings (DEV and admin only).

```http
GET /api/v1/settings
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "serviceFeePercentage": 10.0,
    "minServiceFee": 5.0,
    "maxServiceFee": 1000.0,
    "currency": "BRL",
    "updatedAt": "2025-01-01T00:00:00Z",
    "updatedBy": {
      "name": "Admin User",
      "email": "admin@example.com"
    }
  }
}
```

**CURL Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/settings" \
  -H "Authorization: Bearer <token>"
```

### Update System Settings
Update system settings (DEV and admin only).

```http
PATCH /api/v1/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceFeePercentage": 12.0,
  "minServiceFee": 10.0,
  "maxServiceFee": 2000.0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "serviceFeePercentage": 12.0,
    "minServiceFee": 10.0,
    "maxServiceFee": 2000.0,
    "currency": "BRL",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**CURL Example:**
```bash
curl -X PATCH "http://localhost:3000/api/v1/settings" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceFeePercentage": 12.0,
    "minServiceFee": 10.0
  }'
```

### Get Settings History
Get history of settings changes (DEV and admin only).

```http
GET /api/v1/settings/history
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "settingsId": "uuid",
      "changes": {
        "serviceFeePercentage": {
          "old": 10.0,
          "new": 12.0
        }
      },
      "changedBy": {
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "changedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## Zettels (Knowledge) API

### List Zettels
Get all accessible Zettels.

```http
GET /api/v1/zettels?visibility=company&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `visibility` (optional): Filter by visibility (`personal`, `company`, `public`)
- `type` (optional): Filter by type (`note`, `course`, `article`, `documentation`)
- `search` (optional): Search in title and content
- `tags` (optional): Filter by tags (comma-separated)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "React Best Practices",
      "description": "Common patterns and best practices for React development",
      "content": { ... },
      "type": "article",
      "visibility": "company",
      "tags": ["react", "javascript", "frontend"],
      "employeeId": "uuid",
      "companyId": "uuid",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 10
  }
}
```

### Get Single Zettel
Get details of a specific Zettel.

```http
GET /api/v1/zettels/:id
Authorization: Bearer <token>
```

### Create Zettel
Create a new Zettel.

```http
POST /api/v1/zettels
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "React Best Practices",
  "description": "Common patterns and best practices",
  "content": {
    "sections": [
      { "title": "Introduction", "text": "..." },
      { "title": "Component Structure", "text": "..." }
    ]
  },
  "type": "article",
  "visibility": "company",
  "tags": ["react", "javascript", "frontend"]
}
```

### Update Zettel
Update an existing Zettel.

```http
PATCH /api/v1/zettels/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "visibility": "public",
  "tags": ["react", "javascript", "frontend", "best-practices"]
}
```

### Delete Zettel
Delete a Zettel.

```http
DELETE /api/v1/zettels/:id
Authorization: Bearer <token>
```

---

## Webhooks API

### List Webhooks
Get all webhooks for your company.

```http
GET /api/v1/webhooks
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Job Created Notification",
      "url": "https://example.com/webhook",
      "events": ["job.created", "job.updated"],
      "active": true,
      "secret": "whsec_...",
      "companyId": "uuid",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Create Webhook
Create a new webhook.

```http
POST /api/v1/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Job Created Notification",
  "url": "https://example.com/webhook",
  "events": ["job.created", "job.updated"],
  "active": true
}
```

### Update Webhook
Update an existing webhook.

```http
PATCH /api/v1/webhooks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "active": false
}
```

### Delete Webhook
Delete a webhook.

```http
DELETE /api/v1/webhooks/:id
Authorization: Bearer <token>
```

---

## CMMS (Asset Management) API

### List Assets
Get all assets for your company.

```http
GET /api/v1/cmms/assets?status=active
Authorization: Bearer <token>
```

### Get Single Asset
```http
GET /api/v1/cmms/assets/:id
Authorization: Bearer <token>
```

### Create Asset
```http
POST /api/v1/cmms/assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "CNC Machine #5",
  "description": "High-precision CNC milling machine",
  "type": "equipment",
  "location": "Factory Floor A",
  "status": "active",
  "metadata": {
    "serialNumber": "ABC123",
    "manufacturer": "Acme Manufacturing"
  }
}
```

### Create Maintenance Record
```http
POST /api/v1/cmms/maintenance
Authorization: Bearer <token>
Content-Type: application/json

{
  "assetId": "uuid",
  "type": "preventive",
  "description": "Regular maintenance check",
  "scheduledDate": "2025-06-01",
  "assignedTo": "uuid"
}
```

---

## FSM (Field Service Management) API

### List Work Orders
Get all work orders.

```http
GET /api/v1/fsm/work-orders?status=open
Authorization: Bearer <token>
```

### Create Work Order
```http
POST /api/v1/fsm/work-orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Install HVAC System",
  "description": "Install new HVAC system at client location",
  "clientId": "uuid",
  "priority": "high",
  "scheduledDate": "2025-06-15",
  "assignedTo": "uuid"
}
```

### Update Work Order Status
```http
PATCH /api/v1/fsm/work-orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress"
}
```

---

## MCP (Multi-Channel Processing) API

### List Messages
Get all messages from various channels.

```http
GET /api/v1/mcp/messages?channel=email
Authorization: Bearer <token>
```

### Send Message
```http
POST /api/v1/mcp/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "channel": "email",
  "to": "customer@example.com",
  "subject": "Your Order Confirmation",
  "body": "Thank you for your order..."
}
```

---

## Error Handling

### Error Response Format
All errors follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": []
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions for this action |
| `NOT_FOUND` | 404 | Requested resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `DUPLICATE_ERROR` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Example Error Responses

#### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "title",
      "message": "Title must be at least 3 characters long"
    },
    {
      "field": "budget",
      "message": "Budget must be a positive number"
    }
  ]
}
```

#### Unauthorized Error
```json
{
  "success": false,
  "error": "No token provided",
  "code": "UNAUTHORIZED"
}
```

#### Forbidden Error
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "FORBIDDEN"
}
```

#### Not Found Error
```json
{
  "success": false,
  "error": "Job not found",
  "code": "NOT_FOUND"
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Standard endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **Public endpoints**: 30 requests per 15 minutes (unauthenticated)

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

---

## Pagination

All list endpoints support pagination using query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Pagination information is included in the response:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 245,
    "page": 1,
    "limit": 10,
    "totalPages": 25
  }
}
```

---

## Filtering and Sorting

### Filtering
Most list endpoints support filtering via query parameters:

```http
GET /api/v1/jobs?status=open&types=public&location=Remote
```

### Sorting
Sort results using `sortBy` and `sortOrder` parameters:

```http
GET /api/v1/jobs?sortBy=createdAt&sortOrder=desc
```

- `sortBy`: Field to sort by (default: `createdAt`)
- `sortOrder`: Sort direction (`asc` or `desc`, default: `desc`)

---

## Webhooks

The platform can send webhooks to notify your application of events:

### Webhook Payload Format

```json
{
  "id": "evt_123",
  "type": "job.created",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "jobId": "uuid",
    "title": "Senior Developer",
    "companyId": "uuid"
  }
}
```

### Webhook Signature Verification

Webhooks include a signature in the `X-Webhook-Signature` header for verification:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Available Webhook Events

- `job.created` - New job created
- `job.updated` - Job updated
- `job.deleted` - Job deleted
- `job.application.submitted` - New application submitted
- `service.created` - New service created
- `service.proposal.submitted` - New proposal submitted
- `service.completed` - Service completed
- `partnership.invite.sent` - Partnership invite sent
- `partnership.invite.accepted` - Partnership invite accepted
- `partnership.created` - New partnership created

---

## Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (never in localStorage for sensitive apps)
3. **Implement exponential backoff** for retries
4. **Validate webhook signatures** before processing
5. **Handle rate limits** gracefully
6. **Use pagination** for large datasets
7. **Include proper error handling** in your application
8. **Set appropriate timeouts** for API calls
9. **Monitor API usage** and performance
10. **Keep API credentials secure** and rotate them regularly

---

## Support

For API support, please contact:
- Email: api-support@completo.com
- Documentation: https://docs.completo.com
- Status Page: https://status.completo.com
