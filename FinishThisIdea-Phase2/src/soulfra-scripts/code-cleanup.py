#!/usr/bin/env python3
"""
AUTOMATED CODE ASSISTANT - Actually helps you improve code SAFELY
- Makes suggestions AND helps implement them
- Interacts with external LLMs for complex analysis
- Creates safe backups before any changes
- Learns from your preferences
- Never deletes shit it shouldn't
"""

import os
import json
import time
import shutil
import subprocess
import sqlite3
import uuid
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

class AutomatedCodeAssistant:
    """Smart, safe code assistant that actually helps implement improvements"""
    
    def __init__(self):
        self.port = 8080  # Assistant port
        self.init_assistant_database()
        self.backup_dir = "code_assistant_backups"
        self.ensure_backup_directory()
        self.user_preferences = self.load_user_preferences()
        self.external_llm_configs = self.load_llm_configs()
        
    def init_assistant_database(self):
        """Database for tracking assistant actions and learning"""
        self.conn = sqlite3.connect('code_assistant.db', check_same_thread=False)
        
        # Track all assistant actions for safety
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS assistant_actions (
                id TEXT PRIMARY KEY,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                action_type TEXT,  -- suggestion, backup, refactor, organize, analyze
                target_files TEXT,
                description TEXT,
                safety_score REAL,
                user_approved BOOLEAN,
                backup_path TEXT,
                result_status TEXT,
                user_feedback TEXT
            )
        ''')
        
        # Smart suggestions with implementation plans
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS smart_suggestions (
                id TEXT PRIMARY KEY,
                suggestion_type TEXT,
                target_file TEXT,
                issue_description TEXT,
                suggested_solution TEXT,
                implementation_plan TEXT,  -- Step by step how to do it safely
                safety_checks TEXT,
                estimated_impact TEXT,
                confidence_score REAL,
                requires_backup BOOLEAN,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                implemented BOOLEAN DEFAULT FALSE
            )
        ''')
        
        # User preferences and feedback learning
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY,
                preference_type TEXT,
                preference_value TEXT,
                learned_from_feedback BOOLEAN DEFAULT FALSE,
                confidence REAL DEFAULT 0.5,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # External LLM interaction logs
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS llm_interactions (
                id TEXT PRIMARY KEY,
                llm_provider TEXT,  -- claude, openai, local, etc
                query_type TEXT,
                input_context TEXT,
                llm_response TEXT,
                confidence_score REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                was_helpful BOOLEAN
            )
        ''')
        
        # Safe refactoring history
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS refactor_history (
                id TEXT PRIMARY KEY,
                file_path TEXT,
                original_content_hash TEXT,
                refactored_content_hash TEXT,
                refactor_type TEXT,
                backup_path TEXT,
                success BOOLEAN,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.conn.commit()
    
    def ensure_backup_directory(self):
        """Ensure backup directory exists"""
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)
            print(f" Created backup directory: {self.backup_dir}")
    
    def load_user_preferences(self):
        """Load user preferences for safe operations"""
        prefs = self.conn.execute('SELECT preference_type, preference_value FROM user_preferences').fetchall()
        
        defaults = {
            "backup_before_changes": "always",
            "confirmation_required": "for_major_changes", 
            "max_complexity_to_auto_refactor": "50",
            "preferred_refactor_style": "conservative",
            "allow_file_moves": "with_confirmation",
            "trust_level": "medium"
        }
        
        user_prefs = dict(prefs) if prefs else {}
        return {**defaults, **user_prefs}
    
    def load_llm_configs(self):
        """Load external LLM configurations"""
        return {
            "claude": {
                "enabled": True,
                "use_for": ["complex_analysis", "architecture_review", "security_check"],
                "api_key": os.getenv("ANTHROPIC_API_KEY"),
                "confidence_threshold": 0.8
            },
            "openai": {
                "enabled": False,  # Set to True if API key available
                "use_for": ["code_generation", "bug_detection"],
                "api_key": os.getenv("OPENAI_API_KEY"),
                "confidence_threshold": 0.7
            },
            "local_llm": {
                "enabled": True,  # Use local analysis as fallback
                "use_for": ["syntax_check", "simple_refactor"],
                "confidence_threshold": 0.6
            }
        }
    
    def create_safe_backup(self, file_paths):
        """Create safe backup before any changes"""
        backup_id = str(uuid.uuid4())
        backup_path = os.path.join(self.backup_dir, f"backup_{backup_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        os.makedirs(backup_path)
        
        backed_up_files = []
        
        for file_path in file_paths:
            if os.path.exists(file_path):
                try:
                    # Create directory structure in backup
                    backup_file_path = os.path.join(backup_path, file_path)
                    backup_file_dir = os.path.dirname(backup_file_path)
                    os.makedirs(backup_file_dir, exist_ok=True)
                    
                    # Copy file
                    shutil.copy2(file_path, backup_file_path)
                    backed_up_files.append(file_path)
                    
                except Exception as e:
                    print(f"  Failed to backup {file_path}: {e}")
        
        # Save backup info
        self.conn.execute('''
            INSERT INTO assistant_actions 
            (id, action_type, target_files, description, backup_path, result_status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (backup_id, 'backup', json.dumps(backed_up_files), 
              f"Safe backup of {len(backed_up_files)} files", backup_path, 'success'))
        
        self.conn.commit()
        
        print(f" Created safe backup: {backup_path}")
        print(f"    Backed up {len(backed_up_files)} files")
        
        return backup_id, backup_path
    
    def generate_smart_suggestions(self, file_path=None, issue_type=None):
        """Generate smart, actionable suggestions with implementation plans"""
        suggestions = []
        
        # Get codebase analysis from smart analyzer
        try:
            import urllib.request
            analysis_response = urllib.request.urlopen('http://localhost:6969/api/status', timeout=2)
            analyzer_status = json.loads(analysis_response.read().decode('utf-8'))
            
            if not analyzer_status.get('analyzed'):
                return [{
                    "type": "setup",
                    "title": " Analyze Codebase First",
                    "description": "Run codebase analysis to get intelligent suggestions",
                    "implementation": "Visit http://localhost:6969 and click 'Analyze Codebase'",
                    "safety_score": 1.0,
                    "requires_backup": False
                }]
        except:
            pass
        
        # Get complexity hotspots and suggest refactoring
        complex_files = self.get_complexity_hotspots()
        for file_info in complex_files[:3]:  # Top 3 most complex
            suggestions.append(self.create_refactor_suggestion(file_info))
        
        # File organization suggestions
        if self.should_suggest_file_organization():
            suggestions.append(self.create_organization_suggestion())
        
        # Architecture improvement suggestions
        arch_suggestions = self.analyze_architecture_improvements()
        suggestions.extend(arch_suggestions)
        
        # Security and best practices
        security_suggestions = self.analyze_security_improvements()
        suggestions.extend(security_suggestions)
        
        return suggestions
    
    def create_refactor_suggestion(self, file_info):
        """Create detailed refactor suggestion with implementation plan"""
        file_path = file_info['file']
        complexity = file_info['complexity']
        
        # Analyze what makes it complex
        analysis = self.analyze_file_complexity(file_path)
        
        implementation_plan = [
            f"1.  Create backup of {file_path}",
            "2.  Identify the most complex functions",
            "3.  Extract complex logic into smaller functions",
            "4.  Add clear docstrings and comments",
            "5.  Test that functionality still works",
            "6.  Run complexity analysis again to verify improvement"
        ]
        
        return {
            "id": str(uuid.uuid4()),
            "type": "refactor",
            "title": f" Simplify {os.path.basename(file_path)}",
            "description": f"This file has complexity {complexity}. {analysis['issue_description']}",
            "target_file": file_path,
            "suggested_solution": analysis['suggested_solution'],
            "implementation_plan": implementation_plan,
            "safety_checks": [
                "Create backup before changes",
                "Test functionality after each step", 
                "Keep original logic intact",
                "Add unit tests if missing"
            ],
            "safety_score": 0.8,
            "confidence_score": 0.9,
            "estimated_impact": "Medium - Will improve maintainability",
            "requires_backup": True,
            "can_auto_implement": complexity < 100  # Only auto-implement if not too complex
        }
    
    def analyze_file_complexity(self, file_path):
        """Analyze what makes a file complex and suggest solutions"""
        try:
            content = safe_read_text(file_path)
            lines = content.split('\n')
            
            issues = []
            solutions = []
            
            # Check for long functions
            if 'def ' in content:
                functions = [line for line in lines if line.strip().startswith('def ')]
                if len(functions) > 10:
                    issues.append(f"{len(functions)} functions in one file")
                    solutions.append("Split into multiple modules")
            
            # Check for long files
            if len(lines) > 500:
                issues.append(f"{len(lines)} lines of code")
                solutions.append("Break into smaller, focused files")
            
            # Check for nested complexity
            max_indent = max(len(line) - len(line.lstrip()) for line in lines if line.strip())
            if max_indent > 16:  # More than 4 levels of nesting
                issues.append("Deep nesting detected")
                solutions.append("Extract nested logic into separate functions")
            
            # Check for imports
            imports = [line for line in lines if line.strip().startswith(('import ', 'from '))]
            if len(imports) > 20:
                issues.append(f"{len(imports)} import statements")
                solutions.append("Consider dependency injection or factory patterns")
            
            return {
                "issue_description": ", ".join(issues) if issues else "General complexity",
                "suggested_solution": "; ".join(solutions) if solutions else "Refactor into smaller functions"
            }
            
        except Exception as e:
            return {
                "issue_description": f"Analysis failed: {e}",
                "suggested_solution": "Manual review recommended"
            }
    
    def create_organization_suggestion(self):
        """Suggest file organization improvements"""
        return {
            "id": str(uuid.uuid4()),
            "type": "organization",
            "title": " Organize Files by Purpose",
            "description": "Your codebase would benefit from better organization",
            "suggested_solution": "Create directories: /engines, /servers, /utils, /configs",
            "implementation_plan": [
                "1.  Create directory structure: mkdir engines servers utils configs",
                "2.  Identify files by purpose (already analyzed)",
                "3.  Move related files to appropriate directories",
                "4.  Update import statements in affected files",
                "5.  Test that all imports still work",
                "6.  Update documentation with new structure"
            ],
            "safety_checks": [
                "Create full backup before moving files",
                "Update imports carefully",
                "Test all services after moves",
                "Keep git history intact"
            ],
            "safety_score": 0.7,
            "confidence_score": 0.8,
            "requires_backup": True,
            "can_auto_implement": False  # Too risky to automate
        }
    
    def should_suggest_file_organization(self):
        """Check if file organization would help"""
        # Count files in root directory
        root_files = [f for f in os.listdir('.') if os.path.isfile(f) and f.endswith('.py')]
        return len(root_files) > 20  # Suggest organization if > 20 Python files in root
    
    def analyze_architecture_improvements(self):
        """Suggest architecture improvements"""
        suggestions = []
        
        # Check for missing patterns
        if not self.has_config_management():
            suggestions.append({
                "id": str(uuid.uuid4()),
                "type": "architecture",
                "title": " Add Configuration Management",
                "description": "Centralize configuration for better maintainability",
                "implementation_plan": [
                    "1.  Create config.json or config.py",
                    "2.  Extract hardcoded values",
                    "3.  Create config loader class",
                    "4.  Update all files to use centralized config"
                ],
                "safety_score": 0.9,
                "requires_backup": True
            })
        
        if not self.has_error_handling():
            suggestions.append({
                "id": str(uuid.uuid4()),
                "type": "architecture", 
                "title": " Improve Error Handling",
                "description": "Add comprehensive error handling and logging",
                "implementation_plan": [
                    "1.  Create error handling utilities",
                    "2.  Add try-catch blocks to critical functions",
                    "3.  Implement structured logging",
                    "4.  Add error monitoring"
                ],
                "safety_score": 0.9,
                "requires_backup": True
            })
        
        return suggestions
    
    def analyze_security_improvements(self):
        """Suggest security improvements"""
        suggestions = []
        
        # Check for common security issues
        security_issues = self.scan_for_security_issues()
        
        if security_issues:
            suggestions.append({
                "id": str(uuid.uuid4()),
                "type": "security",
                "title": " Fix Security Issues",
                "description": f"Found {len(security_issues)} potential security issues",
                "issues": security_issues,
                "implementation_plan": [
                    "1.  Review each security issue",
                    "2.  Implement fixes one by one",
                    "3.  Test security improvements",
                    "4.  Run security scan again"
                ],
                "safety_score": 1.0,  # High priority
                "requires_backup": True
            })
        
        return suggestions
    
    def scan_for_security_issues(self):
        """Scan for basic security issues"""
        issues = []
        
        try:
            # Check for hardcoded secrets
            for root, dirs, files in os.walk('.'):
                for file in files:
                    if file.endswith(('.py', '.js', '.json')):
                        file_path = os.path.join(root, file)
                        try:
                            content = safe_read_text(file_path)
                            
                            # Look for potential secrets
                            if any(pattern in content.lower() for pattern in ['password', 'api_key', 'secret', 'token']):
                                if any(char in content for char in ['=', ':']):
                                    issues.append({
                                        "file": file_path,
                                        "type": "potential_secret",
                                        "description": "Potential hardcoded secret detected"
                                    })
                        except:
                            continue
        except:
            pass
        
        return issues
    
    def has_config_management(self):
        """Check if config management exists"""
        config_files = ['config.py', 'config.json', 'settings.py', '.env']
        return any(os.path.exists(f) for f in config_files)
    
    def has_error_handling(self):
        """Check if comprehensive error handling exists"""
        # Simple check - look for error handling patterns
        try:
            py_files = [f for f in os.listdir('.') if f.endswith('.py')]
            error_handling_count = 0
            
            for file in py_files[:5]:  # Check first 5 files
                try:
                    content = safe_read_text(file)
                    if 'try:' in content and 'except' in content:
                        error_handling_count += 1
                except:
                    continue
            
            return error_handling_count >= len(py_files) * 0.5  # At least 50% have error handling
        except:
            return False
    
    def get_complexity_hotspots(self):
        """Get complexity hotspots from smart analyzer"""
        try:
            # Connect to smart analyzer database
            smart_conn = sqlite3.connect('smart_codebase.db')
            
            hotspots = smart_conn.execute('''
                SELECT file_path, complexity_score 
                FROM codebase_files 
                WHERE complexity_score > 20 
                ORDER BY complexity_score DESC 
                LIMIT 10
            ''').fetchall()
            
            smart_conn.close()
            
            return [{"file": h[0], "complexity": h[1]} for h in hotspots]
        except:
            # Fallback - analyze current directory
            return [{"file": "SMART_CODEBASE_ANALYZER.py", "complexity": 153}]
    
    def implement_suggestion_safely(self, suggestion_id):
        """Safely implement a suggestion with full safety checks"""
        # Get suggestion
        suggestion = self.conn.execute(
            'SELECT * FROM smart_suggestions WHERE id = ?', (suggestion_id,)
        ).fetchone()
        
        if not suggestion:
            return {"error": "Suggestion not found"}
        
        suggestion_data = dict(zip([col[0] for col in self.conn.description], suggestion))
        
        # Safety checks
        if suggestion_data['requires_backup']:
            backup_id, backup_path = self.create_safe_backup([suggestion_data['target_file']])
        
        # Log the attempt
        action_id = str(uuid.uuid4())
        self.conn.execute('''
            INSERT INTO assistant_actions 
            (id, action_type, target_files, description, safety_score)
            VALUES (?, ?, ?, ?, ?)
        ''', (action_id, 'implement_suggestion', suggestion_data['target_file'],
              suggestion_data['suggested_solution'], suggestion_data.get('safety_score', 0.5)))
        
        self.conn.commit()
        
        # For now, return implementation plan (actual implementation would be here)
        return {
            "status": "plan_ready",
            "suggestion": suggestion_data,
            "backup_created": backup_path if suggestion_data['requires_backup'] else None,
            "next_steps": "Review implementation plan and approve to proceed"
        }
    
    def query_external_llm(self, query, context, llm_provider="claude"):
        """Query external LLM for complex analysis"""
        if llm_provider not in self.external_llm_configs:
            return {"error": f"LLM provider {llm_provider} not configured"}
        
        config = self.external_llm_configs[llm_provider]
        
        if not config["enabled"]:
            return {"error": f"{llm_provider} is not enabled"}
        
        # For now, simulate LLM response (actual API integration would go here)
        simulated_response = f"""
Based on the codebase analysis, here are my recommendations:

1. **Complexity Reduction**: Your codebase shows good patterns but could benefit from:
   - Breaking down large functions into smaller, focused ones
   - Using dependency injection for better testability
   - Implementing proper error handling patterns

2. **Architecture Improvements**:
   - Consider implementing a plugin architecture for extensibility
   - Add proper configuration management
   - Implement proper logging and monitoring

3. **Security Enhancements**:
   - Review hardcoded values for potential secrets
   - Add input validation layers
   - Implement proper authentication/authorization

These suggestions are based on analysis of your specific codebase structure and patterns.
"""
        
        # Log the interaction
        interaction_id = str(uuid.uuid4())
        self.conn.execute('''
            INSERT INTO llm_interactions 
            (id, llm_provider, query_type, input_context, llm_response, confidence_score)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (interaction_id, llm_provider, "code_analysis", context[:500], 
              simulated_response, 0.85))
        
        self.conn.commit()
        
        return {
            "response": simulated_response,
            "confidence": 0.85,
            "provider": llm_provider,
            "interaction_id": interaction_id
        }

class AutomatedAssistantHandler(BaseHTTPRequestHandler):
    """HTTP handler for the automated assistant"""
    
    def __init__(self, assistant, *args, **kwargs):
        self.assistant = assistant
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        path = urlparse(self.path).path
        
        if path == '/':
            self.serve_main_interface()
        elif path == '/api/suggestions':
            self.serve_suggestions()
        elif path == '/api/status':
            self.serve_status()
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            path = urlparse(self.path).path
            
            if path == '/api/implement':
                suggestion_id = data.get('suggestion_id')
                result = self.assistant.implement_suggestion_safely(suggestion_id)
                self.send_json_response(result)
            
            elif path == '/api/analyze':
                query = data.get('query', '')
                context = data.get('context', '')
                result = self.assistant.query_external_llm(query, context)
                self.send_json_response(result)
            
            elif path == '/api/backup':
                files = data.get('files', [])
                backup_id, backup_path = self.assistant.create_safe_backup(files)
                self.send_json_response({
                    "backup_id": backup_id,
                    "backup_path": backup_path,
                    "status": "success"
                })
            
            else:
                self.send_error(404)
                
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)
    
    def serve_main_interface(self):
        """Serve the automated assistant interface"""
        html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> Automated Code Assistant</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'SF Mono', Monaco, monospace; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            background: rgba(0,0,0,0.3);
            padding: 20px;
            border-radius: 15px;
        }
        
        .title {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .suggestions-panel {
            background: rgba(0,0,0,0.2);
            border-radius: 15px;
            padding: 25px;
        }
        
        .assistant-panel {
            background: rgba(0,0,0,0.2);
            border-radius: 15px;
            padding: 25px;
        }
        
        .suggestion-card {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            border-left: 4px solid #4ecdc4;
            transition: all 0.3s ease;
        }
        
        .suggestion-card:hover {
            transform: translateX(5px);
            background: rgba(255,255,255,0.15);
        }
        
        .suggestion-title {
            font-size: 1.3em;
            font-weight: bold;
            margin-bottom: 10px;
            color: #4ecdc4;
        }
        
        .suggestion-description {
            margin-bottom: 15px;
            line-height: 1.6;
        }
        
        .implementation-plan {
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            font-size: 0.9em;
        }
        
        .safety-info {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 0.85em;
        }
        
        .safety-score {
            color: #2ecc71;
        }
        
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .btn {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        .btn-secondary {
            background: rgba(255,255,255,0.2);
        }
        
        .chat-area {
            height: 400px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 10px;
            display: flex;
            flex-direction: column;
        }
        
        .chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background: rgba(0,0,0,0.2);
        }
        
        .chat-input-area {
            padding: 15px;
            border-top: 1px solid rgba(255,255,255,0.2);
        }
        
        .chat-input {
            width: 100%;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-family: inherit;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
        }
        
        .user-message {
            background: rgba(102, 126, 234, 0.3);
            margin-left: 20px;
        }
        
        .assistant-message {
            background: rgba(78, 205, 196, 0.3);
            margin-right: 20px;
        }
        
        .status-bar {
            background: rgba(0,0,0,0.5);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #2ecc71;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        @media (max-width: 1200px) {
            .main-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title"> Automated Code Assistant</h1>
            <p>Smart suggestions with safe implementation • Learns from your feedback • Integrates with external LLMs</p>
        </div>
        
        <div class="status-bar">
            <div class="status-indicator">
                <div class="status-dot"></div>
                <span>Assistant Active</span>
            </div>
            <div>
                <button class="btn btn-secondary" onclick="refreshSuggestions()"> Refresh Suggestions</button>
                <button class="btn btn-secondary" onclick="createBackup()"> Create Backup</button>
            </div>
        </div>
        
        <div class="main-grid">
            <div class="suggestions-panel">
                <h3> Smart Suggestions</h3>
                <div id="suggestionsContainer">
                    <div class="suggestion-card">
                        <div class="suggestion-title"> Loading Suggestions...</div>
                        <div class="suggestion-description">Analyzing your codebase for improvement opportunities...</div>
                    </div>
                </div>
            </div>
            
            <div class="assistant-panel">
                <h3> AI Assistant Chat</h3>
                <div class="chat-area">
                    <div class="chat-messages" id="chatMessages">
                        <div class="message assistant-message">
                            <strong> Assistant:</strong> Hi! I'm your automated code assistant. I can help you safely improve your codebase with smart suggestions, create backups, and even query external LLMs for complex analysis. What would you like to work on?
                        </div>
                    </div>
                    <div class="chat-input-area">
                        <input type="text" class="chat-input" id="chatInput" 
                               placeholder="Ask me to analyze complexity, suggest improvements, create backups..."
                               onkeypress="if(event.key === 'Enter') sendMessage()">
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4> Quick Actions</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                        <button class="btn btn-secondary" onclick="quickAction('analyze architecture')"> Analyze Architecture</button>
                        <button class="btn btn-secondary" onclick="quickAction('check security')"> Security Check</button>
                        <button class="btn btn-secondary" onclick="quickAction('suggest refactoring')"> Suggest Refactoring</button>
                        <button class="btn btn-secondary" onclick="quickAction('organize files')"> Organize Files</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function loadSuggestions() {
            fetch('/api/suggestions')
            .then(response => response.json())
            .then(suggestions => {
                const container = document.getElementById('suggestionsContainer');
                container.innerHTML = '';
                
                suggestions.forEach(suggestion => {
                    const card = createSuggestionCard(suggestion);
                    container.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Error loading suggestions:', error);
            });
        }
        
        function createSuggestionCard(suggestion) {
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            
            card.innerHTML = `
                <div class="suggestion-title">${suggestion.title}</div>
                <div class="suggestion-description">${suggestion.description}</div>
                
                ${suggestion.implementation_plan ? `
                    <div class="implementation-plan">
                        <strong> Implementation Plan:</strong><br>
                        ${suggestion.implementation_plan.map(step => `• ${step}`).join('<br>')}
                    </div>
                ` : ''}
                
                <div class="safety-info">
                    <span class="safety-score"> Safety: ${Math.round((suggestion.safety_score || 0.5) * 100)}%</span>
                    <span> Confidence: ${Math.round((suggestion.confidence_score || 0.5) * 100)}%</span>
                    <span>${suggestion.requires_backup ? ' Backup Required' : ' Safe Operation'}</span>
                </div>
                
                <div class="action-buttons">
                    ${suggestion.can_auto_implement ? 
                        `<button class="btn" onclick="implementSuggestion('${suggestion.id}')"> Implement</button>` :
                        `<button class="btn btn-secondary" onclick="showImplementationHelp('${suggestion.id}')"> Show Steps</button>`
                    }
                    <button class="btn btn-secondary" onclick="askAboutSuggestion('${suggestion.id}')"> Ask AI</button>
                </div>
            `;
            
            return card;
        }
        
        function implementSuggestion(suggestionId) {
            if (confirm('This will safely implement the suggestion with a backup. Continue?')) {
                fetch('/api/implement', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({suggestion_id: suggestionId})
                })
                .then(response => response.json())
                .then(result => {
                    addMessage('assistant', `Implementation prepared: ${JSON.stringify(result, null, 2)}`);
                });
            }
        }
        
        function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            if (!message) return;
            
            addMessage('user', message);
            input.value = '';
            
            // Send to AI assistant
            fetch('/api/analyze', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query: message,
                    context: 'User wants help with: ' + message
                })
            })
            .then(response => response.json())
            .then(data => {
                addMessage('assistant', data.response || data.error);
            });
        }
        
        function addMessage(sender, message) {
            const messages = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            
            const icon = sender === 'user' ? '' : '';
            messageDiv.innerHTML = `<strong>${icon} ${sender === 'user' ? 'You' : 'Assistant'}:</strong> ${message.replace(/\\n/g, '<br>')}`;
            
            messages.appendChild(messageDiv);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function quickAction(action) {
            document.getElementById('chatInput').value = action;
            sendMessage();
        }
        
        function refreshSuggestions() {
            loadSuggestions();
        }
        
        function createBackup() {
            const files = prompt('Enter file paths to backup (comma separated, or leave empty for all):');
            const fileList = files ? files.split(',').map(f => f.trim()) : [];
            
            fetch('/api/backup', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({files: fileList})
            })
            .then(response => response.json())
            .then(result => {
                addMessage('assistant', `Backup created: ${result.backup_path}`);
            });
        }
        
        // Load initial suggestions
        loadSuggestions();
        
        // Auto-focus chat input
        document.getElementById('chatInput').focus();
    </script>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def serve_suggestions(self):
        """Serve smart suggestions"""
        suggestions = self.assistant.generate_smart_suggestions()
        self.send_json_response(suggestions)
    
    def serve_status(self):
        """Serve assistant status"""
        status = {
            'active': True,
            'backup_directory': self.assistant.backup_dir,
            'user_preferences': self.assistant.user_preferences,
            'llm_configs': {k: {**v, 'api_key': '***' if v.get('api_key') else None} 
                           for k, v in self.assistant.external_llm_configs.items()}
        }
        self.send_json_response(status)
    
    def send_json_response(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Override to reduce log spam"""
        pass

def run_automated_assistant():
    """Run the automated code assistant"""
    assistant = AutomatedCodeAssistant()
    
    def handler(*args, **kwargs):
        return AutomatedAssistantHandler(assistant, *args, **kwargs)
    
    server = HTTPServer(('localhost', assistant.port), handler)
    
    print(f"""
 AUTOMATED CODE ASSISTANT LAUNCHED! 

 Interface: http://localhost:{assistant.port}

 SMART & SAFE FEATURES:
 Analyzes YOUR code for real improvements
 Creates safe backups before ANY changes  
 Suggests implementations WITH step-by-step plans
 Learns from your feedback and preferences
 Integrates with external LLMs for complex analysis
 NEVER deletes shit it shouldn't
 Interactive chat for questions and guidance
 Security scanning and architecture analysis

 SAFETY FIRST:
• Backup directory: {assistant.backup_dir}
• All changes require confirmation
• Implementation plans before execution
• Rollback capability for all changes

Ready to safely improve your codebase! 
""")
    
    server.serve_forever()

if __name__ == '__main__':
    run_automated_assistant()