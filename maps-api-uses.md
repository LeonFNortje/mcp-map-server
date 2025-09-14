# Google Maps API Usage Documentation

This document provides a comprehensive analysis of every Google Maps API endpoint used in the mcp-google-map codebase, detailing their locations, purposes, parameters, and extracted data.

## Overview

The codebase implements a Model Context Protocol (MCP) server that provides access to various Google Maps services through seven main tools. All API interactions are centralized in the `GoogleMapsTools` class and wrapped by the `PlacesSearcher` service layer.

## API Endpoints Summary

The following Google Maps API endpoints are utilized:

1. **Places Nearby Search API**
2. **Place Details API** 
3. **Geocoding API**
4. **Reverse Geocoding API**
5. **Distance Matrix API**
6. **Directions API**
7. **Elevation API**

---

## 1. Places Nearby Search API

### Endpoint Details
- **API Method**: `client.placesNearby()`
- **HTTP Endpoint**: Google Places API - Nearby Search
- **File**: `/home/leon/dev/mcp-google-map/src/services/toolclass.ts`
- **Function**: `GoogleMapsTools.searchNearbyPlaces()` (lines 50-76)
- **Wrapper**: `PlacesSearcher.searchNearby()` in `/home/leon/dev/mcp-google-map/src/services/PlacesSearcher.ts` (lines 74-104)
- **Tool**: `search_nearby` in `/home/leon/dev/mcp-google-map/src/tools/maps/searchNearby.ts`

### Purpose
Searches for places near a specified location based on various criteria including keywords, radius, operating hours, and minimum ratings.

### Parameters Passed
```typescript
{
  location: { lat: number, lng: number },    // Center point for search
  radius: number,                           // Search radius in meters (default: 1000)
  keyword?: string,                         // Search term (e.g., "restaurant", "cafe")
  opennow?: boolean,                        // Filter for currently open places
  language: Language.en,                    // Response language
  key: string                              // Google Maps API key
}
```

### Data Extracted from Response
- `results[]` - Array of place objects containing:
  - `name` - Place name
  - `place_id` - Unique Google place identifier
  - `formatted_address` - Full address string
  - `geometry.location` - Coordinates (lat/lng)
  - `rating` - Average rating (0-5)
  - `user_ratings_total` - Number of ratings
  - `opening_hours.open_now` - Current open status

### Additional Processing
- Client-side filtering by `minRating` parameter
- Error handling with structured error responses

---

## 2. Place Details API

### Endpoint Details
- **API Method**: `client.placeDetails()`
- **HTTP Endpoint**: Google Places API - Place Details
- **File**: `/home/leon/dev/mcp-google-map/src/services/toolclass.ts`
- **Function**: `GoogleMapsTools.getPlaceDetails()` (lines 78-93)
- **Wrapper**: `PlacesSearcher.getPlaceDetails()` in `/home/leon/dev/mcp-google-map/src/services/PlacesSearcher.ts` (lines 106-136)
- **Tool**: `get_place_details` in `/home/leon/dev/mcp-google-map/src/tools/maps/placeDetails.ts`

### Purpose
Retrieves comprehensive information about a specific place using its Google Place ID.

### Parameters Passed
```typescript
{
  place_id: string,                         // Google Place ID
  fields: [                                 // Requested data fields
    "name", "rating", "formatted_address", 
    "opening_hours", "reviews", "geometry", 
    "formatted_phone_number", "website", 
    "price_level", "photos"
  ],
  language: Language.en,                    // Response language
  key: string                              // Google Maps API key
}
```

### Data Extracted from Response
- `result` object containing:
  - `name` - Place name
  - `rating` - Average rating
  - `formatted_address` - Full address
  - `opening_hours.open_now` - Current open status
  - `formatted_phone_number` - Contact phone
  - `website` - Official website URL
  - `price_level` - Price category (0-4)
  - `geometry.location` - Coordinates
  - `reviews[]` - Array of user reviews with:
    - `rating` - Individual review rating
    - `text` - Review content
    - `time` - Review timestamp
    - `author_name` - Reviewer name

