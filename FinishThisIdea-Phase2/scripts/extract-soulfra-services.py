#!/usr/bin/env python3
"""
Extract and inventory services from Soulfra-AgentZero tier-minus10
Maps existing AI services to FinishThisIdea service catalog
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Soulfra base path
SOULFRA_BASE = "/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel"
TIER_MINUS_10 = f"{SOULFRA_BASE}/tier-0/tier-minus1/tier-minus2/tier-minus3/tier-minus4/tier-minus5/tier-minus6/tier-minus7/tier-minus8/tier-minus9/tier-minus10"

# Service mapping: (filename_pattern, service_name, price_cents, category)
SERVICE_MAPPINGS = [
    # Code Quality Services
    ("AUTOMATED_CODE_ASSISTANT", "code-cleanup", 100, "core"),
    ("CODE_GPS", "code-navigation", 200, "enhancement"),
    ("CLEAN_MASTER_CONTROL", "deep-cleanup", 500, "enhancement"),
    ("FIX_IMPORTS", "import-optimizer", 150, "enhancement"),
    
    # Documentation Services
    ("DEV_DOC_GENERATOR", "documentation-generator", 300, "enhancement"),
    ("DOMAIN_BUSINESS_MATCHER", "business-docs", 400, "enhancement"),
    ("CLAUDE_TASK_PROMPTS", "ai-documentation", 350, "enhancement"),
    
    # API Services
    ("API_ROUTER", "api-generator", 500, "enhancement"),
    ("CHAT_API_GATEWAY", "chat-api", 450, "enhancement"),
    ("CREATE_AI_ORCHESTRATOR", "orchestration-api", 600, "enhancement"),
    
    # Testing Services
    ("TEST_MAXED_SYSTEM", "test-generator", 400, "enhancement"),
    ("CLAUDE_TEST_RUNNER", "ai-test-suite", 450, "enhancement"),
    ("CONTAINER_MONITOR", "integration-tests", 350, "enhancement"),
    
    # Security Services
    ("CRINGEPROOF_FILTER", "security-filter", 300, "enhancement"),
    ("FILE_READ_RULE", "access-control", 250, "enhancement"),
    ("ENCODING_FIX", "security-encoding", 200, "enhancement"),
    
    # AI/ML Services
    ("AI_CONDUCTOR_SYSTEM", "ai-conductor", 800, "premium"),
    ("AI_DEBATE_COLOSSEUM", "ai-validator", 700, "premium"),
    ("AI_ECONOMY_GITHUB_AUTOMATION", "ai-versioning", 900, "premium"),
    ("AUTONOMOUS_SIMPLE", "autonomous-agent", 1000, "premium"),
    
    # Performance Services
    ("EMPATHY_GAME_ENGINE", "ux-optimizer", 600, "enhancement"),
    ("SYNTHETIC_EMPATHY_ENGINE", "ai-ux", 700, "premium"),
    ("ECONOMY_STRESS_TEST", "load-testing", 500, "enhancement"),
    
    # Migration Services
    ("CONSOLIDATE_USING_AI_ECONOMY", "code-consolidation", 800, "premium"),
    ("EXTRACT_BUSINESS_IDEAS", "idea-extraction", 600, "enhancement"),
    ("AUTOMATED_HANDOFF_ENGINE", "service-chaining", 700, "premium"),
    
    # DevOps Services
    ("DOCKER_SOLUTION", "containerization", 500, "enhancement"),
    ("DEPLOYMENT_PLAN", "deployment-automation", 600, "enhancement"),
    ("CHECK_SERVICES", "health-monitoring", 300, "enhancement"),
    
    # Enterprise Services
    ("ENTERPRISE_PLATFORM_MAX", "enterprise-suite", 2500, "enterprise"),
    ("DECENTRALIZED_PLATFORM", "distributed-system", 2000, "enterprise"),
    ("DEPARTMENT_AUTOMATION", "workflow-automation", 1500, "enterprise"),
]

def find_service_files(directory: str) -> Dict[str, List[str]]:
    """Find all service files in the Soulfra directory"""
    services = {}
    
    for pattern, service_name, _, _ in SERVICE_MAPPINGS:
        matching_files = []
        
        # Search for files matching the pattern
        for root, dirs, files in os.walk(directory):
            for file in files:
                if pattern in file and (file.endswith('.py') or file.endswith('.js')):
                    file_path = os.path.join(root, file)
                    matching_files.append(file_path)
        
        if matching_files:
            services[service_name] = matching_files
    
    return services

def analyze_service_file(filepath: str) -> Dict:
    """Extract service metadata from file"""
    metadata = {
        'filepath': filepath,
        'language': 'python' if filepath.endswith('.py') else 'javascript',
        'features': [],
        'dependencies': [],
        'has_api': False,
        'has_tests': False,
        'complexity': 'medium'
    }
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Extract features from docstring
            docstring_match = re.search(r'"""(.*?)"""', content, re.DOTALL)
            if docstring_match:
                metadata['description'] = docstring_match.group(1).strip()
            
            # Check for API endpoints
            if 'HTTPServer' in content or 'app.' in content or 'router.' in content:
                metadata['has_api'] = True
            
            # Check for tests
            if 'test_' in content or 'unittest' in content or 'jest' in content:
                metadata['has_tests'] = True
            
            # Extract imports/dependencies
            imports = re.findall(r'import\s+(\w+)|from\s+(\w+)', content)
            metadata['dependencies'] = list(set([imp[0] or imp[1] for imp in imports]))
            
            # Estimate complexity
            lines = len(content.split('\n'))
            if lines < 100:
                metadata['complexity'] = 'simple'
            elif lines < 500:
                metadata['complexity'] = 'medium'
            else:
                metadata['complexity'] = 'complex'
                
    except Exception as e:
        metadata['error'] = str(e)
    
    return metadata

def generate_service_catalog():
    """Generate complete service catalog from Soulfra components"""
    print("🔍 Scanning Soulfra-AgentZero for services...")
    
    # Find all service files
    services = find_service_files(TIER_MINUS_10)
    
    # Also check SOULFRA-CONSOLIDATED-2025
    consolidated_path = f"{SOULFRA_BASE}/SOULFRA-CONSOLIDATED-2025"
    if os.path.exists(consolidated_path):
        consolidated_services = find_service_files(consolidated_path)
        for service, files in consolidated_services.items():
            if service in services:
                services[service].extend(files)
            else:
                services[service] = files
    
    catalog = {
        'generated_at': str(Path(__file__).parent.parent),
        'soulfra_base': SOULFRA_BASE,
        'total_services': len(services),
        'services': {}
    }
    
    # Process each service
    for pattern, service_name, price, category in SERVICE_MAPPINGS:
        if service_name in services:
            service_files = services[service_name]
            
            # Analyze primary file
            primary_file = service_files[0]
            metadata = analyze_service_file(primary_file)
            
            catalog['services'][service_name] = {
                'id': service_name,
                'name': service_name.replace('-', ' ').title(),
                'price': price,
                'category': category,
                'source_files': service_files,
                'primary_file': primary_file,
                'metadata': metadata,
                'features': get_service_features(service_name),
                'estimated_time': estimate_processing_time(metadata['complexity']),
                'confidence': estimate_confidence(metadata)
            }
    
    # Save catalog
    output_path = Path(__file__).parent.parent / 'soulfra-service-catalog.json'
    with open(output_path, 'w') as f:
        json.dump(catalog, f, indent=2)
    
    print(f"✅ Found {len(services)} services from Soulfra")
    print(f"📄 Catalog saved to: {output_path}")
    
    # Print summary
    print("\n📊 Service Summary:")
    print(f"{'Category':<15} {'Count':<10} {'Total Value':<15}")
    print("-" * 40)
    
    by_category = {}
    for service in catalog['services'].values():
        cat = service['category']
        if cat not in by_category:
            by_category[cat] = {'count': 0, 'value': 0}
        by_category[cat]['count'] += 1
        by_category[cat]['value'] += service['price']
    
    for cat, data in by_category.items():
        print(f"{cat:<15} {data['count']:<10} ${data['value']/100:<15.2f}")
    
    total_value = sum(s['price'] for s in catalog['services'].values())
    print("-" * 40)
    print(f"{'TOTAL':<15} {len(services):<10} ${total_value/100:<15.2f}")
    
    return catalog

def get_service_features(service_name: str) -> List[str]:
    """Get features for a service based on its name"""
    feature_map = {
        'code-cleanup': ['Format code', 'Remove dead code', 'Organize imports', 'Fix naming'],
        'documentation-generator': ['README generation', 'API docs', 'Code comments', 'Usage examples'],
        'api-generator': ['REST endpoints', 'OpenAPI spec', 'Authentication', 'Validation'],
        'test-generator': ['Unit tests', 'Integration tests', 'Test coverage', 'Mocks'],
        'security-filter': ['Vulnerability scan', 'Input validation', 'XSS protection', 'SQL injection prevention'],
        'ai-conductor': ['Service orchestration', 'Workflow automation', 'AI routing', 'Load balancing'],
    }
    
    return feature_map.get(service_name, ['Advanced processing', 'AI-powered analysis', 'Automated optimization'])

def estimate_processing_time(complexity: str) -> str:
    """Estimate processing time based on complexity"""
    times = {
        'simple': '5-10 minutes',
        'medium': '15-30 minutes',
        'complex': '30-60 minutes'
    }
    return times.get(complexity, '20-40 minutes')

def estimate_confidence(metadata: Dict) -> float:
    """Estimate service confidence based on metadata"""
    confidence = 0.7  # Base confidence
    
    if metadata.get('has_api'):
        confidence += 0.1
    if metadata.get('has_tests'):
        confidence += 0.1
    if 'error' not in metadata:
        confidence += 0.05
    if len(metadata.get('dependencies', [])) < 10:
        confidence += 0.05
    
    return min(confidence, 0.95)

if __name__ == '__main__':
    catalog = generate_service_catalog()
    
    print("\n🚀 Next Steps:")
    print("1. Run: python scripts/create-service-adapters.py")
    print("2. Run: python scripts/integrate-soulfra-services.py")
    print("3. Test with: npm run test:services")
    print("4. Deploy with: npm run deploy:all-services")