#!/usr/bin/env python3
"""
CONSOLIDATE USING AI ECONOMY
Actually use our AI Economy system to fix this mess
"""

import json
import urllib.request
import urllib.error
from datetime import datetime

# Our AI Economy system
AI_ECONOMY_URL = "http://localhost:9090"

def make_request(endpoint, data=None):
    """Make request to AI Economy system"""
    url = f"{AI_ECONOMY_URL}{endpoint}"
    
    if data:
        data = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    else:
        req = urllib.request.Request(url)
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.URLError as e:
        print(f"Error: {e}")
        return None

print("USING AI ECONOMY TO CONSOLIDATE OUR MESS")
print("="*60)

# Step 1: Register our consolidation agent
print("\n1. Registering consolidation agent...")
agent_data = {
    "agent_name": "Soulfra Consolidator",
    "agent_type": "claude",
    "specialization": "architecture"
}

agent_response = make_request("/api/register-agent", agent_data)
if agent_response:
    agent_id = agent_response.get('agent_id')
    print(f" Agent registered: {agent_id}")
else:
    print(" Failed to register agent - is AI Economy running on port 9090?")
    print("\nTo start it: python3 AI_ECONOMY_GITHUB_AUTOMATION.py")
    agent_id = "manual-consolidator"

# Step 2: Create consolidation proposal
print("\n2. Creating consolidation proposal...")

# List all the duplicate files we found
duplicate_patterns = [
    "SIMPLE_GAME*.py",
    "WORKING_*.py", 
    "FIXED_*.py",
    "ULTIMATE_*.py",
    "ACTUAL_*.py",
    "SOULFRA_*.py"
]

proposal_data = {
    "agent_id": agent_id,
    "proposal_type": "architecture_improvement",
    "target_files": [
        "*.py"  # All Python files in directory
    ],
    "description": "Consolidate 162 duplicate Python files into modular architecture",
    "implementation_plan": [
        "1. Analyze all 162 Python files to identify unique functionality",
        "2. Create modular directory structure: games/, platform/, core/",
        "3. Extract common game logic into reusable modules",
        "4. Create single SOULFRA_MAIN.py entry point",
        "5. Move duplicate functionality to appropriate modules",
        "6. Delete all redundant files (keeping backups)",
        "7. Update imports to use new modular structure",
        "8. Create proper __init__.py files for packages",
        "9. Document the new architecture",
        "10. Set up proper version control using this AI Economy system"
    ]
}

proposal_response = make_request("/api/create-proposal", proposal_data)
if proposal_response:
    proposal_id = proposal_response.get('proposal_id')
    bounty = proposal_response.get('bounty_amount', 0)
    print(f" Proposal created: {proposal_id}")
    print(f" Bounty: ${bounty}")
else:
    proposal_id = None
    print(" Failed to create proposal")

# Step 3: Show what the new structure should look like
print("\n3. Proposed new structure:")
print("="*60)

new_structure = """
soulfra/
 SOULFRA_MAIN.py              # Single entry point
 README.md                    # Clear documentation
 requirements.txt             # Dependencies

 core/                        # Core system files
    __init__.py
    chat_processor.py        # From CHAT_PROCESSOR.py
    ai_economy.py           # From AI_ECONOMY_GITHUB_AUTOMATION.py
    intelligence_engine.py   # From various intelligence files

 games/                       # All game modules
    __init__.py
    simple_click.py         # Consolidated from all SIMPLE_GAME*.py
    habbo_world.py          # Consolidated from all HABBO*.py
    battle_arena.py         # Consolidated from all ARENA*.py
    game_launcher.py        # Game management

 platform/                    # Platform features
    __init__.py
    enterprise.py           # Enterprise licensing
    white_label.py          # White label system
    analytics.py            # Analytics dashboard

 api/                        # API endpoints
    __init__.py
    routes.py               # All API routes

 data/                       # Data storage
     ai_economy.db           # AI Economy database
     chat_logs/              # Chat processor logs
     game_sessions.db        # Game session data
"""

print(new_structure)

# Step 4: Create the actual GitHub PR
if proposal_id:
    print("\n4. Creating GitHub PR...")
    pr_data = {"proposal_id": proposal_id}
    pr_response = make_request("/api/create-pr", pr_data)
    
    if pr_response:
        pr_url = pr_response.get('pr_url')
        print(f" PR created: {pr_url}")
    else:
        print(" Failed to create PR")

# Step 5: Show current mess vs proposed solution
print("\n5. Current mess vs proposed solution:")
print("="*60)
print("CURRENT MESS:")
print("- 162 Python files")
print("- 38 running servers")
print("- No clear structure")
print("- Duplicate code everywhere")
print("- Files like: SIMPLE_GAME_FIXED_WORKING_ULTIMATE_v2.py")

print("\nPROPOSED SOLUTION:")
print("- ~10 well-organized files")
print("- 1 main server")
print("- Clear modular structure")
print("- No duplication")
print("- Proper version control through AI Economy")

# Step 6: Next steps
print("\n6. NEXT STEPS:")
print("="*60)
print("1. Check AI Economy dashboard: http://localhost:9090")
print("2. Review the generated PR")
print("3. Let AI agents review and approve")
print("4. Auto-merge when consensus reached")
print("5. Stop creating new files!")
print("\nUSE THE SYSTEM WE BUILT!")
print("="*60)

# Save consolidation script
consolidation_script = """#!/bin/bash
# Auto-generated consolidation script

echo "Starting Soulfra consolidation..."

# Create directory structure
mkdir -p core games platform api data/chat_logs

# Move core files
mv CHAT_PROCESSOR.py core/chat_processor.py 2>/dev/null
mv AI_ECONOMY_GITHUB_AUTOMATION.py core/ai_economy.py 2>/dev/null

# Consolidate game files
echo "Consolidating game files..."
# This would be done by the AI Economy PR

# Start the consolidated server
echo "Starting consolidated server..."
python3 SOULFRA_MAIN.py
"""

with open("consolidate.sh", "w") as f:
    f.write(consolidation_script)

print("\nGenerated consolidate.sh script")
print("Run it after the PR is merged!")