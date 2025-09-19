#!/bin/bash

# 🛡️ Claude CLI Safe Wrapper
# ==========================
# Runs Claude CLI with automatic WASM error detection and recovery

echo "🛡️ Starting Claude CLI with WASM error protection..."
echo "====================================================="

# Function to detect WASM errors in log output
detect_wasm_error() {
    local output="$1"
    if echo "$output" | grep -qE "(RuntimeError: Aborted|wasm-function|insertChild.*wasm|Build with -sASSERTIONS)"; then
        return 0  # WASM error detected
    fi
    return 1  # No WASM error
}

# Function to run recovery
run_recovery() {
    echo ""
    echo "🔧 WASM ERROR DETECTED! Running automatic recovery..."
    echo "===================================================="
    
    # Run our recovery script
    ./claude-resume.sh
    
    echo ""
    echo "💡 Recovery complete. You can now restart Claude CLI safely."
    echo "🔄 Use: claude  (or run this script again for protection)"
    return 0
}

# Main execution loop
attempt=1
max_attempts=3

while [ $attempt -le $max_attempts ]; do
    echo "🚀 Attempt #$attempt - Starting Claude CLI..."
    echo "💾 Working Directory: $(pwd)"
    echo "🕐 Start Time: $(date)"
    echo ""
    
    # Run Claude CLI and capture both stdout and stderr
    if command -v claude >/dev/null 2>&1; then
        # Create a temporary file for output
        temp_output=$(mktemp)
        
        # Run Claude CLI with output redirection
        claude "$@" 2>&1 | tee "$temp_output"
        exit_code=$?
        
        # Check the output for WASM errors
        if detect_wasm_error "$(cat "$temp_output")"; then
            echo ""
            echo "❌ WASM error detected in Claude CLI output!"
            
            # Clean up temp file
            rm -f "$temp_output"
            
            # Run recovery
            run_recovery
            
            # Ask if user wants to retry
            if [ $attempt -lt $max_attempts ]; then
                echo ""
                read -p "🔄 Attempt recovery and restart? (y/n): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    attempt=$((attempt + 1))
                    echo ""
                    echo "🔄 Retrying with fresh environment..."
                    continue
                else
                    echo "🛑 User chose not to retry. Exiting."
                    break
                fi
            else
                echo "❌ Maximum attempts reached. Please run recovery manually: ./claude-resume.sh"
                break
            fi
        else
            # Clean up temp file
            rm -f "$temp_output"
            
            # Check exit code
            if [ $exit_code -eq 0 ]; then
                echo "✅ Claude CLI completed successfully!"
                break
            else
                echo "⚠️  Claude CLI exited with code: $exit_code"
                
                if [ $attempt -lt $max_attempts ]; then
                    echo ""
                    read -p "🔄 Retry? (y/n): " -n 1 -r
                    echo
                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        attempt=$((attempt + 1))
                        continue
                    else
                        break
                    fi
                else
                    echo "❌ Maximum attempts reached."
                    break
                fi
            fi
        fi
    else
        echo "❌ Claude CLI not found! Please install it first:"
        echo "   npm install -g @anthropic-ai/claude-code"
        exit 1
    fi
done

echo ""
echo "🏁 Claude CLI Safe Wrapper finished."
echo "📊 Total attempts: $attempt"
echo "🕐 End Time: $(date)"

# Check if recovery info exists
if [ -f "claude-recovery-info.md" ]; then
    echo "📄 Recovery information available in: claude-recovery-info.md"
fi

echo ""
echo "💡 Tips for avoiding WASM errors:"
echo "   • Use smaller projects/files when possible"
echo "   • Clear browser cache regularly if using web interface"
echo "   • Close other resource-intensive applications"
echo "   • Consider using claude-resume.sh for manual recovery"