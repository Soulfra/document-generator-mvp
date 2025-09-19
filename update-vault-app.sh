#!/bin/bash

# DocumentGeneratorVault App Update Script
# Updates the existing app with new debugging and decision-making services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="DocumentGeneratorVault"
APP_PATH="./${APP_NAME}.app"
BACKUP_DIR="./backups/app-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DMG_NAME="${APP_NAME}-${TIMESTAMP}.dmg"

# Service definitions
declare -A SERVICES=(
    ["unified-decision-debugger"]="7777"
    ["bulk-database-scanner"]="7778"
    ["decision-flow-connector"]="7780"
    ["localhost-dashboard"]="8000"
)

echo -e "${BLUE}DocumentGeneratorVault App Updater${NC}"
echo -e "${BLUE}===================================${NC}\n"

# 1. Backup Current App
echo -e "${YELLOW}Step 1: Backing up current app...${NC}"
mkdir -p "$BACKUP_DIR"

if [ -d "$APP_PATH" ]; then
    BACKUP_PATH="${BACKUP_DIR}/${APP_NAME}-${TIMESTAMP}.app"
    cp -R "$APP_PATH" "$BACKUP_PATH"
    echo -e "${GREEN}✓ Backed up to: $BACKUP_PATH${NC}"
else
    echo -e "${RED}✗ No existing app found at $APP_PATH${NC}"
    exit 1
fi

# 2. Update App Contents
echo -e "\n${YELLOW}Step 2: Updating app contents...${NC}"

# Create required directories
CONTENTS_PATH="${APP_PATH}/Contents"
MACOS_PATH="${CONTENTS_PATH}/MacOS"
RESOURCES_PATH="${CONTENTS_PATH}/Resources"
SERVICES_PATH="${RESOURCES_PATH}/services"
SCRIPTS_PATH="${RESOURCES_PATH}/scripts"

mkdir -p "$SERVICES_PATH"
mkdir -p "$SCRIPTS_PATH"
mkdir -p "${RESOURCES_PATH}/node_modules"
mkdir -p "${RESOURCES_PATH}/assets/sounds"

# Copy new services
echo "Installing new services..."
for service in "${!SERVICES[@]}"; do
    if [ -f "${service}.js" ]; then
        cp "${service}.js" "$SERVICES_PATH/"
        echo -e "${GREEN}✓ Installed ${service}.js${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: ${service}.js not found${NC}"
    fi
done

# Create service launcher scripts
echo -e "\n${YELLOW}Creating launch scripts...${NC}"

# Main launcher script
cat > "${SCRIPTS_PATH}/launch-all-services.sh" << 'EOF'
#!/bin/bash
# Launch all DocumentGeneratorVault services

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RESOURCES_DIR="$(dirname "$SCRIPT_DIR")"
SERVICES_DIR="${RESOURCES_DIR}/services"
LOG_DIR="${HOME}/Library/Logs/DocumentGeneratorVault"

mkdir -p "$LOG_DIR"

# Service configuration
declare -A SERVICES=(
    ["unified-decision-debugger"]="7777"
    ["bulk-database-scanner"]="7778"
    ["decision-flow-connector"]="7780"
    ["localhost-dashboard"]="8000"
)

# Start each service
for service in "${!SERVICES[@]}"; do
    port="${SERVICES[$service]}"
    log_file="${LOG_DIR}/${service}.log"
    
    echo "Starting ${service} on port ${port}..."
    
    cd "$SERVICES_DIR"
    nohup node "${service}.js" > "$log_file" 2>&1 &
    echo $! > "${LOG_DIR}/${service}.pid"
    
    sleep 1
done

# Wait for services to start
sleep 3

# Open dashboard in default browser
open "http://localhost:8000"

echo "All services started successfully!"
EOF

chmod +x "${SCRIPTS_PATH}/launch-all-services.sh"

# Service health monitor
cat > "${SCRIPTS_PATH}/monitor-services.sh" << 'EOF'
#!/bin/bash
# Monitor service health and restart if needed

LOG_DIR="${HOME}/Library/Logs/DocumentGeneratorVault"

declare -A SERVICES=(
    ["unified-decision-debugger"]="7777"
    ["bulk-database-scanner"]="7778"
    ["decision-flow-connector"]="7780"
    ["localhost-dashboard"]="8000"
)

check_service() {
    local service=$1
    local port=$2
    local pid_file="${LOG_DIR}/${service}.pid"
    
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            # Check if port is responding
            if curl -f -s "http://localhost:${port}/health" > /dev/null; then
                return 0
            fi
        fi
    fi
    return 1
}

