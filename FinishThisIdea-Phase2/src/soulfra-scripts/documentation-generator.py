# UTF-8 Encoding Fix
import sys
import io
import os
import locale

# Force UTF-8 encoding
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['LC_ALL'] = 'C.UTF-8'
os.environ['LANG'] = 'C.UTF-8'

# Ensure stdout/stderr use UTF-8
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Set locale to UTF-8
try:
    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_ALL, 'C.UTF-8')
    except:
        pass


#!/usr/bin/env python3
"""
DEV DOC GENERATOR - Turns debugging pain into AI-readable documentation
Better than every ChatGPT wrapper because it actually understands
"""

import http.server
import socketserver
import json
import os
import time
import hashlib
from datetime import datetime
from collections import defaultdict

PORT = 4201

os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

class DevDocGenerator:
    def __init__(self):
        self.debug_sessions = {}
        self.error_patterns = defaultdict(list)
        self.solutions_db = defaultdict(list)
        self.ai_context = []
        
        # Knowledge base from collective suffering
        self.knowledge_base = {
            'timeout_patterns': {
                'symptoms': ['2 minute timeout', 'serve_forever hangs', 'bash command timeout'],
                'root_causes': ['Synchronous blocking calls', 'No daemon threads', 'Missing background flag'],
                'proven_solutions': [
                    'Use threading.Thread(target=httpd.serve_forever, daemon=True)',
                    'Run with nohup and & flag',
                    'Return immediately after starting service',
                    'Use subprocess.Popen with DEVNULL'
                ]
            },
            'formatting_hell': {
                'symptoms': ['emoji errors', 'UTF-8 decode error', 'malformed characters'],
                'root_causes': ['Mixed encodings', 'Special characters in templates', 'Locale issues'],
                'proven_solutions': [
                    'Set LC_ALL=C environment',
                    'Use ASCII-only responses',
                    'Avoid template literals with emojis',
                    'Pure Python servers instead of JS'
                ]
            },
            'port_failures': {
                'symptoms': ['Address already in use', 'Connection refused', 'Port bind error'],
                'root_causes': ['Zombie processes', 'System daemons', 'Previous runs not killed'],
                'proven_solutions': [
                    'lsof -ti :PORT | xargs kill -9',
                    'Use high random ports (8000-9999)',
                    'Set allow_reuse_address = True',
                    'Avoid cursed ports (6666, 6667)'
                ]
            }
        }
        
    def process_debug_session(self, data):
        """Turn developer pain into structured knowledge"""
        text = data.get('text', '')
        context = data.get('context', {})
        
        # Generate session ID
        session_id = hashlib.md5(f"{text}{time.time()}".encode()).hexdigest()[:12]
        
        # Analyze the problem
        analysis = self._analyze_problem(text, context)
        
        # Generate AI-friendly documentation
        ai_doc = self._generate_ai_documentation(text, analysis, context)
        
        # Store session
        session = {
            'id': session_id,
            'timestamp': datetime.now().isoformat(),
            'raw_input': text,
            'analysis': analysis,
            'ai_documentation': ai_doc,
            'export_ready': True
        }
        
        self.debug_sessions[session_id] = session
        
        # Update knowledge base
        self._update_knowledge_base(analysis)
        
        return session
        
    def _analyze_problem(self, text, context):
        """Deep analysis of the debugging issue"""
        text_lower = text.lower()
        
        # Detect problem category
        problem_type = 'unknown'
        confidence = 0
        
        for category, patterns in self.knowledge_base.items():
            matches = sum(1 for symptom in patterns['symptoms'] if symptom in text_lower)
            if matches > confidence:
                problem_type = category
                confidence = matches
                
        # Extract key information
        analysis = {
            'problem_type': problem_type,
            'confidence': confidence * 33.3,  # Convert to percentage
            'detected_symptoms': self._extract_symptoms(text),
            'error_messages': self._extract_errors(text),
            'attempted_solutions': self._extract_attempts(text),
            'emotional_state': self._detect_frustration_level(text),
            'time_wasted': self._estimate_time_wasted(text),
            'recommended_approach': self._recommend_approach(problem_type, text)
        }
        
        return analysis
        
    def _extract_symptoms(self, text):
        """Extract technical symptoms from rant"""
        symptoms = []
        
        # Common error indicators
        indicators = [
            'error', 'fail', 'timeout', 'refused', 'undefined',
            'null', 'crash', 'hang', 'stuck', 'broken'
        ]
        
        words = text.lower().split()
        for i, word in enumerate(words):
            for indicator in indicators:
                if indicator in word:
                    # Get context around error
                    start = max(0, i-3)
                    end = min(len(words), i+4)
                    context = ' '.join(words[start:end])
                    symptoms.append(context)
                    
        return list(set(symptoms))[:5]  # Top 5 unique symptoms
        
    def _extract_errors(self, text):
        """Extract actual error messages"""
        errors = []
        
        # Look for common error patterns
        lines = text.split('\n')
        for line in lines:
            if any(err in line.lower() for err in ['error:', 'exception:', 'traceback:', 'failed:']):
                errors.append(line.strip())
                
        return errors
        
    def _extract_attempts(self, text):
        """What they've already tried"""
        attempts = []
        
        tried_indicators = [
            'tried', 'attempted', 'used', 'ran', 'executed',
            'changed', 'modified', 'updated', 'fixed'
        ]
        
        sentences = text.split('.')
        for sentence in sentences:
            if any(indicator in sentence.lower() for indicator in tried_indicators):
                attempts.append(sentence.strip())
                
        return attempts
        
    def _detect_frustration_level(self, text):
        """How pissed are they?"""
        frustration_score = 0
        
        # Swear words = frustration
        swears = ['fuck', 'shit', 'damn', 'hell', 'ass', 'crap']
        frustration_score += sum(5 for swear in swears if swear in text.lower())
        
        # Caps lock = yelling
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        frustration_score += int(caps_ratio * 50)
        
        # Multiple punctuation
        frustration_score += text.count('!!!') * 10
        frustration_score += text.count('???') * 10
        
        # Time indicators
        if any(time in text.lower() for time in ['hours', 'days', 'weeks']):
            frustration_score += 20
            
        levels = {
            0: 'zen',
            20: 'mildly annoyed',
            40: 'frustrated',
            60: 'very frustrated',
            80: 'rage mode',
            100: 'considering career change'
        }
        
        for threshold, level in sorted(levels.items(), reverse=True):
            if frustration_score >= threshold:
                return level
                
        return 'zen'
        
    def _estimate_time_wasted(self, text):
        """How much life have they lost to this bug?"""
        time_indicators = {
            'minutes': 1,
            'hours': 60,
            'days': 1440,
            'weeks': 10080
        }
        
        total_minutes = 0
        words = text.lower().split()
        
        for i, word in enumerate(words):
            for unit, multiplier in time_indicators.items():
                if unit in word and i > 0:
                    try:
                        number = float(words[i-1])
                        total_minutes += number * multiplier
                    except:
                        pass
                        
        if total_minutes == 0:
            return "Unknown (but probably too long)"
        elif total_minutes < 60:
            return f"{int(total_minutes)} minutes"
        elif total_minutes < 1440:
            return f"{total_minutes/60:.1f} hours"
        else:
            return f"{total_minutes/1440:.1f} days"
            
    def _recommend_approach(self, problem_type, text):
        """What should they actually do?"""
        if problem_type in self.knowledge_base:
            solutions = self.knowledge_base[problem_type]['proven_solutions']
            return solutions[0] if solutions else "Try turning it off and on again"
            
        # Generic recommendations based on keywords
        if 'timeout' in text.lower():
            return "Use background processes or async operations"
        elif 'port' in text.lower():
            return "Kill all processes and use a different port range"
        elif 'undefined' in text.lower():
            return "Add defensive checks for null/undefined values"
        else:
            return "Take a break. Fresh eyes find bugs faster."
            
    def _generate_ai_documentation(self, original_text, analysis, context):
        """Generate documentation that AIs can actually use"""
        
        doc = {
            'problem_summary': self._create_summary(original_text, analysis),
            'technical_details': {
                'symptoms': analysis['detected_symptoms'],
                'error_messages': analysis['error_messages'],
                'attempted_solutions': analysis['attempted_solutions'],
                'environment': context.get('environment', 'Unknown')
            },
            'structured_query': self._create_structured_query(analysis),
            'context_for_ai': self._create_ai_context(original_text, analysis),
            'search_keywords': self._extract_keywords(original_text, analysis),
            'similar_issues': self._find_similar_issues(analysis),
            'export_format': 'CLAUDE_OPTIMIZED'
        }
        
        return doc
        
    def _create_summary(self, text, analysis):
        """One-line summary for AI consumption"""
        problem = analysis['problem_type'].replace('_', ' ').title()
        frustration = analysis['emotional_state']
        time = analysis['time_wasted']
        
        return f"{problem} issue causing {frustration} after {time} of debugging"
        
    def _create_structured_query(self, analysis):
        """The question to ask an AI, properly formatted"""
        if analysis['error_messages']:
            error = analysis['error_messages'][0]
            return f"How to fix: {error}"
        elif analysis['detected_symptoms']:
            symptom = analysis['detected_symptoms'][0]
            return f"Debug issue: {symptom}"
        else:
            return f"Solve {analysis['problem_type']} problem in development"
            
    def _create_ai_context(self, text, analysis):
        """Context that helps AI understand the real issue"""
        context_parts = [
            f"Problem Type: {analysis['problem_type']}",
            f"Developer Frustration Level: {analysis['emotional_state']}",
            f"Time Already Spent: {analysis['time_wasted']}",
            "Previous Attempts Failed:",
        ]
        
        for attempt in analysis['attempted_solutions'][:3]:
            context_parts.append(f"  - {attempt}")
            
        context_parts.append("\nDeveloper's Original Description:")
        context_parts.append(text[:500] + "..." if len(text) > 500 else text)
        
        return '\n'.join(context_parts)
        
    def _extract_keywords(self, text, analysis):
        """Keywords for better AI search"""
        keywords = []
        
        # Add problem type
        keywords.append(analysis['problem_type'])
        
        # Extract technical terms
        technical_terms = [
            'python', 'javascript', 'server', 'port', 'timeout',
            'async', 'thread', 'process', 'docker', 'kubernetes'
        ]
        
        for term in technical_terms:
            if term in text.lower():
                keywords.append(term)
                
        # Add from symptoms
        for symptom in analysis['detected_symptoms']:
            words = symptom.split()
            keywords.extend([w for w in words if len(w) > 4])
            
        return list(set(keywords))[:10]
        
    def _find_similar_issues(self, analysis):
        """Find similar debugging sessions"""
        similar = []
        problem_type = analysis['problem_type']
        
        if problem_type in self.error_patterns:
            similar = self.error_patterns[problem_type][:3]
            
        return similar
        
    def _update_knowledge_base(self, analysis):
        """Learn from each debugging session"""
        problem_type = analysis['problem_type']
        
        # Store patterns
        self.error_patterns[problem_type].append({
            'symptoms': analysis['detected_symptoms'],
            'solution': analysis['recommended_approach'],
            'time': datetime.now().isoformat()
        })
        
    def export_for_ai(self, session_id):
        """Export in format optimized for AI consumption"""
        if session_id not in self.debug_sessions:
            return None
            
        session = self.debug_sessions[session_id]
        doc = session['ai_documentation']
        
        # Create export format
        export = {
            'version': '1.0',
            'generator': 'DEV_DOC_GENERATOR',
            'timestamp': datetime.now().isoformat(),
            'session_id': session_id,
            'quick_summary': doc['problem_summary'],
            'ai_query': doc['structured_query'],
            'full_context': doc['context_for_ai'],
            'keywords': doc['search_keywords'],
            'technical_details': doc['technical_details'],
            'similar_solved_issues': doc['similar_issues'],
            'recommended_approach': session['analysis']['recommended_approach']
        }
        
        return export