---

## 3. Geocoding API

### Endpoint Details
- **API Method**: `client.geocode()`
- **HTTP Endpoint**: Google Geocoding API
- **File**: `/home/leon/dev/mcp-google-map/src/services/toolclass.ts`
- **Function**: `GoogleMapsTools.geocodeAddress()` (private, lines 95-121) and `GoogleMapsTools.geocode()` (public, lines 138-154)
- **Wrapper**: `PlacesSearcher.geocode()` in `/home/leon/dev/mcp-google-map/src/services/PlacesSearcher.ts` (lines 138-152)
- **Tool**: `maps_geocode` in `/home/leon/dev/mcp-google-map/src/tools/maps/geocode.ts`

### Purpose
Converts human-readable addresses or place names into geographic coordinates (latitude and longitude).

### Parameters Passed
```typescript
{
  address: string,                          // Address or place name to geocode
  key: string,                             // Google Maps API key
  language: Language.en                     // Response language
}
```

### Data Extracted from Response
- `results[0]` (first/best match) containing:
  - `geometry.location.lat` - Latitude coordinate
  - `geometry.location.lng` - Longitude coordinate
  - `formatted_address` - Standardized address string
  - `place_id` - Google Place ID

### Additional Usage
The geocoding functionality is also used internally by `getLocation()` method when processing non-coordinate center points for nearby searches.

---

## 4. Reverse Geocoding API

### Endpoint Details
- **API Method**: `client.reverseGeocode()`
- **HTTP Endpoint**: Google Geocoding API - Reverse Geocoding
- **File**: `/home/leon/dev/mcp-google-map/src/services/toolclass.ts`
- **Function**: `GoogleMapsTools.reverseGeocode()` (lines 156-187)
- **Wrapper**: `PlacesSearcher.reverseGeocode()` in `/home/leon/dev/mcp-google-map/src/services/PlacesSearcher.ts` (lines 154-168)
- **Tool**: `maps_reverse_geocode` in `/home/leon/dev/mcp-google-map/src/tools/maps/reverseGeocode.ts`

### Purpose
Converts geographic coordinates (latitude and longitude) into human-readable addresses.

### Parameters Passed
```typescript
{
  latlng: { lat: number, lng: number },     // Coordinates to reverse geocode
  language: Language.en,                    // Response language
  key: string                              // Google Maps API key
}
```

### Data Extracted from Response
- `results[0]` (first/best match) containing:
  - `formatted_address` - Human-readable address
  - `place_id` - Google Place ID
  - `address_components[]` - Structured address components (street, city, country, etc.)

---

## 5. Distance Matrix API

### Endpoint Details
- **API Method**: `client.distancematrix()`
- **HTTP Endpoint**: Google Distance Matrix API
- **File**: `/home/leon/dev/mcp-google-map/src/services/toolclass.ts`
- **Function**: `GoogleMapsTools.calculateDistanceMatrix()` (lines 189-253)
- **Wrapper**: `PlacesSearcher.calculateDistanceMatrix()` in `/home/leon/dev/mcp-google-map/src/services/PlacesSearcher.ts` (lines 170-184)
- **Tool**: `maps_distance_matrix` in `/home/leon/dev/mcp-google-map/src/tools/maps/distanceMatrix.ts`

### Purpose
Calculates travel distances and durations between multiple origins and destinations for various travel modes.

### Parameters Passed
```typescript
{
  origins: string[],                        // Array of origin addresses/coordinates
  destinations: string[],                   // Array of destination addresses/coordinates
  mode: TravelMode,                        // Travel mode: driving|walking|bicycling|transit
  language: Language.en,                    // Response language
  key: string                              // Google Maps API key
}
```

### Data Extracted from Response
- `rows[]` - Matrix of travel data where each row corresponds to an origin:
  - `elements[]` - Array of destination results for each origin:
    - `distance.value` - Distance in meters
    - `distance.text` - Human-readable distance
    - `duration.value` - Duration in seconds
    - `duration.text` - Human-readable duration
    - `status` - Element calculation status
