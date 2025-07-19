#!/usr/bin/env python3
"""
CODE GPS MVP - Visualize and Fix Your Codebase Chaos
Built to untangle SOULFRA and help other solo founders
"""

import os
import json
import hashlib
import networkx as nx
import matplotlib.pyplot as plt
from pathlib import Path
from collections import defaultdict
import subprocess
import re
from datetime import datetime

class CodeGPS:
    def __init__(self, project_path="."):
        self.project_path = Path(project_path)
        self.files = {}
        self.duplicates = defaultdict(list)
        self.symlinks = []
        self.ports_in_use = defaultdict(list)
        self.graph = nx.DiGraph()
        self.best_versions = {}
        
    def scan_project(self):
        """Scan the entire project and identify issues"""
        print(" Scanning SOULFRA project structure...")
        
        # Find all Python and JS files
        for ext in ['*.py', '*.js']:
            for file_path in self.project_path.rglob(ext):
                if 'node_modules' in str(file_path) or '__pycache__' in str(file_path):
                    continue
                    
                # Check if symlink
                if file_path.is_symlink():
                    self.symlinks.append(str(file_path))
                    
                # Get file info
                try:
                    content = file_path.read_text(errors='ignore')
                    file_hash = hashlib.md5(content.encode()).hexdigest()
                    
                    self.files[str(file_path)] = {
                        'hash': file_hash,
                        'size': file_path.stat().st_size,
                        'lines': len(content.splitlines()),
                        'content': content[:1000],  # First 1000 chars for analysis
                        'ports': self._extract_ports(content),
                        'imports': self._extract_imports(content, file_path.suffix)
                    }
                    
                    # Track duplicates by content hash
                    self.duplicates[file_hash].append(str(file_path))
                    
                    # Track port usage
                    for port in self.files[str(file_path)]['ports']:
                        self.ports_in_use[port].append(str(file_path))
                        
                except Exception as e:
                    print(f"  Error reading {file_path}: {e}")
                    
    def _extract_ports(self, content):
        """Extract port numbers from code"""
        ports = []
        # Common port patterns
        patterns = [
            r'port[:\s]*=?\s*(\d{4,5})',
            r'PORT[:\s]*=?\s*(\d{4,5})',
            r':(\d{4,5})',
            r'localhost:(\d{4,5})',
            r'0\.0\.0\.0:(\d{4,5})'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            ports.extend([int(p) for p in matches if 1000 < int(p) < 65535])
            
        return list(set(ports))
        
    def _extract_imports(self, content, ext):
        """Extract imports/requires from code"""
        imports = []
        
        if ext == '.py':
            # Python imports
            patterns = [
                r'from\s+(\S+)\s+import',
                r'import\s+(\S+)'
            ]
        else:
            # JavaScript imports
            patterns = [
                r'require\([\'"](.+?)[\'"]\)',
                r'from\s+[\'"](.+?)[\'"]',
                r'import\s+.*\s+from\s+[\'"](.+?)[\'"]'
            ]
            
        for pattern in patterns:
            matches = re.findall(pattern, content)
            imports.extend(matches)
            
        return list(set(imports))
        
    def analyze_chaos(self):
        """Analyze the project chaos and identify issues"""
        print("\n CHAOS ANALYSIS RESULTS")
        print("=" * 50)
        
        # Duplicate files
        print(f"\n DUPLICATE FILES: {sum(len(files) > 1 for files in self.duplicates.values())}")
        for file_hash, files in self.duplicates.items():
            if len(files) > 1:
                print(f"\n  Duplicate group ({len(files)} files):")
                # Pick best version (most recent, largest, or in better location)
                best = self._pick_best_version(files)
                self.best_versions[file_hash] = best
                for f in files:
                    marker = "" if f == best else ""
                    print(f"    {marker} {f} ({self.files[f]['lines']} lines)")
                    
        # Symlinks
        print(f"\n SYMLINKS FOUND: {len(self.symlinks)}")
        for link in self.symlinks[:10]:
            print(f"    {link}")
            
        # Port conflicts
        print(f"\n PORT CONFLICTS:")
        for port, files in self.ports_in_use.items():
            if len(files) > 1:
                print(f"\n  Port {port} used by {len(files)} files:")
                for f in files:
                    print(f"    - {f}")
                    
        # Service analysis
        self._analyze_services()
        
    def _pick_best_version(self, files):
        """Pick the best version of duplicate files"""
        scored_files = []
        
        for f in files:
            score = 0
            file_info = self.files[f]
            
            # Prefer files with more lines (more complete)
            score += file_info['lines']
            
            # Prefer files not in backup/old directories
            if 'backup' not in f.lower() and 'old' not in f.lower():
                score += 1000
                
            # Prefer files in cleaner paths
            if 'tier-minus10' in f:
                score += 500  # Latest tier
            elif 'ULTIMATE' in f or 'UNIFIED' in f:
                score += 400  # Integrated versions
                
            # Prefer files with clear names
            if 'WORKING' in f or 'FINAL' in f:
                score += 200
                
            scored_files.append((score, f))
            
        # Return the highest scoring file
        scored_files.sort(reverse=True)
        return scored_files[0][1]
        
    def _analyze_services(self):
        """Analyze different service implementations"""
        print("\n SERVICE IMPLEMENTATIONS FOUND:")
        
        services = {
            'main_platforms': [],
            'games': [],
            'economies': [],
            'filters': [],
            'other': []
        }
        
        for file_path in self.files:
            if file_path.endswith('.py'):
                name = Path(file_path).name.upper()
                
                if 'SOULFRA' in name and ('UNIFIED' in name or 'ULTIMATE' in name or 'PLATFORM' in name):
                    services['main_platforms'].append(file_path)
                elif 'GAME' in name or 'RUNESCAPE' in name or 'HABBO' in name:
                    services['games'].append(file_path)
                elif 'VIBE' in name or 'ECONOMY' in name or 'TOKEN' in name:
                    services['economies'].append(file_path)
                elif 'CRINGE' in name or 'FILTER' in name:
                    services['filters'].append(file_path)
                else:
                    services['other'].append(file_path)
                    
        for category, files in services.items():
            if files:
                print(f"\n  {category.replace('_', ' ').title()}: {len(files)} implementations")
                for f in files[:5]:
                    print(f"    - {Path(f).name}")
                    
    def visualize_chaos(self):
        """Create visual representation of the chaos"""
        print("\n Generating chaos visualization...")
        
        # Create a graph of file relationships
        plt.figure(figsize=(20, 16))
        
        # Add nodes for each unique file type
        node_colors = []
        node_sizes = []
        labels = {}
        
        for file_path, info in self.files.items():
            if len(self.graph) > 100:  # Limit for readability
                break
                
            name = Path(file_path).name
            self.graph.add_node(name)
            labels[name] = name[:20] + "..." if len(name) > 20 else name
            
            # Color by type
            if 'SOULFRA' in name.upper():
                node_colors.append('red')
                node_sizes.append(1000)
            elif 'GAME' in name.upper():
                node_colors.append('blue')
                node_sizes.append(800)
            elif 'VIBE' in name.upper() or 'ECONOMY' in name.upper():
                node_colors.append('green')
                node_sizes.append(800)
            else:
                node_colors.append('gray')
                node_sizes.append(400)
                
            # Add edges for imports
            for imp in info['imports']:
                if imp in labels:
                    self.graph.add_edge(name, imp)
                    
        # Draw the graph
        pos = nx.spring_layout(self.graph, k=3, iterations=50)
        nx.draw(self.graph, pos, 
                node_color=node_colors,
                node_size=node_sizes,
                with_labels=True,
                labels=labels,
                font_size=8,
                font_weight='bold',
                arrows=True,
                edge_color='gray',
                alpha=0.7)
                
        plt.title("SOULFRA Codebase Chaos Visualization", fontsize=20, fontweight='bold')
        plt.tight_layout()
        
        # Save the visualization
        output_file = "soulfra_chaos_map.png"
        plt.savefig(output_file, dpi=150, bbox_inches='tight')
        print(f" Chaos map saved to: {output_file}")
        plt.close()
        
    def generate_cleanup_script(self):
        """Generate a script to clean up the mess"""
        print("\n Generating cleanup script...")
        
        script = '''#!/bin/bash
# SOULFRA Cleanup Script - Generated by Code GPS
# Run this to create a clean, unified structure

echo " SOULFRA CLEANUP SCRIPT"
echo "========================"
echo ""
echo "This will create a clean SOULFRA structure from your chaos."
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Create clean directory structure
echo " Creating clean structure..."
mkdir -p SOULFRA_CLEAN/{backend,frontend,shared,config,scripts,docs}

# Function to safely copy best version
copy_best() {
    src="$1"
    dst="$2"
    if [ -f "$src" ]; then
        echo "   Copying $(basename "$src")"
        cp "$src" "$dst"
    fi
}

'''
        
        # Add copy commands for best versions
        copied_files = set()
        
        # Main platform file
        platform_files = [f for f in self.files if 'ULTIMATE' in f or 'UNIFIED' in f]
        if platform_files:
            best_platform = max(platform_files, key=lambda f: self.files[f]['lines'])
            script += f'# Main platform\ncopy_best "{best_platform}" "SOULFRA_CLEAN/backend/app.py"\n\n'
            copied_files.add(best_platform)
            
        # Economy files
        script += "# Economy systems\n"
        for f in self.files:
            if 'VIBE' in f.upper() or 'ECONOMY' in f.upper():
                if f not in copied_files:
                    name = Path(f).name
                    script += f'copy_best "{f}" "SOULFRA_CLEAN/shared/{name}"\n'
                    copied_files.add(f)
                    
        script += "\n# Game implementations\n"
        for f in self.files:
            if ('GAME' in f.upper() or 'RUNESCAPE' in f.upper() or 'HABBO' in f.upper()):
                if f not in copied_files:
                    name = Path(f).name
                    script += f'copy_best "{f}" "SOULFRA_CLEAN/shared/{name}"\n'
                    copied_files.add(f)
                    
        # Create unified launcher
        script += '''
# Create unified launcher
cat > SOULFRA_CLEAN/launch.py << 'EOF'
#!/usr/bin/env python3
"""
SOULFRA Unified Launcher - No more timeouts, no more port conflicts
Generated by Code GPS
"""

import os
import sys
import signal
import subprocess
from pathlib import Path

class SOULFRALauncher:
    def __init__(self):
        self.process = None
        self.port = 7777
        
    def kill_existing(self):
        """Kill any existing processes on our port"""
        os.system(f'lsof -ti :{self.port} | xargs kill -9 2>/dev/null')
        
    def launch(self):
        """Launch SOULFRA with auto-restart on timeout"""
        print(" Launching SOULFRA Ultimate Platform")
        print(f" Access at: http://localhost:{self.port}")
        print(" Mobile: http://[your-ip]:{self.port}")
        print("")
        
        while True:
            try:
                self.kill_existing()
                self.process = subprocess.Popen(
                    [sys.executable, 'backend/app.py'],
                    cwd=Path(__file__).parent
                )
                self.process.wait()
            except KeyboardInterrupt:
                print("\\n Shutting down SOULFRA...")
                if self.process:
                    self.process.terminate()
                break
            except Exception as e:
                print(f"  Error: {e}")
                print(" Restarting in 5 seconds...")
                time.sleep(5)

if __name__ == "__main__":
    launcher = SOULFRALauncher()
    launcher.launch()
EOF

chmod +x SOULFRA_CLEAN/launch.py

# Create requirements.txt
echo " Creating unified requirements.txt..."
cat > SOULFRA_CLEAN/requirements.txt << 'EOF'
flask==2.3.2
flask-socketio==5.3.4
flask-cors==4.0.0
stripe==5.4.0
requests==2.31.0
python-dotenv==1.0.0
sqlite3
EOF

# Create setup script
cat > SOULFRA_CLEAN/setup.sh << 'EOF'
#!/bin/bash
echo " Setting up SOULFRA..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo " Setup complete! Run ./launch.py to start"
EOF

chmod +x SOULFRA_CLEAN/setup.sh

echo ""
echo " CLEANUP COMPLETE!"
echo ""
echo "Next steps:"
echo "1. cd SOULFRA_CLEAN"
echo "2. ./setup.sh"
echo "3. ./launch.py"
echo ""
echo "Your chaos has been transformed into a clean structure! "
'''
        
        # Write the cleanup script
        with open('cleanup_soulfra.sh', 'w') as f:
            f.write(script)
            
        os.chmod('cleanup_soulfra.sh', 0o755)
        print(" Cleanup script created: cleanup_soulfra.sh")
        
    def generate_report(self):
        """Generate a comprehensive report of findings"""
        report = {
            'scan_time': datetime.now().isoformat(),
            'total_files': len(self.files),
            'duplicate_groups': sum(len(files) > 1 for files in self.duplicates.values()),
            'total_duplicates': sum(len(files) - 1 for files in self.duplicates.values() if len(files) > 1),
            'symlinks': len(self.symlinks),
            'port_conflicts': sum(len(files) > 1 for files in self.ports_in_use.values()),
            'recommendations': []
        }
        
        # Add recommendations
        if report['duplicate_groups'] > 0:
            report['recommendations'].append(
                f"Remove {report['total_duplicates']} duplicate files to save space and reduce confusion"
            )
            
        if report['symlinks'] > 0:
            report['recommendations'].append(
                f"Replace {report['symlinks']} symlinks with proper imports"
            )
            
        if report['port_conflicts'] > 0:
            report['recommendations'].append(
                "Consolidate services to use consistent ports"
            )
            
        # Find the best main file
        platform_files = [f for f in self.files if 'SOULFRA' in f.upper() and ('ULTIMATE' in f.upper() or 'UNIFIED' in f.upper())]
        if platform_files:
            best = max(platform_files, key=lambda f: self.files[f]['lines'])
            report['recommendations'].append(
                f"Use {Path(best).name} as your main platform file ({self.files[best]['lines']} lines)"
            )
            
        # Save report
        with open('code_gps_report.json', 'w') as f:
            json.dump(report, f, indent=2)
            
        print("\n Report saved to: code_gps_report.json")
        
        return report

def main():
    print("""
     CODE GPS - SOULFRA Chaos Navigator
    =====================================
    
    This tool will analyze your messy codebase and help you clean it up!
    """)
    
    gps = CodeGPS()
    
    # Run the analysis
    gps.scan_project()
    gps.analyze_chaos()
    gps.visualize_chaos()
    gps.generate_cleanup_script()
    report = gps.generate_report()
    
    print("\n ANALYSIS COMPLETE!")
    print(f"\n Summary:")
    print(f"  - Files analyzed: {report['total_files']}")
    print(f"  - Duplicates found: {report['total_duplicates']}")
    print(f"  - Port conflicts: {report['port_conflicts']}")
    print(f"  - Symlinks: {report['symlinks']}")
    
    print("\n Next Steps:")
    print("  1. Review the chaos visualization: soulfra_chaos_map.png")
    print("  2. Check the detailed report: code_gps_report.json")
    print("  3. Run the cleanup script: ./cleanup_soulfra.sh")
    print("  4. Start fresh with the cleaned structure!")
    
    print("\n This chaos analysis will become the first demo of Code GPS!")

if __name__ == "__main__":
    main()