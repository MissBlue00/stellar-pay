#!/bin/bash

# Stellar Pay Development Helper Script
# Use this to cleanly start/restart the dev server

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

show_usage() {
  cat << EOF
Stellar Pay Dev Helper

Usage: ./dev-helper.sh [command]

Commands:
  start       - Clean and start dev server (default)
  clean       - Clean lock files and build artifacts only
  kill        - Kill all dev processes
  status      - Show running processes and ports
  reset       - Full clean install (removes node_modules)

Examples:
  ./dev-helper.sh start
  ./dev-helper.sh clean && pnpm run dev
  ./dev-helper.sh kill
  ./dev-helper.sh reset

EOF
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

kill_processes() {
  log_info "Killing dev processes..."
  pkill -f "next dev" || true
  pkill -f "turbo run dev" || true
  pkill -f "nest start" || true
  sleep 2
  log_success "Processes terminated"
}

clean_artifacts() {
  cd "$PROJECT_ROOT"
  
  log_info "Cleaning lock files and build artifacts..."
  
  # Remove Next.js .next directories
  rm -rf apps/frontend/.next
  rm -rf apps/admin-dashboard/.next
  
  # Remove all dist directories
  find . -type d -name "dist" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
  
  # Remove API build directory if exists
  rm -rf apps/api/dist
  
  log_success "Build artifacts cleaned"
}

show_status() {
  log_info "Running processes:"
  ps aux | grep -E "turbo|next|nest" | grep -v grep || log_info "No dev processes running"
  
  echo ""
  log_info "Listening ports:"
  lsof -i :3000 -i :3001 -i :3002 -i :3003 2>/dev/null | grep LISTEN || log_info "No services running on dev ports"
}

start_dev() {
  kill_processes
  clean_artifacts
  
  log_info "Ensuring dependencies are installed..."
  cd "$PROJECT_ROOT"
  pnpm install --frozen-lockfile 2>&1 | tail -3
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log_success "Services starting..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📱 Frontend:        http://localhost:3000"
  echo "🎛️  Admin Dashboard: http://localhost:3001 (or next available)"
  echo "🔌 API:             http://localhost:3000/api"
  echo ""
  echo "Press Ctrl+C to stop"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  cd "$PROJECT_ROOT"
  pnpm run dev
}

reset_install() {
  kill_processes
  clean_artifacts
  
  log_info "Removing node_modules (this may take a moment)..."
  find "$PROJECT_ROOT" -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
  
  log_info "Reinstalling dependencies..."
  cd "$PROJECT_ROOT"
  pnpm install
  
  log_success "Dependencies reinstalled"
  start_dev
}

# Main script logic
COMMAND="${1:-start}"

case "$COMMAND" in
  start)
    start_dev
    ;;
  clean)
    kill_processes
    clean_artifacts
    log_success "Ready to start dev server with: pnpm run dev"
    ;;
  kill)
    kill_processes
    show_status
    ;;
  status)
    show_status
    ;;
  reset)
    reset_install
    ;;
  help)
    show_usage
    ;;
  *)
    log_error "Unknown command: $COMMAND"
    echo ""
    show_usage
    exit 1
    ;;
esac