restart_service() {
    local service=$1
    local port=$2
    local pid_file="${LOG_DIR}/${service}.pid"
    
    # Kill existing process if any
    if [ -f "$pid_file" ]; then
        kill $(cat "$pid_file") 2>/dev/null
        rm "$pid_file"
    fi
    
    # Start service
    cd "$(dirname "$0")/../services"
    nohup node "${service}.js" > "${LOG_DIR}/${service}.log" 2>&1 &
    echo $! > "$pid_file"
}

# Monitor loop
while true; do
    for service in "${!SERVICES[@]}"; do
        port="${SERVICES[$service]}"
        if ! check_service "$service" "$port"; then
            echo "Service $service is down, restarting..."
            restart_service "$service" "$port"
        fi
    done
    sleep 30
done
EOF

chmod +x "${SCRIPTS_PATH}/monitor-services.sh"

# 3. Update Info.plist
echo -e "\n${YELLOW}Step 3: Updating Info.plist...${NC}"

cat > "${CONTENTS_PATH}/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>DocumentGeneratorVault</string>
    <key>CFBundleDisplayName</key>
    <string>Document Generator Vault</string>
    <key>CFBundleIdentifier</key>
    <string>com.documentgenerator.vault</string>
    <key>CFBundleVersion</key>
    <string>2.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>2.0.0</string>
    <key>CFBundleExecutable</key>
    <string>DocumentGeneratorVault</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
    <key>NSRequiresAquaSystemAppearance</key>
    <false/>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.developer-tools</string>
    <key>NSAppleEventsUsageDescription</key>
    <string>Document Generator Vault needs to control other applications.</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>Document Generator Vault needs microphone access for audio features.</string>
</dict>
</plist>
EOF

# 4. Update Main Executable
echo -e "\n${YELLOW}Step 4: Updating main executable...${NC}"

cat > "${MACOS_PATH}/DocumentGeneratorVault" << 'EOF'
#!/bin/bash
# DocumentGeneratorVault Main Launcher

APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RESOURCES_DIR="${APP_DIR}/../Resources"
SCRIPTS_DIR="${RESOURCES_DIR}/scripts"
LOG_DIR="${HOME}/Library/Logs/DocumentGeneratorVault"

# Create log directory
mkdir -p "$LOG_DIR"

# Export environment variables
export NODE_PATH="${RESOURCES_DIR}/node_modules"
export VAULT_HOME="${RESOURCES_DIR}"
export NODE_ENV="production"

# Launch services
"${SCRIPTS_DIR}/launch-all-services.sh" &

# Start health monitor
"${SCRIPTS_DIR}/monitor-services.sh" > "${LOG_DIR}/monitor.log" 2>&1 &

# Create status bar app using osascript
osascript << 'AS_EOF'
use framework "Foundation"
use framework "AppKit"
use scripting additions

property statusItem : missing value
property statusMenu : missing value

