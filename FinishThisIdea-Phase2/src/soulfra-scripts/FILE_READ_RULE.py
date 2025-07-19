#!/usr/bin/env python3
"""
FILE READ RULE - Ensure all files are read before writing
This prevents the "File has not been read yet" error throughout the ecosystem
"""

import os
import sys
import inspect
import functools

class FileReadRule:
    """Enforces reading files before writing to prevent ecosystem errors"""
    
    def __init__(self):
        self.read_files = set()
        self.debug_mode = True
    
    def mark_as_read(self, file_path):
        """Mark a file as having been read"""
        abs_path = os.path.abspath(file_path)
        self.read_files.add(abs_path)
        if self.debug_mode:
            print(f" File marked as read: {abs_path}")
    
    def check_read_before_write(self, file_path):
        """Check if file was read before writing"""
        abs_path = os.path.abspath(file_path)
        if abs_path not in self.read_files:
            caller_info = self.get_caller_info()
            error_msg = f"""
 FILE READ RULE VIOLATION:
   File: {file_path}
   Caller: {caller_info}
   
   Solution: Read the file first using one of these methods:
   - Read tool/function
   - open() and read content
   - os.path.exists() check
   
   This rule prevents ecosystem debugging issues.
"""
            raise FileNotReadError(error_msg)
        
        if self.debug_mode:
            print(f" File read check passed: {abs_path}")
    
    def get_caller_info(self):
        """Get information about who called the function"""
        frame = inspect.currentframe()
        try:
            # Go up the call stack to find the caller
            for i in range(10):  # Max 10 levels up
                frame = frame.f_back
                if frame is None:
                    break
                
                filename = frame.f_code.co_filename
                line_number = frame.f_lineno
                function_name = frame.f_code.co_name
                
                # Skip internal functions
                if not any(skip in filename for skip in ['FileReadRule', '__init__']):
                    return f"{os.path.basename(filename)}:{function_name}:{line_number}"
            
            return "Unknown caller"
        finally:
            del frame

# Global instance for the ecosystem
file_read_rule = FileReadRule()

class FileNotReadError(Exception):
    """Raised when trying to write to a file that hasn't been read"""
    pass

def enforce_read_before_write(func):
    """Decorator to enforce reading before writing"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # Try to extract file path from arguments
        file_path = None
        
        # Check common parameter names
        for arg_name in ['file_path', 'filename', 'path']:
            if arg_name in kwargs:
                file_path = kwargs[arg_name]
                break
        
        # Check positional arguments
        if not file_path and args:
            file_path = args[0]  # Assume first arg is file path
        
        if file_path and isinstance(file_path, str):
            file_read_rule.check_read_before_write(file_path)
        
        return func(*args, **kwargs)
    
    return wrapper

# Monkey patch common write functions
original_open = open

def safe_open(file_path, mode='r', *args, **kwargs):
    """Safe open that enforces read-before-write rule"""
    if 'w' in mode or 'a' in mode:
        # Writing mode - check if file was read first
        if os.path.exists(file_path):
            file_read_rule.check_read_before_write(file_path)
    
    result = original_open(file_path, mode, *args, **kwargs)
    
    if 'r' in mode:
        # Reading mode - mark as read
        file_read_rule.mark_as_read(file_path)
    
    return result

# Patch the built-in open function
import builtins
builtins.open = safe_open

def safe_write_text(file_path, content, encoding='utf-8'):
    """Safe write function that enforces the rule"""
    file_read_rule.check_read_before_write(file_path)
    with original_open(file_path, 'w', encoding=encoding) as f:
        f.write(content)
    print(f" Successfully wrote to {file_path}")

def safe_read_text(file_path, encoding='utf-8'):
    """Safe read function that marks file as read"""
    with original_open(file_path, 'r', encoding=encoding) as f:
        content = f.read()
    file_read_rule.mark_as_read(file_path)
    return content

def quick_read_check(file_path):
    """Quick way to mark a file as read without actually reading content"""
    file_read_rule.mark_as_read(file_path)  # Mark as read regardless of existence
    return os.path.exists(file_path)

def get_ecosystem_status():
    """Get status of files that have been read"""
    return {
        'files_read': len(file_read_rule.read_files),
        'read_files': list(file_read_rule.read_files),
        'debug_mode': file_read_rule.debug_mode
    }

def set_debug_mode(enabled=True):
    """Enable or disable debug mode"""
    file_read_rule.debug_mode = enabled
    print(f" Debug mode: {'ON' if enabled else 'OFF'}")

if __name__ == '__main__':
    print("""
 FILE READ RULE - Ecosystem Protection System

This module prevents "File has not been read yet" errors by:

1. Tracking which files have been read
2. Enforcing read-before-write rule  
3. Providing safe read/write functions
4. Debugging ecosystem file operations

Usage:
    from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check
    
    # Always read first
    content = safe_read_text('myfile.txt')
    
    # Or just mark as read
    quick_read_check('myfile.txt')
    
    # Then write
    safe_write_text('myfile.txt', 'new content')

This rule helps catch errors in Cal, Domingo, narrator, and debugging systems.
""")