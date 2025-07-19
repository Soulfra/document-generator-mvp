#!/usr/bin/env python3
"""
DOMAIN BUSINESS MATCHER - Match your 100 GoDaddy domains to business ideas
Extracts ideas from chat logs and matches them to available domains
"""

import json
import sqlite3
import requests
from datetime import datetime
import os
import re
from pathlib import Path

class DomainBusinessMatcher:
    """Match domains to business ideas and create implementation plans"""
    
    def __init__(self):
        self.db_path = "domain_business_ideas.db"
        self.ollama_url = "http://localhost:11434/api/generate"
        self.init_database()
        
    def init_database(self):
        """Create database for domains and business ideas"""
        conn = sqlite3.connect(self.db_path)
        
        # Domains table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS domains (
                id INTEGER PRIMARY KEY,
                domain TEXT UNIQUE,
                registrar TEXT DEFAULT 'GoDaddy',
                status TEXT DEFAULT 'available',
                matched_idea_id INTEGER,
                implementation_status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Business ideas table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS business_ideas (
                id INTEGER PRIMARY KEY,
                title TEXT,
                description TEXT,
                source_file TEXT,
                revenue_model TEXT,
                estimated_revenue TEXT,
                implementation_time TEXT,
                complexity TEXT,
                extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Matches table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS domain_matches (
                id INTEGER PRIMARY KEY,
                domain_id INTEGER,
                idea_id INTEGER,
                match_score REAL,
                implementation_plan TEXT,
                priority INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (domain_id) REFERENCES domains(id),
                FOREIGN KEY (idea_id) REFERENCES business_ideas(id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def load_domains_from_file(self, domains_file="my_domains.txt"):
        """Load your GoDaddy domains from a text file"""
        conn = sqlite3.connect(self.db_path)
        
        if os.path.exists(domains_file):
            with open(domains_file, 'r') as f:
                domains = [line.strip() for line in f if line.strip()]
                
            for domain in domains:
                try:
                    conn.execute(
                        "INSERT OR IGNORE INTO domains (domain) VALUES (?)",
                        (domain,)
                    )
                except Exception as e:
                    print(f"Error adding domain {domain}: {e}")
                    
            conn.commit()
            print(f"Loaded {len(domains)} domains")
        else:
            print(f"Please create {domains_file} with your domains (one per line)")
            
        conn.close()
    
    def extract_ideas_from_chat_logs(self):
        """Extract business ideas from processed chat logs"""
        conn = sqlite3.connect(self.db_path)
        
        # Check generated_docs directory for processed files
        docs_dir = Path("generated_docs")
        if docs_dir.exists():
            for doc_file in docs_dir.glob("*_docs.md"):
                content = doc_file.read_text()
                ideas = self.parse_business_ideas(content, str(doc_file))
                
                for idea in ideas:
                    try:
                        conn.execute('''
                            INSERT OR IGNORE INTO business_ideas 
                            (title, description, source_file, revenue_model, 
                             estimated_revenue, implementation_time, complexity)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', idea)
                    except Exception as e:
                        print(f"Error saving idea: {e}")
                        
        # Also check AI tasks directory
        tasks_dir = Path("ai_tasks")
        if tasks_dir.exists():
            for task_file in tasks_dir.glob("*_tasks.json"):
                try:
                    with open(task_file) as f:
                        tasks = json.load(f)
                        for task in tasks.get('tasks', []):
                            if 'business' in task.get('type', '').lower():
                                idea = (
                                    task.get('title', 'Untitled'),
                                    task.get('description', ''),
                                    str(task_file),
                                    task.get('revenue_model', 'subscription'),
                                    task.get('revenue_potential', 'Unknown'),
                                    task.get('time_estimate', '1 week'),
                                    task.get('complexity', 'medium')
                                )
                                conn.execute('''
                                    INSERT OR IGNORE INTO business_ideas 
                                    (title, description, source_file, revenue_model, 
                                     estimated_revenue, implementation_time, complexity)
                                    VALUES (?, ?, ?, ?, ?, ?, ?)
                                ''', idea)
                except Exception as e:
                    print(f"Error processing {task_file}: {e}")
                    
        conn.commit()
        conn.close()
    
    def parse_business_ideas(self, content, source_file):
        """Parse business ideas from documentation content"""
        ideas = []
        
        # Look for business idea patterns
        patterns = [
            r"Business Idea:?\s*(.+)",
            r"Opportunity:?\s*(.+)",
            r"Revenue Stream:?\s*(.+)",
            r"Product:?\s*(.+)",
            r"Service:?\s*(.+)"
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                # Extract details using Ollama
                idea_details = self.analyze_idea_with_ollama(match)
                ideas.append((
                    idea_details.get('title', match[:100]),
                    idea_details.get('description', match),
                    source_file,
                    idea_details.get('revenue_model', 'subscription'),
                    idea_details.get('estimated_revenue', '$1K-10K/month'),
                    idea_details.get('implementation_time', '1-2 weeks'),
                    idea_details.get('complexity', 'medium')
                ))
                
        return ideas
    
    def analyze_idea_with_ollama(self, idea_text):
        """Use Ollama to analyze and structure business idea"""
        try:
            response = requests.post(self.ollama_url, json={
                "model": "mistral",
                "prompt": f"""Analyze this business idea and provide structured data:
                
                Idea: {idea_text}
                
                Provide:
                1. Title (short, catchy)
                2. Description (one paragraph)
                3. Revenue model (subscription/one-time/commission/ads)
                4. Estimated revenue potential
                5. Implementation time
                6. Complexity (simple/medium/complex)
                
                Format as JSON.""",
                "stream": False
            })
            
            if response.status_code == 200:
                result = response.json().get('response', '')
                # Try to parse JSON from response
                try:
                    import json
                    # Find JSON in response
                    json_start = result.find('{')
                    json_end = result.rfind('}') + 1
                    if json_start >= 0 and json_end > json_start:
                        return json.loads(result[json_start:json_end])
                except:
                    pass
                    
        except Exception as e:
            print(f"Ollama analysis error: {e}")
            
        # Fallback
        return {
            'title': idea_text[:50],
            'description': idea_text,
            'revenue_model': 'subscription',
            'estimated_revenue': 'TBD',
            'implementation_time': '1-2 weeks',
            'complexity': 'medium'
        }
    
    def match_domains_to_ideas(self):
        """Match domains to business ideas based on relevance"""
        conn = sqlite3.connect(self.db_path)
        
        domains = conn.execute("SELECT id, domain FROM domains WHERE matched_idea_id IS NULL").fetchall()
        ideas = conn.execute("SELECT id, title, description FROM business_ideas").fetchall()
        
        for domain_id, domain in domains:
            domain_words = set(domain.lower().replace('-', ' ').replace('.', ' ').split())
            best_match = None
            best_score = 0
            
            for idea_id, title, description in ideas:
                # Calculate match score
                idea_text = f"{title} {description}".lower()
                idea_words = set(idea_text.split())
                
                # Score based on word overlap
                common_words = domain_words.intersection(idea_words)
                score = len(common_words) / max(len(domain_words), 1)
                
                # Bonus for exact domain name in idea
                if domain.lower() in idea_text:
                    score += 1.0
                    
                if score > best_score:
                    best_score = score
                    best_match = idea_id
                    
            if best_match and best_score > 0.2:  # Threshold for match
                # Create implementation plan
                plan = self.create_implementation_plan(domain, best_match)
                
                conn.execute('''
                    INSERT INTO domain_matches (domain_id, idea_id, match_score, implementation_plan, priority)
                    VALUES (?, ?, ?, ?, ?)
                ''', (domain_id, best_match, best_score, plan, int(best_score * 10)))
                
                conn.execute(
                    "UPDATE domains SET matched_idea_id = ? WHERE id = ?",
                    (best_match, domain_id)
                )
                
        conn.commit()
        conn.close()
    
    def create_implementation_plan(self, domain, idea_id):
        """Create implementation plan using Ollama"""
        conn = sqlite3.connect(self.db_path)
        idea = conn.execute(
            "SELECT title, description, revenue_model FROM business_ideas WHERE id = ?",
            (idea_id,)
        ).fetchone()
        conn.close()
        
        if not idea:
            return "No implementation plan available"
            
        try:
            response = requests.post(self.ollama_url, json={
                "model": "mistral",
                "prompt": f"""Create a simple implementation plan for:
                
                Domain: {domain}
                Business: {idea[0]}
                Description: {idea[1]}
                Revenue Model: {idea[2]}
                
                Provide a 5-step plan to launch this in 48 hours.""",
                "stream": False
            })
            
            if response.status_code == 200:
                return response.json().get('response', 'Implementation plan pending')
                
        except Exception as e:
            print(f"Plan generation error: {e}")
            
        return "Manual implementation required"
    
    def generate_report(self):
        """Generate report of domains and matched business ideas"""
        conn = sqlite3.connect(self.db_path)
        
        # Get statistics
        total_domains = conn.execute("SELECT COUNT(*) FROM domains").fetchone()[0]
        matched_domains = conn.execute("SELECT COUNT(*) FROM domains WHERE matched_idea_id IS NOT NULL").fetchone()[0]
        total_ideas = conn.execute("SELECT COUNT(*) FROM business_ideas").fetchone()[0]
        
        print("\n=== DOMAIN BUSINESS MATCHER REPORT ===")
        print(f"Total Domains: {total_domains}")
        print(f"Matched Domains: {matched_domains}")
        print(f"Total Business Ideas: {total_ideas}")
        print(f"Unmatched Domains: {total_domains - matched_domains}")
        
        # Get top matches
        print("\n=== TOP 10 DOMAIN MATCHES ===")
        matches = conn.execute('''
            SELECT d.domain, b.title, b.estimated_revenue, b.implementation_time, m.match_score
            FROM domain_matches m
            JOIN domains d ON m.domain_id = d.id
            JOIN business_ideas b ON m.idea_id = b.id
            ORDER BY m.priority DESC, m.match_score DESC
            LIMIT 10
        ''').fetchall()
        
        for i, (domain, title, revenue, time, score) in enumerate(matches, 1):
            print(f"\n{i}. {domain}")
            print(f"   Business: {title}")
            print(f"   Revenue: {revenue}")
            print(f"   Time: {time}")
            print(f"   Match Score: {score:.2f}")
            
        # Save full report
        report = {
            'generated_at': datetime.now().isoformat(),
            'statistics': {
                'total_domains': total_domains,
                'matched_domains': matched_domains,
                'total_ideas': total_ideas
            },
            'top_matches': [
                {
                    'domain': m[0],
                    'business': m[1],
                    'revenue': m[2],
                    'implementation_time': m[3],
                    'score': m[4]
                }
                for m in matches
            ]
        }
        
        with open('domain_business_report.json', 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"\nFull report saved to: domain_business_report.json")
        
        conn.close()

def main():
    matcher = DomainBusinessMatcher()
    
    print("DOMAIN BUSINESS MATCHER")
    print("======================")
    
    # Load domains (create my_domains.txt first)
    print("\n1. Loading domains...")
    matcher.load_domains_from_file()
    
    # Extract ideas from chat logs
    print("\n2. Extracting business ideas from chat logs...")
    matcher.extract_ideas_from_chat_logs()
    
    # Match domains to ideas
    print("\n3. Matching domains to business ideas...")
    matcher.match_domains_to_ideas()
    
    # Generate report
    print("\n4. Generating report...")
    matcher.generate_report()
    
    print("\nDone! Check domain_business_report.json for matches")

if __name__ == "__main__":
    main()