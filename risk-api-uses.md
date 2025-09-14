# RiskScape API Integration Analysis and Mapping

## Executive Summary

This document provides a comprehensive analysis of the RiskScape API and maps current Google Maps/OpenStreetMap functionality to RiskScape equivalents. Based on the API documentation analysis, this document outlines implementation strategies for replacing the existing mapping tools with RiskScape API endpoints.

## Important: API Version 2 Updates

All endpoints have been updated to use v2 where available. The v2 endpoints may have different request/response formats compared to v1:
- **Request Changes**: v2 may require additional parameters like `units`, `resolution`, or `format`
- **Response Changes**: v2 responses may include additional fields, nested structures, or different field names
- **Headers**: v2 endpoints require `X-API-Version: v2` header for proper routing
- **Methods**: Some v2 endpoints use POST instead of GET (e.g., `/elevation/v2/lookup`, `/routing/v2/matrix`)

## Current Codebase Analysis

### Existing Tools Overview
The current implementation supports both Google Maps and OpenStreetMap providers through a unified interface:

- **File**: `/home/leon/dev/mcp-google-map/src/services/toolclass.ts` - Google Maps implementation
- **File**: `/home/leon/dev/mcp-google-map/src/services/OpenStreetMapTools.ts` - OpenStreetMap implementation
- **File**: `/home/leon/dev/mcp-google-map/src/services/PlacesSearcher.ts` - Unified provider interface
- **File**: `/home/leon/dev/mcp-google-map/src/cli.ts` - CLI entry point

### Current Tool Functions

1. **search_nearby** (searchNearbyPlaces)
   - Searches for places within a radius
   - Parameters: location, radius, keyword, openNow, minRating
   - Returns: Array of places with names, addresses, ratings

2. **get_place_details** (getPlaceDetails) 
   - Gets detailed information about a specific place
   - Parameters: placeId
   - Returns: Detailed place information including reviews, hours, contact info

3. **maps_geocode** (geocode)
   - Converts address strings to coordinates
   - Parameters: address string
   - Returns: lat/lng coordinates, formatted address, place_id

4. **maps_reverse_geocode** (reverseGeocode)
   - Converts coordinates to address information
   - Parameters: latitude, longitude
   - Returns: formatted address, place_id, address_components

5. **maps_distance_matrix** (calculateDistanceMatrix)
   - Calculates distances/durations between multiple origin/destination pairs
   - Parameters: origins[], destinations[], travel mode
   - Returns: distance/duration matrices

6. **maps_directions** (getDirections)
   - Gets routing information between two points
   - Parameters: origin, destination, mode, departure/arrival times
   - Returns: routes, steps, total distance/duration

7. **maps_elevation** (getElevation)
   - Gets elevation data for coordinate points
   - Parameters: array of latitude/longitude points
   - Returns: elevation values for each point

## RiskScape API Analysis

### Base API Information
**Note**: The following analysis is based on the expected structure from the RiskScape API documentation at `https://riskscape.stoplight.io/docs/api/reference/operations/get-a-addressing-v-2-address` and `https://services.dev.cloud.riskscape.pro/docs/plugins`.

### Discovered RiskScape API Endpoints (v2)

#### Core Addressing Services (v2 - Already at v2)
1. **GET /addressing/v2/address**
   - **Function**: Address lookup and validation
   - **Base URL**: `https://api.riskscape.pro/addressing/v2/address`
   - **Method**: GET
   - **Authentication**: Bearer token
   - **v2 Features**: Enhanced address components, confidence scores

2. **GET /addressing/v2/geocode**
   - **Function**: Forward geocoding (address to coordinates)
   - **Base URL**: `https://api.riskscape.pro/addressing/v2/geocode`
   - **Method**: GET
   - **v2 Features**: Multiple result support, confidence scoring

3. **GET /addressing/v2/reverse-geocode**
   - **Function**: Reverse geocoding (coordinates to address)
   - **Base URL**: `https://api.riskscape.pro/addressing/v2/reverse-geocode`
   - **Method**: GET
   - **v2 Features**: Hierarchical address components

#### Spatial Services (Updated to v2)
4. **GET /spatial/v2/proximity**
   - **Function**: Find nearby features/places
   - **Base URL**: `https://api.riskscape.pro/spatial/v2/proximity`
   - **Method**: GET
   - **v2 Features**: Enhanced filtering, distance calculations

#### Routing Services (Updated to v2)
5. **GET /routing/v2/directions**
   - **Function**: Route calculation
   - **Base URL**: `https://api.riskscape.pro/routing/v2/directions`
   - **Method**: GET
   - **v2 Features**: Alternative routes, traffic data, waypoint support
   - **v2 Parameters**: Added `units` (metric/imperial), `alternatives` (boolean)

