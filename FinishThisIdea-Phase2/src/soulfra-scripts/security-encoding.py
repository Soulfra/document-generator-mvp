#!/usr/bin/env python3
"""
Database UTF-8 Encoding Fix
Ensures all SQLite databases use proper UTF-8 encoding
"""

import sqlite3
import json
import os
import sys

# Force UTF-8
sys.stdout.reconfigure(encoding='utf-8')

class DatabaseEncodingFixer:
    def __init__(self):
        self.databases = [
            'crampal.db',
            'cringeproof.db',
            'vibe_platform.db',
            'soulfra.db',
            'empathy_scores.db'
        ]
    
    def fix_database(self, db_path):
        """Fix encoding for a single database"""
        if not os.path.exists(db_path):
            print(f"  {db_path} not found")
            return
        
        print(f"Fixing {db_path}...")
        
        try:
            # Connect with UTF-8 encoding
            conn = sqlite3.connect(db_path)
            conn.execute("PRAGMA encoding = 'UTF-8'")
            
            # Get all tables
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            
            for table in tables:
                table_name = table[0]
                print(f"  Checking table: {table_name}")
                
                # Get all text columns
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = cursor.fetchall()
                
                text_columns = []
                for col in columns:
                    col_name = col[1]
                    col_type = col[2].upper()
                    if 'TEXT' in col_type or 'VARCHAR' in col_type or 'CHAR' in col_type:
                        text_columns.append(col_name)
                
                if text_columns:
                    # Test with emoji data
                    test_data = "Test  Emoji  Support "
                    try:
                        # Create test table if needed
                        cursor.execute(f"""
                            CREATE TABLE IF NOT EXISTS encoding_test (
                                id INTEGER PRIMARY KEY,
                                test_text TEXT
                            )
                        """)
                        
                        # Insert test data
                        cursor.execute(
                            "INSERT INTO encoding_test (test_text) VALUES (?)",
                            (test_data,)
                        )
                        
                        # Read it back
                        cursor.execute("SELECT test_text FROM encoding_test WHERE id = last_insert_rowid()")
                        result = cursor.fetchone()
                        
                        if result and result[0] == test_data:
                            print(f"   UTF-8 encoding working correctly")
                        else:
                            print(f"    Encoding issue detected")
                        
                        # Clean up test
                        cursor.execute("DELETE FROM encoding_test WHERE test_text = ?", (test_data,))
                        
                    except Exception as e:
                        print(f"   Error testing encoding: {e}")
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f" Error fixing {db_path}: {e}")
    
    def create_utf8_connection(self, db_path):
        """Create a UTF-8 safe database connection"""
        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA encoding = 'UTF-8'")
        conn.text_factory = str
        return conn
    
    def fix_all_databases(self):
        """Fix encoding for all known databases"""
        print("====================================")
        print("   DATABASE UTF-8 ENCODING FIX      ")
        print("====================================")
        print()
        
        for db in self.databases:
            self.fix_database(db)
        
        print()
        print(" Database encoding fixes complete!")
    
    def create_test_database(self):
        """Create a test database with proper UTF-8 support"""
        print("Creating UTF-8 test database...")
        
        conn = self.create_utf8_connection('utf8_test.db')
        cursor = conn.cursor()
        
        # Create test table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS utf8_test (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                emoji_test TEXT,
                unicode_test TEXT,
                json_test TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert test data
        test_entries = [
            {
                'emoji': ' Rocket Launch ',
                'unicode': ' Hello мир',
                'json': json.dumps({'test': '', 'data': ''}, ensure_ascii=False)
            },
            {
                'emoji': '   ',
                'unicode': 'café résumé naïve',
                'json': json.dumps({'emojis': ['', '', '']}, ensure_ascii=False)
            }
        ]
        
        for entry in test_entries:
            cursor.execute("""
                INSERT INTO utf8_test (emoji_test, unicode_test, json_test)
                VALUES (?, ?, ?)
            """, (entry['emoji'], entry['unicode'], entry['json']))
        
        # Read back and verify
        cursor.execute("SELECT * FROM utf8_test")
        results = cursor.fetchall()
        
        print("\nTest results:")
        for row in results:
            print(f"ID: {row[0]}")
            print(f"Emoji: {row[1]}")
            print(f"Unicode: {row[2]}")
            print(f"JSON: {row[3]}")
            print("---")
        
        conn.commit()
        conn.close()
        
        print("\n Test database created: utf8_test.db")

# SQLite connection wrapper for services
class UTF8Database:
    """UTF-8 safe database wrapper for SQLite"""
    
    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = None
        self.connect()
    
    def connect(self):
        """Create UTF-8 connection"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.execute("PRAGMA encoding = 'UTF-8'")
        self.conn.text_factory = str
        self.conn.row_factory = sqlite3.Row
    
    def execute(self, query, params=None):
        """Execute query with UTF-8 safety"""
        cursor = self.conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor
    
    def fetchone(self, query, params=None):
        """Fetch one result"""
        cursor = self.execute(query, params)
        return cursor.fetchone()
    
    def fetchall(self, query, params=None):
        """Fetch all results"""
        cursor = self.execute(query, params)
        return cursor.fetchall()
    
    def commit(self):
        """Commit transaction"""
        self.conn.commit()
    
    def close(self):
        """Close connection"""
        if self.conn:
            self.conn.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

# Example usage in services
def example_service_with_utf8_db():
    """Example of using UTF8Database in a service"""
    
    # Create/connect to database
    with UTF8Database('example.db') as db:
        # Create table
        db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user TEXT,
                message TEXT,
                emoji_reaction TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.commit()
        
        # Insert emoji-rich message
        db.execute("""
            INSERT INTO messages (user, message, emoji_reaction)
            VALUES (?, ?, ?)
        """, ('User', 'Hello World! ', ''))
        db.commit()
        
        # Query with emoji
        results = db.fetchall("""
            SELECT * FROM messages WHERE emoji_reaction = ?
        """, ('',))
        
        for row in results:
            print(f"{row['user']}: {row['message']} {row['emoji_reaction']}")

if __name__ == "__main__":
    fixer = DatabaseEncodingFixer()
    
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        # Create test database
        fixer.create_test_database()
        example_service_with_utf8_db()
    else:
        # Fix all databases
        fixer.fix_all_databases()