- `origin_addresses[]` - Resolved origin addresses
- `destination_addresses[]` - Resolved destination addresses
- `status` - Overall API call status

### Additional Processing
- Transforms matrix data into structured arrays of distances and durations
- Handles failed calculations by inserting `null` values
- Validates overall API response status

---

## 6. Directions API

### Endpoint Details
- **API Method**: `client.directions()`
- **HTTP Endpoint**: Google Directions API
- **File**: `/home/leon/dev/mcp-google-map/src/services/toolclass.ts`
- **Function**: `GoogleMapsTools.getDirections()` (lines 255-347)
- **Wrapper**: `PlacesSearcher.getDirections()` in `/home/leon/dev/mcp-google-map/src/services/PlacesSearcher.ts` (lines 186-202)
- **Tool**: `maps_directions` in `/home/leon/dev/mcp-google-map/src/tools/maps/directions.ts`

### Purpose
Provides detailed turn-by-turn navigation directions between two locations with comprehensive route information.

### Parameters Passed
```typescript
{
  origin: string,                           // Starting point address/coordinates
  destination: string,                      // Destination address/coordinates
  mode: TravelMode,                        // Travel mode: driving|walking|bicycling|transit
  language: Language.en,                    // Response language
  key: string,                             // Google Maps API key
  arrival_time?: number,                   // Unix timestamp for arrival time
  departure_time?: number | "now"          // Unix timestamp or "now" for departure
}
```

### Data Extracted from Response
- `routes[]` - Array of possible routes (typically returns first route)
- `routes[0].summary` - Route summary description
- `routes[0].legs[0]` - First leg of journey containing:
  - `distance.value` - Total distance in meters
  - `distance.text` - Human-readable distance
  - `duration.value` - Total duration in seconds  
  - `duration.text` - Human-readable duration
  - `arrival_time` - Estimated arrival time info
  - `departure_time` - Departure time info

### Additional Processing
- Handles time parameter processing (converts Date objects to Unix timestamps)
- Formats arrival and departure times with timezone support
- Provides comprehensive route information including steps and waypoints

---

## 7. Elevation API

### Endpoint Details
- **API Method**: `client.elevation()`
- **HTTP Endpoint**: Google Elevation API
- **File**: `/home/leon/dev/mcp-google-map/src/services/toolclass.ts`
- **Function**: `GoogleMapsTools.getElevation()` (lines 349-377)
- **Wrapper**: `PlacesSearcher.getElevation()` in `/home/leon/dev/mcp-google-map/src/services/PlacesSearcher.ts` (lines 204-218)
- **Tool**: `maps_elevation` in `/home/leon/dev/mcp-google-map/src/tools/maps/elevation.ts`

### Purpose
Retrieves elevation data (height above sea level) for specific geographic locations.

### Parameters Passed
```typescript
{
  locations: Array<{lat: number, lng: number}>, // Array of coordinate points
  key: string                                   // Google Maps API key
}
```

### Data Extracted from Response
- `results[]` - Array of elevation data points:
  - `elevation` - Height above sea level in meters
  - `location` - Corresponding lat/lng coordinates
  - `resolution` - Accuracy of elevation data (if available)
- `status` - API response status

### Additional Processing
- Transforms input coordinate format from `{latitude, longitude}` to `{lat, lng}`
- Maps results back to original coordinate format for consistency

---

## Alternative Open-Source API Replacements

This section provides direct replacements for the 7 Google Maps APIs currently used in the codebase. Only exact functional equivalents are included - no additional features or endpoints beyond what the original Google Maps implementation provides.

### 1. Places Nearby Search Replacement

**Google Maps Function**: Search for places near a location with radius, keyword, and open_now filters

**Open-Source Alternative**: **OpenStreetMap Overpass API**

**Endpoint**: `https://overpass-api.de/api/interpreter`
**Method**: POST