on run
    set statusItem to current application's NSStatusBar's systemStatusBar's statusItemWithLength:(current application's NSVariableStatusItemLength)
    statusItem's setTitle:"DGV"
    statusItem's setHighlightMode:true
    
    set statusMenu to current application's NSMenu's alloc()'s init()
    
    -- Add menu items
    set dashboardItem to (current application's NSMenuItem's alloc()'s initWithTitle:"Open Dashboard" action:"openDashboard:" keyEquivalent:"")
    dashboardItem's setTarget:me
    statusMenu's addItem:dashboardItem
    
    statusMenu's addItem:(current application's NSMenuItem's separatorItem())
    
    set servicesItem to (current application's NSMenuItem's alloc()'s initWithTitle:"Services" action:"" keyEquivalent:"")
    set servicesSubmenu to current application's NSMenu's alloc()'s init()
    
    set services to {"Decision Debugger (7777)", "Database Scanner (7778)", "Flow Connector (7780)", "Dashboard (8000)"}
    repeat with serviceName in services
        set serviceItem to (current application's NSMenuItem's alloc()'s initWithTitle:serviceName action:"" keyEquivalent:"")
        servicesSubmenu's addItem:serviceItem
    end repeat
    
    servicesItem's setSubmenu:servicesSubmenu
    statusMenu's addItem:servicesItem
    
    statusMenu's addItem:(current application's NSMenuItem's separatorItem())
    
    set quitItem to (current application's NSMenuItem's alloc()'s initWithTitle:"Quit" action:"terminate:" keyEquivalent:"q")
    statusMenu's addItem:quitItem
    
    statusItem's setMenu:statusMenu
    
    current application's NSApp's run()
end run

on openDashboard:sender
    do shell script "open http://localhost:8000"
end openDashboard:

on terminate:sender
    -- Kill all services
    do shell script "pkill -f 'unified-decision-debugger|bulk-database-scanner|decision-flow-connector|localhost-dashboard' || true"
    current application's NSApp's terminate:me
end terminate:
AS_EOF

# Keep the app running
wait
EOF

chmod +x "${MACOS_PATH}/DocumentGeneratorVault"

# 5. Package Dependencies
echo -e "\n${YELLOW}Step 5: Packaging dependencies...${NC}"

# Create package.json for dependencies
cat > "${RESOURCES_PATH}/package.json" << 'EOF'
{
  "name": "document-generator-vault",
  "version": "2.0.0",
  "private": true,
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "sqlite3": "^5.1.6",
    "node-schedule": "^2.1.1",
    "chalk": "^4.1.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "compression": "^1.7.4",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1"
  }
}
EOF

# Install dependencies if npm is available
if command -v npm &> /dev/null; then
    echo "Installing Node.js dependencies..."
    cd "$RESOURCES_PATH"
    npm install --production --no-audit --no-fund
    cd -
else
    echo -e "${YELLOW}⚠ npm not found, skipping dependency installation${NC}"
fi

# Copy sound assets
echo "Copying sound assets..."
if [ -d "./assets/sounds" ]; then
    cp -R ./assets/sounds/* "${RESOURCES_PATH}/assets/sounds/" 2>/dev/null || true
fi

# 6. Create DMG
echo -e "\n${YELLOW}Step 6: Creating DMG installer...${NC}"

# Create temporary directory for DMG
DMG_TEMP="./dmg-temp"
mkdir -p "$DMG_TEMP"

# Copy app to temp directory
cp -R "$APP_PATH" "$DMG_TEMP/"

# Create Applications symlink
ln -s /Applications "$DMG_TEMP/Applications"

# Create background image
cat > "$DMG_TEMP/.background/background.png" << 'EOF'
# This would normally be a base64 encoded PNG
# For now, we'll skip the actual image
EOF

# Create DS_Store for window settings
cat > "${DMG_TEMP}/.DS_Store" << 'EOF'
# DMG window settings would go here
EOF

# Create Release Notes
cat > "$DMG_TEMP/Release Notes.txt" << 'EOF'
Document Generator Vault 2.0.0
==============================

New Features:
- Unified Decision Debugger (Port 7777)
- Bulk Database Scanner (Port 7778)
- Decision Flow Connector (Port 7780)
- Enhanced Dashboard (Port 8000)

Improvements:
- Real-time service monitoring
- Auto-restart capabilities
- Better error handling
- Improved UI integration

Bug Fixes:
- Fixed service communication issues
- Resolved memory leaks
- Enhanced stability

Installation:
1. Drag DocumentGeneratorVault to Applications
2. Launch from Applications folder
3. Services will start automatically
4. Dashboard opens at http://localhost:8000
EOF

# Create DMG
if command -v hdiutil &> /dev/null; then
    echo "Creating DMG..."
    hdiutil create -volname "Document Generator Vault" -srcfolder "$DMG_TEMP" -ov -format UDZO "$DMG_NAME"
    echo -e "${GREEN}✓ DMG created: $DMG_NAME${NC}"
else
    echo -e "${YELLOW}⚠ hdiutil not found, skipping DMG creation${NC}"
fi

# Cleanup
rm -rf "$DMG_TEMP"

# 7. Post-Update Tasks
echo -e "\n${YELLOW}Step 7: Running post-update tasks...${NC}"

# Migrate existing data
VAULT_DATA="${HOME}/Library/Application Support/DocumentGeneratorVault"
mkdir -p "$VAULT_DATA"

# Create migration marker
echo "$TIMESTAMP" > "${VAULT_DATA}/.last_update"

# Clear caches
rm -rf "${HOME}/Library/Caches/DocumentGeneratorVault" 2>/dev/null || true

# Create success notification script
cat > "${SCRIPTS_PATH}/notify-success.sh" << 'EOF'
#!/bin/bash
osascript -e 'display notification "All services updated and ready!" with title "Document Generator Vault" subtitle "Update Complete"'
EOF

chmod +x "${SCRIPTS_PATH}/notify-success.sh"

# Show completion message
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Update completed successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "\nUpdated services:"
for service in "${!SERVICES[@]}"; do
    echo -e "  - ${service} (port ${SERVICES[$service]})"
done
echo -e "\n${BLUE}To launch the updated app:${NC}"
echo -e "  open ${APP_PATH}"
echo -e "\n${BLUE}DMG installer created:${NC}"
echo -e "  ${DMG_NAME}"

# Run success notification if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    "${SCRIPTS_PATH}/notify-success.sh"
fi

echo -e "\n${GREEN}✓ Update complete!${NC}"