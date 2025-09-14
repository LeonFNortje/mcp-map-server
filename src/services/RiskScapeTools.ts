import { Logger } from "../index.js";
import dotenv from "dotenv";

dotenv.config();

// Use the same interfaces as GoogleMapsTools for compatibility
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

export class RiskScapeTools {
  private readonly baseUrl: string = "https://api.riskscape.pro";
  private readonly apiKey: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor() {
    if (!process.env.RISKSCAPE_API_KEY) {
      throw new Error("RiskScape API Key is required");
    }
    this.apiKey = process.env.RISKSCAPE_API_KEY;
    this.defaultHeaders = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Version': 'v2'  // Specify v2 API version
    };
  }

  private async fetchAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`RiskScape API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async searchNearbyPlaces(params: SearchParams): Promise<PlaceResult[]> {
    try {
      const queryParams = new URLSearchParams({
        lat: params.location.lat.toString(),
        lng: params.location.lng.toString(),
        radius: (params.radius || 1000).toString(),
        ...(params.keyword && { category: params.keyword }),
        limit: '20'
      });

      // v2 endpoint - may have different response structure than v1
      const data = await this.fetchAPI(`/places/v2/search?${queryParams}`);
      
      const results = data.results || [];
      let filtered = results;

      // Apply filters if specified
      if (params.openNow) {
        filtered = filtered.filter((place: any) => place.hours?.open_now === true);
      }
      
      if (params.minRating) {
        filtered = filtered.filter((place: any) => (place.rating || 0) >= params.minRating);
      }

      return filtered.map((place: any) => ({
        name: place.name,
        place_id: place.id,
        formatted_address: place.address,
        geometry: {
          location: {
            lat: place.location.lat,
            lng: place.location.lng
          }
        },
        rating: place.rating,
        user_ratings_total: place.review_count,
        opening_hours: place.hours ? {
          open_now: place.hours.open_now
        } : undefined
      }));
    } catch (error) {
      Logger.error("Error in searchNearbyPlaces:", error);
      throw new Error("Error occurred while searching nearby places");
    }
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      // v2 endpoint - response may include additional fields
      const data = await this.fetchAPI(`/places/v2/details/${placeId}`);
      
      return {
        name: data.name,
        rating: data.rating,
        formatted_address: data.address,
        opening_hours: data.hours,
        reviews: data.reviews,
        geometry: {
          location: {
            lat: data.location.lat,
            lng: data.location.lng
          }
        },
        formatted_phone_number: data.contact?.phone,
        website: data.contact?.website,
        price_level: data.price_level,
        photos: data.photos
      };
    } catch (error) {
      Logger.error("Error in getPlaceDetails:", error);
      throw new Error("Error occurred while getting place details");
    }
  }

  private async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      const queryParams = new URLSearchParams({
        address: address,
        limit: '1'
      });

      const data = await this.fetchAPI(`/addressing/v2/geocode?${queryParams}`);
      
      if (!data.results || data.results.length === 0) {
        throw new Error("Cannot find location for this address");
      }

      const result = data.results[0];
      return {
        lat: result.location.lat,
        lng: result.location.lng,
        formatted_address: result.formatted_address,
        place_id: result.address_id
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
        place_id: result.place_id || ""
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
      const queryParams = new URLSearchParams({
        lat: latitude.toString(),
        lng: longitude.toString()
      });

      const data = await this.fetchAPI(`/addressing/v2/reverse-geocode?${queryParams}`);
      
      if (!data.address) {
        throw new Error("Cannot find address for these coordinates");
      }

      return {
        formatted_address: data.address.formatted_address,
        place_id: data.address.address_id,
        address_components: Object.entries(data.address.components || {}).map(([type, value]) => ({
          long_name: value,
          short_name: value,
          types: [type]
        }))
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
      // Parse origins and destinations to coordinates
      const originCoords = await Promise.all(origins.map(async (origin) => {
        if (origin.includes(',') && origin.split(',').length === 2) {
          const coords = this.parseCoordinates(origin);
          return { lat: coords.lat, lng: coords.lng };
        } else {
          const geocoded = await this.geocodeAddress(origin);
          return { lat: geocoded.lat, lng: geocoded.lng };
        }
      }));

      const destCoords = await Promise.all(destinations.map(async (dest) => {
        if (dest.includes(',') && dest.split(',').length === 2) {
          const coords = this.parseCoordinates(dest);
          return { lat: coords.lat, lng: coords.lng };
        } else {
          const geocoded = await this.geocodeAddress(dest);
          return { lat: geocoded.lat, lng: geocoded.lng };
        }
      }));

      const riskscapeMode = mode === "bicycling" ? "cycling" : mode;

      // v2 endpoint - POST method, may require additional parameters
      const data = await this.fetchAPI('/routing/v2/matrix', {
        method: 'POST',
        body: JSON.stringify({
          origins: originCoords,
          destinations: destCoords,
          mode: riskscapeMode,
          units: 'metric'  // v2 may require units specification
        })
      });

      return {
        distances: data.distances,
        durations: data.durations,
        origin_addresses: data.origin_addresses || origins,
        destination_addresses: data.destination_addresses || destinations
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
      const queryParams = new URLSearchParams({
        origin: origin,
        destination: destination,
        mode: mode === "bicycling" ? "cycling" : mode,
        units: 'metric',  // v2 may require units
        ...(departure_time && { departure_time: departure_time.toISOString() }),
        ...(arrival_time && { arrival_time: arrival_time.toISOString() })
      });

      // v2 endpoint - may include additional route information
      const data = await this.fetchAPI(`/routing/v2/directions?${queryParams}`);
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error("No routes found");
      }

      const route = data.routes[0];

      return {
        routes: data.routes,
        summary: route.summary || "",
        total_distance: {
          value: route.distance,
          text: `${(route.distance / 1000).toFixed(1)} km`
        },
        total_duration: {
          value: route.duration,
          text: `${Math.round(route.duration / 60)} mins`
        },
        arrival_time: route.arrival_time || "",
        departure_time: route.departure_time || ""
      };
    } catch (error) {
      Logger.error("Error in getDirections:", error);
      throw new Error("Error occurred while getting directions: " + error);
    }
  }

  async getElevation(locations: Array<{ latitude: number; longitude: number }>): Promise<Array<{ elevation: number; location: { lat: number; lng: number } }>> {
    try {
      const points = locations.map(loc => ({
        lat: loc.latitude,
        lng: loc.longitude
      }));

      // v2 endpoint - POST method, may include resolution options
      const data = await this.fetchAPI('/elevation/v2/lookup', {
        method: 'POST',
        body: JSON.stringify({ 
          points,
          resolution: 'high'  // v2 may support resolution parameter
        })
      });

      if (!data.elevations) {
        throw new Error("Failed to get elevation data");
      }

      return data.elevations.map((elevation: number, index: number) => ({
        elevation: elevation,
        location: points[index]
      }));
    } catch (error) {
      Logger.error("Error in getElevation:", error);
      throw new Error("Error occurred while getting elevation data");
    }
  }
}