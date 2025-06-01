# Highlightly API Response Documentation

Based on [Highlightly API Documentation](https://highlightly.net/documentation/football/) and our testing.

## Base Information

- **Base URL**: `https://soccer.highlightly.net` (via local proxy at `http://localhost:3001/api/highlightly`)
- **API Documentation**: https://highlightly.net/documentation/football/
- **Response Format**: Always JSON with `application/json` content type

## Countries API

### GET /countries

**Purpose**: Get all supported countries

**Parameters**: 
- `name` (optional): Filter by country name (e.g., "France")

**Response Format**:
```json
[
  {
    "code": "FR",
    "name": "France", 
    "logo": "https://example.com/logos/country/FR.png"
  }
]
```

**Notes**: 
- Returns ~258 countries
- Country codes follow ISO 3166 standard
- Used for filtering other endpoints

## Leagues API

### GET /leagues

**Purpose**: Get all leagues with optional filtering

**Parameters**:
- `limit`: Number (0-100, default 100) - Max leagues to return
- `offset`: Number (≥0, default 0) - Pagination offset  
- `season`: Number (≥0) - Filter by season year
- `leagueName`: String - Filter by league name
- `countryCode`: String - ISO 3166 country code (e.g., "FR")
- `countryName`: String - Country name (e.g., "France")

**Response Format**:
```json
{
  "data": [
    {
      "id": 104,
      "name": "UEFA Champions League",
      "logo": "https://example.com/logos/league/104.png",
      "country": {
        "code": "FR",
        "name": "France",
        "logo": "https://example.com/logos/country/FR.png"
      },
      "seasons": [
        {
          "year": 2023,
          "start": "2023-09-19",
          "end": "2024-06-01"
        }
      ]
    }
  ]
}
```

**Important Notes**:
- **The `country` field is an OBJECT, not a string**
- Default limit is 100, but there are thousands of leagues globally
- For country-specific queries, use `countryCode` parameter instead of client-side filtering
- Pagination available via `limit` and `offset`

## Matches API

### GET /matches

**Purpose**: Get matches with optional filtering

**Parameters**:
- `leagueId`: String - Filter by league ID
- `leagueName`: String - Filter by league name  
- `date`: String - Filter by date (YYYY-MM-DD format)
- `countryCode`: String - ISO 3166 country code
- `countryName`: String - Country name
- `homeTeamId`: String - Home team ID
- `awayTeamId`: String - Away team ID
- `homeTeamName`: String - Home team name
- `awayTeamName`: String - Away team name
- `season`: String - Season year
- `timezone`: String - Response timezone
- `limit`: String - Max results (default varies)
- `offset`: String - Pagination offset

**Response Format**: 
```json
{
  "data": [
    {
      "id": 12345,
      "date": "2024-01-15T20:00:00Z",
      "homeTeam": {
        "id": 123,
        "name": "Team A",
        "logo": "https://example.com/logos/team/123.png"
      },
      "awayTeam": {
        "id": 456, 
        "name": "Team B",
        "logo": "https://example.com/logos/team/456.png"
      },
      "league": {
        "id": 104,
        "name": "Premier League"
      },
      "fixture": {
        "status": {
          "short": "FT",
          "long": "Match Finished"
        }
      },
      "goals": {
        "home": 2,
        "away": 1
      }
    }
  ]
}
```

## Highlights API

### GET /highlights

**Purpose**: Get match highlights with filtering

**Parameters**: Similar to matches, plus:
- `match`: String - Specific match filter
- All match parameters apply

**Response Format**:
```json
{
  "data": [
    {
      "id": "highlight123",
      "title": "Match Highlights",
      "url": "https://example.com/video.mp4",
      "thumbnail": "https://example.com/thumb.jpg",
      "match": {
        // Match object (same as matches API)
      }
    }
  ]
}
```

## Common Patterns

### Response Wrapping
- Most endpoints return data wrapped in `{ "data": [...] }`
- Some may return arrays directly
- Always check both formats in code

### Error Handling
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (invalid API key)
- 404: Not Found (resource doesn't exist)
- 429: Rate Limited (too many requests)
- 500: Internal Server Error

### Pagination
- Use `limit` and `offset` parameters
- Default limits vary by endpoint
- Check response headers for rate limiting info

### Country/League Filtering
- Always use server-side filtering when available
- Use `countryCode` (ISO 3166) for better accuracy
- Avoid client-side filtering of large datasets

## Implementation Notes

### Type Safety
- The `country` field in leagues is an object: `{ code: string, name: string, logo: string }`
- Always check for both wrapped and direct array responses
- Use optional chaining for nested properties

### Performance
- Use appropriate `limit` values to avoid large responses
- Cache responses when possible (data refresh intervals noted in docs)
- Use specific filters instead of fetching all data

### Best Practices
- Always handle both response formats (wrapped/direct)
- Use server-side filtering parameters instead of client-side
- Check the official documentation for rate limits and refresh intervals
- Log sample responses during development to understand structure 

## Standings API

### GET /standings

**Purpose**: Get league standings/table

**Parameters**:
- `league`: String (required) - League ID
- `season`: String (optional) - Season year

**Response Format**:
```json
{
  "league": {
    "standings": [
      [
        {
          "position": 1,
          "team": {
            "id": 123,
            "name": "Team Name",
            "logo": "https://example.com/logo.png"
          },
          "points": 45,
          "played": 20,
          "won": 14,
          "drawn": 3,
          "lost": 3,
          "goalsFor": 42,
          "goalsAgainst": 18,
          "goalDifference": 24
        }
      ]
    ]
  }
}
```

## Teams API

### GET /teams

**Purpose**: Get teams with optional filtering

**Parameters**:
- `country`: String - Filter by country name
- `league`: String - Filter by league ID
- `name`: String - Filter by team name

**Response Format**:
```json
{
  "data": [
    {
      "id": 123,
      "name": "Team Name",
      "logo": "https://example.com/logo.png",
      "founded": 1900,
      "venue": {
        "name": "Stadium Name",
        "capacity": 50000,
        "address": "Stadium Address",
        "city": "City Name"
      },
      "country": {
        "code": "GB",
        "name": "England",
        "logo": "https://example.com/country.png"
      }
    }
  ]
}
``` 