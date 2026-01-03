# Backend API Routes Summary

## File Location
`/home/user/completov2/backend/all-routes.http`

## Overview
- **Total Routes**: 236
- **Total Modules**: 34
- **File Format**: REST Client (.http) - VS Code extension compatible
- **Base URL**: http://localhost:3000

## Module Breakdown

| Module | Routes | Key Features |
|--------|--------|--------------|
| **ai** | 6 | Chat, RAG (ingest/query/search), AI mode management |
| **analytics** | 6 | Activity tracking, dashboard, export, pipeline, timeseries |
| **apikeys** | 3 | Create, list, delete API keys |
| **audit** | 5 | Activity logs, history, export, stats |
| **auth** | 8 | Login, register, 2FA (setup/verify/disable), logout, refresh, me |
| **automations** | 12 | Workflows (CRUD, activate, pause, test, analyze), executions, suggestions |
| **chat** | 8 | Channels (list/create), messages (list/send), sentiment, suggest-reply, summary |
| **cmms** | 14 | Assets, downtime, maintenance (plans/records), spare parts |
| **crm** | 19 | Contacts, deals, interactions, AI recommendations, pipeline analytics |
| **dashboard** | 2 | Main dashboard, stats |
| **deduplication** | 7 | Detect, merge, auto-merge, pending, feedback, history, rollback |
| **email-templates** | 3 | List, preview, send |
| **erp** | 2 | Products (list, create) |
| **feedback** | 2 | Create, list feedback |
| **files** | 6 | Upload, download, list, delete, get-url, avatar |
| **fsm** | 13 | Work orders, technicians, time tracking, tasks, checklist |
| **gatekeeper** | 2 | Check permissions, manage rules |
| **jobs** | 10 | Jobs CRUD, applications, apply, interest, suggestions |
| **knowledge** | 17 | Nodes (CRUD), links, convert, tags, semantic search, graph, ask |
| **learning** | 10 | Learning paths, enrollment, skill assessment, development plans |
| **mcp** | 11 | Servers, resources, tools, logs management |
| **narrative** | 1 | Generate narratives |
| **notifications** | 3 | List, read, read-all |
| **omnichannel** | 12 | Accounts, conversations, QR code, send-message, webhook |
| **partnerships** | 5 | Partnerships CRUD |
| **people-growth** | 7 | Skill gaps, learning paths, team reports, heatmap |
| **rbac** | 4 | Roles, permissions, assign roles |
| **search** | 4 | Global search, recent, save, suggest |
| **services** | 13 | Services CRUD, proposals, transactions, ratings |
| **settings** | 2 | Get, update settings |
| **simulation** | 4 | Scenarios, session management |
| **sso** | 4 | Accounts, authorize, callback, disconnect |
| **sync** | 6 | Connections, sync runs management |
| **webhooks** | 5 | Webhooks CRUD, test |

## Usage Instructions

### Prerequisites
- VS Code with REST Client extension installed
- Backend server running on http://localhost:3000
- Valid JWT token for authentication

### Getting Started

1. **Set your token**:
   - Update the `@token` variable at the top of the file with your JWT token
   - Get a token by running the Login request first

2. **Run requests**:
   - Click "Send Request" above any HTTP method line
   - Or use the keyboard shortcut (Ctrl/Cmd + Alt + R)

3. **Variables**:
   - `{{baseUrl}}` - Base API URL (http://localhost:3000)
   - `{{token}}` - Your JWT authentication token

### Authentication Flow

1. **Register** (Public):
   ```http
   POST {{baseUrl}}/api/v1/auth/register
   ```

2. **Login** (Public):
   ```http
   POST {{baseUrl}}/api/v1/auth/login
   ```

3. **Copy the token** from the response and update `@token` variable

4. **Access protected routes** using the token

## Route Features

### Sample Request Bodies
- All POST/PUT/PATCH requests include realistic sample request bodies
- Bodies are pre-populated with example data
- Field types and structures match the backend validation schemas

### Authorization Headers
- Protected routes include `Authorization: Bearer {{token}}`
- Public routes (login, register, refresh, SSO callback) do not include auth headers
- Easy to identify which routes require authentication

### Path Parameters
- Routes with dynamic parameters use `:param` notation
- Examples: `/api/v1/contacts/:id`, `/api/v1/deals/:id/stage`
- Replace with actual UUIDs when making requests

### Query Parameters
- Documented in GET request comments where applicable
- Common params: `page`, `limit`, `search`, `filter`, `sort`

## File Structure

Each module section includes:
```
### ===========================================
### MODULE_NAME MODULE (X routes)
### ===========================================

### 1. Route Description
METHOD {{baseUrl}}/api/v1/module/endpoint
Authorization: Bearer {{token}}  (if protected)
Content-Type: application/json  (if POST/PUT/PATCH)

{
  "sampleBody": "data"
}
```

## Notes

- **REST Client Format**: Compatible with VS Code REST Client extension
- **IntelliJ Compatible**: Also works with IntelliJ HTTP Client
- **Postman**: Can be imported into Postman with minimal adjustments
- **Organized by Module**: Routes grouped alphabetically by module
- **Route Count per Module**: Header shows total routes in each section
- **Numbered Routes**: Each route numbered within its module

## Updates

To regenerate this file if routes change:
1. Route extraction script reads all `*.route.ts` files
2. Parses `app.get/post/put/patch/delete` registrations
3. Generates corresponding HTTP requests with sample bodies
4. Organizes by module alphabetically

---

Generated on: 2026-01-03
Total Routes: 236
Total Modules: 34
