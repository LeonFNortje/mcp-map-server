# MCP Map Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/mcp-map-server.svg)](https://badge.fury.io/js/mcp-map-server)

A powerful Model Context Protocol (MCP) server providing comprehensive mapping services through three different providers:
- **Google Maps API** - Premium features with extensive data
- **OpenStreetMap** - Free, open-source alternative
- **RiskScape API** - Enterprise spatial analysis platform

All providers offer the same unified interface with streamable HTTP transport support and LLM processing capabilities.

## 🚀 Quick Start in 30 Seconds

```bash
# Install globally
npm install -g mcp-map-server

# Start with your preferred provider:

# Option 1: OpenStreetMap (FREE - No API key needed!)
mcp-map-server --port 3200 --provider osm

# Option 2: Google Maps (Requires API key)
mcp-map-server --port 3200 --apikey "your_google_api_key"

# Option 3: RiskScape (Enterprise)
mcp-map-server --port 3200 --provider riskscape --riskscape-key "your_key"
```

Server will be available at `http://localhost:3200/mcp` ✨

## 🤖 Using with Claude Desktop (Claude Code)

### Step 1: Start the MCP Server

First, start the MCP server with your preferred provider (see Quick Start above).

### Step 2: Configure Claude Desktop

Add the server to your Claude Desktop configuration file:

**On macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**On Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**On Linux:** `~/.config/Claude/claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "maps": {
      "command": "npx",
      "args": [
        "mcp-map-server",
        "--port", "3200",
        "--provider", "osm"
      ]
    }
  }
}
```

**For different providers, adjust the args:**

```json
// For Google Maps
"args": [
  "mcp-map-server",
  "--port", "3200",
  "--apikey", "your_google_api_key"
]

// For OpenStreetMap (recommended for testing)
"args": [
  "mcp-map-server",
  "--port", "3200",
  "--provider", "osm"
]

// For RiskScape
"args": [
  "mcp-map-server",
  "--port", "3200",
  "--provider", "riskscape",
  "--riskscape-key", "your_riskscape_key"
]
```

### Step 3: Restart Claude Desktop

After updating the configuration, restart Claude Desktop to load the MCP server.

### Step 4: Use Map Tools in Claude

Once configured, you can ask Claude to use the mapping tools:

**Example prompts:**
- "Search for coffee shops near Times Square, New York"
- "Get directions from San Francisco to Los Angeles"
- "What's the address at coordinates 37.7749, -122.4194?"
- "Calculate the distance between London and Paris"
- "Find restaurants within 2km of the Eiffel Tower with rating above 4.0"
- "Get the elevation at Mount Everest base camp"

Claude will automatically use the appropriate mapping tools to answer your questions.

### Alternative: Environment Variables Configuration

You can also use environment variables in the Claude Desktop config:

```json
{
  "mcpServers": {
    "maps": {
      "command": "npx",
      "args": ["mcp-map-server"],
      "env": {
        "MCP_SERVER_PORT": "3200",
        "MAP_API_PROVIDER": "osm"
        // Add API keys here if needed:
        // "GOOGLE_MAPS_API_KEY": "your_key",
        // "RISKSCAPE_API_KEY": "your_key"
      }
    }
  }
}
```

### Verifying the Connection

After restarting Claude Desktop, you can verify the MCP server is connected:

1. Open Claude Desktop
2. Look for the 🔌 icon in the bottom right corner
3. Click it to see connected MCP servers
4. You should see "maps" with 7 available tools

If you don't see the server connected:
- Check the Claude Desktop logs for errors
- Ensure the MCP server is installed globally: `npm list -g mcp-map-server`
- Verify your configuration file JSON syntax is valid
- Try running the server manually first to test: `mcp-map-server --port 3200 --provider osm`

## 🙌 Special Thanks