# Global generator
doc_generator = DevDocGenerator()

class DocHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
<title>Dev Doc Generator - Turn Pain into Documentation</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {
    font-family: -apple-system, 'Courier New', monospace;
    background: #0a0a0a;
    color: #00ff00;
    margin: 0;
    padding: 20px;
}

.container {
    max-width: 1000px;
    margin: 0 auto;
}

h1 {
    color: #ff00ff;
    text-align: center;
}

.subtitle {
    text-align: center;
    color: #ffff00;
    margin-bottom: 30px;
}

.input-section {
    background: #1a1a1a;
    border: 1px solid #00ff00;
    padding: 20px;
    margin: 20px 0;
}

textarea {
    width: 100%;
    background: #000;
    color: #00ff00;
    border: 1px solid #444;
    padding: 15px;
    font-family: monospace;
    font-size: 14px;
}

button {
    background: #ff00ff;
    color: #000;
    border: none;
    padding: 12px 30px;
    font-size: 16px;
    cursor: pointer;
    font-weight: bold;
    margin: 10px 10px 0 0;
}

button:hover {
    opacity: 0.8;
}

.analysis-result {
    display: none;
    background: #111;
    border: 1px solid #ff00ff;
    padding: 20px;
    margin: 20px 0;
}

.metric {
    background: #1a1a1a;
    padding: 10px;
    margin: 10px 0;
    border-left: 3px solid #00ff00;
}