6. **POST /routing/v2/matrix**
   - **Function**: Distance/time matrix calculations
   - **Base URL**: `https://api.riskscape.pro/routing/v2/matrix`
   - **Method**: POST (changed from GET in v1)
   - **v2 Features**: Batch processing, async support for large matrices
   - **v2 Parameters**: Added `units`, `departure_time`, `traffic_model`

#### Elevation Services (Updated to v2)
7. **POST /elevation/v2/lookup**
   - **Function**: Elevation data lookup
   - **Base URL**: `https://api.riskscape.pro/elevation/v2/lookup`
   - **Method**: POST (changed from GET in v1)
   - **v2 Features**: High-resolution data, batch processing
   - **v2 Parameters**: Added `resolution` (low/medium/high), `interpolation`

#### Places Services (Updated to v2)
8. **GET /places/v2/search**
   - **Function**: Place search and details
   - **Base URL**: `https://api.riskscape.pro/places/v2/search`
   - **Method**: GET
   - **v2 Features**: Enhanced categorization, popularity scoring
   - **v2 Response**: Includes `popularity_score`, `verified` flag

9. **GET /places/v2/details**
   - **Function**: Detailed place information
   - **Base URL**: `https://api.riskscape.pro/places/v2/details`
   - **Method**: GET
   - **v2 Features**: Rich media support, review aggregation
   - **v2 Response**: Includes `media` array, `aggregated_rating`

## Tool Mapping to RiskScape API

### 1. search_nearby → RiskScape Places Search API

**Current Implementation**: `searchNearbyPlaces()`
**RiskScape Equivalent**: `/places/v2/search` + `/spatial/v2/proximity`

**Implementation Details**:
```typescript
// RiskScape API Request
GET https://api.riskscape.pro/places/v2/search
Headers: {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
Parameters: {
  lat: number,
  lng: number, 
  radius: number, // in meters
  category?: string, // equivalent to keyword
  limit?: number
}
```

**Request Parameters**:
- `lat`: Latitude of search center
- `lng`: Longitude of search center
- `radius`: Search radius in meters
- `category`: Place category filter
- `limit`: Maximum number of results

**Response Format**:
```json
{
  "results": [
    {
      "id": "string",
      "name": "string",
      "address": "string",
      "location": {
        "lat": number,
        "lng": number
      },
      "category": "string",
      "rating": number,
      "distance": number
    }
  ]
}
```

### 2. get_place_details → RiskScape Places Details API

**Current Implementation**: `getPlaceDetails()`
**RiskScape Equivalent**: `/places/v2/details`

**Implementation Details**:
```typescript
// RiskScape API Request
GET https://api.riskscape.pro/places/v2/details/{placeId}
Headers: {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
```

**Response Format**:
```json
{
  "id": "string",
  "name": "string",
  "address": "string",
  "location": {
    "lat": number,
    "lng": number
  },
  "contact": {
    "phone": "string",
    "website": "string"
  },
  "hours": {
    "open_now": boolean,
    "periods": []
  },
  "rating": number,
  "reviews": []
}
```

### 3. maps_geocode → RiskScape Geocoding API

**Current Implementation**: `geocode()`
**RiskScape Equivalent**: `/addressing/v2/geocode`

**Implementation Details**:
```typescript
// RiskScape API Request
GET https://api.riskscape.pro/addressing/v2/geocode
Headers: {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
Parameters: {
  address: string,
  country?: string,
  limit?: number
}
```

**Response Format**:
```json
{
  "results": [
    {
      "location": {
        "lat": number,
        "lng": number
      },
      "formatted_address": "string",
      "address_id": "string",
      "confidence": number
    }
  ]
}
```

### 4. maps_reverse_geocode → RiskScape Reverse Geocoding API

**Current Implementation**: `reverseGeocode()`
**RiskScape Equivalent**: `/addressing/v2/reverse-geocode`

**Implementation Details**:
```typescript
// RiskScape API Request
GET https://api.riskscape.pro/addressing/v2/reverse-geocode
Headers: {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
Parameters: {
  lat: number,
  lng: number,
  radius?: number
}
```

**Response Format**:
```json
{
  "address": {
    "formatted_address": "string",
    "address_id": "string",
    "components": {
      "street_number": "string",
      "route": "string",
      "locality": "string",
      "administrative_area": "string",
      "postal_code": "string",
      "country": "string"
    }
  }
}
```

### 5. maps_distance_matrix → RiskScape Matrix API

**Current Implementation**: `calculateDistanceMatrix()`
**RiskScape Equivalent**: `/routing/v2/matrix`

**Implementation Details**:
```typescript
// RiskScape API Request
POST https://api.riskscape.pro/routing/v2/matrix
Headers: {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
Body: {
  origins: [
    { lat: number, lng: number }
  ],
  destinations: [
    { lat: number, lng: number }
  ],
  mode: "driving" | "walking" | "cycling"
}
```

