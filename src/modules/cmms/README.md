# 🏭 CMMS Module

Computerized Maintenance Management System for asset lifecycle, maintenance planning, and spare parts inventory.

## Overview

The CMMS module provides:
- **Asset Management**: Track equipment, facilities, and tools
- **Maintenance Planning**: Schedule preventive and corrective maintenance
- **Downtime Tracking**: Monitor and resolve equipment failures
- **Spare Parts Inventory**: Manage spare parts inventory with low-stock alerts
- **Maintenance History**: Complete audit trail of all maintenance activities
- **Cost Tracking**: Track maintenance costs and asset health

## API Routes

### Asset Management (4 routes)

#### 1. List Assets
Get all assets with optional filtering.

```http
GET /api/v1/cmms/assets?page=1&limit=20&status=active&type=equipment
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): active, maintenance, retired
- `type` (optional): equipment, facility, vehicle, tool
- `location` (optional): Filter by location
- `criticalityLevel` (optional): low, medium, high, critical

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Production Machine #1",
      "type": "equipment",
      "serialNumber": "SN-2025-0001",
      "manufacturer": "Siemens",
      "model": "S7-1200",
      "location": "Factory Floor - Section A",
      "status": "active",
      "criticalityLevel": "high",
      "purchaseDate": "2023-01-15",
      "warrantyExpiry": "2026-01-15",
      "lastMaintenanceDate": "2024-12-20",
      "nextMaintenanceDate": "2025-02-03",
      "createdAt": "2023-01-15T00:00:00Z"
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

#### 2. Get Single Asset
Get detailed information about a specific asset.

```http
GET /api/v1/cmms/assets/:assetId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Production Machine #1",
    "type": "equipment",
    "serialNumber": "SN-2025-0001",
    "manufacturer": "Siemens",
    "model": "S7-1200",
    "location": "Factory Floor - Section A",
    "parentAssetId": null,
    "childAssets": ["uuid1", "uuid2"],
    "status": "active",
    "criticalityLevel": "high",
    "purchaseDate": "2023-01-15",
    "warrantyExpiry": "2026-01-15",
    "lastMaintenanceDate": "2024-12-20",
    "nextMaintenanceDate": "2025-02-03",
    "maintenanceHistory": [
      {
        "id": "uuid",
        "date": "2024-12-20",
        "type": "preventive",
        "duration": 4,
        "cost": 450,
        "description": "Oil change and filter replacement"
      }
    ],
    "downtimeCount": 2,
    "totalDowntimeHours": 12,
    "maintenanceCostYTD": 2500,
    "createdAt": "2023-01-15T00:00:00Z"
  }
}
```

#### 3. Create Asset
Create a new asset record.

```http
POST /api/v1/cmms/assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production Machine #1",
  "type": "equipment",
  "serialNumber": "SN-2025-0001",
  "manufacturer": "Siemens",
  "model": "S7-1200",
  "location": "Factory Floor - Section A",
  "parentAssetId": null,
  "status": "active",
  "purchaseDate": "2023-01-15",
  "warrantyExpiry": "2026-01-15",
  "criticalityLevel": "high"
}
```

**Asset Types:**
- `equipment`: Production equipment, machinery
- `facility`: Buildings, rooms, infrastructure
- `vehicle`: Vehicles, forklifts, loaders
- `tool`: Hand tools, measurement devices

**Required Fields:**
- `name` (string)
- `type` (string)
- `location` (string)
- `status` (string): active, maintenance, retired

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Production Machine #1",
    ...
  }
}
```

#### 4. Update Asset
Update asset information.

```http
PUT /api/v1/cmms/assets/:assetId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production Machine #1 - Updated",
  "status": "maintenance",
  "location": "Factory Floor - Section B",
  "criticalityLevel": "critical"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Production Machine #1 - Updated",
    ...
  }
}
```

### Maintenance Management (4 routes)

#### 5. List Maintenance Plans
Get maintenance plans for assets.

```http
GET /api/v1/cmms/maintenance-plans?assetId=uuid&type=preventive
Authorization: Bearer <token>
```

**Query Parameters:**
- `assetId` (optional): Filter by asset
- `type` (optional): preventive, corrective, emergency
- `page` (optional): Page number

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "assetId": "uuid",
      "type": "preventive",
      "frequency": "monthly",
      "nextScheduledDate": "2025-02-03",
      "estimatedDuration": 4,
      "requiredSkills": ["electrical", "mechanical"],
      "estimatedCost": 500,
      "description": "Monthly preventive maintenance",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

#### 6. Create Maintenance Plan
Create a new maintenance plan.

```http
POST /api/v1/cmms/maintenance-plans
Authorization: Bearer <token>
Content-Type: application/json

{
  "assetId": "uuid",
  "type": "preventive",
  "frequency": "monthly",
  "nextScheduledDate": "2025-02-03",
  "estimatedDuration": 4,
  "requiredSkills": ["electrical", "mechanical"],
  "estimatedCost": 500,
  "description": "Monthly preventive maintenance"
}
```

