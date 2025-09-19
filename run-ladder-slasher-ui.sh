#!/bin/bash

# 🎮⚔️ LADDER SLASHER UI LAUNCHER
# Launches the enhanced ladder slasher with game view

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
cat << "EOF"
⚔️🎮 LADDER SLASHER UI LAUNCHER 🎮⚔️
====================================

🎯 Choose your slashing adventure:

1. 🎮 Enhanced Game View - Full game interface with levels, XP, and browser simulation
2. 💻 Simple Live UI - Clean overlay window for real-time scraping
3. 🌐 Open D2JSP Website - Go directly to the target

EOF
echo -e "${NC}"

# Function to check dependencies
check_deps() {
    echo -e "${BLUE}[INFO]${NC} Checking dependencies..."
    
    if ! command -v python3 >/dev/null 2>&1; then
        echo -e "${RED}[ERROR]${NC} Python 3 is required"
        exit 1
    fi
    
    # Check for tkinter
    if ! python3 -c "import tkinter" 2>/dev/null; then
        echo -e "${RED}[ERROR]${NC} tkinter is required for the UI"
        echo "Install with: sudo apt-get install python3-tk (Ubuntu/Debian)"
        echo "Or: brew install python-tk (macOS with Homebrew)"
        exit 1
    fi
    
    # Install missing packages
    python3 -c "
import sys
missing = []
try: import requests
except: missing.append('requests')
try: import beautifulsoup4
except: 
    try: import bs4
    except: missing.append('beautifulsoup4')

if missing:
    import subprocess
    print('Installing missing packages:', missing)
    subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing)
" 2>/dev/null || echo -e "${YELLOW}[WARNING]${NC} Some packages may need manual installation"
    
    echo -e "${GREEN}[OK]${NC} Dependencies ready"
}

# Launch enhanced game view
launch_enhanced() {
    echo -e "${GREEN}[LAUNCHER]${NC} Starting Enhanced Ladder Slasher..."
    echo -e "${CYAN}🎮 Features:${NC}"
    echo "  • Game-like interface with levels and XP"
    echo "  • Real-time website simulation"
    echo "  • Health/Mana bars and scoring system"
    echo "  • Live scraping with visual feedback"
    echo ""
    echo -e "${YELLOW}⚔️ Launching your slashing adventure...${NC}"
    python3 enhanced-ladder-slasher-with-game-view.py
}

# Launch simple UI
launch_simple() {
    echo -e "${GREEN}[LAUNCHER]${NC} Starting Simple Live UI..."
    echo -e "${CYAN}💻 Features:${NC}"
    echo "  • Clean overlay window (always on top)"
    echo "  • Real-time scraping statistics"
    echo "  • Live data feed"
    echo "  • Browser integration"
    echo ""
    echo -e "${YELLOW}⚔️ Launching simple slasher...${NC}"
    python3 live-ladder-slasher-ui.py
}

# Open website
open_website() {
    echo -e "${GREEN}[LAUNCHER]${NC} Opening D2JSP website..."
    
    if command -v open >/dev/null 2>&1; then
        open "https://forums.d2jsp.org/"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "https://forums.d2jsp.org/"
    elif command -v firefox >/dev/null 2>&1; then
        firefox "https://forums.d2jsp.org/" &
    elif command -v chrome >/dev/null 2>&1; then
        chrome "https://forums.d2jsp.org/" &
    else
        echo -e "${YELLOW}[INFO]${NC} Please open https://forums.d2jsp.org/ manually"
    fi
    
    echo -e "${GREEN}✅${NC} D2JSP website should be opening..."
    echo -e "${CYAN}💡 TIP:${NC} Run one of the slasher UIs alongside to see scraping in action!"
}

# Show help
show_help() {
    cat << EOF
⚔️ Ladder Slasher UI Launcher

Usage: $0 [option]

Options:
  1, enhanced    Launch enhanced game view
  2, simple      Launch simple live UI  
  3, website     Open D2JSP website
  help           Show this help

Interactive mode:
  $0             Show menu and choose

Examples:
  $0 enhanced    # Launch game view directly
  $0 simple      # Launch simple UI directly
  $0 website     # Open website directly

The enhanced view provides a full game experience with:
• Character progression (level, XP, gold)
• Health and mana bars
• Real-time website content simulation
• Game-like scoring and achievements

The simple view provides a clean overlay with:
• Always-on-top window
• Real-time scraping stats
• Live data feed
• Minimal resource usage

🎯 Pro tip: Launch a UI first, then open the website to see 
the scraping happening in real-time!
EOF
}

# Main menu
show_menu() {
    echo -e "${CYAN}Choose your option:${NC}"
    echo "1) 🎮 Enhanced Game View"
    echo "2) 💻 Simple Live UI"
    echo "3) 🌐 Open D2JSP Website"
    echo "4) ❓ Help"
    echo "5) ❌ Exit"
    echo ""
    echo -n "Enter your choice (1-5): "
}

# Main execution
main() {
    check_deps
    
    case "${1:-}" in
        1|enhanced)
            launch_enhanced
            ;;
        2|simple)  
            launch_simple
            ;;
        3|website)
            open_website
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            # Interactive mode
            while true; do
                show_menu
                read -r choice
                
                case $choice in
                    1)
                        launch_enhanced
                        break
                        ;;
                    2)
                        launch_simple
                        break
                        ;;
                    3)
                        open_website
                        ;;
                    4)
                        show_help
                        ;;
                    5)
                        echo -e "${GREEN}⚔️ Happy slashing!${NC}"
                        exit 0
                        ;;
                    *)
                        echo -e "${RED}Invalid choice. Please enter 1-5.${NC}"
                        ;;
                esac
                echo ""
            done
            ;;
    esac
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}Slashing interrupted. Goodbye!${NC}"; exit 0' INT

main "$@"