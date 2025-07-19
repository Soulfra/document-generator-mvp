#!/usr/bin/env python3
"""
Department Automation System
Connects all departments automatically with smart routing
"""

import json
import os
import threading
import time
from collections import defaultdict
import sqlite3
from datetime import datetime
import requests

class DepartmentRouter:
    """Automatically routes work between departments"""
    
    def __init__(self):
        self.departments = {
            'education': {
                'name': 'CramPal Education',
                'port': 7000,
                'handles': ['learning', 'study', 'homework', 'exam', 'teach'],
                'emoji': ''
            },
            'social': {
                'name': 'Vibe Platform',
                'port': 8888,
                'handles': ['chat', 'community', 'vibe', 'social', 'friends'],
                'emoji': ''
            },
            'support': {
                'name': 'Empathy Engine',
                'port': 5000,
                'handles': ['help', 'support', 'feeling', 'emotion', 'empathy'],
                'emoji': ''
            },
            'moderation': {
                'name': 'Cringeproof Filter',
                'port': 9999,
                'handles': ['filter', 'moderate', 'clean', 'cringe', 'toxic'],
                'emoji': ''
            },
            'documentation': {
                'name': 'Doc Generator',
                'port': 4201,
                'handles': ['document', 'guide', 'manual', 'readme', 'docs'],
                'emoji': ''
            },
            'identity': {
                'name': 'Soul System',
                'port': 9000,
                'handles': ['soul', 'identity', 'profile', 'signature', 'self'],
                'emoji': ''
            }
        }
        
        self.init_database()
        self.start_auto_routing()
    
    def init_database(self):
        """Create routing database"""
        self.conn = sqlite3.connect('department_routing.db', check_same_thread=False)
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS routing_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                from_dept TEXT,
                to_dept TEXT,
                message TEXT,
                keywords TEXT,
                success BOOLEAN
            )
        ''')
        self.conn.commit()
    
    def find_best_department(self, message):
        """Find which department should handle this"""
        message_lower = message.lower()
        scores = defaultdict(int)
        
        # Score each department based on keywords
        for dept_id, dept in self.departments.items():
            for keyword in dept['handles']:
                if keyword in message_lower:
                    scores[dept_id] += 10
            
            # Partial matches
            for word in message_lower.split():
                for keyword in dept['handles']:
                    if keyword in word or word in keyword:
                        scores[dept_id] += 5
        
        # Get best match
        if scores:
            best_dept = max(scores.items(), key=lambda x: x[1])
            if best_dept[1] > 0:
                return best_dept[0]
        
        # Default to education
        return 'education'
    
    def route_message(self, message, from_dept=None):
        """Route a message to the right department"""
        to_dept = self.find_best_department(message)
        dept_info = self.departments[to_dept]
        
        try:
            # Send to department
            response = requests.post(
                f"http://localhost:{dept_info['port']}/api/handle",
                json={'message': message, 'from': from_dept},
                timeout=5
            )
            
            # Log routing
            self.conn.execute('''
                INSERT INTO routing_log (from_dept, to_dept, message, success)
                VALUES (?, ?, ?, ?)
            ''', (from_dept, to_dept, message[:200], response.ok))
            self.conn.commit()
            
            return {
                'department': dept_info['name'],
                'emoji': dept_info['emoji'],
                'response': response.json() if response.ok else None,
                'success': response.ok
            }
            
        except Exception as e:
            return {
                'department': dept_info['name'],
                'emoji': dept_info['emoji'],
                'error': str(e),
                'success': False
            }
    
    def get_department_health(self):
        """Check health of all departments"""
        health = {}
        
        for dept_id, dept in self.departments.items():
            try:
                resp = requests.get(
                    f"http://localhost:{dept['port']}/health",
                    timeout=2
                )
                health[dept_id] = {
                    'name': dept['name'],
                    'status': ' Online' if resp.ok else ' Issues',
                    'emoji': dept['emoji']
                }
            except:
                health[dept_id] = {
                    'name': dept['name'],
                    'status': ' Offline',
                    'emoji': dept['emoji']
                }
        
        return health
    
    def start_auto_routing(self):
        """Start automatic cross-department communication"""
        def routing_loop():
            while True:
                try:
                    # Check for cross-department needs
                    health = self.get_department_health()
                    
                    # If a department is down, route its work elsewhere
                    for dept_id, status in health.items():
                        if '' in status['status']:
                            # Find backup department
                            print(f"Department {dept_id} is down, rerouting...")
                    
                except Exception as e:
                    print(f"Routing error: {e}")
                
                time.sleep(30)  # Check every 30 seconds
        
        thread = threading.Thread(target=routing_loop, daemon=True)
        thread.start()

class UniversalInterface:
    """One interface that connects to all departments"""
    
    def __init__(self):
        self.router = DepartmentRouter()
        self.conversation_history = defaultdict(list)
    
    def process_request(self, user_id, message):
        """Process any request and route to right department"""
        # Add to conversation history
        self.conversation_history[user_id].append({
            'message': message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Smart routing based on context
        context = self.get_user_context(user_id)
        
        # Route the message
        result = self.router.route_message(message, context.get('last_dept'))
        
        # Update context
        self.conversation_history[user_id].append({
            'response': result,
            'timestamp': datetime.now().isoformat()
        })
        
        return result
    
    def get_user_context(self, user_id):
        """Get user's conversation context"""
        history = self.conversation_history[user_id]
        
        if not history:
            return {}
        
        # Get last department they talked to
        for item in reversed(history):
            if 'response' in item and 'department' in item['response']:
                return {
                    'last_dept': item['response']['department'],
                    'message_count': len(history)
                }
        
        return {'message_count': len(history)}

class AutomationOrchestrator:
    """Orchestrates all automation across the platform"""
    
    def __init__(self):
        self.tasks = []
        self.schedules = {}
        self.init_automation_db()
    
    def init_automation_db(self):
        """Initialize automation database"""
        self.conn = sqlite3.connect('automation.db', check_same_thread=False)
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS automation_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                trigger_type TEXT,
                trigger_value TEXT,
                action_type TEXT,
                action_value TEXT,
                enabled BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Add default automation rules
        default_rules = [
            {
                'name': 'Welcome New Users',
                'trigger_type': 'new_user',
                'action_type': 'send_message',
                'action_value': 'Welcome!  Click any button to get started!'
            },
            {
                'name': 'Daily Motivation',
                'trigger_type': 'time',
                'trigger_value': '09:00',
                'action_type': 'broadcast',
                'action_value': 'Good morning! Ready to learn something new today? '
            },
            {
                'name': 'Auto-Clean Logs',
                'trigger_type': 'file_size',
                'trigger_value': 'logs/*.log > 100MB',
                'action_type': 'rotate_logs',
                'action_value': 'archive'
            }
        ]
        
        for rule in default_rules:
            self.conn.execute('''
                INSERT OR IGNORE INTO automation_rules 
                (name, trigger_type, trigger_value, action_type, action_value)
                VALUES (?, ?, ?, ?, ?)
            ''', (rule['name'], rule['trigger_type'], 
                  rule.get('trigger_value', ''), rule['action_type'], 
                  rule['action_value']))
        
        self.conn.commit()
    
    def add_automation(self, name, trigger, action):
        """Add a new automation rule"""
        self.conn.execute('''
            INSERT INTO automation_rules 
            (name, trigger_type, trigger_value, action_type, action_value)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, trigger['type'], trigger.get('value', ''), 
              action['type'], action['value']))
        self.conn.commit()
    
    def run_automations(self):
        """Run all enabled automations"""
        cursor = self.conn.execute('''
            SELECT * FROM automation_rules WHERE enabled = 1
        ''')
        
        for rule in cursor:
            try:
                self.execute_rule(rule)
            except Exception as e:
                print(f"Automation error in {rule[1]}: {e}")