**Direct Replacement**: Query OSM data for places within radius
```typescript
const overpassQuery = `
  [out:json];
  (
    node["amenity"="restaurant"](around:1000,40.7128,-74.0060);
    way["amenity"="restaurant"](around:1000,40.7128,-74.0060);
  );
  out geom;
`;

const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  body: overpassQuery
});
```

**Data Available**: Basic place information (name, location, amenity type)
**Missing from OSM**: ratings, reviews, user_ratings_total, detailed business info

**Limitations**: No rating/review system, limited business hours, inconsistent data quality, different categorization system

---

### 2. Place Details Replacement

**Google Maps Function**: Get detailed information about a specific place using place_id

**Open-Source Alternative**: **OpenStreetMap Nominatim Lookup API**

**Endpoint**: `https://nominatim.openstreetmap.org/lookup`
**Method**: GET

**Direct Replacement**: Look up OSM place by ID
```typescript
const osmId = "N123456"; // Convert from Google place_id to OSM ID
const response = await fetch(
  `https://nominatim.openstreetmap.org/lookup?osm_ids=${osmId}&format=json&addressdetails=1&extratags=1`
);
```

**Data Available**: Name, address, phone, website, opening hours, coordinates
**Missing from OSM**: ratings, reviews, photos, price level

**Limitations**: No rating/review system, no photos, limited business info, no real-time data, no price levels

---

### 3. Geocoding Replacement

**Google Maps Function**: Convert addresses to coordinates

**Open-Source Alternative**: **OpenStreetMap Nominatim Forward Geocoding**

**Endpoint**: `https://nominatim.openstreetmap.org/search`
**Method**: GET

**Direct Replacement**: Convert address string to lat/lng coordinates
```typescript
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
);
const data = await response.json();
// Returns: lat, lng, formatted_address, place_id
```

**Data Available**: Coordinates (lat/lng), formatted address, address components, place_id

**Limitations**: Slower response times, different address parsing, less comprehensive rural coverage, different place ID system

---

### 4. Reverse Geocoding Replacement

**Google Maps Function**: Convert coordinates to addresses

**Open-Source Alternative**: **OpenStreetMap Nominatim Reverse Geocoding**

**Endpoint**: `https://nominatim.openstreetmap.org/reverse`
**Method**: GET

**Direct Replacement**: Convert lat/lng coordinates to address string
```typescript
const response = await fetch(
  `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
);
const data = await response.json();
// Returns: formatted_address, place_id, address_components
```

**Data Available**: Formatted address, place_id, address components

**Limitations**: Less detailed address parsing, different type system, accuracy varies by region, rate limits

---

### 5. Distance Matrix Replacement

**Google Maps Function**: Calculate distances/durations between multiple origins and destinations

**Open-Source Alternative**: **OSRM (Open Source Routing Machine) Table Service**

**Endpoint**: `https://router.project-osrm.org/table/v1/driving/{coordinates}`
**Method**: GET

**Direct Replacement**: Calculate travel distances and durations between multiple points
```typescript
// OSRM requires coordinates, so addresses must be geocoded first
const allCoords = [...origins, ...destinations];
const coordString = allCoords.map(([lng, lat]) => `${lng},${lat}`).join(';');

const response = await fetch(
  `https://router.project-osrm.org/table/v1/driving/${coordString}?sources=0,1&destinations=2,3`
);
// Returns: distances matrix, durations matrix
```

**Data Available**: Distance matrix (meters), duration matrix (seconds), travel mode support
**Missing from OSRM**: Real-time traffic data

**Limitations**: No real-time traffic data, less comprehensive road data in some regions, no transit mode, different routing algorithms

---

### 6. Directions Replacement

**Google Maps Function**: Get turn-by-turn navigation directions with route summary, distance, duration, and arrival/departure times

**Open-Source Alternative**: **OSRM Route Service**

**Endpoint**: `https://router.project-osrm.org/route/v1/driving/{coordinates}`
**Method**: GET

