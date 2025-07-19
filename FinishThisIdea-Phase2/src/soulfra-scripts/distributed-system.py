#!/usr/bin/env python3
"""
SOULFRA DECENTRALIZED PLATFORM
Integrates multi-database layer, distributed search, and rule enforcement
All components work together to create a resilient, self-healing system
"""

import asyncio
import json
import time
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import sqlite3
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
from urllib.parse import urlparse, parse_qs

# Import our decentralized components
import sys
database_path = str(Path(__file__).parent / 'database')
if database_path not in sys.path:
    sys.path.insert(0, database_path)

try:
    from unified_database_layer import UnifiedDatabaseLayer, DatabaseConfig
    from decentralized_search_engine import DecentralizedSearchEngine, SearchQuery
    from rule_enforcement_engine import RuleEnforcementEngine
except ImportError:
    # If modules aren't in database/, they might be in current directory
    sys.path.insert(0, str(Path(__file__).parent))
    from database.unified_database_layer import UnifiedDatabaseLayer, DatabaseConfig
    from database.decentralized_search_engine import DecentralizedSearchEngine, SearchQuery
    from database.rule_enforcement_engine import RuleEnforcementEngine

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('DECENTRALIZED_PLATFORM')

class DecentralizedPlatform:
    """Main platform integrating all decentralized components"""
    
    def __init__(self):
        self.db_layer = UnifiedDatabaseLayer()
        self.search_engine = DecentralizedSearchEngine(num_shards=4)
        self.rule_engine = RuleEnforcementEngine()
        self.monitoring_data = {
            'start_time': datetime.now(),
            'queries_processed': 0,
            'violations_fixed': 0,
            'databases_online': 0
        }
        self.running = False
        
    async def initialize(self):
        """Initialize all platform components"""
        logger.info("🚀 Initializing Decentralized SOULFRA Platform...")
        
        # 1. Setup databases
        await self._setup_databases()
        
        # 2. Index existing content
        await self._index_codebase()
        
        # 3. Run initial rule scan
        await self._initial_rule_scan()
        
        # 4. Start monitoring
        self._start_monitoring()
        
        logger.info("✅ Platform initialized successfully!")
        
    async def _setup_databases(self):
        """Setup multi-database federation"""
        logger.info("Setting up database federation...")
        
        # Main platform database
        await self.db_layer.add_database('main', DatabaseConfig(
            type='sqlite',
            connection_string='soulfra_decentralized.db'
        ))
        
        # Search index databases (sharded)
        for i in range(4):
            await self.db_layer.add_database(f'search_shard_{i}', DatabaseConfig(
                type='sqlite',
                connection_string=f'search_shard_{i}.db'
            ))
        
        # Monitoring database
        await self.db_layer.add_database('monitoring', DatabaseConfig(
            type='sqlite',
            connection_string='monitoring.db'
        ))
        
        # Add sharding rules
        self.db_layer.add_sharding_rule('search_index', 
            lambda params: f"search_shard_{hash(params.get('doc_id', '')) % 4}")
        
        # Check health
        health = await self.db_layer.health_check_all()
        self.monitoring_data['databases_online'] = sum(1 for h in health.values() if h)
        
        logger.info(f"Database federation ready: {self.monitoring_data['databases_online']} databases online")
    
    async def _index_codebase(self):
        """Index all code files for search"""
        logger.info("Indexing codebase for search...")
        
        indexed_count = 0
        for file_path in Path('.').rglob('*.py'):
            if any(skip in str(file_path) for skip in ['__pycache__', 'venv', '.git']):
                continue
            
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
                
                # Extract metadata
                metadata = {
                    'file_type': 'python',
                    'size': file_path.stat().st_size,
                    'modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                    'path': str(file_path)
                }
                
                # Index in search engine
                await self.search_engine.index_document(
                    doc_id=str(file_path),
                    content=content,
                    metadata=metadata
                )
                
                indexed_count += 1
                
            except Exception as e:
                logger.error(f"Error indexing {file_path}: {e}")
        
        logger.info(f"Indexed {indexed_count} files")
    
    async def _initial_rule_scan(self):
        """Run initial rule enforcement scan"""
        logger.info("Running initial rule scan...")
        
        violations = await self.rule_engine.scan_directory('.', patterns=['*.py', '*.js'])
        
        total_violations = sum(len(v) for v in violations.values())
        logger.info(f"Found {total_violations} rule violations")
        
        # Auto-fix critical violations
        critical_violations = []
        for file_violations in violations.values():
            critical_violations.extend([v for v in file_violations if v.severity == 'critical'])
        
        if critical_violations:
            logger.info(f"Auto-fixing {len(critical_violations)} critical violations...")
            fix_results = await self.rule_engine.auto_fix_violations(critical_violations)
            self.monitoring_data['violations_fixed'] = fix_results['fixed']
            logger.info(f"Fixed {fix_results['fixed']} violations")
    
    def _start_monitoring(self):
        """Start background monitoring tasks"""
        async def monitor_loop():
            while self.running:
                # Check database health
                health = await self.db_layer.health_check_all()
                self.monitoring_data['databases_online'] = sum(1 for h in health.values() if h)
                
                # Get search stats
                search_stats = await self.search_engine.get_stats()
                self.monitoring_data['search_stats'] = search_stats
                
                # Get rule enforcement stats
                rule_report = await self.rule_engine.generate_report()
                self.monitoring_data['rule_report'] = rule_report
                
                # Sleep
                await asyncio.sleep(60)  # Check every minute
        
        # Start monitoring in background
        self.running = True
        asyncio.create_task(monitor_loop())
    
    async def search(self, query: str, filters: Dict = None) -> List[Dict]:
        """Search across all databases"""
        search_query = SearchQuery(
            query=query,
            filters=filters,
            limit=50
        )
        
        results = await self.search_engine.search(search_query)
        self.monitoring_data['queries_processed'] += 1
        
        # Convert to dict format
        return [
            {
                'id': r.id,
                'score': r.score,
                'title': r.title,
                'content': r.content,
                'metadata': r.metadata,
                'highlights': r.highlights
            }
            for r in results
        ]
    
    async def enforce_rules(self, file_path: str = None):
        """Enforce rules on specific file or entire codebase"""
        if file_path:
            violations = await self.rule_engine.scan_file(file_path)
            if violations:
                fix_results = await self.rule_engine.auto_fix_violations(violations)
                return fix_results
        else:
            violations = await self.rule_engine.scan_directory('.')
            all_violations = []
            for file_violations in violations.values():
                all_violations.extend(file_violations)
            
            if all_violations:
                fix_results = await self.rule_engine.auto_fix_violations(all_violations)
                self.monitoring_data['violations_fixed'] += fix_results['fixed']
                return fix_results
        
        return {'fixed': 0, 'failed': 0}
    
    async def query_database(self, sql: str, params: Dict = None) -> List[Dict]:
        """Query the federated database layer"""
        results = await self.db_layer.federated_search(sql, params)
        return results
    
    async def get_status(self) -> Dict[str, Any]:
        """Get platform status"""
        uptime = (datetime.now() - self.monitoring_data['start_time']).total_seconds()
        
        return {
            'status': 'online',
            'uptime_seconds': uptime,
            'databases_online': self.monitoring_data['databases_online'],
            'queries_processed': self.monitoring_data['queries_processed'],
            'violations_fixed': self.monitoring_data['violations_fixed'],
            'search_stats': self.monitoring_data.get('search_stats', {}),
            'rule_report': self.monitoring_data.get('rule_report', {})
        }

