#!/bin/bash

# Initialize session
SESSION_ID=$(curl -s -X POST http://localhost:3200/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "1.0",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0"
      }
    },
    "id": 1
  }' | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)

echo "Session ID: $SESSION_ID"

# Test geocoding
curl -s -X POST http://localhost:3200/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "maps_geocode",
      "arguments": {
        "address": "Times Square, New York"
      }
    },
    "id": 2
  }' | jq .