This project has received contributions from the community.  
Special thanks to [@junyinnnn](https://github.com/junyinnnn) for helping add support for `streamablehttp`.

## ✅ Testing Status

**This MCP server has been tested and verified to work correctly with:**
- Claude Desktop
- Dive Desktop
- MCP protocol implementations

All tools and features are confirmed functional through real-world testing.

## Features

### 🌍 Triple Provider Support: Google Maps, OpenStreetMap & RiskScape

**Choose your preferred mapping provider:**
- **Google Maps** - Premium features with API key required
- **OpenStreetMap** - Free, open-source alternative with no API key needed
- **RiskScape** - Enterprise API with advanced spatial analysis capabilities

### 🗺️ Mapping Services

- **Location Search**
  - Search for places near a specific location with customizable radius and filters
  - Get detailed place information including ratings, opening hours, and contact details

- **Geocoding Services**
  - Convert addresses to coordinates (geocoding)
  - Convert coordinates to addresses (reverse geocoding)

- **Distance & Directions**
  - Calculate distances and travel times between multiple origins and destinations
  - Get detailed turn-by-turn directions between two points
  - Support for different travel modes (driving, walking, bicycling, transit)

- **Elevation Data**
  - Retrieve elevation data for specific locations

### 🚀 Advanced Features

- **Streamable HTTP Transport**: Latest MCP protocol with real-time streaming capabilities
- **Session Management**: Stateful sessions with UUID-based identification
- **Multiple Connection Support**: Handle multiple concurrent client connections
- **Echo Service**: Built-in testing tool for MCP server functionality

## Quick Start

### Installation

```bash
npm install -g mcp-map-server
```

### Starting the Server

The MCP server can be started with any of the three map providers. Choose the one that best fits your needs:

#### Option 1: Google Maps (Default Provider)

**Requirements:** Google Maps API key ([Get one here](https://developers.google.com/maps/documentation/javascript/get-api-key))

```bash
# Using command line arguments
mcp-map-server --port 3200 --apikey "your_google_api_key"

# Using environment variables
GOOGLE_MAPS_API_KEY="your_google_api_key" mcp-map-server --port 3200

# Short form
mcp-map-server -p 3200 -k "your_google_api_key"
```

#### Option 2: OpenStreetMap (Free, No API Key Required)

**Requirements:** None - completely free to use!

```bash
# Using command line arguments
mcp-map-server --port 3200 --provider osm

# Using environment variables
MAP_API_PROVIDER=osm mcp-map-server --port 3200

# Short form
mcp-map-server -p 3200 -r osm
```

#### Option 3: RiskScape API (Enterprise)

**Requirements:** RiskScape API key ([Contact RiskScape](https://riskscape.pro))

```bash
# Using command line arguments
mcp-map-server --port 3200 --provider riskscape --riskscape-key "your_riskscape_key"

# Using environment variables
MAP_API_PROVIDER=riskscape RISKSCAPE_API_KEY="your_key" mcp-map-server --port 3200

# Short form
mcp-map-server -p 3200 -r riskscape -s "your_riskscape_key"
```

### Verify Server is Running

Once started, the server will display:
```
✅ MCP Server started successfully!
🌐 Endpoint: http://localhost:3200/mcp
📚 Tools: 7 available
```

### Command Line Options

```bash
mcp-map-server --help
```

| Option | Alias | Description | Default |
|--------|-------|-------------|----------|
| `--port` | `-p` | Port to run the server on | 3200 |
| `--provider` | `-r` | Map provider (google, osm, riskscape) | google |
| `--apikey` | `-k` | Google Maps API key | - |
| `--riskscape-key` | `-s` | RiskScape API key | - |
| `--help` | `-h` | Show help information | - |
| `--version` | `-v` | Show version number | - |

## Configuration

### Using Environment Variables

Create a `.env` file in your working directory:

#### For Google Maps:
```env
MAP_API_PROVIDER=google
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
MCP_SERVER_PORT=3200
```

#### For OpenStreetMap:
```env
MAP_API_PROVIDER=osm
MCP_SERVER_PORT=3200
# No API key needed!
```

#### For RiskScape:
```env
MAP_API_PROVIDER=riskscape
RISKSCAPE_API_KEY=your_riskscape_api_key_here
MCP_SERVER_PORT=3200
```

**Note**: Command line arguments always take precedence over environment variables.

## Choosing a Provider

### Provider Comparison

| Feature | Google Maps | OpenStreetMap | RiskScape |
|---------|------------|---------------|-----------|
| **API Key Required** | ✅ Yes | ❌ No | ✅ Yes |
| **Cost** | Pay-per-use with free tier | **100% Free** | Enterprise pricing |
| **Best For** | Commercial apps, detailed business data | Open source projects, cost-conscious users | Enterprise spatial analysis |
| **Place Ratings/Reviews** | ✅ Extensive | ❌ No | ⚠️ Limited |
| **Business Hours** | ✅ Real-time | ⚠️ Community-provided | ⚠️ Limited |
| **Real-time Traffic** | ✅ Yes | ❌ No | ❌ No |
| **Global Coverage** | ✅ Excellent | ✅ Good | ⚠️ Regional focus |
| **Rate Limits** | Based on billing | Fair use policy | API tier based |
| **Spatial Analysis** | Basic | Basic | ✅ Advanced |
| **API Version** | Latest | Overpass API | v2 endpoints |

### When to Use Each Provider

**Use Google Maps when you need:**
- Business information (ratings, reviews, hours)
- Real-time traffic data
- Street View integration
- Premium geocoding accuracy
- Extensive place details

**Use OpenStreetMap when you need:**
- Completely free usage
- Open source compatibility
- No API key management
- Community-driven data
- Basic mapping features

**Use RiskScape when you need:**
- Enterprise spatial analysis
- Risk assessment features
- Advanced routing algorithms
- Custom spatial queries
- Professional support

## Available Tools

All three providers support the same set of tools through a unified interface:

1. **search_nearby** - Search for nearby places based on location, with optional filtering by keywords, distance, rating, and operating hours
2. **get_place_details** - Get detailed information about a specific place including contact details, reviews, ratings, and operating hours
3. **maps_geocode** - Convert addresses or place names to geographic coordinates (latitude and longitude)
4. **maps_reverse_geocode** - Convert geographic coordinates to a human-readable address
5. **maps_distance_matrix** - Calculate travel distances and durations between multiple origins and destinations
6. **maps_directions** - Get detailed turn-by-turn navigation directions between two locations
7. **maps_elevation** - Get elevation data (height above sea level) for specific geographic locations

## Complete Setup Examples

### Example 1: Setting up with Google Maps

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable required APIs: Places API, Geocoding API, Directions API, Distance Matrix API, Elevation API
3. Start the server:
   ```bash
   mcp-map-server --port 3200 --apikey "AIzaSyB..."
   ```

### Example 2: Setting up with OpenStreetMap

1. No API key needed!
2. Simply start the server:
   ```bash
   mcp-map-server --port 3200 --provider osm
   ```

### Example 3: Setting up with RiskScape

1. Obtain API key from [RiskScape](https://riskscape.pro)
2. Start the server:
   ```bash
   mcp-map-server --port 3200 --provider riskscape --riskscape-key "rsk_..."
   ```

### Example 4: Using .env file (Recommended for Production)

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your preferred provider:
   ```env
   MAP_API_PROVIDER=osm  # or 'google' or 'riskscape'
   MCP_SERVER_PORT=3200
   # Add API keys if needed:
   # GOOGLE_MAPS_API_KEY=your_key_here
   # RISKSCAPE_API_KEY=your_key_here
   ```

3. Start the server:
   ```bash
   mcp-map-server
   ```

## Troubleshooting

### Common Issues and Solutions

#### Issue: "API Key not found" error
**Solution:** Ensure you've provided the API key either via command line or environment variable:
```bash
# For Google Maps
mcp-map-server --apikey "your_key"
# For RiskScape
mcp-map-server --provider riskscape --riskscape-key "your_key"
```

#### Issue: Port already in use
**Solution:** Use a different port:
```bash
mcp-map-server --port 3201
```

#### Issue: OpenStreetMap rate limiting
**Solution:** OpenStreetMap has fair use limits. If you hit them, consider:
- Reducing request frequency
- Using Google Maps or RiskScape for high-volume applications
- Implementing caching in your application

#### Issue: RiskScape v2 endpoints not working
**Solution:** Ensure your API key has access to v2 endpoints. The server automatically uses v2 endpoints for better performance and features.

## Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/LeonFNortje/mcp-map-server.git
cd mcp-map-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your preferred provider and API keys

# Build the project
npm run build

# Start the server
npm start

# Or run in development mode
npm run dev
```

### Project Structure

```
src/
├── cli.ts                    # Main CLI entry point
├── config.ts                 # Server configuration
├── index.ts                  # Package exports
├── core/
│   └── BaseMcpServer.ts     # Base MCP server with streamable HTTP
├── services/
│   ├── PlacesSearcher.ts    # Service layer with provider switching
│   ├── toolclass.ts         # Google Maps API client
│   ├── OpenStreetMapTools.ts # OpenStreetMap API client
│   └── RiskScapeTools.ts    # RiskScape API client
└── tools/
    └── maps/                # Map service tools
        ├── searchNearby.ts  # Search nearby places
        ├── placeDetails.ts  # Place details
        ├── geocode.ts       # Geocoding
        ├── reverseGeocode.ts # Reverse geocoding
        ├── distanceMatrix.ts # Distance matrix
        ├── directions.ts    # Directions
        └── elevation.ts     # Elevation data
```

## Tech Stack

- **TypeScript** - Type-safe development
- **Node.js** - Runtime environment
- **Google Maps Services JS** - Google Maps API integration
- **Model Context Protocol SDK** - MCP protocol implementation
- **Express.js** - HTTP server framework
- **Zod** - Schema validation

## Security Considerations

- API keys are handled server-side for security
- DNS rebinding protection available for production
- Input validation using Zod schemas
- Error handling and logging

## License

MIT

## Contributing

Community participation and contributions are welcome! Here's how you can contribute:

- ⭐️ Star the project if you find it helpful
- 🐛 Submit Issues: Report bugs or provide suggestions
- 🔧 Create Pull Requests: Submit code improvements
- 📖 Documentation: Help improve documentation

## Contact

If you have any questions or suggestions, feel free to reach out:

- 📧 Email: [lnortje@gmail.com](mailto:lnortje@gmail.com)
- 💻 GitHub: [LeonFNortje](https://github.com/LeonFNortje/)
- 🤝 Collaboration: Welcome to discuss project cooperation
- 📚 Technical Guidance: Sincere welcome for suggestions and guidance

## Changelog

### v0.2.0 (Latest) - Triple Provider Support
- **NEW:** Added RiskScape API as third provider option
- **NEW:** Implemented all RiskScape v2 endpoints for better performance
- **NEW:** Added `--riskscape-key` CLI option for RiskScape authentication
- **IMPROVED:** Enhanced README with comprehensive setup instructions for all providers
- **ADDED:** Provider comparison guide and troubleshooting section
- **ADDED:** Complete RiskScape API documentation in risk-api-uses.md
- **FEATURE:** Full triple provider support: Google Maps, OpenStreetMap, and RiskScape

### v0.1.0 - OpenStreetMap Integration
- **NEW:** Added OpenStreetMap as free alternative to Google Maps
- **NEW:** Implemented provider switching via `--provider` CLI option
- **CHANGED:** Updated default port from 3000 to 3200 to avoid conflicts
- **FIXED:** Translated all error messages from Chinese to English
- **ADDED:** Comprehensive API documentation in maps-api-uses.md
- **FEATURE:** No API key required when using OpenStreetMap provider
- **FIXED:** Resolved npm deprecation warnings for inflight and glob packages

### v0.0.5
- Added streamable HTTP transport support
- Improved CLI interface with emoji indicators
- Enhanced error handling and logging
- Added comprehensive tool descriptions for LLM integration
- Updated to latest MCP SDK version

### v0.0.4
- Initial release with basic Google Maps integration
- Support for location search, geocoding, and directions
- Compatible with MCP protocol

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cablate/mcp-google-map&type=Date)](https://www.star-history.com/#cablate/mcp-google-map&Date)
