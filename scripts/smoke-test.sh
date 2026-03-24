#!/bin/bash
set -e

# Mock smoke test script for Blue-Green deployment
# This script should check if the new environment is healthy before switching traffic.

URL=$1
echo "Running smoke tests against $URL..."

# Simulate health check
if curl -s --head --request GET "$URL" | grep "200 OK" > /dev/null; then
  echo "Smoke tests passed! Environment is healthy."
  exit 0
else
  echo "Smoke tests failed! Environment is not responding correctly."
  exit 1
fi