**Direct Replacement**: Get route with steps, distance, duration, and summary
```typescript
// OSRM requires coordinates, so addresses must be geocoded first
const coordinates = `${originLng},${originLat};${destLng},${destLat}`;

const response = await fetch(
  `https://router.project-osrm.org/route/v1/driving/${coordinates}?steps=true&geometries=geojson`
);
// Returns: route summary, legs with distance/duration, steps
```

**Data Available**: Route summary, leg distance/duration, turn-by-turn steps, departure/arrival times
**Missing from OSRM**: Real-time traffic, detailed voice instructions

**Limitations**: No real-time traffic data, less detailed instructions, no voice navigation, no transit routing, different routing algorithms

---

### 7. Elevation Replacement

**Google Maps Function**: Get elevation data (height above sea level) for coordinate locations

**Open-Source Alternative**: **Open-Elevation API**

**Endpoint**: `https://api.open-elevation.com/api/v1/lookup`
**Method**: POST

**Direct Replacement**: Get elevation in meters for coordinate locations
```typescript
const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    locations: [{ latitude: 39.7391536, longitude: -104.9847034 }]
  })
});
// Returns: elevation in meters, location coordinates
```

**Data Available**: Elevation in meters, location coordinates

**Limitations**: Slower response times, less precision than Google's data, no resolution information, rate limiting

---

## Summary

This document provides **direct 1:1 replacements** for the 7 Google Maps APIs currently used in the codebase:

1. **Places Nearby Search** → OpenStreetMap Overpass API
2. **Place Details** → OpenStreetMap Nominatim Lookup API  
3. **Geocoding** → OpenStreetMap Nominatim Search API
4. **Reverse Geocoding** → OpenStreetMap Nominatim Reverse API
5. **Distance Matrix** → OSRM Table Service API
6. **Directions** → OSRM Route Service API
7. **Elevation** → Open-Elevation API

### Key Considerations

- **Missing features**: Open-source alternatives lack ratings, reviews, real-time data
- **Different data model**: OSM uses different place IDs and categorization
- **Rate limiting**: Free services have usage limits
- **Data quality**: Varies by region, generally good for major areas
- **No additional endpoints**: This list contains only direct replacements

### Implementation Approach

**No direct replacement available** for APIs that don't have functional equivalents in the open-source ecosystem. Where alternatives exist, they provide the core functionality but may lack commercial features like real-time traffic, comprehensive business data, or advanced routing options.

---

## Architecture Overview

### Service Layer Structure

1. **GoogleMapsTools** (`/home/leon/dev/mcp-google-map/src/services/toolclass.ts`)
   - Core service class containing all direct API interactions
   - Handles authentication, error processing, and data transformation
   - Provides private helper methods for coordinate parsing and address resolution

2. **PlacesSearcher** (`/home/leon/dev/mcp-google-map/src/services/PlacesSearcher.ts`)
   - Wrapper service that provides consistent response formatting
   - Standardizes error handling across all tools
   - Converts API responses to structured success/error format

3. **Tool Layer** (`/home/leon/dev/mcp-google-map/src/tools/maps/`)
   - Individual tool implementations that define MCP interfaces
   - Handle parameter validation using Zod schemas
   - Format responses for MCP protocol consumption

### Common Patterns

- **Authentication**: All API calls use `process.env.GOOGLE_MAPS_API_KEY`
- **Language**: Default language is English (`Language.en`)
- **Error Handling**: Comprehensive try-catch blocks with structured error messages
- **Response Formatting**: Consistent JSON structure with success/error indicators
- **Validation**: Zod schemas for parameter validation at tool level

### Configuration

The server configuration is managed in `/home/leon/dev/mcp-google-map/src/config.ts`, which registers all seven tools with the MCP server through the `BaseMcpServer` class.

---

## API Key Requirements

All endpoints require a valid Google Maps API key with the following services enabled:

1. Places API (for nearby search and place details)
2. Geocoding API (for geocoding and reverse geocoding)
3. Distance Matrix API (for distance calculations)
4. Directions API (for navigation directions)
5. Elevation API (for elevation data)

The API key should be provided via the `GOOGLE_MAPS_API_KEY` environment variable or command-line argument.