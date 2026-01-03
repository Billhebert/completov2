# 📦 ERP Module

Enterprise Resource Planning for product inventory management.

## Overview

The ERP module provides:
- **Product Inventory**: Manage product catalog and stock levels
- **Stock Management**: Track inventory levels and reorders
- **Supplier Integration**: Manage supplier relationships
- **Product Details**: SKU, pricing, dimensions, and specifications
- **Stock Tracking**: Automatic reorder alerts

## API Routes (2 total)

### Products

#### 1. List Products
Get all products with optional filtering.

```http
GET /api/v1/erp/products?page=1&limit=20&category=electronics&inStock=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by category
- `inStock` (optional): Filter by stock availability
- `supplier` (optional): Filter by supplier

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Industrial Motor",
      "description": "High-performance industrial motor",
      "category": "electronics",
      "sku": "MOT-IND-001",
      "quantity": 100,
      "reorderLevel": 20,
      "unitCost": 450.00,
      "retailPrice": 750.00,
      "supplier": {
        "id": "uuid",
        "name": "Motor Supplier Inc"
      },
      "weight": 15.5,
      "dimensions": "30x20x25cm",
      "status": "in-stock",
      "lastRestockedDate": "2025-01-02T00:00:00Z",
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ],
  "meta": {
    "total": 250,
    "page": 1,
    "limit": 20,
    "totalPages": 13
  }
}
```

#### 2. Create Product
Create a new product in the catalog.

```http
POST /api/v1/erp/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Industrial Motor",
  "description": "High-performance industrial motor",
  "category": "electronics",
  "sku": "MOT-IND-001",
  "quantity": 100,
  "reorderLevel": 20,
  "unitCost": 450.00,
  "retailPrice": 750.00,
  "supplier": "supplier-uuid",
  "weight": 15.5,
  "dimensions": "30x20x25cm"
}
```

**Required Fields:**
- `name` (string)
- `category` (string)
- `sku` (string)
- `quantity` (number)
- `unitCost` (number)
- `retailPrice` (number)

**Categories:**
- `electronics`, `mechanical`, `supplies`, `tools`, `other`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Industrial Motor",
    "sku": "MOT-IND-001",
    "quantity": 100,
    "status": "in-stock",
    "createdAt": "2025-01-03T10:00:00Z"
  }
}
```

## Database Models

- `Product` - Product catalog entries
- `Supplier` - Supplier information

## Error Handling

```json
{
  "success": false,
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

Common errors:
- `PRODUCT_NOT_FOUND`
- `SKU_ALREADY_EXISTS`
- `UNAUTHORIZED`
- `INVALID_CATEGORY`

## Version

v1.0.0

## Last Updated

January 3, 2026