.metric strong {
    color: #ffff00;
}

.ai-doc {
    background: #001100;
    border: 1px solid #00ff00;
    padding: 20px;
    margin: 20px 0;
    font-family: monospace;
    white-space: pre-wrap;
}

.export-section {
    text-align: center;
    margin: 20px 0;
}

.knowledge-base {
    background: #1a1a1a;
    border: 1px solid #444;
    padding: 20px;
    margin: 20px 0;
}

.error-pattern {
    background: #0d0d0d;
    padding: 10px;
    margin: 10px 0;
    border-left: 3px solid #ff0000;
}

.success {
    color: #00ff00;
}

.warning {
    color: #ffff00;
}

.error {
    color: #ff0000;
}
</style>
</head>
<body>
<div class="container">
    <h1>DEV DOC GENERATOR</h1>
    <div class="subtitle">Turn your debugging rage into AI-readable documentation</div>
    
    <div class="input-section">
        <h3>Describe Your Debugging Hell:</h3>
        <textarea id="debugInput" rows="8" placeholder="I've been trying to fix this FUCKING timeout error for 3 hours. The server just hangs with serve_forever() and won't respond. I tried using threads, background processes, even sacrificed a keyboard to the coding gods..."></textarea>
        
        <h3>Environment Context (Optional):</h3>
        <input type="text" id="envInput" placeholder="Python 3.11, macOS, HTTPServer" style="width:100%; background:#000; color:#0f0; border:1px solid #444; padding:10px; margin-top:10px;">
        
        <div style="margin-top: 15px;">
            <button onclick="generateDocs()">GENERATE AI DOCS</button>
            <button onclick="exportDocs()" id="exportBtn" style="display:none; background:#00ff00; color:#000;">EXPORT FOR AI</button>
        </div>
    </div>
    
    <div id="analysisResult" class="analysis-result"></div>
    
    <div class="knowledge-base">
        <h3>Knowledge Base Status</h3>
        <div id="knowledgeStatus">
            <p class="warning">Loading collective debugging wisdom...</p>
        </div>
    </div>