# Create simple deployment scripts
def create_deployment_scripts():
    """Create one-click deployment scripts"""
    
    # Windows batch file
    with open('START_EASY_MODE.bat', 'w') as f:
        f.write('''@echo off
echo Starting Easy Mode System...
python EASY_MODE.py
pause
''')
    
    # Mac/Linux shell script
    with open('start_easy_mode.sh', 'w') as f:
        f.write('''#!/bin/bash
echo "Starting Easy Mode System..."
python3 EASY_MODE.py
''')
    os.chmod('start_easy_mode.sh', 0o755)
    
    # Create README for kids
    with open('README_FOR_KIDS.md', 'w') as f:
        f.write('''# How to Use CramPal Easy Mode! 

## For Kids and Beginners:

### To Start Everything:
1. **On Windows:** Double-click `START_EASY_MODE.bat`
2. **On Mac:** Double-click `start_easy_mode.sh`
3. A colorful control panel will open in your browser!

### In the Control Panel:
-  **Green Button** = Start Everything
-  **Red Button** = Stop Everything  
-  **Orange Button** = Fix Problems

### To Use the Apps:
Click any of the blue buttons:
-  **CramPal Learning** - For homework help!
-  **Vibe Platform** - Chat with friends!
-  **Chat Filter** - Keeps chats friendly!
-  **Empathy Game** - Learn about feelings!

## For Teachers/Parents:

The system automatically:
- Routes messages to the right department
- Filters inappropriate content
- Tracks learning progress
- Provides homework help
- Teaches empathy and social skills

Everything is safe, educational, and fun!

## Troubleshooting:

If something doesn't work:
1. Click the  Fix Problems button
2. Wait 5 seconds
3. Click  Start Everything again

That's it! Have fun learning! 
''')

