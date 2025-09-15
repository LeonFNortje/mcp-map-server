#!/usr/bin/env node

import { config as dotenvConfig } from "dotenv";
import { resolve, dirname } from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import serverConfigs from "./config.js";
import { BaseMcpServer } from "./core/BaseMcpServer.js";
import { Logger } from "./index.js";
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env from current directory first, then from package directory
dotenvConfig({ path: resolve(process.cwd(), ".env") });
// Also try to load from the package installation directory
dotenvConfig({ path: resolve(__dirname, "../.env") });

export async function startServer(port?: number, apiKey?: string, provider?: string, riskscapeKey?: string): Promise<void> {
  // Override environment variables with CLI arguments if provided
  if (port) {
    process.env.MCP_SERVER_PORT = port.toString();
  }
  if (apiKey) {
    process.env.GOOGLE_MAPS_API_KEY = apiKey;
  }
  if (provider) {
    process.env.MAP_API_PROVIDER = provider;
  }
  if (riskscapeKey) {
    process.env.RISKSCAPE_API_KEY = riskscapeKey;
  }

  const mapProvider = process.env.MAP_API_PROVIDER?.toLowerCase() || "google";
  let providerName = "Google Maps";
  if (mapProvider === "osm" || mapProvider === "openstreetmap") {
    providerName = "OpenStreetMap";
  } else if (mapProvider === "riskscape") {
    providerName = "RiskScape";
  }
  
  Logger.log(`🚀 Starting ${providerName} MCP Server...`);
  Logger.log("📍 Available tools: search_nearby, get_place_details, maps_geocode, maps_reverse_geocode, maps_distance_matrix, maps_directions, maps_elevation, echo");
  Logger.log("");

  const startPromises = serverConfigs.map(async (config) => {
    const portString = process.env[config.portEnvVar];
    if (!portString) {
      Logger.error(
        `⚠️  [${config.name}] Port environment variable ${config.portEnvVar} not set.`
      );
      Logger.log(`💡 Please set ${config.portEnvVar} in your .env file or use --port parameter.`);
      Logger.log(`   Example: ${config.portEnvVar}=3000 or --port 3000`);
      return;
    }

    const serverPort = Number(portString);
    if (isNaN(serverPort) || serverPort <= 0) {
      Logger.error(
        `❌ [${config.name}] Invalid port number "${portString}" defined in ${config.portEnvVar}.`
      );
      return;
    }

    try {
      const server = new BaseMcpServer(config.name, config.tools);
      Logger.log(
        `🔧 [${config.name}] Initializing MCP Server in HTTP mode on port ${serverPort}...`
      );
      await server.startHttpServer(serverPort);
      Logger.log(
        `✅ [${config.name}] MCP Server started successfully!`
      );
      Logger.log(`   🌐 Endpoint: http://localhost:${serverPort}/mcp`);
      Logger.log(`   📚 Tools: ${config.tools.length} available`);
    } catch (error) {
      Logger.error(
        `❌ [${config.name}] Failed to start MCP Server on port ${serverPort}:`,
        error
      );
    }
  });

  await Promise.allSettled(startPromises);

  Logger.log("");
  Logger.log("🎉 Server initialization completed!");
  Logger.log("💡 Need help? Check the README.md for configuration details.");
}

// Check if this script is being run directly
// When installed globally via npm, process.argv[1] might be a symlink like /usr/local/bin/mcp-google-map
// So we check multiple conditions to ensure the script runs properly
const isRunDirectly = process.argv[1] && (
  process.argv[1].endsWith("cli.ts") || 
  process.argv[1].endsWith("cli.js") ||
  process.argv[1].endsWith("mcp-map-server") ||
  process.argv[1].includes("mcp-map-server") ||
  process.argv[1].endsWith("mcp-google-map") ||
  process.argv[1].includes("mcp-google-map")
);

// For ES modules, we can also check if this file is the entry point
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isRunDirectly || isMainModule) {
  // Read package.json to get version
  let packageVersion = "0.0.0";
  try {
    const packageJsonPath = resolve(__dirname, "../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    packageVersion = packageJson.version;
  } catch (e) {
    // Fallback version if package.json can't be read
    packageVersion = "0.0.0";
  }

  // Parse command line arguments
  const argv = yargs(hideBin(process.argv))
    .option('port', {
      alias: 'p',
      type: 'number',
      description: 'Port to run the MCP server on',
      default: process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT) : 3000
    })
    .option('apikey', {
      alias: 'k',
      type: 'string',
      description: 'Google Maps API key (only required for Google Maps provider)',
      default: process.env.GOOGLE_MAPS_API_KEY
    })
    .option('provider', {
      alias: 'r',
      type: 'string',
      choices: ['google', 'osm', 'openstreetmap', 'riskscape'],
      description: 'Map API provider to use',
      default: process.env.MAP_API_PROVIDER || 'google'
    })
    .option('riskscape-key', {
      alias: 's',
      type: 'string',
      description: 'RiskScape API key (only required for RiskScape provider)',
      default: process.env.RISKSCAPE_API_KEY
    })
    .option('help', {
      alias: 'h',
      type: 'boolean',
      description: 'Show help'
    })
    .version(packageVersion)
    .alias('version', 'v')
    .example([
      ['mcp-map-server', 'Start server with default settings (Google Maps)'],
      ['mcp-map-server --port 3200 --apikey "your_api_key"', 'Start server with Google Maps'],
      ['mcp-map-server --provider osm', 'Start server with OpenStreetMap (no API key required)'],
      ['mcp-map-server --provider riskscape --riskscape-key "your_key"', 'Start server with RiskScape'],
      ['mcp-map-server -p 3200 -r osm', 'Start server with OpenStreetMap and custom port']
    ])
    .help()
    .parseSync();

  // Show welcome message
  Logger.log("🗺️  MCP Map Server");
  Logger.log("   A universal Model Context Protocol server for mapping services");
  Logger.log("");
  
  // Check for API key requirements based on provider
  const selectedProvider = argv.provider?.toLowerCase() || "google";
  const isOSM = selectedProvider === "osm" || selectedProvider === "openstreetmap";
  const isRiskScape = selectedProvider === "riskscape";
  
  if (selectedProvider === "google" && !argv.apikey) {
    Logger.log("⚠️  Google Maps API Key not found!");
    Logger.log("   Please provide --apikey parameter or set GOOGLE_MAPS_API_KEY in your .env file");
    Logger.log("   Example: mcp-map-server --apikey your_api_key_here");
    Logger.log("");
    Logger.log("💡 Alternatives:");
    Logger.log("   OpenStreetMap (free): mcp-map-server --provider osm");
    Logger.log("   RiskScape: mcp-map-server --provider riskscape --riskscape-key your_key");
    Logger.log("");
  } else if (isOSM) {
    Logger.log("ℹ️  Using OpenStreetMap - no API key required");
    Logger.log("");
  } else if (isRiskScape) {
    if (!argv['riskscape-key']) {
      Logger.log("⚠️  RiskScape API Key not found!");
      Logger.log("   Please provide --riskscape-key parameter or set RISKSCAPE_API_KEY in your .env file");
      Logger.log("   Example: mcp-map-server --provider riskscape --riskscape-key your_key");
      Logger.log("");
    } else {
      Logger.log("ℹ️  Using RiskScape API");
      Logger.log("");
    }
  }
  
  startServer(argv.port, argv.apikey, argv.provider, argv['riskscape-key']).catch((error) => {
    Logger.error("❌ Failed to start server:", error);
    process.exit(1);
  });
}
