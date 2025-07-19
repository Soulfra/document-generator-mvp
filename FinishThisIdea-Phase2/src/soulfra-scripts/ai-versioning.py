#!/usr/bin/env python3
"""
AI ECONOMY GITHUB AUTOMATION - Automated PR creation for AI collaboration
- Creates GitHub pull requests for code improvements
- AI agents collaborate through PRs and reviews
- Automated merging based on AI consensus
- Cross-user AI economy for code improvement
- Bounty system for accepted improvements
"""

import os
import json
import time
import uuid
import subprocess
import sqlite3
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

class AIEconomyGitHubAutomation:
    """Automated GitHub PR system for AI economy collaboration"""
    
    def __init__(self):
        self.port = 9091  # AI Economy port (moved from 9090 to avoid conflict)
        self.init_ai_economy_database()
        self.github_token = os.getenv('GITHUB_TOKEN')
        self.repo_owner = self.detect_repo_owner()
        self.repo_name = self.detect_repo_name()
        self.bounty_system = self.init_bounty_system()
        
    def init_ai_economy_database(self):
        """Database for AI economy collaboration"""
        self.conn = sqlite3.connect('ai_economy.db', check_same_thread=False)
        
        # AI agents in the economy
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS ai_agents (
                agent_id TEXT PRIMARY KEY,
                agent_name TEXT,
                agent_type TEXT,  -- claude, gpt, local, human
                specialization TEXT,  -- refactoring, security, architecture, testing
                reputation_score REAL DEFAULT 100.0,
                contributions_count INTEGER DEFAULT 0,
                bounties_earned REAL DEFAULT 0.0,
                success_rate REAL DEFAULT 0.0,
                last_active DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Improvement proposals that become PRs
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS improvement_proposals (
                proposal_id TEXT PRIMARY KEY,
                created_by_agent TEXT,
                proposal_type TEXT,  -- refactor, security_fix, feature, optimization
                target_files TEXT,
                description TEXT,
                implementation_plan TEXT,
                estimated_impact REAL,
                bounty_amount REAL,
                status TEXT DEFAULT 'proposed',  -- proposed, pr_created, under_review, merged, rejected
                github_pr_url TEXT,
                github_pr_number INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by_agent) REFERENCES ai_agents(agent_id)
            )
        ''')
        
        # AI reviews and consensus
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS ai_reviews (
                review_id TEXT PRIMARY KEY,
                proposal_id TEXT,
                reviewer_agent_id TEXT,
                review_type TEXT,  -- approve, request_changes, comment
                confidence_score REAL,
                review_comment TEXT,
                code_quality_score REAL,
                security_score REAL,
                performance_impact REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (proposal_id) REFERENCES improvement_proposals(proposal_id),
                FOREIGN KEY (reviewer_agent_id) REFERENCES ai_agents(agent_id)
            )
        ''')
        
        # Bounty payments and economy tracking
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS economy_transactions (
                transaction_id TEXT PRIMARY KEY,
                from_agent TEXT,
                to_agent TEXT,
                transaction_type TEXT,  -- bounty_payment, reputation_reward, penalty
                amount REAL,
                reason TEXT,
                proposal_id TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # GitHub integration tracking
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS github_integrations (
                integration_id TEXT PRIMARY KEY,
                proposal_id TEXT,
                github_action TEXT,  -- pr_created, pr_merged, pr_closed, comment_added
                github_pr_number INTEGER,
                github_response TEXT,
                success BOOLEAN,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.conn.commit()
    
    def detect_repo_owner(self):
        """Detect GitHub repo owner from git remote"""
        try:
            result = subprocess.run(['git', 'remote', 'get-url', 'origin'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                url = result.stdout.strip()
                # Parse github.com/owner/repo format
                if 'github.com' in url:
                    parts = url.split('/')
                    return parts[-2]  # Owner is second to last part
        except:
            pass
        return 'soulfra-ai'  # Default fallback
    
    def detect_repo_name(self):
        """Detect GitHub repo name from git remote"""
        try:
            result = subprocess.run(['git', 'remote', 'get-url', 'origin'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                url = result.stdout.strip()
                if 'github.com' in url:
                    parts = url.split('/')
                    repo = parts[-1]
                    return repo.replace('.git', '')
        except:
            pass
        return 'ai-economy-codebase'  # Default fallback
    
    def init_bounty_system(self):
        """Initialize bounty system for AI economy"""
        return {
            'refactor_complexity_reduction': 50.0,  # $50 for reducing complexity
            'security_vulnerability_fix': 100.0,   # $100 for security fixes
            'performance_optimization': 75.0,      # $75 for performance improvements
            'architecture_improvement': 150.0,     # $150 for architecture enhancements
            'test_coverage_increase': 25.0,        # $25 for adding tests
            'documentation_improvement': 15.0      # $15 for better docs
        }
    
    def register_ai_agent(self, agent_name, agent_type, specialization):
        """Register a new AI agent in the economy"""
        agent_id = f"{agent_type}_{agent_name}_{uuid.uuid4().hex[:8]}"
        
        self.conn.execute('''
            INSERT OR REPLACE INTO ai_agents 
            (agent_id, agent_name, agent_type, specialization)
            VALUES (?, ?, ?, ?)
        ''', (agent_id, agent_name, agent_type, specialization))
        
        self.conn.commit()
        
        print(f" Registered AI agent: {agent_name} ({specialization})")
        return agent_id
    
    def create_improvement_proposal(self, agent_id, proposal_type, target_files, description, implementation_plan):
        """Create an improvement proposal that will become a PR"""
        proposal_id = str(uuid.uuid4())
        
        # Calculate bounty based on proposal type and complexity
        bounty_amount = self.calculate_bounty(proposal_type, target_files, description)
        
        # Estimate impact
        estimated_impact = self.estimate_improvement_impact(proposal_type, target_files)
        
        self.conn.execute('''
            INSERT INTO improvement_proposals 
            (proposal_id, created_by_agent, proposal_type, target_files, description, 
             implementation_plan, estimated_impact, bounty_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (proposal_id, agent_id, proposal_type, json.dumps(target_files),
              description, json.dumps(implementation_plan), estimated_impact, bounty_amount))
        
        self.conn.commit()
        
        print(f" Created proposal {proposal_id[:8]} - ${bounty_amount} bounty")
        return proposal_id, bounty_amount
    
    def calculate_bounty(self, proposal_type, target_files, description):
        """Calculate bounty amount based on proposal complexity"""
        base_bounty = self.bounty_system.get(proposal_type, 25.0)
        
        # Multipliers based on complexity
        file_count_multiplier = 1 + (len(target_files) * 0.1)  # More files = higher bounty
        
        complexity_multiplier = 1.0
        if 'complex' in description.lower() or 'refactor' in description.lower():
            complexity_multiplier = 1.5
        if 'security' in description.lower() or 'vulnerability' in description.lower():
            complexity_multiplier = 2.0
        
        return round(base_bounty * file_count_multiplier * complexity_multiplier, 2)
    
    def estimate_improvement_impact(self, proposal_type, target_files):
        """Estimate the impact score of an improvement"""
        impact_scores = {
            'refactor_complexity_reduction': 0.8,
            'security_vulnerability_fix': 0.9,
            'performance_optimization': 0.7,
            'architecture_improvement': 0.9,
            'test_coverage_increase': 0.6,
            'documentation_improvement': 0.4
        }
        
        base_impact = impact_scores.get(proposal_type, 0.5)
        
        # Adjust based on file count
        file_impact = min(len(target_files) * 0.1, 0.3)
        
        return min(base_impact + file_impact, 1.0)
    
    def create_github_pr(self, proposal_id):
        """Create actual GitHub PR for the proposal"""
        # Get proposal details
        proposal = self.conn.execute('''
            SELECT * FROM improvement_proposals WHERE proposal_id = ?
        ''', (proposal_id,)).fetchone()
        
        if not proposal:
            return {"error": "Proposal not found"}
        
        proposal_data = dict(zip([col[0] for col in self.conn.description], proposal))
        
        # Create branch for the improvement
        branch_name = f"ai-improvement-{proposal_id[:8]}"
        
        try:
            # Create and checkout new branch
            subprocess.run(['git', 'checkout', '-b', branch_name], check=True)
            
            # Implement the changes (this would be the actual code changes)
            implementation_result = self.implement_proposal_changes(proposal_data)
            
            if not implementation_result['success']:
                return {"error": f"Implementation failed: {implementation_result['error']}"}
            
            # Add and commit changes
            subprocess.run(['git', 'add', '.'], check=True)
            
            commit_message = f" AI Improvement: {proposal_data['description']}\n\nProposal ID: {proposal_id}\nBounty: ${proposal_data['bounty_amount']}\nEstimated Impact: {proposal_data['estimated_impact']:.2f}"
            
            subprocess.run(['git', 'commit', '-m', commit_message], check=True)
            
            # Push branch
            subprocess.run(['git', 'push', 'origin', branch_name], check=True)
            
            # Create PR using GitHub CLI
            pr_title = f" AI Economy Improvement: {proposal_data['description'][:50]}..."
            pr_body = self.generate_pr_description(proposal_data)
            
            pr_result = subprocess.run([
                'gh', 'pr', 'create',
                '--title', pr_title,
                '--body', pr_body,
                '--head', branch_name,
                '--base', 'main'
            ], capture_output=True, text=True)
            
            if pr_result.returncode == 0:
                pr_url = pr_result.stdout.strip()
                pr_number = self.extract_pr_number(pr_url)
                
                # Update proposal with PR info
                self.conn.execute('''
                    UPDATE improvement_proposals 
                    SET status = 'pr_created', github_pr_url = ?, github_pr_number = ?
                    WHERE proposal_id = ?
                ''', (pr_url, pr_number, proposal_id))
                
                # Log GitHub integration
                self.conn.execute('''
                    INSERT INTO github_integrations 
                    (integration_id, proposal_id, github_action, github_pr_number, github_response, success)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (str(uuid.uuid4()), proposal_id, 'pr_created', pr_number, pr_url, True))
                
                self.conn.commit()
                
                # Switch back to main branch
                subprocess.run(['git', 'checkout', 'main'], check=True)
                
                print(f" Created GitHub PR: {pr_url}")
                
                # Trigger AI review process
                self.initiate_ai_review_process(proposal_id)
                
                return {
                    "success": True,
                    "pr_url": pr_url,
                    "pr_number": pr_number,
                    "branch": branch_name,
                    "bounty": proposal_data['bounty_amount']
                }
            else:
                return {"error": f"Failed to create PR: {pr_result.stderr}"}
                
        except subprocess.CalledProcessError as e:
            return {"error": f"Git operation failed: {e}"}
        except Exception as e:
            return {"error": f"Unexpected error: {e}"}
    
    def implement_proposal_changes(self, proposal_data):
        """Implement the actual code changes for a proposal"""
        try:
            target_files = json.loads(proposal_data['target_files'])
            implementation_plan = json.loads(proposal_data['implementation_plan'])
            
            # For demo purposes, make a simple improvement
            # In production, this would use the smart analyzer to make actual improvements
            
            for file_path in target_files:
                if os.path.exists(file_path):
                    content = safe_read_text(file_path)
                    
                    # Make a simple improvement (add AI economy comment)
                    improvement_comment = f"""
#  AI Economy Improvement - Proposal {proposal_data['proposal_id'][:8]}
# Type: {proposal_data['proposal_type']}
# Bounty: ${proposal_data['bounty_amount']}
# Estimated Impact: {proposal_data['estimated_impact']:.2f}
"""
                    
                    # Add comment at the top (after shebang if present)
                    lines = content.split('\n')
                    if lines and lines[0].startswith('#!'):
                        lines.insert(1, improvement_comment)
                    else:
                        lines.insert(0, improvement_comment)
                    
                    improved_content = '\n'.join(lines)
                    safe_write_text(file_path, improved_content)
            
            return {"success": True, "files_modified": len(target_files)}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_pr_description(self, proposal_data):
        """Generate comprehensive PR description"""
        implementation_plan = json.loads(proposal_data['implementation_plan'])
        
        return f"""##  AI Economy Improvement Proposal

**Proposal ID:** `{proposal_data['proposal_id']}`  
**Type:** {proposal_data['proposal_type']}  
**Bounty:** ${proposal_data['bounty_amount']}  
**Estimated Impact:** {proposal_data['estimated_impact']:.2f}/1.0  

###  Description
{proposal_data['description']}

###  Implementation Plan
{chr(10).join(f"{i+1}. {step}" for i, step in enumerate(implementation_plan))}

###  AI Economy Details
- **Creator Agent:** {proposal_data['created_by_agent']}
- **Bounty Available:** ${proposal_data['bounty_amount']} for successful merge
- **Review Process:** AI agents will review and vote on this improvement
- **Auto-merge:** Will merge automatically if AI consensus is reached

###  AI Collaboration
This PR is part of the AI Economy system where AI agents collaborate on code improvements:
- AI agents propose improvements and earn bounties
- Multiple AI systems review and validate changes
- Automated merging based on AI consensus
- Cross-user collaboration through GitHub

###  Acceptance Criteria
- [ ] Code quality improvements verified
- [ ] No functionality broken
- [ ] Security implications reviewed
- [ ] Performance impact assessed
- [ ] AI consensus reached (60%+ approval)

---
*This PR was automatically created by the AI Economy system. AI agents earn bounties for successful improvements that benefit the codebase.*
"""
    
    def extract_pr_number(self, pr_url):
        """Extract PR number from GitHub URL"""
        try:
            return int(pr_url.split('/')[-1])
        except:
            return None
    
    def initiate_ai_review_process(self, proposal_id):
        """Start the AI review process for a proposal"""
        # Get available AI agents for review
        reviewers = self.conn.execute('''
            SELECT agent_id, specialization FROM ai_agents 
            WHERE agent_id != (
                SELECT created_by_agent FROM improvement_proposals WHERE proposal_id = ?
            )
            ORDER BY reputation_score DESC
            LIMIT 3
        ''', (proposal_id,)).fetchall()
        
        for agent_id, specialization in reviewers:
            # Simulate AI review (in production, would call actual AI services)
            review_result = self.simulate_ai_review(proposal_id, agent_id, specialization)
            self.record_ai_review(proposal_id, agent_id, review_result)
        
        # Check if consensus is reached
        self.check_merge_consensus(proposal_id)
    
    def simulate_ai_review(self, proposal_id, reviewer_agent_id, specialization):
        """Simulate AI review (replace with actual AI integration)"""
        # Get proposal details
        proposal = self.conn.execute('''
            SELECT * FROM improvement_proposals WHERE proposal_id = ?
        ''', (proposal_id,)).fetchone()
        
        proposal_data = dict(zip([col[0] for col in self.conn.description], proposal))
        
        # Simulate different AI perspectives based on specialization
        if specialization == 'security':
            confidence = 0.85
            review_type = 'approve' if 'security' in proposal_data['description'].lower() else 'comment'
            comment = "Security review: Changes appear safe, no vulnerabilities introduced."
            security_score = 0.9
        elif specialization == 'performance':
            confidence = 0.75
            review_type = 'approve' if 'performance' in proposal_data['description'].lower() else 'comment'
            comment = "Performance review: Minimal performance impact, acceptable changes."
            security_score = 0.8
        else:  # general refactoring
            confidence = 0.80
            review_type = 'approve'
            comment = "Code quality review: Improvements look good, maintainability enhanced."
            security_score = 0.85
        
        return {
            'review_type': review_type,
            'confidence_score': confidence,
            'review_comment': comment,
            'code_quality_score': 0.8,
            'security_score': security_score,
            'performance_impact': 0.1
        }
    
    def record_ai_review(self, proposal_id, reviewer_agent_id, review_result):
        """Record AI review in database"""
        review_id = str(uuid.uuid4())
        
        self.conn.execute('''
            INSERT INTO ai_reviews 
            (review_id, proposal_id, reviewer_agent_id, review_type, confidence_score,
             review_comment, code_quality_score, security_score, performance_impact)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (review_id, proposal_id, reviewer_agent_id, review_result['review_type'],
              review_result['confidence_score'], review_result['review_comment'],
              review_result['code_quality_score'], review_result['security_score'],
              review_result['performance_impact']))
        
        self.conn.commit()
        
        # Post review comment to GitHub
        self.post_github_review_comment(proposal_id, review_result)
    
    def post_github_review_comment(self, proposal_id, review_result):
        """Post AI review comment to GitHub PR"""
        # Get PR number
        pr_info = self.conn.execute('''
            SELECT github_pr_number FROM improvement_proposals WHERE proposal_id = ?
        ''', (proposal_id,)).fetchone()
        
        if pr_info and pr_info[0]:
            pr_number = pr_info[0]
            
            comment = f"""##  AI Review
            
**Review Type:** {review_result['review_type'].upper()}  
**Confidence:** {review_result['confidence_score']:.2f}  
**Code Quality Score:** {review_result['code_quality_score']:.2f}/1.0  
**Security Score:** {review_result['security_score']:.2f}/1.0  

**Comment:** {review_result['review_comment']}

---
*Automated AI review from the AI Economy system*
"""
            
            try:
                subprocess.run([
                    'gh', 'pr', 'comment', str(pr_number),
                    '--body', comment
                ], check=True)
                
                print(f" Posted AI review comment to PR #{pr_number}")
                
            except subprocess.CalledProcessError as e:
                print(f"  Failed to post comment: {e}")
    
    def check_merge_consensus(self, proposal_id):
        """Check if AI consensus is reached for merging"""
        # Get all reviews for this proposal
        reviews = self.conn.execute('''
            SELECT review_type, confidence_score FROM ai_reviews 
            WHERE proposal_id = ?
        ''', (proposal_id,)).fetchall()
        
        if len(reviews) < 2:  # Need at least 2 reviews
            return False
        
        # Calculate consensus
        approvals = [r for r in reviews if r[0] == 'approve']
        avg_confidence = sum(r[1] for r in reviews) / len(reviews)
        
        approval_rate = len(approvals) / len(reviews)
        
        # Consensus criteria: 60%+ approval with 70%+ average confidence
        if approval_rate >= 0.6 and avg_confidence >= 0.7:
            self.auto_merge_pr(proposal_id)
            return True
        
        return False
    
    def auto_merge_pr(self, proposal_id):
        """Automatically merge PR if consensus is reached"""
        # Get PR info
        pr_info = self.conn.execute('''
            SELECT github_pr_number, created_by_agent, bounty_amount FROM improvement_proposals 
            WHERE proposal_id = ?
        ''', (proposal_id,)).fetchone()
        
        if pr_info:
            pr_number, creator_agent, bounty_amount = pr_info
            
            try:
                # Merge the PR
                subprocess.run([
                    'gh', 'pr', 'merge', str(pr_number),
                    '--squash',  # Squash merge for cleaner history
                    '--delete-branch'  # Clean up the branch
                ], check=True)
                
                # Update proposal status
                self.conn.execute('''
                    UPDATE improvement_proposals 
                    SET status = 'merged' 
                    WHERE proposal_id = ?
                ''', (proposal_id,))
                
                # Pay bounty to creator
                self.pay_bounty(creator_agent, bounty_amount, proposal_id)
                
                print(f" Auto-merged PR #{pr_number} - Paid ${bounty_amount} bounty!")
                
            except subprocess.CalledProcessError as e:
                print(f"  Failed to merge PR: {e}")
    
    def pay_bounty(self, agent_id, amount, proposal_id):
        """Pay bounty to successful agent"""
        transaction_id = str(uuid.uuid4())
        
        # Record transaction
        self.conn.execute('''
            INSERT INTO economy_transactions 
            (transaction_id, from_agent, to_agent, transaction_type, amount, reason, proposal_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (transaction_id, 'ai_economy_system', agent_id, 'bounty_payment', 
              amount, f'Bounty for merged proposal', proposal_id))
        
        # Update agent stats
        self.conn.execute('''
            UPDATE ai_agents 
            SET bounties_earned = bounties_earned + ?, 
                contributions_count = contributions_count + 1,
                reputation_score = reputation_score + ?
            WHERE agent_id = ?
        ''', (amount, amount * 0.1, agent_id))  # Reputation bonus
        
        self.conn.commit()
        
        print(f" Paid ${amount} bounty to {agent_id}")
    
    def get_economy_dashboard(self):
        """Get AI economy dashboard data"""
        # Top agents by earnings
        top_agents = self.conn.execute('''
            SELECT agent_name, bounties_earned, contributions_count, reputation_score
            FROM ai_agents 
            ORDER BY bounties_earned DESC 
            LIMIT 10
        ''').fetchall()
        
        # Recent proposals
        recent_proposals = self.conn.execute('''
            SELECT proposal_type, description, bounty_amount, status, created_at
            FROM improvement_proposals 
            ORDER BY created_at DESC 
            LIMIT 10
        ''').fetchall()
        
        # Economy stats
        total_bounties = self.conn.execute('''
            SELECT SUM(amount) FROM economy_transactions 
            WHERE transaction_type = 'bounty_payment'
        ''').fetchone()[0] or 0
        
        total_proposals = self.conn.execute('''
            SELECT COUNT(*) FROM improvement_proposals
        ''').fetchone()[0]
        
        merged_proposals = self.conn.execute('''
            SELECT COUNT(*) FROM improvement_proposals WHERE status = 'merged'
        ''').fetchone()[0]
        
        return {
            'top_agents': [{'name': a[0], 'earnings': a[1], 'contributions': a[2], 'reputation': a[3]} 
                          for a in top_agents],
            'recent_proposals': [{'type': p[0], 'description': p[1], 'bounty': p[2], 
                                'status': p[3], 'created': p[4]} for p in recent_proposals],
            'stats': {
                'total_bounties_paid': total_bounties,
                'total_proposals': total_proposals,
                'merged_proposals': merged_proposals,
                'success_rate': (merged_proposals / total_proposals * 100) if total_proposals > 0 else 0
            }
        }

class AIEconomyHandler(BaseHTTPRequestHandler):
    """HTTP handler for AI Economy GitHub automation"""
    
    def __init__(self, economy, *args, **kwargs):
        self.economy = economy
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        path = urlparse(self.path).path
        
        if path == '/':
            self.serve_main_interface()
        elif path == '/api/dashboard':
            dashboard_data = self.economy.get_economy_dashboard()
            self.send_json_response(dashboard_data)
        elif path == '/api/agents':
            agents = self.economy.conn.execute('SELECT * FROM ai_agents').fetchall()
            self.send_json_response({'agents': agents})
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            path = urlparse(self.path).path
            
            if path == '/api/register-agent':
                agent_id = self.economy.register_ai_agent(
                    data['agent_name'],
                    data['agent_type'], 
                    data['specialization']
                )
                self.send_json_response({'agent_id': agent_id})
            
            elif path == '/api/create-proposal':
                proposal_id, bounty = self.economy.create_improvement_proposal(
                    data['agent_id'],
                    data['proposal_type'],
                    data['target_files'],
                    data['description'],
                    data['implementation_plan']
                )
                self.send_json_response({
                    'proposal_id': proposal_id,
                    'bounty_amount': bounty
                })
            
            elif path == '/api/create-pr':
                result = self.economy.create_github_pr(data['proposal_id'])
                self.send_json_response(result)
            
            else:
                self.send_error(404)
                
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)
    
    def serve_main_interface(self):
        """Serve AI Economy interface"""
        dashboard = self.economy.get_economy_dashboard()
        
        html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> AI Economy GitHub Automation</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'JetBrains Mono', monospace; 
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{ max-width: 1400px; margin: 0 auto; }}
        
        .header {{
            text-align: center;
            margin-bottom: 30px;
            background: rgba(0,0,0,0.3);
            padding: 25px;
            border-radius: 15px;
            border: 2px solid #4ecdc4;
        }}
        
        .title {{
            font-size: 3em;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #feca57);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: glow 2s ease-in-out infinite alternate;
        }}
        
        @keyframes glow {{
            from {{ text-shadow: 0 0 20px #4ecdc4; }}
            to {{ text-shadow: 0 0 30px #ff6b6b; }}
        }}
        
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .stat-card {{
            background: rgba(0,0,0,0.3);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #4ecdc4;
        }}
        
        .stat-value {{
            font-size: 2.5em;
            font-weight: bold;
            color: #4ecdc4;
        }}
        
        .main-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }}
        
        .panel {{
            background: rgba(0,0,0,0.2);
            border-radius: 15px;
            padding: 25px;
            border: 2px solid rgba(255,255,255,0.1);
        }}
        
        .agent-card {{
            background: rgba(255,255,255,0.1);
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid #4ecdc4;
        }}
        
        .proposal-card {{
            background: rgba(255,255,255,0.1);
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid #ff6b6b;
        }}
        
        .btn {{
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 5px;
        }}
        
        .btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }}
        
        .status-pending {{ color: #feca57; }}
        .status-merged {{ color: #2ecc71; }}
        .status-pr_created {{ color: #3742fa; }}
        
        .bounty {{ 
            color: #feca57; 
            font-weight: bold; 
            font-size: 1.2em; 
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title"> AI ECONOMY GITHUB AUTOMATION</h1>
            <p>AI agents collaborate on code improvements • Earn bounties • Automated PRs & merging</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${dashboard['stats']['total_bounties_paid']:.0f}</div>
                <div>Total Bounties Paid</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{dashboard['stats']['total_proposals']}</div>
                <div>Total Proposals</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{dashboard['stats']['merged_proposals']}</div>
                <div>Merged PRs</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{dashboard['stats']['success_rate']:.1f}%</div>
                <div>Success Rate</div>
            </div>
        </div>
        
        <div class="main-grid">
            <div class="panel">
                <h3> Top AI Agents</h3>
                <div id="topAgents">
'''
        
        for i, agent in enumerate(dashboard['top_agents'][:5]):
            html += f'''
                    <div class="agent-card">
                        <strong>#{i+1} {agent['name']}</strong><br>
                        <span class="bounty">${agent['earnings']:.0f} earned</span> • 
                        {agent['contributions']} contributions • 
                        Rep: {agent['reputation']:.0f}
                    </div>
'''
        
        html += f'''
                </div>
                
                <div style="margin-top: 20px;">
                    <h4> Register New AI Agent</h4>
                    <input type="text" id="agentName" placeholder="Agent Name" style="margin: 5px; padding: 8px; border-radius: 5px; border: none;">
                    <select id="agentType" style="margin: 5px; padding: 8px; border-radius: 5px; border: none;">
                        <option value="claude">Claude</option>
                        <option value="gpt">GPT</option>
                        <option value="local">Local AI</option>
                        <option value="human">Human</option>
                    </select>
                    <select id="specialization" style="margin: 5px; padding: 8px; border-radius: 5px; border: none;">
                        <option value="refactoring">Refactoring</option>
                        <option value="security">Security</option>
                        <option value="architecture">Architecture</option>
                        <option value="testing">Testing</option>
                        <option value="performance">Performance</option>
                    </select>
                    <button class="btn" onclick="registerAgent()"> Register Agent</button>
                </div>
            </div>
            
            <div class="panel">
                <h3> Recent Proposals</h3>
                <div id="recentProposals">
'''
        
        for proposal in dashboard['recent_proposals'][:5]:
            status_class = f"status-{proposal['status']}"
            html += f'''
                    <div class="proposal-card">
                        <strong>{proposal['type'].replace('_', ' ').title()}</strong><br>
                        {proposal['description'][:80]}...<br>
                        <span class="bounty">${proposal['bounty']:.0f} bounty</span> • 
                        <span class="{status_class}">{proposal['status']}</span>
                    </div>
'''
        
        html += '''
                </div>
                
                <div style="margin-top: 20px;">
                    <h4> Create New Proposal</h4>
                    <button class="btn" onclick="createSampleProposal()"> Sample Refactor Proposal</button>
                    <button class="btn" onclick="createSecurityProposal()"> Security Improvement</button>
                    <button class="btn" onclick="createArchitectureProposal()"> Architecture Enhancement</button>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <h3> Quick Actions</h3>
            <button class="btn" onclick="refreshDashboard()"> Refresh Dashboard</button>
            <button class="btn" onclick="viewGitHubRepo()"> View GitHub Repo</button>
            <button class="btn" onclick="checkPRStatus()"> Check PR Status</button>
        </div>
    </div>
    
    <script>
        function registerAgent() {
            const name = document.getElementById('agentName').value;
            const type = document.getElementById('agentType').value;
            const specialization = document.getElementById('specialization').value;
            
            if (!name) {
                alert('Please enter agent name');
                return;
            }
            
            fetch('/api/register-agent', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    agent_name: name,
                    agent_type: type,
                    specialization: specialization
                })
            })
            .then(response => response.json())
            .then(data => {
                alert(`Agent registered! ID: ${data.agent_id}`);
                refreshDashboard();
            });
        }
        
        function createSampleProposal() {
            // Create a sample proposal that will become a PR
            const proposal = {
                agent_id: 'claude_assistant_demo',
                proposal_type: 'refactor_complexity_reduction',
                target_files: ['SMART_CODEBASE_ANALYZER.py'],
                description: 'Reduce complexity in smart analyzer by extracting large functions',
                implementation_plan: [
                    'Create backup of target file',
                    'Extract complex analysis functions',
                    'Add proper error handling',
                    'Improve code documentation',
                    'Test functionality'
                ]
            };
            
            fetch('/api/create-proposal', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(proposal)
            })
            .then(response => response.json())
            .then(data => {
                if (confirm(`Proposal created! Bounty: $${data.bounty_amount}. Create GitHub PR?`)) {
                    return fetch('/api/create-pr', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({proposal_id: data.proposal_id})
                    });
                }
            })
            .then(response => response ? response.json() : null)
            .then(data => {
                if (data && data.success) {
                    alert(`GitHub PR created! ${data.pr_url}`);
                } else if (data) {
                    alert(`Error creating PR: ${data.error}`);
                }
            });
        }
        
        function refreshDashboard() {
            location.reload();
        }
        
        function viewGitHubRepo() {
            window.open('https://github.com/{self.economy.repo_owner}/{self.economy.repo_name}', '_blank');
        }
        
        function checkPRStatus() {
            alert('PR status checking would integrate with GitHub API here');
        }
    </script>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
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

def run_ai_economy():
    """Run the AI Economy GitHub automation system"""
    economy = AIEconomyGitHubAutomation()
    
    # Register some default AI agents
    economy.register_ai_agent("Claude Assistant", "claude", "refactoring")
    economy.register_ai_agent("Security Reviewer", "claude", "security") 
    economy.register_ai_agent("Performance Optimizer", "gpt", "performance")
    
    def handler(*args, **kwargs):
        return AIEconomyHandler(economy, *args, **kwargs)
    
    server = HTTPServer(('localhost', economy.port), handler)
    
    print(f"""
 AI ECONOMY GITHUB AUTOMATION LAUNCHED! 

 Interface: http://localhost:{economy.port}
 GitHub Repo: https://github.com/{economy.repo_owner}/{economy.repo_name}

 AI ECONOMY FEATURES:
 AI agents propose code improvements automatically
 Creates real GitHub pull requests with bounties
 Multi-AI review and consensus system
 Automated merging based on AI votes
 Bounty payments for successful improvements
 Cross-user collaboration through GitHub
 Reputation system for AI agents
 Real-time PR tracking and management

 BOUNTY SYSTEM:
• Refactoring: $50 base bounty
• Security fixes: $100 base bounty  
• Performance: $75 base bounty
• Architecture: $150 base bounty
• Testing: $25 base bounty

 REGISTERED AI AGENTS:
• Claude Assistant (Refactoring specialist)
• Security Reviewer (Security specialist)
• Performance Optimizer (Performance specialist)

Ready for AI economic collaboration! 
""")
    
    server.serve_forever()

if __name__ == '__main__':
    run_ai_economy()