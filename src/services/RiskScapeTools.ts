import { Logger } from "../index.js";
import { config } from "dotenv";
import { OpenStreetMapTools } from "./OpenStreetMapTools.js";

config();

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
  private readonly baseUrl: string = "https://api.cloud.riskscape.pro";
  private readonly servicesUrl: string = "https://services.cloud.riskscape.pro/api";
  private readonly apiKey: string;
  private readonly bearerToken: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly osmFallback: OpenStreetMapTools;

  constructor() {
    if (!process.env.RISKSCAPE_API_KEY) {
      throw new Error("RiskScape API Key is required");
    }
    this.apiKey = process.env.RISKSCAPE_API_KEY;
    this.bearerToken = process.env.RISKSCAPE_BEARER || '';
    Logger.log(`RiskScapeTools initialized with API key: ${this.apiKey.substring(0, 10)}...`);
    if (this.bearerToken) {
      Logger.log(`RiskScapeTools initialized with Bearer token: ${this.bearerToken.substring(0, 10)}...`);
    }
    this.defaultHeaders = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'http://localhost:3200'  // Add Origin header for CORS
    };
    // Initialize OSM fallback for unsupported endpoints
    this.osmFallback = new OpenStreetMapTools();
    Logger.log("RiskScapeTools initialized with OSM fallback for places search");
  }

  private async fetchAPI(endpoint: string, options: RequestInit = {}, useServicesHost: boolean = false): Promise<any> {
    const url = useServicesHost ? `${this.servicesUrl}${endpoint}` : `${this.baseUrl}${endpoint}`;
    
    // Use different auth headers based on the host
    const authHeaders = useServicesHost && this.bearerToken
      ? { 'Authorization': `Bearer ${this.bearerToken}` }
      : { 'x-api-key': this.apiKey };
    
    const finalHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'http://localhost:3200',
      ...authHeaders,
      ...options.headers
    };
    
    Logger.log(`Fetching: ${url}`);
    Logger.log(`Headers: ${useServicesHost ? 'Authorization' : 'x-api-key'}: ${useServicesHost ? finalHeaders.Authorization?.substring(0, 30) : finalHeaders['x-api-key']?.substring(0, 20)}...`);
    
    const response = await fetch(url, {
      ...options,
      headers: finalHeaders
    });

    if (!response.ok) {
      const error = await response.text();
      Logger.error(`API Response Status: ${response.status}`);
      Logger.error(`API Response: ${error}`);
      throw new Error(`RiskScape API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async searchNearbyPlaces(params: SearchParams): Promise<PlaceResult[]> {
    // RiskScape doesn't support places search, fallback to OSM
    Logger.log("RiskScape doesn't support places search, using OSM fallback");
    try {
      return await this.osmFallback.searchNearbyPlaces(params);
    } catch (error) {
      Logger.error("Error in searchNearbyPlaces with OSM fallback:", error);
      throw new Error("Error occurred while searching nearby places using OSM");
    }
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    // RiskScape doesn't support place details, fallback to OSM
    Logger.log("RiskScape doesn't support place details, using OSM fallback");
    try {
      return await this.osmFallback.getPlaceDetails(placeId);
    } catch (error) {
      Logger.error("Error in getPlaceDetails with OSM fallback:", error);
      throw new Error("Error occurred while getting place details using OSM");
    }
  }

  private async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      const queryParams = new URLSearchParams({
        q: address  // Changed from 'address' to 'q' as per API docs
      });

      const response = await this.fetchAPI(`/addressing/v2/autocomplete?${queryParams}`);
      
      // RiskScape returns data wrapped in a 'data' property
      const data = response.data || response;
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Cannot find location for this address");
      }

      const result = data[0];
      return {
        lat: result.position?.lat || 0,
        lng: result.position?.lon || 0,
        formatted_address: result.candidate || address,
        place_id: result.attributes?.address_id || ""
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
        latlon: `${latitude},${longitude}`  // Changed to use 'latlon' parameter as per API docs
      });

      const data = await this.fetchAPI(`/addressing/v2/reverse-geocode?${queryParams}`, {}, true); // Use services host with Bearer token
      
      // Check if we got a valid response
      if (!data) {
        throw new Error("Cannot find address for these coordinates");
      }

      // RiskScape returns the address object directly or wrapped in data
      const addressData = data.data || data;
      
      return {
        formatted_address: addressData.full_address || addressData.short_address || "",
        place_id: addressData.property_key || "",
        address_components: [
          addressData.street_number && { long_name: addressData.street_number, short_name: addressData.street_number, types: ["street_number"] },
          addressData.street && { long_name: addressData.street, short_name: addressData.street, types: ["route"] },
          addressData.suburb && { long_name: addressData.suburb, short_name: addressData.suburb, types: ["sublocality"] },
          addressData.city_town && { long_name: addressData.city_town, short_name: addressData.city_town, types: ["locality"] },
          addressData.province && { long_name: addressData.province, short_name: addressData.province_code || addressData.province, types: ["administrative_area_level_1"] },
          addressData.postal_code && { long_name: addressData.postal_code, short_name: addressData.postal_code, types: ["postal_code"] }
        ].filter(Boolean)
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