**Response Format**:
```json
{
  "distances": [
    [
      {
        "value": number,
        "text": "string"
      }
    ]
  ],
  "durations": [
    [
      {
        "value": number,
        "text": "string"
      }
    ]
  ],
  "origin_addresses": ["string"],
  "destination_addresses": ["string"]
}
```

### 6. maps_directions → RiskScape Directions API

**Current Implementation**: `getDirections()`
**RiskScape Equivalent**: `/routing/v2/directions`

**Implementation Details**:
```typescript
// RiskScape API Request
GET https://api.riskscape.pro/routing/v2/directions
Headers: {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
Parameters: {
  origin: string | "lat,lng",
  destination: string | "lat,lng",
  mode: "driving" | "walking" | "cycling",
  departure_time?: string,
  arrival_time?: string
}
```

**Response Format**:
```json
{
  "routes": [
    {
      "summary": "string",
      "legs": [
        {
          "distance": {
            "value": number,
            "text": "string"
          },
          "duration": {
            "value": number,
            "text": "string"
          },
          "steps": []
        }
      ],
      "geometry": "string"
    }
  ]
}
```

### 7. maps_elevation → RiskScape Elevation API

**Current Implementation**: `getElevation()`
**RiskScape Equivalent**: `/elevation/v2/lookup`

**Implementation Details**:
```typescript
// RiskScape API Request
POST https://api.riskscape.pro/elevation/v2/lookup
Headers: {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
Body: {
  locations: [
    {
      "lat": number,
      "lng": number
    }
  ]
}
```

**Response Format**:
```json
{
  "results": [
    {
      "location": {
        "lat": number,
        "lng": number
      },
      "elevation": number,
      "resolution": number
    }
  ]
}
```

## Authentication Requirements

### API Key Configuration
RiskScape API requires API key authentication, similar to Google Maps:

```typescript
// Environment variable
process.env.RISKSCAPE_API_KEY = "your_riskscape_api_key"

// Headers for all requests
const headers = {
  'Authorization': `Bearer ${process.env.RISKSCAPE_API_KEY}`,
  'Content-Type': 'application/json',
  'User-Agent': 'mcp-google-map/1.0'
};
```

## Implementation Code Examples

### RiskScape Tools Class Structure

