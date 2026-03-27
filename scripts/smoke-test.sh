#!/bin/bash
set -e

# Mock smoke test script for Blue-Green deployment
# This script should check if the new environment is healthy before switching traffic.

URL=$1
echo "Running smoke tests against $URL..."

# Retry parameters
MAX_RETRIES=5
RETRY_COUNT=0
SLEEP_INTERVAL=5

until [ $RETRY_COUNT -ge $MAX_RETRIES ]
do
  echo "Attempt $((RETRY_COUNT+1)) of $MAX_RETRIES..."
  if curl -s --head --request GET "$URL" | grep "200" > /dev/null; then
    echo "Smoke tests passed! Environment is healthy."
    exit 0
  fi
  
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "Smoke test failed. Retrying in ${SLEEP_INTERVAL}s..."
    sleep $SLEEP_INTERVAL
  fi
done

echo "Smoke tests failed after $MAX_RETRIES attempts! Environment is not responding correctly."
exit 1
