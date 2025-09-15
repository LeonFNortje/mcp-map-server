import { z } from "zod";
import { PlacesSearcher } from "../../services/PlacesSearcher.js";

const NAME = "maps_elevation";
const DESCRIPTION = "Get elevation data (height above sea level) for specific geographic locations";

const elevationSchema = z.object({
  locations: z.array(z.object({
    latitude: z.number().describe("Latitude coordinate"),
    longitude: z.number().describe("Longitude coordinate"),
  })).describe("List of locations to get elevation data for"),
});

const SCHEMA = elevationSchema.shape;

export type ElevationParams = z.infer<typeof elevationSchema>;

let placesSearcher: PlacesSearcher | null = null;

async function ACTION(params: ElevationParams): Promise<{ content: any[]; isError?: boolean }> {
  try {
    if (!placesSearcher) {
      placesSearcher = new PlacesSearcher();
    }
    const result = await placesSearcher.getElevation(params.locations as Array<{ latitude: number; longitude: number }>);

    if (!result.success) {
      return {
        content: [{ type: "text", text: result.error || "Failed to get elevation data" }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.data, null, 2),
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error getting elevation data: ${errorMessage}` }],
    };
  }
}

export const Elevation = {
  NAME,
  DESCRIPTION,
  SCHEMA,
  ACTION,
};