# 🔄 Sync Module

External system synchronization for RDStation, HubSpot, Zendesk, and Chatwoot.

## Overview

The Sync module provides:
- **Connection Management**: Connect to external platforms
- **Data Synchronization**: Sync contacts, conversations, and data
- **Platform Support**: RDStation, HubSpot, Zendesk, Chatwoot
- **Sync History**: Track all synchronization runs
- **Error Handling**: Detailed error reporting and retry logic

## API Routes

### 1. List Connections
Get all synchronized connections.

```http
GET /api/v1/sync/connections
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `platform` (optional): Filter by platform (rdstation, hubspot, zendesk, chatwoot)
- `enabled` (optional): Filter by enabled status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "RDStation Connection",
      "platform": "rdstation",
      "enabled": true,
      "lastSyncAt": "2025-01-03T10:00:00Z",
      "lastSyncStatus": "success",
      "syncedRecords": 1250,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 4,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 2. Create Connection
Create a new external system connection.

```http
POST /api/v1/sync/connections
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "RDStation Connection",
  "platform": "rdstation",
  "credentials": {
    "apiKey": "your-api-key",
    "workspaceId": "workspace-id"
  },
  "enabled": true
}
```

**Supported Platforms:**

#### RDStation
```json
{
  "platform": "rdstation",
  "credentials": {
    "apiKey": "string",
    "workspaceId": "string"
  }
}
```

#### HubSpot
```json
{
  "platform": "hubspot",
  "credentials": {
    "accessToken": "string"
  }
}
```

#### Zendesk
```json
{
  "platform": "zendesk",
  "credentials": {
    "email": "string",
    "apiToken": "string",
    "subdomain": "string"
  }
}
```

#### Chatwoot
```json
{
  "platform": "chatwoot",
  "credentials": {
    "accountId": "string",
    "accessToken": "string",
    "baseUrl": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "RDStation Connection",
    "platform": "rdstation",
    "enabled": true,
    "createdAt": "2025-01-03T10:00:00Z"
  }
}
```

### 3. List Sync Runs
Get history of synchronization runs.

```http
GET /api/v1/sync/runs?page=1&limit=20&connectionId=uuid&status=success
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `connectionId` (optional): Filter by connection
- `status` (optional): Filter by status (pending, success, error)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "connectionId": "uuid",
      "status": "success",
      "recordsSynced": 250,
      "recordsCreated": 50,
      "recordsUpdated": 200,
      "recordsErrors": 0,
      "startedAt": "2025-01-03T10:00:00Z",
      "completedAt": "2025-01-03T10:05:30Z",
      "duration": "5m 30s"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### 4. Get Sync Run Details
Get detailed information about a specific sync run.

```http
GET /api/v1/sync/runs/:runId
Authorization: Bearer <token>
```

**Parameters:**
- `runId` (path): Sync run ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "connectionId": "uuid",
    "connection": {
      "name": "RDStation Connection",
      "platform": "rdstation"
    },
    "status": "success",
    "recordsSynced": 250,
    "recordsCreated": 50,
    "recordsUpdated": 200,
    "recordsErrors": 0,
    "errors": [],
    "startedAt": "2025-01-03T10:00:00Z",
    "completedAt": "2025-01-03T10:05:30Z",
    "duration": "5m 30s",
    "logUrl": "https://..."
  }
}
```

### 5. Start Sync Job
Manually trigger a synchronization job.

```http
POST /api/v1/sync/run
Authorization: Bearer <token>
Content-Type: application/json

{
  "connectionId": "uuid",
  "fullSync": false
}
```

**Parameters:**
- `connectionId` (required): Connection to sync
- `fullSync` (optional): Full sync (true) or incremental (false, default)

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "uuid",
    "connectionId": "uuid",
    "status": "pending",
    "createdAt": "2025-01-03T10:00:00Z"
  }
}
```

### 6. Sync Specific Connection
Sync all data from a specific connection.

```http
POST /api/v1/sync/connections/:connectionId/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullSync": true
}
```

**Parameters:**
- `connectionId` (path): Connection ID
- `fullSync` (optional): Perform full sync (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "uuid",
    "status": "in_progress",
    "message": "Sync job started"
  }
}
```

## Services

### RDStationConnector
Manages RDStation API integration.

```typescript
syncContacts(apiKey: string): Promise<SyncResult>
syncLeads(apiKey: string): Promise<SyncResult>
```

### ChatwootConnector
Manages Chatwoot integration.

```typescript
syncConversations(accountId: string): Promise<SyncResult>
syncMessages(accountId: string): Promise<SyncResult>
```

## Database Models

- `ExternalConnection` - Connection configurations
- `SyncRun` - Sync execution history
- `SyncLog` - Detailed sync logs

## Queue System

Uses enqueueSyncJob for asynchronous sync processing.

```typescript
enqueueSyncJob({
  connectionId: string,
  fullSync: boolean,
  userId: string
})
```

## Testing

See `teste.http` for complete testing examples.

**Quick Test:**
```bash
# Create a connection
curl -X POST http://localhost:3000/api/v1/sync/connections \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Connection",
    "platform": "rdstation",
    "credentials": {"apiKey": "test"}
  }'
```

## Error Handling

```json
{
  "success": false,
  "error": "Connection not found",
  "code": "CONNECTION_NOT_FOUND",
  "details": []
}
```

Common errors:
- `CONNECTION_NOT_FOUND`: Connection ID is invalid
- `INVALID_CREDENTIALS`: Credentials test failed
- `SYNC_IN_PROGRESS`: Another sync is running for this connection
- `PLATFORM_NOT_SUPPORTED`: Platform is not currently supported
- `UNAUTHORIZED`: Missing or invalid token

## Environment Variables

```bash
RDSTATION_BASE_URL=https://api.rd.services
HUBSPOT_BASE_URL=https://api.hubapi.com
ZENDESK_BASE_URL=https://[subdomain].zendesk.com/api/v2
CHATWOOT_BASE_URL=https://app.chatwoot.com/api/v1
```

## Version

v1.0.0

## Last Updated

January 3, 2026
