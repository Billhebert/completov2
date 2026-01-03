# 📖 Narrative Module

AI-powered narrative generation from knowledge nodes (zettels) for automatic content synthesis.

## Overview

The Narrative module provides:
- **Narrative Generation**: AI-powered synthesis of knowledge nodes into coherent narratives
- **Multiple Formats**: Summary, timeline, lessons learned, risk analysis, comprehensive
- **Style Customization**: Professional, casual, technical, or academic tone
- **Zettel Integration**: Works with knowledge nodes from the Knowledge module
- **Content Templates**: Pre-defined templates for different narrative types

## API Routes (1 total)

### Narrative Generation

#### 1. Generate Narrative
Generate an AI-powered narrative from selected knowledge nodes.

```http
POST /api/v1/narrative/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "zettels": [
    "zettel-uuid-1",
    "zettel-uuid-2",
    "zettel-uuid-3"
  ],
  "format": "summary",
  "style": "professional"
}
```

**Parameters:**
- `zettels` (required, array): Array of zettel IDs (min: 1, max: 20)
- `format` (required, string): Narrative format
- `style` (required, string): Writing style

**Supported Formats:**
- `summary`: Brief overview of key points
- `timeline`: Chronological narrative of events
- `lessons`: Extracted lessons and insights
- `risks`: Risk analysis and mitigation strategies
- `comprehensive`: Full detailed narrative

**Supported Styles:**
- `professional`: Business/formal tone
- `casual`: Conversational tone
- `technical`: Engineering/technical tone
- `academic`: Research/scholarly tone

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "narrative": "Based on the selected knowledge nodes, here's a comprehensive summary of the key insights...",
    "format": "summary",
    "style": "professional",
    "zettels": [
      {
        "id": "zettel-uuid-1",
        "title": "Project Kickoff Meeting"
      }
    ],
    "wordCount": 450,
    "generatedAt": "2025-01-03T10:00:00Z",
    "expiresAt": "2025-01-10T10:00:00Z"
  }
}
```

## Services

### NarrativeService
Generates narratives from knowledge nodes.

```typescript
generateNarrative(
  zettels: KnowledgeNode[],
  format: 'summary' | 'timeline' | 'lessons' | 'risks' | 'comprehensive',
  style: 'professional' | 'casual' | 'technical' | 'academic'
): Promise<string>
```

## Features

- **AI-Powered**: Uses GPT-4 for intelligent synthesis
- **Format Templates**: Pre-defined structures for each format
- **Style Consistency**: Maintains consistent tone throughout
- **Zettel Integration**: Seamless integration with knowledge management
- **Caching**: Generated narratives cached for 7 days
- **Quality**: Advanced prompt engineering for high-quality output

## Database Models

- `Narrative` - Generated narratives with metadata
- `KnowledgeNode` - Zettels used in generation

## Dependencies

- **OpenAI API** - For narrative generation
- **Prisma Client** - ORM for database access
- **Knowledge Module** - For zettel retrieval

## Error Handling

```json
{
  "success": false,
  "error": "No zettels found for given IDs",
  "code": "ZETTELS_NOT_FOUND"
}
```

Common errors:
- `ZETTELS_NOT_FOUND`: One or more zettel IDs are invalid
- `INVALID_FORMAT`: Format is not supported
- `INVALID_STYLE`: Style is not supported
- `TOO_MANY_ZETTELS`: More than 20 zettels provided
- `TOO_FEW_ZETTELS`: Less than 1 zettel provided
- `OPENAI_ERROR`: Issue with OpenAI API
- `UNAUTHORIZED`: Missing or invalid token

## Rate Limiting

- **Max requests**: 100 per hour per user
- **Caching**: Results cached for 7 days with same parameters

## Environment Variables

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
NARRATIVE_CACHE_TTL=604800  # 7 days in seconds
```

## Testing

See `teste.http` for complete testing examples.

**Quick Test:**
```bash
curl -X POST http://localhost:3000/api/v1/narrative/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "zettels": ["uuid1", "uuid2"],
    "format": "summary",
    "style": "professional"
  }'
```

## Performance

- **Generation Time**: 5-15 seconds depending on content
- **Response Size**: 2-10 KB depending on format
- **Cache Hit**: 100-200 ms for cached results

## Version

v1.0.0

## Last Updated

January 3, 2026