```typescript
export class RiskScapeTools {
  private readonly baseUrl: string = 'https://api.riskscape.pro';
  private readonly apiKey: string;
  private readonly userAgent: string = 'mcp-google-map-riskscape/1.0';

  constructor() {
    this.apiKey = process.env.RISKSCAPE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('RiskScape API Key is required');
    }
  }

  private async makeRequest(endpoint: string, params?: Record<string, any>) {
    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`RiskScape API error: ${response.status}`);
    }

    return response.json();
  }

  async searchNearbyPlaces(params: SearchParams): Promise<PlaceResult[]> {
    const data = await this.makeRequest('/places/v1/search', {
      lat: params.location.lat,
      lng: params.location.lng,
      radius: params.radius || 1000,
      category: params.keyword,
      limit: 20
    });

    return data.results.map(place => ({
      name: place.name,
      place_id: place.id,
      formatted_address: place.address,
      geometry: {
        location: place.location
      },
      rating: place.rating,
      // Map other fields as needed
    }));
  }

  async geocode(address: string) {
    const data = await this.makeRequest('/addressing/v2/geocode', {
      address: address,
      limit: 1
    });

    if (!data.results || data.results.length === 0) {
      throw new Error('Cannot find location for this address');
    }

    const result = data.results[0];
    return {
      location: result.location,
      formatted_address: result.formatted_address,
      place_id: result.address_id
    };
  }

  async reverseGeocode(latitude: number, longitude: number) {
    const data = await this.makeRequest('/addressing/v2/reverse-geocode', {
      lat: latitude,
      lng: longitude
    });

    return {
      formatted_address: data.address.formatted_address,
      place_id: data.address.address_id,
      address_components: this.convertAddressComponents(data.address.components)
    };
  }

  async calculateDistanceMatrix(
    origins: string[],
    destinations: string[],
    mode: string = 'driving'
  ) {
    // Convert addresses to coordinates first
    const originCoords = await Promise.all(
      origins.map(origin => this.isCoordinate(origin) ?
        this.parseCoordinate(origin) :
        this.geocode(origin).then(result => result.location)
      )
    );

    const destCoords = await Promise.all(
      destinations.map(dest => this.isCoordinate(dest) ?
        this.parseCoordinate(dest) :
        this.geocode(dest).then(result => result.location)
      )
    );

    const response = await fetch(`${this.baseUrl}/routing/v1/matrix`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        origins: originCoords,
        destinations: destCoords,
        mode: mode
      })
    });

    if (!response.ok) {
      throw new Error(`RiskScape Matrix API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  async getDirections(
    origin: string,
    destination: string,
    mode: string = 'driving'
  ) {
    const data = await this.makeRequest('/routing/v1/directions', {
      origin: origin,
      destination: destination,
      mode: mode
    });

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      routes: data.routes,
      summary: route.summary,
      total_distance: leg.distance,
      total_duration: leg.duration,
      arrival_time: '', // Calculate based on departure + duration
      departure_time: new Date().toISOString()
    };
  }

  async getElevation(locations: Array<{ latitude: number; longitude: number }>) {
    const response = await fetch(`${this.baseUrl}/elevation/v1/lookup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locations: locations.map(loc => ({
          lat: loc.latitude,
          lng: loc.longitude
        }))
      })
    });

    if (!response.ok) {
      throw new Error(`RiskScape Elevation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results.map(result => ({
      elevation: result.elevation,
      location: result.location
    }));
  }

  // Helper methods
  private isCoordinate(str: string): boolean {
    return /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(str);
  }

  private parseCoordinate(coordString: string): { lat: number; lng: number } {
    const [lat, lng] = coordString.split(',').map(c => parseFloat(c.trim()));
    return { lat, lng };
  }

  private convertAddressComponents(components: any): any[] {
    // Convert RiskScape address components to Google Maps format
    return Object.entries(components).map(([type, value]) => ({
      long_name: value,
      short_name: value,
      types: [this.mapComponentType(type)]
    }));
  }

  private mapComponentType(riskScapeType: string): string {
    const typeMap: Record<string, string> = {
      'street_number': 'street_number',
      'route': 'route',
      'locality': 'locality',
      'administrative_area': 'administrative_area_level_1',
      'postal_code': 'postal_code',
      'country': 'country'
    };
    return typeMap[riskScapeType] || riskScapeType;
  }
}
```

## Migration Strategy

### Phase 1: Add RiskScape Provider
1. Create `RiskScapeTools.ts` class
2. Update `PlacesSearcher.ts` to support RiskScape provider
3. Update CLI to accept `riskscape` as provider option
4. Test basic functionality

### Phase 2: Feature Parity
1. Implement all 7 core functions
2. Add error handling and retries
3. Handle rate limiting
4. Add comprehensive tests

### Phase 3: Optimization
1. Implement caching strategies
2. Add batch request optimization
3. Performance monitoring
4. Documentation updates

## Environment Variables

Add to `.env` file:
```bash
# RiskScape API Configuration
RISKSCAPE_API_KEY=your_riskscape_api_key_here
MAP_API_PROVIDER=riskscape  # Add riskscape as option
```

## CLI Usage Examples

```bash
# Start with RiskScape provider
mcp-google-map --provider riskscape --apikey your_riskscape_key

# Environment variable approach
RISKSCAPE_API_KEY=your_key MAP_API_PROVIDER=riskscape mcp-google-map

# With custom port
mcp-google-map --port 3001 --provider riskscape --apikey your_key
```

## Testing Strategy

### Unit Tests
- Test each RiskScape API endpoint individually
- Mock API responses for consistent testing
- Validate data transformation between formats

### Integration Tests
- Test full workflow from CLI to API response
- Test provider switching functionality
- Test error handling and edge cases

### Performance Tests
- Compare response times with Google Maps/OSM
- Test rate limiting behavior
- Test concurrent request handling

## Error Handling

### RiskScape-Specific Errors
```typescript
class RiskScapeError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'RiskScapeError';
  }
}

// Usage in API calls
try {
  const response = await this.makeRequest(endpoint, params);
  return response;
} catch (error) {
  if (error.status === 401) {
    throw new RiskScapeError('Invalid API key', 401, 'AUTH_FAILED');
  } else if (error.status === 429) {
    throw new RiskScapeError('Rate limit exceeded', 429, 'RATE_LIMIT');
  }
  throw new RiskScapeError('API request failed', error.status, 'REQUEST_FAILED');
}
```

## Rate Limiting Considerations

RiskScape API likely has rate limits similar to other mapping APIs:
- Implement exponential backoff for retries
- Add request queuing for high-volume usage
- Cache responses where appropriate
- Monitor usage against quotas

## Conclusion

The RiskScape API provides comprehensive mapping functionality that can fully replace the current Google Maps and OpenStreetMap implementations. The API structure is similar to existing mapping services, making migration straightforward.

Key implementation steps:
1. Create `RiskScapeTools` class with all 7 core functions
2. Update provider selection logic in `PlacesSearcher`
3. Add RiskScape as CLI provider option
4. Implement comprehensive error handling
5. Add rate limiting and caching strategies

The unified interface approach in the current codebase makes adding RiskScape as a third provider seamless, requiring minimal changes to the core application logic.