class DecentralizedAPIHandler(BaseHTTPRequestHandler):
    """HTTP API for decentralized platform"""
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/status':
            self._handle_status()
        elif parsed_path.path == '/search':
            self._handle_search(parsed_path)
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/enforce':
            self._handle_enforce()
        elif parsed_path.path == '/query':
            self._handle_query()
        else:
            self.send_error(404)
    
    def _handle_status(self):
        """Get platform status"""
        loop = asyncio.new_event_loop()
        status = loop.run_until_complete(platform.get_status())
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(status, indent=2).encode())
    
    def _handle_search(self, parsed_path):
        """Handle search requests"""
        params = parse_qs(parsed_path.query)
        query = params.get('q', [''])[0]
        
        if not query:
            self.send_error(400, "Missing query parameter")
            return
        
        loop = asyncio.new_event_loop()
        results = loop.run_until_complete(platform.search(query))
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(results, indent=2).encode())
    
    def _handle_enforce(self):
        """Enforce rules"""
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data) if post_data else {}
            file_path = data.get('file_path')
            
            loop = asyncio.new_event_loop()
            results = loop.run_until_complete(platform.enforce_rules(file_path))
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(results, indent=2).encode())
            
        except Exception as e:
            self.send_error(500, str(e))
    
    def _handle_query(self):
        """Handle database queries"""
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data)
            sql = data.get('sql')
            params = data.get('params', {})
            
            if not sql:
                self.send_error(400, "Missing SQL query")
                return
            
            loop = asyncio.new_event_loop()
            results = loop.run_until_complete(platform.query_database(sql, params))
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(results, indent=2).encode())
            
        except Exception as e:
            self.send_error(500, str(e))

def start_api_server(port: int = 8989):
    """Start the API server"""
    server = HTTPServer(('127.0.0.1', port), DecentralizedAPIHandler)
    logger.info(f"🌐 Decentralized API server running on http://127.0.0.1:{port}")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down API server...")
        server.shutdown()

# Global platform instance
platform = None

async def main():
    """Main entry point"""
    global platform
    
    print("""
╔══════════════════════════════════════════════╗
║     SOULFRA DECENTRALIZED PLATFORM           ║
║     Multi-DB + Distributed Search + Rules    ║
╚══════════════════════════════════════════════╝
    """)
    
    # Initialize platform
    platform = DecentralizedPlatform()
    await platform.initialize()
    
    # Start API server in thread
    api_thread = threading.Thread(target=start_api_server, daemon=True)
    api_thread.start()
    
    # Example usage
    print("\n📊 Platform Status:")
    status = await platform.get_status()
    print(json.dumps(status, indent=2))
    
    print("\n🔍 Example Search:")
    results = await platform.search("consciousness AI")
    print(f"Found {len(results)} results")
    
    print("\n✅ Platform ready!")
    print("\nAPI Endpoints:")
    print("  GET  http://127.0.0.1:8989/status      - Platform status")
    print("  GET  http://127.0.0.1:8989/search?q=X  - Search for X")
    print("  POST http://127.0.0.1:8989/enforce     - Enforce rules")
    print("  POST http://127.0.0.1:8989/query       - Database query")
    
    # Keep running
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down platform...")
        platform.running = False

if __name__ == "__main__":
    asyncio.run(main())