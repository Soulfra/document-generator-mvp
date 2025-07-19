#!/usr/bin/env python3
"""
EXTRACT BUSINESS IDEAS - Quick extraction from any chat log format
Searches for business ideas, domains, revenue models in your chats
"""

import os
import re
import json
from pathlib import Path
import sqlite3

class BusinessIdeaExtractor:
    """Extract business ideas from various chat formats"""
    
    def __init__(self):
        self.patterns = {
            'business_ideas': [
                r"business idea[:\s]+(.+?)(?:\n|$)",
                r"startup idea[:\s]+(.+?)(?:\n|$)",
                r"app idea[:\s]+(.+?)(?:\n|$)",
                r"website for[:\s]+(.+?)(?:\n|$)",
                r"platform for[:\s]+(.+?)(?:\n|$)",
                r"service that[:\s]+(.+?)(?:\n|$)",
                r"tool for[:\s]+(.+?)(?:\n|$)",
                r"marketplace for[:\s]+(.+?)(?:\n|$)",
                r"(\w+\.com|\w+\.io|\w+\.ai|\w+\.net|\w+\.org)",  # Domain names
            ],
            'revenue_models': [
                r"charge[:\s]+(.+?)(?:\n|$)",
                r"monetize[:\s]+(.+?)(?:\n|$)",
                r"subscription[:\s]+(.+?)(?:\n|$)",
                r"(\$\d+(?:/month|/year|/user)?)",  # Price mentions
                r"revenue[:\s]+(.+?)(?:\n|$)",
            ]
        }
        
    def extract_from_file(self, filepath):
        """Extract business ideas from a single file"""
        ideas = []
        
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            # Extract business ideas
            for pattern in self.patterns['business_ideas']:
                matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    if len(match) > 10:  # Filter out tiny matches
                        ideas.append({
                            'text': match.strip(),
                            'source': str(filepath),
                            'type': 'business_idea'
                        })
                        
            # Extract revenue models
            for pattern in self.patterns['revenue_models']:
                matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    if len(match) > 5:
                        ideas.append({
                            'text': match.strip(),
                            'source': str(filepath),
                            'type': 'revenue_model'
                        })
                        
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
            
        return ideas
    
    def scan_all_chat_logs(self):
        """Scan all potential chat log locations"""
        all_ideas = []
        
        # Directories to check
        search_dirs = [
            'chat_logs',
            'chatlog_workspace',
            'processed_chats',
            'logs',
            '.',  # Current directory
        ]
        
        # File patterns to check
        file_patterns = ['*.txt', '*.log', '*.md', '*.json']
        
        for search_dir in search_dirs:
            if os.path.exists(search_dir):
                dir_path = Path(search_dir)
                for pattern in file_patterns:
                    for file_path in dir_path.glob(pattern):
                        if 'chat' in str(file_path).lower() or 'log' in str(file_path).lower():
                            print(f"Scanning: {file_path}")
                            ideas = self.extract_from_file(file_path)
                            all_ideas.extend(ideas)
                            
        # Also check specific files
        specific_files = [
            'demo_chatlog.txt',
            'sample_chat.txt',
            'current_conversation.txt'
        ]
        
        for filename in specific_files:
            if os.path.exists(filename):
                print(f"Scanning: {filename}")
                ideas = self.extract_from_file(filename)
                all_ideas.extend(ideas)
                
        return all_ideas
    
    def save_to_database(self, ideas):
        """Save extracted ideas to database"""
        conn = sqlite3.connect('domain_business_ideas.db')
        
        # Ensure table exists
        conn.execute('''
            CREATE TABLE IF NOT EXISTS extracted_ideas (
                id INTEGER PRIMARY KEY,
                text TEXT,
                source TEXT,
                type TEXT,
                processed BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert ideas
        for idea in ideas:
            try:
                conn.execute(
                    "INSERT INTO extracted_ideas (text, source, type) VALUES (?, ?, ?)",
                    (idea['text'], idea['source'], idea['type'])
                )
            except Exception as e:
                print(f"Error saving idea: {e}")
                
        conn.commit()
        conn.close()
    
    def generate_summary(self, ideas):
        """Generate summary of extracted ideas"""
        print("\n=== BUSINESS IDEAS EXTRACTION SUMMARY ===")
        print(f"Total items found: {len(ideas)}")
        
        # Count by type
        business_ideas = [i for i in ideas if i['type'] == 'business_idea']
        revenue_models = [i for i in ideas if i['type'] == 'revenue_model']
        
        print(f"Business ideas: {len(business_ideas)}")
        print(f"Revenue models: {len(revenue_models)}")
        
        # Show sample ideas
        print("\n=== SAMPLE BUSINESS IDEAS ===")
        for idea in business_ideas[:10]:
            print(f"- {idea['text'][:100]}...")
            
        # Extract domains
        domains = []
        domain_pattern = r'(\w+\.(?:com|io|ai|net|org|app|dev|tech))'
        for idea in ideas:
            domain_matches = re.findall(domain_pattern, idea['text'], re.IGNORECASE)
            domains.extend(domain_matches)
            
        if domains:
            print(f"\n=== DOMAINS MENTIONED ({len(set(domains))}) ===")
            for domain in set(domains)[:20]:
                print(f"- {domain}")
                
        # Save summary
        summary = {
            'total_extracted': len(ideas),
            'business_ideas': len(business_ideas),
            'revenue_models': len(revenue_models),
            'unique_domains': list(set(domains)),
            'sources': list(set(i['source'] for i in ideas))
        }
        
        with open('business_ideas_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
            
        print(f"\nSummary saved to: business_ideas_summary.json")

def main():
    print("BUSINESS IDEAS EXTRACTOR")
    print("========================")
    
    extractor = BusinessIdeaExtractor()
    
    # Scan all chat logs
    print("\nScanning for business ideas in chat logs...")
    ideas = extractor.scan_all_chat_logs()
    
    if ideas:
        # Save to database
        print(f"\nSaving {len(ideas)} items to database...")
        extractor.save_to_database(ideas)
        
        # Generate summary
        extractor.generate_summary(ideas)
        
        print("\nNext steps:")
        print("1. Add your domains to my_domains.txt")
        print("2. Run: python3 DOMAIN_BUSINESS_MATCHER.py")
        print("3. Check domain_business_report.json for matches")
    else:
        print("\nNo business ideas found. Please add chat logs to:")
        print("- chat_logs/")
        print("- Or create demo_chatlog.txt with your ideas")

if __name__ == "__main__":
    main()