**Frequencies:**
- `weekly`, `biweekly`, `monthly`, `quarterly`, `semiannual`, `annual`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "assetId": "uuid",
    "type": "preventive",
    ...
  }
}
```

#### 7. List Maintenance Records
Get maintenance history.

```http
GET /api/v1/cmms/maintenance-records?assetId=uuid&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `assetId` (optional): Filter by asset
- `type` (optional): Filter by type
- `page` (optional): Page number

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "assetId": "uuid",
      "type": "preventive",
      "performedDate": "2025-01-03",
      "duration": 4,
      "technicians": [
        {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@company.com"
        }
      ],
      "cost": 450,
      "description": "Oil change and filter replacement",
      "status": "completed",
      "createdAt": "2025-01-03T10:00:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### 8. Create Maintenance Record
Log a completed maintenance activity.

```http
POST /api/v1/cmms/maintenance-records
Authorization: Bearer <token>
Content-Type: application/json

{
  "assetId": "uuid",
  "type": "preventive",
  "performedDate": "2025-01-03",
  "duration": 4,
  "technicians": ["tech-uuid-1", "tech-uuid-2"],
  "cost": 450,
  "description": "Oil change and filter replacement",
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "assetId": "uuid",
    ...
  }
}
```

### Downtime Tracking (2 routes)

#### 9. Create Downtime Incident
Report equipment downtime.

```http
POST /api/v1/cmms/downtime
Authorization: Bearer <token>
Content-Type: application/json

{
  "assetId": "uuid",
  "reason": "Motor failure",
  "description": "Motor making unusual noise, requires immediate repair",
  "severity": "critical",
  "reportedBy": "user-uuid"
}
```

**Severity Levels:**
- `low`: Minor issue, can wait
- `medium`: Should be addressed soon
- `high`: Important, affects production
- `critical`: Emergency, immediate action required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "assetId": "uuid",
    "reason": "Motor failure",
    "severity": "critical",
    "status": "open",
    "reportedAt": "2025-01-03T10:00:00Z"
  }
}
```

#### 10. Resolve Downtime Incident
Mark downtime as resolved.

```http
POST /api/v1/cmms/downtime/:incidentId/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolution": "Motor replaced with new unit",
  "resolvedBy": "tech-uuid",
  "costIncurred": 2500,
  "totalDowntimeMinutes": 240
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "resolved",
    "resolution": "Motor replaced with new unit",
    "costIncurred": 2500,
    "downtime": {
      "duration": "4 hours",
      "minutes": 240,
      "cost": 5000
    },
    "resolvedAt": "2025-01-03T14:00:00Z"
  }
}
```

### Spare Parts Inventory (4 routes)

#### 11. List Spare Parts
Get inventory of spare parts.

```http
GET /api/v1/cmms/spare-parts?page=1&limit=20&location=Warehouse%20B
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `location` (optional): Filter by location

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Industrial Motor Brush",
      "partNumber": "PN-SM-001",
      "manufacturer": "Siemens",
      "quantity": 50,
      "minThreshold": 10,
      "maxThreshold": 100,
      "unitCost": 25.50,
      "location": "Warehouse B - Shelf 3",
      "totalValue": 1275.00,
      "lastMovement": "2025-01-02T10:00:00Z",
      "status": "in-stock"
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

#### 12. List Low Stock Items
Get spare parts below minimum threshold.

```http
GET /api/v1/cmms/spare-parts/low-stock
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Industrial Motor Brush",
      "partNumber": "PN-SM-001",
      "quantity": 8,
      "minThreshold": 10,
      "shortage": 2,
      "recommendedAction": "Order immediately"
    }
  ]
}
```

#### 13. Create Spare Part Entry
Add a new spare part to inventory.

```http
POST /api/v1/cmms/spare-parts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Industrial Motor Brush",
  "partNumber": "PN-SM-001",
  "manufacturer": "Siemens",
  "quantity": 50,
  "minThreshold": 10,
  "maxThreshold": 100,
  "unitCost": 25.50,
  "location": "Warehouse B - Shelf 3",
  "compatibleAssets": ["asset-uuid-1", "asset-uuid-2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Industrial Motor Brush",
    ...
  }
}
```

#### 14. Record Part Movement
Track consumption or receipt of spare parts.

```http
POST /api/v1/cmms/spare-parts/:partId/movement
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "consumption",
  "quantity": 2,
  "reason": "Used in motor repair - Asset #1",
  "relatedAssetId": "asset-uuid",
  "performedBy": "tech-uuid",
  "cost": 51.00
}
```

**Movement Types:**
- `consumption`: Part used in maintenance
- `receipt`: New stock received
- `adjustment`: Inventory correction

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "partId": "uuid",
    "type": "consumption",
    "quantity": 2,
    "newQuantity": 48,
    "cost": 51.00,
    "recordedAt": "2025-01-03T11:00:00Z"
  }
}
```

## Database Models

- `Asset` - Equipment and facility records
- `MaintenancePlan` - Scheduled maintenance
- `MaintenanceRecord` - Completed maintenance history
- `DowntimeIncident` - Equipment failure tracking
- `SparePart` - Inventory management
- `SparePartMovement` - Inventory transactions

## Services

All services are integrated in `services/` directory.

## Testing

See `teste.http` for complete testing examples.

## Error Handling

```json
{
  "success": false,
  "error": "Asset not found",
  "code": "ASSET_NOT_FOUND"
}
```

Common errors:
- `ASSET_NOT_FOUND`
- `PLAN_NOT_FOUND`
- `INCIDENT_NOT_FOUND`
- `PART_NOT_FOUND`
- `UNAUTHORIZED`

## Version

v1.0.0

## Last Updated

January 3, 2026
