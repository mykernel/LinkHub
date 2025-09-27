#!/bin/bash

# Ops Dashboard Management Script
# Used to start, stop, restart frontend and backend services

# Configuration
FRONTEND_PORT=5173
BACKEND_PORT=3001
PID_DIR="/tmp/ops-dashboard"
FRONTEND_PID="$PID_DIR/frontend.pid"
BACKEND_PID="$PID_DIR/backend.pid"
LOG_DIR="$PID_DIR/logs"

# Create necessary directories
mkdir -p "$PID_DIR" "$LOG_DIR"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if port is occupied
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port occupied
    else
        return 1  # Port free
    fi
}

# Check if process is running
check_process() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            return 0  # Process running
        else
            rm -f "$pid_file"  # Clean invalid PID file
            return 1  # Process not running
        fi
    else
        return 1  # PID file does not exist
    fi
}

# Get service status
get_status() {
    local service=$1
    local port=$2
    local pid_file=$3

    local process_running=false
    local port_occupied=false

    if check_process "$pid_file"; then
        process_running=true
    fi

    if check_port "$port"; then
        port_occupied=true
    fi

    if $process_running && $port_occupied; then
        echo "Running"
    elif $port_occupied; then
        echo "Port occupied (unknown process)"
    elif $process_running; then
        echo "Process exists but port not listening"
    else
        echo "Stopped"
    fi
}

# Status check
status() {
    log_info "Checking service status..."
    echo

    local frontend_status=$(get_status "Frontend" $FRONTEND_PORT "$FRONTEND_PID")
    local backend_status=$(get_status "Backend" $BACKEND_PORT "$BACKEND_PID")

    printf "%-10s %-8s %-30s %s\n" "Service" "Port" "Status" "PID"
    echo "--------------------------------------------------------"

    # Frontend status
    local frontend_pid=""
    if check_process "$FRONTEND_PID"; then
        frontend_pid=$(cat "$FRONTEND_PID")
    fi
    printf "%-10s %-8s %-30s %s\n" "Frontend" "$FRONTEND_PORT" "$frontend_status" "$frontend_pid"

    # Backend status
    local backend_pid=""
    if check_process "$BACKEND_PID"; then
        backend_pid=$(cat "$BACKEND_PID")
    fi
    printf "%-10s %-8s %-30s %s\n" "Backend" "$BACKEND_PORT" "$backend_status" "$backend_pid"

    echo
}

# Start frontend
start_frontend() {
    log_info "Starting frontend service..."

    if check_process "$FRONTEND_PID"; then
        log_warning "Frontend service is already running (PID: $(cat $FRONTEND_PID))"
        return 0
    fi

    if check_port $FRONTEND_PORT; then
        log_error "Port $FRONTEND_PORT is already occupied"
        return 1
    fi

    # Start frontend
    cd /root/ops-dashboard
    nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    local pid=$!
    echo $pid > "$FRONTEND_PID"

    # Wait for startup and verify
    log_info "Waiting for frontend to start..."
    for i in {1..10}; do
        sleep 2
        if check_port $FRONTEND_PORT; then
            log_success "Frontend service started successfully (PID: $pid, Port: $FRONTEND_PORT)"
            return 0
        fi
        echo -n "."
    done

    log_error "Frontend startup failed, check logs: $LOG_DIR/frontend.log"
    rm -f "$FRONTEND_PID"
    return 1
}

# Start backend
start_backend() {
    log_info "Starting backend service..."

    if check_process "$BACKEND_PID"; then
        log_warning "Backend service is already running (PID: $(cat $BACKEND_PID))"
        return 0
    fi

    if check_port $BACKEND_PORT; then
        log_error "Port $BACKEND_PORT is already occupied"
        return 1
    fi

    # Start backend
    cd /root/ops-dashboard/server
    # Set JWT_SECRET for security (required after security fix)
    export JWT_SECRET="ops-dashboard-super-secure-jwt-secret-key-for-production-use-2024"
    nohup npm start > "$LOG_DIR/backend.log" 2>&1 &
    local pid=$!
    echo $pid > "$BACKEND_PID"

    # Wait for startup and verify
    log_info "Waiting for backend to start..."
    for i in {1..10}; do
        sleep 2
        if check_port $BACKEND_PORT; then
            log_success "Backend service started successfully (PID: $pid, Port: $BACKEND_PORT)"
            return 0
        fi
        echo -n "."
    done

    log_error "Backend startup failed, check logs: $LOG_DIR/backend.log"
    rm -f "$BACKEND_PID"
    return 1
}

