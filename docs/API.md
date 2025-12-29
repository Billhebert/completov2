# API Documentation

Base URL: `http://localhost:3000/api/v1`

## Authentication

All endpoints (except auth routes) require `Authorization: Bearer <token>` header.

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "securepass",
  "companyName": "My Company",
  "companyDomain": "mycompany"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@company.com",
  "password": "securepass",
  "code2FA": "123456" // Optional
}
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "john@company.com",
      "name": "John Doe",
      "role": "admin",
      "companyId": "uuid"
    }
  }
}
```

## Modules

See individual module documentation:
- Chat: `/docs/modules/CHAT.md`
- CRM: `/docs/modules/CRM.md`
- ERP: `/docs/modules/ERP.md`
- Knowledge: `/docs/modules/KNOWLEDGE.md`
- AI: `/docs/modules/AI.md`

## Error Responses

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [...],
    "traceId": "trace_123"
  }
}
```

## Rate Limiting

- **API calls**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes

Headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp
