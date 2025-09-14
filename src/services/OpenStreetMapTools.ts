import { Logger } from "../index.js";

interface SearchParams {
  location: { lat: number; lng: number };
  radius?: number;
  keyword?: string;
  openNow?: boolean;
  minRating?: number;
}

interface PlaceResult {
  name: string;
  place_id: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now?: boolean;
  };
}

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address?: string;
  place_id?: string;
}

export class OpenStreetMapTools {
  private readonly userAgent: string = "mcp-google-map/1.0 (https://github.com/cablate/mcp-google-map)";

  constructor() {
    // No API key required for OSM services
  }

  async searchNearbyPlaces(params: SearchParams): Promise<PlaceResult[]> {
    try {
      const { location, radius = 1000, keyword } = params;
      
      // Map common keywords to OSM amenity types
      const amenityMap: Record<string, string[]> = {
        'restaurant': ['restaurant', 'fast_food', 'cafe'],
        'food': ['restaurant', 'fast_food', 'cafe', 'bar', 'pub'],
        'cafe': ['cafe'],
        'hotel': ['hotel', 'motel', 'guest_house'],
        'gas': ['fuel'],
        'hospital': ['hospital', 'clinic'],
        'bank': ['bank', 'atm'],
        'pharmacy': ['pharmacy'],
        'shop': ['shop'],
        'shopping': ['shop', 'mall'],
        'school': ['school', 'university'],
        'park': ['park']
      };

      const amenities = keyword ? (amenityMap[keyword.toLowerCase()] || [keyword.toLowerCase()]) : ['restaurant', 'cafe', 'shop', 'hotel', 'hospital'];
      
      // Build Overpass query
      const amenityQueries = amenities.map(amenity => 
        `node["amenity"="${amenity}"](around:${radius},${location.lat},${location.lng});
         way["amenity"="${amenity}"](around:${radius},${location.lat},${location.lng});`
      ).join('\n  ');

      const overpassQuery = `
        [out:json][timeout:25];
        (
          ${amenityQueries}
        );
        out geom;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': this.userAgent
        },
        body: overpassQuery
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      const results: PlaceResult[] = [];

      for (const element of data.elements || []) {
        const tags = element.tags || {};
        const name = tags.name || `${tags.amenity || 'Place'}`;
        
        let lat: number, lng: number;
        if (element.type === 'node') {
          lat = element.lat;
          lng = element.lon;
        } else if (element.type === 'way' && element.geometry) {
          // Use center of way
          const center = this.calculateCentroid(element.geometry);
          lat = center.lat;
          lng = center.lng;
        } else {
          continue;
        }

        // Create a formatted address from available tags
        const address = this.formatOSMAddress(tags);

        results.push({
          name,
          place_id: `${element.type}/${element.id}`,
          formatted_address: address,
          geometry: {
            location: { lat, lng }
          },
          // OSM doesn't have ratings, so we'll omit these fields
          rating: undefined,
          user_ratings_total: undefined,
          opening_hours: {
            open_now: this.isOpenNow(tags.opening_hours)
          }
        });
      }

      // Apply client-side filtering for minRating (though OSM doesn't have ratings)
      let filteredResults = results;
      if (params.openNow) {
        filteredResults = filteredResults.filter(place => 
          place.opening_hours?.open_now !== false
        );
      }

      return filteredResults.slice(0, 20); // Limit results like Google Maps
    } catch (error) {
      Logger.error("Error in searchNearbyPlaces:", error);
      throw new Error("Error occurred while searching nearby places");
    }
  }

  async getPlaceDetails(placeId: string) {
    try {
      // Extract OSM ID from place_id format: "type/id"
      const [type, id] = placeId.split('/');
      const osmId = `${type.toUpperCase()[0]}${id}`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/lookup?osm_ids=${osmId}&format=json&addressdetails=1&extratags=1`,
        {
          headers: {
            'User-Agent': this.userAgent
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim lookup error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error("Place not found");
      }

      const place = data[0];
      const extratags = place.extratags || {};

      return {
        name: place.display_name.split(',')[0],
        rating: undefined, // OSM doesn't have ratings
        formatted_address: place.display_name,
        opening_hours: {
          open_now: this.isOpenNow(extratags.opening_hours)
        },
        reviews: [], // OSM doesn't have reviews
        geometry: {
          location: {
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon)
          }
        },
        formatted_phone_number: extratags.phone || extratags['contact:phone'],
        website: extratags.website || extratags['contact:website'],
        price_level: undefined, // OSM doesn't have price levels
        photos: [] // OSM doesn't have photos
      };
    } catch (error) {
      Logger.error("Error in getPlaceDetails:", error);
      throw new Error("Error occurred while getting place details");
    }
  }