# Stop service
stop_service() {
    local service_name=$1
    local pid_file=$2
    local port=$3

    log_info "Stopping $service_name service..."

    if check_process "$pid_file"; then
        local pid=$(cat "$pid_file")
        log_info "Stopping process $pid..."

        # Graceful stop
        kill "$pid" 2>/dev/null

        # Wait for process to exit
        for i in {1..10}; do
            if ! kill -0 "$pid" 2>/dev/null; then
                break
            fi
            sleep 1
            echo -n "."
        done

        # Force stop
        if kill -0 "$pid" 2>/dev/null; then
            log_warning "Graceful stop failed, force killing process..."
            kill -9 "$pid" 2>/dev/null
            sleep 2
        fi

        rm -f "$pid_file"
    fi

    # Check if port is released
    if check_port "$port"; then
        log_warning "Port $port is still occupied, trying to kill process..."
        local port_pid=$(lsof -ti :$port)
        if [ -n "$port_pid" ]; then
            kill -9 $port_pid 2>/dev/null
            sleep 2
        fi
    fi

    # Double verification
    if ! check_port "$port" && ! check_process "$pid_file"; then
        log_success "$service_name service stopped"
        return 0
    else
        log_error "$service_name service stop failed"
        return 1
    fi
}

# Start all services
start() {
    log_info "Starting Ops Dashboard..."
    echo

    local success=true

    # Start backend
    if ! start_backend; then
        success=false
    fi

    # Start frontend
    if ! start_frontend; then
        success=false
    fi

    echo
    if $success; then
        log_success "All services started successfully!"
        echo
        log_info "Access URLs:"
        echo "  Frontend: http://localhost:$FRONTEND_PORT"
        echo "  Backend:  http://localhost:$BACKEND_PORT"
    else
        log_error "Some services failed to start, check logs"
    fi

    echo
    status
}

# Stop all services
stop() {
    log_info "Stopping Ops Dashboard..."
    echo

    local success=true

    # Stop frontend
    if ! stop_service "Frontend" "$FRONTEND_PID" $FRONTEND_PORT; then
        success=false
    fi

    # Stop backend
    if ! stop_service "Backend" "$BACKEND_PID" $BACKEND_PORT; then
        success=false
    fi

    echo
    if $success; then
        log_success "All services stopped"
    else
        log_error "Some services failed to stop"
    fi

    echo
    status
}

# Restart all services
restart() {
    log_info "Restarting Ops Dashboard..."
    echo

    stop
    sleep 3
    start
}

# View logs
logs() {
    local service=$1
    case $service in
        "frontend"|"Frontend")
            if [ -f "$LOG_DIR/frontend.log" ]; then
                log_info "Frontend logs (last 50 lines):"
                tail -n 50 "$LOG_DIR/frontend.log"
            else
                log_warning "Frontend log file does not exist"
            fi
            ;;
        "backend"|"Backend")
            if [ -f "$LOG_DIR/backend.log" ]; then
                log_info "Backend logs (last 50 lines):"
                tail -n 50 "$LOG_DIR/backend.log"
            else
                log_warning "Backend log file does not exist"
            fi
            ;;
        *)
            log_info "All log files:"
            ls -la "$LOG_DIR/" 2>/dev/null || echo "No log files found"
            echo
            if [ -f "$LOG_DIR/frontend.log" ]; then
                log_info "Frontend logs (last 20 lines):"
                tail -n 20 "$LOG_DIR/frontend.log"
                echo
            fi
            if [ -f "$LOG_DIR/backend.log" ]; then
                log_info "Backend logs (last 20 lines):"
                tail -n 20 "$LOG_DIR/backend.log"
            fi
            ;;
    esac
}

# Show help
help() {
    echo "Ops Dashboard Management Script"
    echo
    echo "Usage: $0 {start|stop|restart|status|logs}"
    echo
    echo "Commands:"
    echo "  start           Start frontend and backend services"
    echo "  stop            Stop frontend and backend services"
    echo "  restart         Restart frontend and backend services"
    echo "  status          Check service status"
    echo "  logs [service]  View logs (frontend/backend/all)"
    echo "  help            Show this help message"
    echo
    echo "Examples:"
    echo "  $0 start        # Start all services"
    echo "  $0 logs         # View all logs"
    echo "  $0 logs backend # View backend logs"
}

# Main logic
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs "$2"
        ;;
    help|--help|-h)
        help
        ;;
    *)
        if [ -z "$1" ]; then
            log_error "No command provided"
        else
            log_error "Unknown command: $1"
        fi
        echo
        help
        exit 1
        ;;
esac