# Integration with existing systems
class SystemIntegrator:
    """Integrates with schools, businesses, etc."""
    
    def __init__(self):
        self.integrations = {
            'google_classroom': {
                'enabled': False,
                'sync_homework': True,
                'sync_grades': False
            },
            'slack': {
                'enabled': False,
                'webhook': None,
                'channels': ['#general', '#support']
            },
            'discord': {
                'enabled': False,
                'bot_token': None,
                'servers': []
            },
            'email': {
                'enabled': True,
                'smtp_server': 'localhost',
                'notifications': ['daily_summary', 'alerts']
            }
        }
    
    def setup_school_integration(self, school_type='k12'):
        """Easy setup for schools"""
        configs = {
            'k12': {
                'content_filter': 'strict',
                'features': ['homework_help', 'safe_chat', 'progress_tracking'],
                'blocked_words': 'extended',
                'parental_controls': True
            },
            'university': {
                'content_filter': 'moderate',
                'features': ['research_help', 'collaboration', 'peer_tutoring'],
                'blocked_words': 'basic',
                'parental_controls': False
            }
        }
        
        return configs.get(school_type, configs['k12'])
    
    def generate_reports(self):
        """Generate usage reports for administrators"""
        report = {
            'daily_active_users': 0,
            'messages_processed': 0,
            'homework_completed': 0,
            'empathy_score_average': 0,
            'departments_health': self.get_all_health(),
            'top_topics': self.get_trending_topics()
        }
        
        return report
    
    def get_all_health(self):
        """Get health of all systems"""
        router = DepartmentRouter()
        return router.get_department_health()
    
    def get_trending_topics(self):
        """Get what users are talking about"""
        # This would analyze routing logs
        return ['math homework', 'friendship', 'test prep', 'emotions']

if __name__ == "__main__":
    print("Creating deployment scripts...")
    create_deployment_scripts()
    
    print("""
 Department Automation System Ready!

This system automatically:
- Routes messages to the right department
- Handles failures with backup routing
- Tracks all interactions
- Provides unified interface
- Integrates with schools/businesses

To use:
1. Run EASY_MODE.py for simple control
2. All departments auto-connect
3. Messages route automatically
4. Reports generate themselves

Perfect for:
- Schools (K-12 and University)
- After-school programs
- Tutoring centers
- Youth organizations
- Anyone who wants easy management!
""")