  private async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': this.userAgent
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim search error: ${response.status}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        throw new Error("Cannot find location for this address");
      }

      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted_address: result.display_name,
        place_id: `${result.osm_type}/${result.osm_id}`,
      };
    } catch (error) {
      Logger.error("Error in geocodeAddress:", error);
      throw new Error("Error occurred during geocoding");
    }
  }

  private parseCoordinates(coordString: string): GeocodeResult {
    const coords = coordString.split(",").map((c) => parseFloat(c.trim()));
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
      throw new Error("Invalid coordinate format, please use 'latitude,longitude' format");
    }
    return { lat: coords[0], lng: coords[1] };
  }

  async getLocation(center: { value: string; isCoordinates: boolean }): Promise<GeocodeResult> {
    if (center.isCoordinates) {
      return this.parseCoordinates(center.value);
    }
    return this.geocodeAddress(center.value);
  }

  async geocode(address: string): Promise<{
    location: { lat: number; lng: number };
    formatted_address: string;
    place_id: string;
  }> {
    try {
      const result = await this.geocodeAddress(address);
      return {
        location: { lat: result.lat, lng: result.lng },
        formatted_address: result.formatted_address || "",
        place_id: result.place_id || "",
      };
    } catch (error) {
      Logger.error("Error in geocode:", error);
      throw new Error("Error occurred during geocoding");
    }
  }

  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{
    formatted_address: string;
    place_id: string;
    address_components: any[];
  }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': this.userAgent
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim reverse error: ${response.status}`);
      }

      const data = await response.json();

      if (!data || data.error) {
        throw new Error("Cannot find address for these coordinates");
      }

      // Convert OSM address structure to Google Maps format
      const addressComponents = this.convertOSMAddressComponents(data.address || {});

      return {
        formatted_address: data.display_name,
        place_id: `${data.osm_type}/${data.osm_id}`,
        address_components: addressComponents,
      };
    } catch (error) {
      Logger.error("Error in reverseGeocode:", error);
      throw new Error("Error occurred during reverse geocoding");
    }
  }

  async calculateDistanceMatrix(
    origins: string[],
    destinations: string[],
    mode: "driving" | "walking" | "bicycling" | "transit" = "driving"
  ): Promise<{
    distances: any[][];
    durations: any[][];
    origin_addresses: string[];
    destination_addresses: string[];
  }> {
    try {
      // First geocode all origins and destinations
      const originCoords = await Promise.all(
        origins.map(origin => this.isCoordinate(origin) ? 
          Promise.resolve(this.parseCoordinateString(origin)) :
          this.geocodeAddress(origin).then(result => ({ lat: result.lat, lng: result.lng }))
        )
      );

      const destCoords = await Promise.all(
        destinations.map(dest => this.isCoordinate(dest) ?
          Promise.resolve(this.parseCoordinateString(dest)) :
          this.geocodeAddress(dest).then(result => ({ lat: result.lat, lng: result.lng }))
        )
      );

      // Map travel modes to OSRM profiles
      const profileMap: Record<string, string> = {
        'driving': 'driving',
        'walking': 'foot',
        'bicycling': 'bike',
        'transit': 'driving' // OSRM doesn't support transit, fallback to driving
      };

      const profile = profileMap[mode] || 'driving';
      
      // Prepare coordinates for OSRM (format: lng,lat)
      const allCoords = [...originCoords, ...destCoords];
      const coordString = allCoords.map(coord => `${coord.lng},${coord.lat}`).join(';');
      
      // Create sources and destinations indices
      const sources = originCoords.map((_, index) => index).join(';');
      const destinationsIndices = destCoords.map((_, index) => index + originCoords.length).join(';');

      const response = await fetch(
        `https://router.project-osrm.org/table/v1/${profile}/${coordString}?sources=${sources}&destinations=${destinationsIndices}`,
        {
          headers: {
            'User-Agent': this.userAgent
          }
        }
      );

      if (!response.ok) {
        throw new Error(`OSRM table service error: ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== 'Ok') {
        throw new Error(`OSRM error: ${data.code}`);
      }

      const distances: any[][] = [];
      const durations: any[][] = [];

      // Convert OSRM response to Google Maps format
      data.durations.forEach((row: number[], originIndex: number) => {
        const distanceRow: any[] = [];
        const durationRow: any[] = [];

        row.forEach((duration: number, destIndex: number) => {
          const distance = data.distances[originIndex][destIndex];
          
          if (duration !== null && distance !== null) {
            distanceRow.push({
              value: Math.round(distance),
              text: this.formatDistance(distance)
            });
            durationRow.push({
              value: Math.round(duration),
              text: this.formatDuration(duration)
            });
          } else {
            distanceRow.push(null);
            durationRow.push(null);
          }
        });

        distances.push(distanceRow);
        durations.push(durationRow);
      });

      return {
        distances,
        durations,
        origin_addresses: origins,
        destination_addresses: destinations,
      };
    } catch (error) {
      Logger.error("Error in calculateDistanceMatrix:", error);
      throw new Error("Error occurred while calculating distance matrix");
    }
  }

  async getDirections(
    origin: string,
    destination: string,
    mode: "driving" | "walking" | "bicycling" | "transit" = "driving",
    departure_time?: Date,
    arrival_time?: Date
  ): Promise<{
    routes: any[];
    summary: string;
    total_distance: { value: number; text: string };
    total_duration: { value: number; text: string };
    arrival_time: string;
    departure_time: string;
  }> {
    try {
      // Geocode origin and destination
      const originCoord = this.isCoordinate(origin) ?
        this.parseCoordinateString(origin) :
        await this.geocodeAddress(origin).then(result => ({ lat: result.lat, lng: result.lng }));

      const destCoord = this.isCoordinate(destination) ?
        this.parseCoordinateString(destination) :
        await this.geocodeAddress(destination).then(result => ({ lat: result.lat, lng: result.lng }));

      // Map travel modes to OSRM profiles
      const profileMap: Record<string, string> = {
        'driving': 'driving',
        'walking': 'foot',
        'bicycling': 'bike',
        'transit': 'driving' // OSRM doesn't support transit, fallback to driving
      };

      const profile = profileMap[mode] || 'driving';
      const coordinates = `${originCoord.lng},${originCoord.lat};${destCoord.lng},${destCoord.lat}`;

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/${profile}/${coordinates}?steps=true&geometries=geojson&overview=full`,
        {
          headers: {
            'User-Agent': this.userAgent
          }
        }
      );

      if (!response.ok) {
        throw new Error(`OSRM route service error: ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== 'Ok') {
        throw new Error(`OSRM error: ${data.code}`);
      }

      if (!data.routes || data.routes.length === 0) {
        throw new Error("No routes found");
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      // Calculate arrival and departure times
      const departureTime = departure_time || new Date();
      const durationSeconds = route.duration;
      const arrivalTime = arrival_time || new Date(departureTime.getTime() + durationSeconds * 1000);

      return {
        routes: data.routes,
        summary: `Route via OSRM ${profile}`,
        total_distance: {
          value: Math.round(route.distance),
          text: this.formatDistance(route.distance)
        },
        total_duration: {
          value: Math.round(route.duration),
          text: this.formatDuration(route.duration)
        },
        arrival_time: arrivalTime.toISOString(),
        departure_time: departureTime.toISOString(),
      };
    } catch (error) {
      Logger.error("Error in getDirections:", error);
      throw new Error("Error occurred while getting directions: " + error);
    }
  }

  async getElevation(locations: Array<{ latitude: number; longitude: number }>): Promise<Array<{ elevation: number; location: { lat: number; lng: number } }>> {
    try {
      const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': this.userAgent
        },
        body: JSON.stringify({
          locations: locations.map(loc => ({
            latitude: loc.latitude,
            longitude: loc.longitude
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Open-Elevation API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results) {
        throw new Error("Invalid response from elevation service");
      }

      return data.results.map((item: any) => ({
        elevation: item.elevation,
        location: {
          lat: item.latitude,
          lng: item.longitude
        }
      }));
    } catch (error) {
      Logger.error("Error in getElevation:", error);
      throw new Error("Error occurred while getting elevation data");
    }
  }

  // Helper methods
  private calculateCentroid(geometry: any[]): { lat: number; lng: number } {
    if (!geometry || geometry.length === 0) {
      throw new Error("Invalid geometry for centroid calculation");
    }
    
    let lat = 0, lng = 0;
    geometry.forEach(point => {
      lat += point.lat;
      lng += point.lon;
    });
    
    return {
      lat: lat / geometry.length,
      lng: lng / geometry.length
    };
  }

  private formatOSMAddress(tags: any): string {
    const parts = [];
    
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    if (tags['addr:state']) parts.push(tags['addr:state']);
    if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
    if (tags['addr:country']) parts.push(tags['addr:country']);

    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  }

  private isOpenNow(openingHours?: string): boolean | undefined {
    if (!openingHours) return undefined;
    
    // This is a simplified check - a full implementation would need to parse complex opening hours
    if (openingHours.includes('24/7')) return true;
    if (openingHours.includes('closed')) return false;
    
    // For now, return undefined for complex opening hours
    return undefined;
  }

  private convertOSMAddressComponents(osmAddress: any): any[] {
    const components = [];
    
    const componentMap: Record<string, string> = {
      'house_number': 'street_number',
      'road': 'route',
      'city': 'locality',
      'town': 'locality',
      'village': 'locality',
      'state': 'administrative_area_level_1',
      'postcode': 'postal_code',
      'country': 'country'
    };

    Object.entries(osmAddress).forEach(([key, value]) => {
      const googleType = componentMap[key];
      if (googleType && value) {
        components.push({
          long_name: value,
          short_name: value,
          types: [googleType]
        });
      }
    });

    return components;
  }

  private isCoordinate(str: string): boolean {
    return /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(str);
  }

  private parseCoordinateString(coordString: string): { lat: number; lng: number } {
    const [lat, lng] = coordString.split(',').map(c => parseFloat(c.trim()));
    return { lat, lng };
  }

  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} h ${remainingMinutes} min`;
    }
  }
}