</div>

<script>
let currentSession = null;

async function generateDocs() {
    const debugText = document.getElementById('debugInput').value;
    const environment = document.getElementById('envInput').value;
    
    if (!debugText.trim()) return;
    
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            text: debugText,
            context: {
                environment: environment || 'Not specified'
            }
        })
    });
    
    const session = await response.json();
    currentSession = session;
    displayAnalysis(session);
}

function displayAnalysis(session) {
    const resultDiv = document.getElementById('analysisResult');
    const analysis = session.analysis;
    const aiDoc = session.ai_documentation;
    
    resultDiv.innerHTML = `
        <h3>Analysis Complete - Session: ${session.id}</h3>
        
        <div class="metric">
            <strong>Problem Type:</strong> ${analysis.problem_type.replace(/_/g, ' ').toUpperCase()}
            <span class="warning"> (${analysis.confidence.toFixed(1)}% confidence)</span>
        </div>
        
        <div class="metric">
            <strong>Frustration Level:</strong> <span class="error">${analysis.emotional_state.toUpperCase()}</span>
        </div>
        
        <div class="metric">
            <strong>Time Wasted:</strong> ${analysis.time_wasted}
        </div>
        
        <div class="metric">
            <strong>Detected Symptoms:</strong><br>
            ${analysis.detected_symptoms.map(s => '• ' + s).join('<br>') || 'None detected'}
        </div>
        
        <div class="metric">
            <strong>Error Messages:</strong><br>
            ${analysis.error_messages.map(e => '<span class="error">• ' + e + '</span>').join('<br>') || 'None found'}
        </div>
        
        <div class="metric">
            <strong>Recommended Approach:</strong><br>
            <span class="success">${analysis.recommended_approach}</span>
        </div>
        
        <h3>AI-Optimized Documentation:</h3>
        <div class="ai-doc">
${JSON.stringify(aiDoc, null, 2)}
        </div>
    `;
    
    resultDiv.style.display = 'block';
    document.getElementById('exportBtn').style.display = 'inline-block';
    resultDiv.scrollIntoView({behavior: 'smooth'});
}

