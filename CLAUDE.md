# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides Google Maps API integration with streamable HTTP transport support. It's built as an npm package that can be installed globally or used locally for development.

## Development Commands

```bash
# Install dependencies
npm install

# Build the project (uses tsup to bundle TypeScript)
npm run build

# Start the built server
npm start

# Development mode with auto-rebuild on changes
npm run dev

# Prepare for publishing (runs build)
npm run prepublishOnly
```

## Running the Server

```bash
# After building, run with command line arguments
node dist/cli.js --port 3000 --apikey "your_api_key"

# Or use environment variables (.env file)
GOOGLE_MAPS_API_KEY=your_api_key_here
MCP_SERVER_PORT=3000
```

## Architecture

The codebase follows a modular architecture with clear separation of concerns:

- **Entry Points**: 
  - `src/cli.ts` - CLI entry point that starts the HTTP server
  - `src/index.ts` - Package exports (currently just Logger utility)

- **Core MCP Server**:
  - `src/core/BaseMcpServer.ts` - Base class implementing MCP protocol with streamable HTTP transport, session management, and tool registration

- **Google Maps Integration**:
  - `src/services/toolclass.ts` - Google Maps API client wrapper
  - `src/services/PlacesSearcher.ts` - Places search service layer
  - `src/tools/maps/` - Individual tool implementations (geocode, directions, elevation, etc.)

- **Configuration**:
  - `src/config.ts` - Server configuration and tool registration
  - Tools are registered with name, description, Zod schema, and action handler

## Key Technical Details

- **TypeScript**: Strict mode enabled, ES2020 target, NodeNext module resolution
- **Build System**: Uses tsup for bundling, outputs ESM format only
- **MCP Protocol**: Implements streamable HTTP transport with session management via UUID
- **Validation**: Uses Zod for schema validation of tool parameters
- **Logging**: Custom Logger that outputs to stderr to avoid interfering with MCP protocol

## Environment Configuration

Required environment variables:
- `GOOGLE_MAPS_API_KEY` - Google Maps API key for all map services
- `MCP_SERVER_PORT` - Port for the MCP HTTP server (default: 3000)

Command line arguments override environment variables when provided.

## Available Tools

The server provides 7 Google Maps tools plus an echo tool for testing:
- `search_nearby` - Search for places near a location
- `get_place_details` - Get detailed place information
- `maps_geocode` - Convert addresses to coordinates
- `maps_reverse_geocode` - Convert coordinates to addresses
- `maps_distance_matrix` - Calculate distances and travel times
- `maps_directions` - Get turn-by-turn directions
- `maps_elevation` - Get elevation data for locations
- `echo` - Test tool that echoes input

## Testing Approach

Currently no test suite is configured. The project includes Jest and ts-jest as dev dependencies but no test files or jest configuration exists yet. Consider adding:
- Unit tests for individual tools
- Integration tests for MCP server functionality
- E2E tests for HTTP transport layer

## Important Notes

- The server uses Express.js for HTTP handling with JSON middleware
- Sessions are managed via MCP-Session-Id header
- DNS rebinding protection is commented out by default (see BaseMcpServer.ts:85-88)
- The project publishes only the dist folder and README to npm
- Node.js 18+ is required due to native fetch and other modern APIs