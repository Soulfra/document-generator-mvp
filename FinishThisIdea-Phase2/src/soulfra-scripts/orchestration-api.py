#!/usr/bin/env python3
"""
CREATE AI ORCHESTRATOR - Set up the structure for controlling everything from your phone
"""

import os
import shutil
from pathlib import Path

def create_orchestrator_structure():
    """Create the AI orchestrator directory structure"""
    
    base_dir = Path("ai_orchestrator")
    
    # Create directory structure
    directories = [
        "core",
        "integrations/claude_desktop",
        "integrations/chatgpt_desktop", 
        "integrations/google_drive",
        "integrations/cursor_ide",
        "integrations/claude_cli",
        "bridges",
        "utils"
    ]
    
    for dir_path in directories:
        (base_dir / dir_path).mkdir(parents=True, exist_ok=True)
        print(f" Created: {base_dir / dir_path}")
    
    # Copy existing files to appropriate locations
    file_mappings = {
        "CLAUDE_BRIDGE.py": "bridges/CLAUDE_BRIDGE.py",
        "CLAUDE_CODE_INTEGRATION.py": "integrations/claude_cli/CLAUDE_CODE_INTEGRATION.py",
        "DEPARTMENT_AUTOMATION.py": "utils/DEPARTMENT_ROUTER.py",
        "SOULFRA_MASTER_ORCHESTRATOR.py": "core/MASTER_ORCHESTRATOR.py",
        "AI_ECONOMY_GITHUB_AUTOMATION.py": "utils/GITHUB_AUTOMATION.py"
    }
    
    for src, dst in file_mappings.items():
        if os.path.exists(src):
            dst_path = base_dir / dst
            shutil.copy2(src, dst_path)
            print(f" Moved: {src} → {dst_path}")
    
    # Create README for the orchestrator
    readme_content = """# AI Orchestrator

Control all your desktop AI tools from your phone!

## Structure:
- **core/** - Main orchestration logic
- **integrations/** - Desktop app connectors
- **bridges/** - Communication bridges
- **utils/** - Helper utilities

## Quick Start:
1. Run `python START_AI_ORCHESTRATOR.py`
2. Open phone browser to shown URL
3. Control everything remotely!

## Features:
-  Control Claude Desktop
-  Control ChatGPT Desktop  
-  Access Google Drive
-  Run Cursor commands
-  Execute Claude CLI
-  All from your phone!
"""
    
    with open(base_dir / "README.md", "w") as f:
        f.write(readme_content)
    
    print("\n AI Orchestrator structure created!")
    print(f" Location: {base_dir.absolute()}")
    
    return base_dir

if __name__ == "__main__":
    create_orchestrator_structure()