async function exportDocs() {
    if (!currentSession) return;
    
    const response = await fetch(`/api/export/${currentSession.id}`);
    const exportData = await response.json();
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug_session_${currentSession.id}.json`;
    a.click();
    
    // Also copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    alert('Documentation exported and copied to clipboard!');
}

async function updateKnowledgeBase() {
    const response = await fetch('/api/knowledge');
    const knowledge = await response.json();
    
    const statusDiv = document.getElementById('knowledgeStatus');
    statusDiv.innerHTML = `
        <p class="success">Knowledge base contains solutions for:</p>
        ${Object.keys(knowledge).map(type => 
            `<div class="error-pattern">
                <strong>${type.replace(/_/g, ' ').toUpperCase()}</strong><br>
                Solutions: ${knowledge[type].proven_solutions.length}
            </div>`
        ).join('')}
    `;
}

// Load knowledge base on start
updateKnowledgeBase();
setInterval(updateKnowledgeBase, 30000);

// Ctrl+Enter to submit
document.getElementById('debugInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        generateDocs();
    }
});
</script>
</body>
</html>'''
            
            self.wfile.write(html.encode())
            
        elif self.path == '/api/knowledge':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(doc_generator.knowledge_base).encode())
            
        elif self.path.startswith('/api/export/'):
            session_id = self.path.split('/')[-1]
            export_data = doc_generator.export_for_ai(session_id)
            
            if export_data:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(export_data).encode())
            else:
                self.send_error(404, "Session not found")
                
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/api/generate':
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                session = doc_generator.process_debug_session(data)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(session).encode())
                
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        print(f"[DOC] {format % args}")

httpd = socketserver.TCPServer(("", PORT), DocHandler)
httpd.allow_reuse_address = True

print(f"\nDEV DOC GENERATOR: http://localhost:{PORT}")
print("\nThis turns your debugging pain into AI-readable documentation.")
print("\nFeatures:")
print("- Analyzes your debugging rants")
print("- Detects problem patterns")
print("- Measures frustration levels")
print("- Generates structured AI queries")
print("- Exports optimized documentation")
print("- Learns from collective suffering")
print("\nBetter than ChatGPT wrappers because it:")
print("- Understands developer frustration")
print("- Extracts real technical details")
print("- Formats queries for better AI responses")
print("- Remembers what actually worked")

httpd.serve_forever()