#!/usr/bin/env python3
"""
Wrapper to adapt Soulfra services for FinishThisIdea job processing
Provides a consistent interface for all Python-based services
"""

import sys
import os
import json
import argparse
import importlib.util
import tempfile
import shutil
import zipfile
from pathlib import Path

def extract_zip(zip_path, extract_to):
    """Extract zip file to directory"""
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)

def create_zip(source_dir, zip_path):
    """Create zip file from directory"""
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)

def load_soulfra_module(script_path):
    """Dynamically load a Soulfra Python module"""
    spec = importlib.util.spec_from_file_location("soulfra_service", script_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules["soulfra_service"] = module
    
    # Add script directory to path for imports
    sys.path.insert(0, os.path.dirname(script_path))
    
    spec.loader.exec_module(module)
    return module

def find_main_function(module):
    """Find the main processing function in the module"""
    # Common function names in Soulfra services
    function_names = [
        'main', 'process', 'run', 'execute',
        'process_code', 'analyze', 'generate',
        'start_server', 'handle_request'
    ]
    
    for name in function_names:
        if hasattr(module, name) and callable(getattr(module, name)):
            return getattr(module, name)
    
    # Look for classes with process methods
    for attr_name in dir(module):
        attr = getattr(module, attr_name)
        if isinstance(attr, type) and hasattr(attr, 'process'):
            # Return a wrapper that instantiates and calls process
            def wrapper(*args, **kwargs):
                instance = attr()
                return instance.process(*args, **kwargs)
            return wrapper
    
    return None

def adapt_soulfra_service(module, input_path, output_dir):
    """Adapt Soulfra service to our interface"""
    main_func = find_main_function(module)
    
    if not main_func:
        # If no main function, check if it's a server-based service
        if hasattr(module, 'PORT') or 'HTTPServer' in str(module.__dict__):
            return run_server_based_service(module, input_path, output_dir)
        else:
            raise Exception("Could not find main processing function")
    
    # Try different calling conventions
    try:
        # Convention 1: main(input_file, output_dir)
        result = main_func(input_path, output_dir)
    except TypeError:
        try:
            # Convention 2: main() with globals
            module.INPUT_FILE = input_path
            module.OUTPUT_DIR = output_dir
            result = main_func()
        except:
            # Convention 3: process with config
            config = {
                'input': input_path,
                'output': output_dir
            }
            result = main_func(config)
    
    return result

def run_server_based_service(module, input_path, output_dir):
    """Handle server-based Soulfra services"""
    # For server-based services, we'll simulate a request
    import requests
    import threading
    import time
    
    # Start server in background
    server_thread = threading.Thread(target=lambda: module.main() if hasattr(module, 'main') else None)
    server_thread.daemon = True
    server_thread.start()
    
    # Wait for server to start
    time.sleep(2)
    
    # Determine port
    port = getattr(module, 'PORT', 8080)
    
    # Send request
    with open(input_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f'http://localhost:{port}/process', files=files)
    
    # Save response
    result_path = os.path.join(output_dir, 'result.json')
    with open(result_path, 'w') as f:
        json.dump(response.json(), f)
    
    return response.json()

def main():
    parser = argparse.ArgumentParser(description='Soulfra Service Wrapper')
    parser.add_argument('service_script', help='Path to Soulfra service script')
    parser.add_argument('--input', required=True, help='Input file path')
    parser.add_argument('--output', required=True, help='Output directory')
    parser.add_argument('--job-mode', action='store_true', help='Run in job mode')
    parser.add_argument('--config', help='JSON config for service')
    
    args = parser.parse_args()
    
    try:
        print(f"progress: 10")
        
        # Create temp working directory
        work_dir = tempfile.mkdtemp()
        
        # Extract input if it's a zip
        if args.input.endswith('.zip'):
            extract_dir = os.path.join(work_dir, 'input')
            os.makedirs(extract_dir)
            extract_zip(args.input, extract_dir)
            input_path = extract_dir
        else:
            input_path = args.input
        
        print(f"progress: 20")
        
        # Load Soulfra module
        module = load_soulfra_module(args.service_script)
        
        print(f"progress: 30")
        
        # Process with Soulfra service
        result = adapt_soulfra_service(module, input_path, args.output)
        
        print(f"progress: 80")
        
        # Ensure output is packaged
        output_files = os.listdir(args.output)
        if not any(f.endswith('.zip') for f in output_files):
            # Create output zip
            output_zip = os.path.join(args.output, 'output.zip')
            create_zip(args.output, output_zip)
        
        print(f"progress: 90")
        
        # Return result as JSON
        result_data = {
            'success': True,
            'metadata': result if isinstance(result, dict) else {'result': str(result)},
            'outputFiles': os.listdir(args.output)
        }
        
        print(json.dumps(result_data))
        print(f"progress: 100")
        
        # Cleanup
        shutil.rmtree(work_dir, ignore_errors=True)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()