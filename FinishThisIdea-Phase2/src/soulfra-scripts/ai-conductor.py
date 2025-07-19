#!/usr/bin/env python3
"""
AI CONDUCTOR SYSTEM - The intelligent layer between users and AI builders
- Manages multiple LLM conversations
- Semantic clustering of ideas
- Tree of Thought chaining
- Closed-loop building system
- Project manager/narrator/prompt engineer
"""

import os
import json
import asyncio
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import hashlib
from collections import defaultdict
import sqlite3
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
import re

class AIConductor:
    """The conductor that orchestrates everything"""
    
    def __init__(self):
        self.db_path = "conductor_brain.db"
        self.vector_dim = 384  # Embedding dimension
        self.setup_conductor_brain()
        
    def setup_conductor_brain(self):
        """Initialize the conductor's brain"""
        conn = sqlite3.connect(self.db_path)
        
        # Conversation threads from multiple sources
        conn.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                source TEXT,  -- claude, gpt4, gemini, local, etc
                thread_id TEXT,
                content TEXT,
                timestamp TIMESTAMP,
                embedding BLOB,
                cluster_id INTEGER,
                importance_score REAL,
                processed BOOLEAN DEFAULT FALSE
            )
        ''')
        
        # Semantic clusters
        conn.execute('''
            CREATE TABLE IF NOT EXISTS semantic_clusters (
                id INTEGER PRIMARY KEY,
                theme TEXT,
                description TEXT,
                centroid BLOB,
                size INTEGER,
                quality_score REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tree of Thought chains
        conn.execute('''
            CREATE TABLE IF NOT EXISTS thought_chains (
                id TEXT PRIMARY KEY,
                parent_id TEXT,
                thought TEXT,
                reasoning TEXT,
                confidence REAL,
                path_score REAL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES thought_chains(id)
            )
        ''')
        
        # Project states and progress
        conn.execute('''
            CREATE TABLE IF NOT EXISTS project_states (
                id TEXT PRIMARY KEY,
                name TEXT,
                goal TEXT,
                current_state TEXT,
                next_actions TEXT,
                blockers TEXT,
                ai_assignments TEXT,  -- Which AI is working on what
                user_input_needed TEXT,
                progress REAL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # AI Builder status
        conn.execute('''
            CREATE TABLE IF NOT EXISTS ai_builders (
                id TEXT PRIMARY KEY,
                name TEXT,
                type TEXT,  -- gpt4, claude, local_llm, etc
                status TEXT,  -- idle, building, blocked, error
                current_task TEXT,
                capabilities TEXT,
                performance_score REAL,
                last_active TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        
        # Initialize AI builders
        self.register_ai_builders()
        
    def register_ai_builders(self):
        """Register available AI builders"""
        builders = [
            {
                'id': 'claude_builder',
                'name': 'Claude Architect',
                'type': 'claude',
                'capabilities': json.dumps(['code_generation', 'documentation', 'architecture'])
            },
            {
                'id': 'gpt4_builder',
                'name': 'GPT-4 Engineer',
                'type': 'gpt4',
                'capabilities': json.dumps(['problem_solving', 'optimization', 'testing'])
            },
            {
                'id': 'local_builder',
                'name': 'Local LLM Worker',
                'type': 'ollama',
                'capabilities': json.dumps(['simple_tasks', 'data_processing', 'validation'])
            },
            {
                'id': 'gemini_builder',
                'name': 'Gemini Analyst',
                'type': 'gemini',
                'capabilities': json.dumps(['analysis', 'research', 'planning'])
            }
        ]
        
        conn = sqlite3.connect(self.db_path)
        for builder in builders:
            conn.execute("""
                INSERT OR REPLACE INTO ai_builders 
                (id, name, type, status, capabilities, performance_score)
                VALUES (?, ?, ?, 'idle', ?, 1.0)
            """, (builder['id'], builder['name'], builder['type'], builder['capabilities']))
        conn.commit()
        conn.close()
        
    def ingest_conversation(self, source: str, content: str, thread_id: str = None):
        """Ingest conversation from any LLM source"""
        conv_id = str(hashlib.md5(f"{source}_{thread_id}_{datetime.now()}".encode()).hexdigest())[:12]
        
        # Generate embedding (simplified - in production use real embeddings)
        embedding = self.generate_embedding(content)
        
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            INSERT INTO conversations 
            (id, source, thread_id, content, timestamp, embedding, importance_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (conv_id, source, thread_id, content, datetime.now(), 
              embedding.tobytes(), self.calculate_importance(content)))
        conn.commit()
        conn.close()
        
        # Trigger clustering if enough new conversations
        self.check_and_cluster()
        
    def generate_embedding(self, text: str) -> np.ndarray:
        """Generate text embedding (simplified)"""
        # In production, use sentence-transformers or OpenAI embeddings
        # This is a simplified version
        words = text.lower().split()
        vec = np.zeros(self.vector_dim)
        
        for i, word in enumerate(words[:self.vector_dim]):
            vec[i % self.vector_dim] += hash(word) % 100 / 100.0
            
        # Normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
            
        return vec
        
    def calculate_importance(self, content: str) -> float:
        """Calculate importance score of content"""
        score = 0.0
        
        # Keywords that indicate importance
        important_keywords = [
            'error', 'fix', 'urgent', 'critical', 'important',
            'money', 'revenue', 'customer', 'launch', 'deadline',
            'breakthrough', 'idea', 'solution', 'working', 'success'
        ]
        
        content_lower = content.lower()
        for keyword in important_keywords:
            if keyword in content_lower:
                score += 0.1
                
        # Length indicates detail
        if len(content) > 500:
            score += 0.2
            
        # Questions are important
        if '?' in content:
            score += 0.1
            
        # Code blocks are important
        if '```' in content:
            score += 0.3
            
        return min(score, 1.0)
        
    def check_and_cluster(self):
        """Check if we need to run clustering"""
        conn = sqlite3.connect(self.db_path)
        
        # Count unprocessed conversations
        cursor = conn.execute("SELECT COUNT(*) FROM conversations WHERE processed = FALSE")
        unprocessed = cursor.fetchone()[0]
        
        if unprocessed >= 10:  # Cluster every 10 new conversations
            self.semantic_clustering()
            
        conn.close()
        
    def semantic_clustering(self):
        """Perform semantic clustering on conversations"""
        conn = sqlite3.connect(self.db_path)
        
        # Get all conversations with embeddings
        cursor = conn.execute("""
            SELECT id, embedding, importance_score 
            FROM conversations 
            WHERE embedding IS NOT NULL
        """)
        
        conversations = []
        embeddings = []
        
        for conv_id, embedding_blob, importance in cursor.fetchall():
            conversations.append((conv_id, importance))
            embedding = np.frombuffer(embedding_blob, dtype=np.float64).reshape(-1)
            embeddings.append(embedding)
            
        if len(embeddings) < 2:
            conn.close()
            return
            
        # Convert to numpy array
        X = np.array(embeddings)
        
        # Perform DBSCAN clustering
        clustering = DBSCAN(eps=0.3, min_samples=2, metric='cosine')
        labels = clustering.fit_predict(X)
        
        # Update conversation clusters
        for i, (conv_id, _) in enumerate(conversations):
            conn.execute("""
                UPDATE conversations 
                SET cluster_id = ?, processed = TRUE 
                WHERE id = ?
            """, (int(labels[i]), conv_id))
            
        # Calculate cluster themes
        unique_labels = set(labels)
        for label in unique_labels:
            if label == -1:  # Noise
                continue
                
            # Get conversations in this cluster
            cluster_indices = [i for i, l in enumerate(labels) if l == label]
            cluster_embeddings = X[cluster_indices]
            
            # Calculate centroid
            centroid = np.mean(cluster_embeddings, axis=0)
            
            # Generate theme (simplified - in production use LLM)
            theme = f"Cluster {label}"
            description = f"Semantic cluster with {len(cluster_indices)} conversations"
            
            conn.execute("""
                INSERT OR REPLACE INTO semantic_clusters 
                (id, theme, description, centroid, size, quality_score)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (label, theme, description, centroid.tobytes(), 
                  len(cluster_indices), 0.8))
                  
        conn.commit()
        conn.close()
        
    def tree_of_thought(self, goal: str, max_depth: int = 5) -> List[Dict]:
        """Generate tree of thought for achieving a goal"""
        root_id = str(hashlib.md5(goal.encode()).hexdigest())[:12]
        
        conn = sqlite3.connect(self.db_path)
        
        # Create root thought
        conn.execute("""
            INSERT OR REPLACE INTO thought_chains 
            (id, parent_id, thought, reasoning, confidence, path_score)
            VALUES (?, NULL, ?, 'Root goal', 1.0, 1.0)
        """, (root_id, goal))
        
        # Generate child thoughts
        thoughts = self._generate_thoughts(goal, root_id, 0, max_depth, conn)
        
        conn.commit()
        conn.close()
        
        return thoughts
        
    def _generate_thoughts(self, parent_thought: str, parent_id: str, 
                          depth: int, max_depth: int, conn) -> List[Dict]:
        """Recursively generate thoughts"""
        if depth >= max_depth:
            return []
            
        # Generate possible next thoughts (simplified)
        next_thoughts = self._brainstorm_next_steps(parent_thought)
        
        thought_list = []
        for thought, reasoning, confidence in next_thoughts:
            thought_id = str(hashlib.md5(f"{thought}_{parent_id}".encode()).hexdigest())[:12]
            
            # Calculate path score
            parent_score = conn.execute(
                "SELECT path_score FROM thought_chains WHERE id = ?", 
                (parent_id,)
            ).fetchone()[0]
            path_score = parent_score * confidence
            
            # Insert thought
            conn.execute("""
                INSERT OR REPLACE INTO thought_chains 
                (id, parent_id, thought, reasoning, confidence, path_score)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (thought_id, parent_id, thought, reasoning, confidence, path_score))
            
            thought_dict = {
                'id': thought_id,
                'thought': thought,
                'reasoning': reasoning,
                'confidence': confidence,
                'path_score': path_score,
                'children': self._generate_thoughts(thought, thought_id, depth + 1, max_depth, conn)
            }
            
            thought_list.append(thought_dict)
            
        return thought_list
        
    def _brainstorm_next_steps(self, thought: str) -> List[Tuple[str, str, float]]:
        """Brainstorm next steps for a thought"""
        # In production, use LLM for this
        # Simplified version based on keywords
        
        next_steps = []
        
        if 'build' in thought.lower():
            next_steps.extend([
                ("Design the architecture", "Need blueprint before building", 0.9),
                ("Set up development environment", "Required for implementation", 0.8),
                ("Create MVP prototype", "Test core concept quickly", 0.7)
            ])
        elif 'process' in thought.lower():
            next_steps.extend([
                ("Analyze input format", "Understand data structure", 0.9),
                ("Create processing pipeline", "Systematic approach", 0.8),
                ("Implement error handling", "Robust processing", 0.7)
            ])
        elif 'earn' in thought.lower() or 'money' in thought.lower():
            next_steps.extend([
                ("Identify revenue streams", "Multiple income sources", 0.9),
                ("Build monetization features", "Enable transactions", 0.8),
                ("Create pricing strategy", "Optimize revenue", 0.7)
            ])
        else:
            # Generic steps
            next_steps.extend([
                ("Break down into subtasks", "Simplify complexity", 0.8),
                ("Research best practices", "Learn from others", 0.7),
                ("Create action plan", "Clear path forward", 0.6)
            ])
            
        return next_steps
        
    def orchestrate_project(self, project_name: str, goal: str) -> Dict:
        """Orchestrate a complete project with AI builders"""
        project_id = str(hashlib.md5(project_name.encode()).hexdigest())[:12]
        
        # Create project
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            INSERT OR REPLACE INTO project_states 
            (id, name, goal, current_state, progress)
            VALUES (?, ?, ?, 'initialized', 0.0)
        """, (project_id, project_name, goal))
        
        # Generate tree of thought
        thought_tree = self.tree_of_thought(goal)
        
        # Find best path
        best_path = self._find_best_path(thought_tree)
        
        # Assign tasks to AI builders
        assignments = self._assign_tasks_to_builders(best_path, conn)
        
        # Update project with assignments
        conn.execute("""
            UPDATE project_states 
            SET ai_assignments = ?, next_actions = ?
            WHERE id = ?
        """, (json.dumps(assignments), json.dumps(best_path[:3]), project_id))
        
        conn.commit()
        conn.close()
        
        return {
            'project_id': project_id,
            'thought_tree': thought_tree,
            'best_path': best_path,
            'ai_assignments': assignments
        }
        
    def _find_best_path(self, thought_tree: List[Dict]) -> List[str]:
        """Find the best path through thought tree"""
        best_path = []
        
        def traverse(node, path):
            current_path = path + [node['thought']]
            
            if not node['children']:
                return current_path, node['path_score']
                
            best_child_path = current_path
            best_score = node['path_score']
            
            for child in node['children']:
                child_path, child_score = traverse(child, current_path)
                if child_score > best_score:
                    best_child_path = child_path
                    best_score = child_score
                    
            return best_child_path, best_score
            
        # Find best path from each root thought
        all_paths = []
        for root in thought_tree:
            path, score = traverse(root, [])
            all_paths.append((path, score))
            
        # Return path with highest score
        if all_paths:
            best_path = max(all_paths, key=lambda x: x[1])[0]
        
        return best_path
        
    def _assign_tasks_to_builders(self, tasks: List[str], conn) -> Dict[str, str]:
        """Assign tasks to appropriate AI builders"""
        assignments = {}
        
        # Get available builders
        cursor = conn.execute("""
            SELECT id, name, capabilities, performance_score 
            FROM ai_builders 
            WHERE status = 'idle'
            ORDER BY performance_score DESC
        """)
        
        builders = []
        for builder_id, name, caps_json, score in cursor.fetchall():
            builders.append({
                'id': builder_id,
                'name': name,
                'capabilities': json.loads(caps_json),
                'score': score
            })
            
        # Assign tasks based on capabilities
        for task in tasks[:len(builders)]:  # Only assign available builders
            best_builder = None
            best_match = 0
            
            for builder in builders:
                if builder['id'] in assignments.values():
                    continue
                    
                # Simple capability matching
                match_score = 0
                task_lower = task.lower()
                
                if 'code' in task_lower and 'code_generation' in builder['capabilities']:
                    match_score += 1
                if 'design' in task_lower and 'architecture' in builder['capabilities']:
                    match_score += 1
                if 'test' in task_lower and 'testing' in builder['capabilities']:
                    match_score += 1
                if 'analyze' in task_lower and 'analysis' in builder['capabilities']:
                    match_score += 1
                    
                if match_score > best_match:
                    best_match = match_score
                    best_builder = builder
                    
            if best_builder:
                assignments[task] = best_builder['id']
                
                # Update builder status
                conn.execute("""
                    UPDATE ai_builders 
                    SET status = 'building', current_task = ?, last_active = ?
                    WHERE id = ?
                """, (task, datetime.now(), best_builder['id']))
                
        return assignments
        
    def get_conductor_insights(self) -> Dict:
        """Get insights from the conductor"""
        conn = sqlite3.connect(self.db_path)
        
        # Get cluster information
        cursor = conn.execute("""
            SELECT COUNT(DISTINCT cluster_id) as num_clusters,
                   COUNT(*) as total_conversations,
                   AVG(importance_score) as avg_importance
            FROM conversations
            WHERE cluster_id IS NOT NULL
        """)
        
        cluster_stats = cursor.fetchone()
        
        # Get active projects
        cursor = conn.execute("""
            SELECT name, goal, progress, ai_assignments
            FROM project_states
            WHERE progress < 1.0
            ORDER BY updated_at DESC
        """)
        
        active_projects = []
        for name, goal, progress, assignments in cursor.fetchall():
            active_projects.append({
                'name': name,
                'goal': goal,
                'progress': progress,
                'assignments': json.loads(assignments) if assignments else {}
            })
            
        # Get builder status
        cursor = conn.execute("""
            SELECT name, status, current_task, performance_score
            FROM ai_builders
            ORDER BY performance_score DESC
        """)
        
        builders = []
        for name, status, task, score in cursor.fetchall():
            builders.append({
                'name': name,
                'status': status,
                'current_task': task,
                'performance': score
            })
            
        conn.close()
        
        return {
            'clusters': {
                'count': cluster_stats[0] or 0,
                'total_conversations': cluster_stats[1] or 0,
                'avg_importance': cluster_stats[2] or 0
            },
            'active_projects': active_projects,
            'ai_builders': builders
        }

# Conductor Web Interface
CONDUCTOR_INTERFACE_HTML = '''
<!DOCTYPE html>
<html>
<head>
    <title> AI Conductor - Orchestrating Intelligence</title>
    <style>
        body {
            font-family: -apple-system, Arial, sans-serif;
            background: #0a0a0a;
            color: #fff;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 48px;
            margin: 0;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .conductor-grid {
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .panel {
            background: #1a1a1a;
            border-radius: 15px;
            padding: 25px;
            border: 1px solid #333;
        }
        .conversation-input {
            width: 100%;
            min-height: 150px;
            background: #2a2a2a;
            border: 1px solid #444;
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-size: 16px;
            margin-bottom: 15px;
        }
        .source-select {
            width: 100%;
            padding: 10px;
            background: #2a2a2a;
            border: 1px solid #444;
            color: white;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        .submit-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(45deg, #4ecdc4, #45b7d1);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(78, 205, 196, 0.4);
        }
        .thought-tree {
            position: relative;
            min-height: 400px;
        }
        .thought-node {
            background: #2a2a2a;
            padding: 15px;
            border-radius: 10px;
            margin: 10px 0;
            border-left: 4px solid #4ecdc4;
            transition: all 0.3s;
        }
        .thought-node:hover {
            background: #3a3a3a;
            transform: translateX(5px);
        }
        .confidence-bar {
            height: 4px;
            background: #333;
            border-radius: 2px;
            margin-top: 10px;
            overflow: hidden;
        }
        .confidence-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
            transition: width 0.3s;
        }
        .cluster-viz {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 20px 0;
        }
        .cluster-bubble {
            background: #2a2a2a;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            transition: all 0.3s;
            cursor: pointer;
        }
        .cluster-bubble:hover {
            background: #3a3a3a;
            transform: scale(1.05);
        }
        .ai-builder {
            background: #2a2a2a;
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 10px;
        }
        .status-idle { background: #4ecdc4; }
        .status-building { background: #ffd93d; animation: pulse 1s infinite; }
        .status-blocked { background: #ff6b6b; }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .project-card {
            background: #2a2a2a;
            padding: 20px;
            margin: 15px 0;
            border-radius: 10px;
            border: 1px solid #333;
        }
        .progress-bar {
            height: 8px;
            background: #333;
            border-radius: 4px;
            margin: 10px 0;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4ecdc4, #45b7d1);
            transition: width 0.5s;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1> AI Conductor</h1>
            <p style="color: #888; font-size: 20px;">Orchestrating Multiple AIs into Coherent Intelligence</p>
        </div>
        
        <div class="conductor-grid">
            <!-- Input Panel -->
            <div class="panel">
                <h3> Conversation Input</h3>
                <select class="source-select" id="sourceSelect">
                    <option value="claude">Claude</option>
                    <option value="gpt4">GPT-4</option>
                    <option value="gemini">Gemini</option>
                    <option value="local">Local LLM</option>
                    <option value="other">Other</option>
                </select>
                
                <textarea class="conversation-input" id="conversationInput" 
                    placeholder="Paste your conversation here..."></textarea>
                
                <button class="submit-btn" onclick="ingestConversation()">
                     Process Conversation
                </button>
                
                <div style="margin-top: 30px;">
                    <h4> Semantic Clusters</h4>
                    <div class="cluster-viz" id="clusterViz">
                        <!-- Clusters will appear here -->
                    </div>
                </div>
            </div>
            
            <!-- Central Orchestration -->
            <div class="panel">
                <h3> Tree of Thought</h3>
                <div style="margin-bottom: 20px;">
                    <input type="text" id="goalInput" placeholder="What's your goal?" 
                           style="width: 70%; padding: 10px; background: #2a2a2a; border: 1px solid #444; color: white; border-radius: 5px;">
                    <button onclick="generateThoughtTree()" 
                            style="width: 25%; padding: 10px; background: #4ecdc4; border: none; border-radius: 5px; color: white; cursor: pointer; margin-left: 10px;">
                        Generate
                    </button>
                </div>
                
                <div class="thought-tree" id="thoughtTree">
                    <!-- Thought tree visualization -->
                </div>
                
                <div style="margin-top: 30px;">
                    <h4> Active Projects</h4>
                    <div id="activeProjects">
                        <!-- Active projects -->
                    </div>
                </div>
            </div>
            
            <!-- AI Builders Status -->
            <div class="panel">
                <h3> AI Builders</h3>
                <div id="aiBuilders">
                    <div class="ai-builder">
                        <div>
                            <span class="status-indicator status-idle"></span>
                            <strong>Claude Architect</strong>
                        </div>
                        <span style="color: #888;">Idle</span>
                    </div>
                    <div class="ai-builder">
                        <div>
                            <span class="status-indicator status-building"></span>
                            <strong>GPT-4 Engineer</strong>
                        </div>
                        <span style="color: #888;">Building UI</span>
                    </div>
                    <div class="ai-builder">
                        <div>
                            <span class="status-indicator status-idle"></span>
                            <strong>Local Worker</strong>
                        </div>
                        <span style="color: #888;">Idle</span>
                    </div>
                    <div class="ai-builder">
                        <div>
                            <span class="status-indicator status-blocked"></span>
                            <strong>Gemini Analyst</strong>
                        </div>
                        <span style="color: #888;">Needs Input</span>
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <h4> Conductor Insights</h4>
                    <div id="insights" style="background: #2a2a2a; padding: 15px; border-radius: 10px;">
                        <p>Loading insights...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="panel" style="text-align: center;">
            <h3> Orchestrate New Project</h3>
            <div style="display: flex; gap: 10px; justify-content: center; align-items: center;">
                <input type="text" id="projectName" placeholder="Project name..." 
                       style="padding: 15px; background: #2a2a2a; border: 1px solid #444; color: white; border-radius: 10px; flex: 1;">
                <input type="text" id="projectGoal" placeholder="Project goal..." 
                       style="padding: 15px; background: #2a2a2a; border: 1px solid #444; color: white; border-radius: 10px; flex: 2;">
                <button onclick="orchestrateProject()" 
                        style="padding: 15px 30px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border: none; border-radius: 10px; color: white; font-size: 18px; font-weight: bold; cursor: pointer;">
                     Start Orchestration
                </button>
            </div>
        </div>
    </div>
    
    <script>
        // WebSocket connection to conductor
        let ws = null;
        
        function connect() {
            ws = new WebSocket('ws://localhost:8282');
            
            ws.onopen = () => {
                console.log('Connected to AI Conductor');
                loadInsights();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleUpdate(data);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            ws.onclose = () => {
                setTimeout(connect, 3000);
            };
        }
        
        function ingestConversation() {
            const source = document.getElementById('sourceSelect').value;
            const content = document.getElementById('conversationInput').value;
            
            if (!content.trim()) return;
            
            ws.send(JSON.stringify({
                action: 'ingest',
                source: source,
                content: content
            }));
            
            document.getElementById('conversationInput').value = '';
        }
        
        function generateThoughtTree() {
            const goal = document.getElementById('goalInput').value;
            if (!goal.trim()) return;
            
            ws.send(JSON.stringify({
                action: 'thought_tree',
                goal: goal
            }));
        }
        
        function orchestrateProject() {
            const name = document.getElementById('projectName').value;
            const goal = document.getElementById('projectGoal').value;
            
            if (!name.trim() || !goal.trim()) return;
            
            ws.send(JSON.stringify({
                action: 'orchestrate',
                name: name,
                goal: goal
            }));
            
            document.getElementById('projectName').value = '';
            document.getElementById('projectGoal').value = '';
        }
        
        function handleUpdate(data) {
            if (data.type === 'clusters') {
                updateClusters(data.clusters);
            } else if (data.type === 'thought_tree') {
                displayThoughtTree(data.tree);
            } else if (data.type === 'insights') {
                updateInsights(data.insights);
            } else if (data.type === 'project_update') {
                updateProjects(data.projects);
            }
        }
        
        function updateClusters(clusters) {
            const viz = document.getElementById('clusterViz');
            viz.innerHTML = clusters.map((cluster, i) => `
                <div class="cluster-bubble" style="background: hsl(${i * 60}, 50%, 30%);">
                    ${cluster.theme} (${cluster.size})
                </div>
            `).join('');
        }
        
        function displayThoughtTree(tree) {
            const container = document.getElementById('thoughtTree');
            container.innerHTML = renderThoughtNode(tree[0], 0);
        }
        
        function renderThoughtNode(node, depth) {
            if (!node) return '';
            
            const indent = depth * 30;
            return `
                <div class="thought-node" style="margin-left: ${indent}px;">
                    <div>${node.thought}</div>
                    <div style="font-size: 12px; color: #888;">${node.reasoning}</div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${node.confidence * 100}%"></div>
                    </div>
                </div>
                ${node.children ? node.children.map(child => renderThoughtNode(child, depth + 1)).join('') : ''}
            `;
        }
        
        function updateInsights(insights) {
            const container = document.getElementById('insights');
            container.innerHTML = `
                <p> Clusters: ${insights.clusters.count}</p>
                <p> Conversations: ${insights.clusters.total_conversations}</p>
                <p> Avg Importance: ${(insights.clusters.avg_importance * 100).toFixed(1)}%</p>
            `;
        }
        
        function loadInsights() {
            ws.send(JSON.stringify({ action: 'get_insights' }));
        }
        
        // Initialize
        connect();
        setInterval(loadInsights, 5000);
    </script>
</body>
</html>
'''

# WebSocket server for real-time updates
import websockets
import json as json_module

class ConductorServer:
    def __init__(self):
        self.conductor = AIConductor()
        self.clients = set()
        
    async def handle_client(self, websocket, path):
        self.clients.add(websocket)
        try:
            async for message in websocket:
                data = json_module.loads(message)
                await self.process_message(websocket, data)
        finally:
            self.clients.remove(websocket)
            
    async def process_message(self, websocket, data):
        action = data.get('action')
        
        if action == 'ingest':
            self.conductor.ingest_conversation(
                data['source'], 
                data['content']
            )
            # Send cluster update
            await self.broadcast_clusters()
            
        elif action == 'thought_tree':
            tree = self.conductor.tree_of_thought(data['goal'])
            await websocket.send(json_module.dumps({
                'type': 'thought_tree',
                'tree': tree
            }))
            
        elif action == 'orchestrate':
            result = self.conductor.orchestrate_project(
                data['name'],
                data['goal']
            )
            await self.broadcast_projects()
            
        elif action == 'get_insights':
            insights = self.conductor.get_conductor_insights()
            await websocket.send(json_module.dumps({
                'type': 'insights',
                'insights': insights
            }))
            
    async def broadcast_clusters(self):
        # Get cluster data
        conn = sqlite3.connect(self.conductor.db_path)
        cursor = conn.execute("""
            SELECT id, theme, size 
            FROM semantic_clusters 
            ORDER BY size DESC 
            LIMIT 10
        """)
        
        clusters = []
        for cluster_id, theme, size in cursor.fetchall():
            clusters.append({
                'id': cluster_id,
                'theme': theme,
                'size': size
            })
            
        conn.close()
        
        message = json_module.dumps({
            'type': 'clusters',
            'clusters': clusters
        })
        
        # Broadcast to all clients
        if self.clients:
            await asyncio.gather(
                *[client.send(message) for client in self.clients]
            )
            
    async def broadcast_projects(self):
        insights = self.conductor.get_conductor_insights()
        
        message = json_module.dumps({
            'type': 'project_update',
            'projects': insights['active_projects']
        })
        
        if self.clients:
            await asyncio.gather(
                *[client.send(message) for client in self.clients]
            )

# HTTP server for the interface
from http.server import HTTPServer, BaseHTTPRequestHandler

class ConductorHTTPHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(CONDUCTOR_INTERFACE_HTML.encode())
        else:
            self.send_error(404)

async def run_conductor():
    # Start WebSocket server
    ws_server = ConductorServer()
    ws_task = websockets.serve(ws_server.handle_client, 'localhost', 8282)
    
    # Start HTTP server in thread
    http_server = HTTPServer(('localhost', 8383), ConductorHTTPHandler)
    
    import threading
    http_thread = threading.Thread(target=http_server.serve_forever)
    http_thread.daemon = True
    http_thread.start()
    
    print("""

                     AI CONDUCTOR SYSTEM                      

                                                                
  The intelligent orchestration layer that:                     
                                                                
   Manages multiple LLM conversations                        
   Performs semantic clustering                              
   Creates Tree of Thought chains                           
   Orchestrates AI builders in closed loops                 
   Acts as project manager/narrator/prompt engineer         
                                                                

  Access at: http://localhost:8383                              
                                                                
  How to use:                                                   
  1. Paste conversations from any LLM                          
  2. Watch semantic clusters form                              
  3. Generate thought trees for goals                          
  4. Orchestrate projects with AI builders                     
                                                                

    """)
    
    # Run WebSocket server
    await ws_task

if __name__ == "__main__":
    # Save this as a separate launch script
    launch_script = '''#!/bin/bash
echo " Starting AI Conductor System..."
python3 AI_CONDUCTOR_SYSTEM.py
'''
    
    with open('LAUNCH_CONDUCTOR.sh', 'w') as f:
        f.write(launch_script)
    os.chmod('LAUNCH_CONDUCTOR.sh', 0o755)
    
    # Run the conductor
    asyncio.run(run_conductor())