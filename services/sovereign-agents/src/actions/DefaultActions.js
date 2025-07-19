/**
 * Default Actions - Pre-built actions for Sovereign Agents
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

/**
 * File System Actions
 */
const FILE_ACTIONS = {
  // Create file action
  createFile: {
    name: 'Create File',
    description: 'Create a new file with specified content',
    category: 'filesystem',
    requiresApproval: false,
    rollbackable: true,

    async execute(params, context, execution) {
      const { filePath, content, encoding = 'utf8' } = params;
      
      if (!filePath || content === undefined) {
        throw new Error('filePath and content are required');
      }

      // Check if file already exists
      let fileExisted = false;
      let originalContent = null;
      
      try {
        originalContent = await fs.readFile(filePath, encoding);
        fileExisted = true;
      } catch {
        // File doesn't exist, which is expected
      }

      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Write the file
      await fs.writeFile(filePath, content, encoding);

      console.log(`📄 Created file: ${filePath}`);

      return {
        result: { filePath, created: true, size: content.length },
        rollbackData: { filePath, fileExisted, originalContent, encoding }
      };
    },

    async rollback(rollbackData) {
      const { filePath, fileExisted, originalContent, encoding } = rollbackData;

      if (fileExisted && originalContent !== null) {
        // Restore original content
        await fs.writeFile(filePath, originalContent, encoding);
        console.log(`🔄 Restored file: ${filePath}`);
      } else {
        // Delete the file we created
        await fs.unlink(filePath);
        console.log(`🗑️ Deleted file: ${filePath}`);
      }

      return { filePath, restored: true };
    },

    async validate(params) {
      const errors = [];
      if (!params.filePath) errors.push('filePath is required');
      if (params.content === undefined) errors.push('content is required');
      
      return { valid: errors.length === 0, errors };
    }
  },

  // Read file action
  readFile: {
    name: 'Read File',
    description: 'Read content from a file',
    category: 'filesystem',
    requiresApproval: false,
    rollbackable: false,

    async execute(params) {
      const { filePath, encoding = 'utf8' } = params;
      
      const content = await fs.readFile(filePath, encoding);
      const stats = await fs.stat(filePath);

      return {
        content,
        size: stats.size,
        modified: stats.mtime.toISOString()
      };
    },

    async validate(params) {
      const errors = [];
      if (!params.filePath) errors.push('filePath is required');
      
      return { valid: errors.length === 0, errors };
    }
  },

  // Delete file action
  deleteFile: {
    name: 'Delete File',
    description: 'Delete a file from the filesystem',
    category: 'filesystem',
    requiresApproval: true,
    rollbackable: true,

    async execute(params, context, execution) {
      const { filePath } = params;
      
      // Read file content for rollback
      let originalContent;
      let originalStats;
      
      try {
        originalContent = await fs.readFile(filePath, 'utf8');
        originalStats = await fs.stat(filePath);
      } catch (error) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Delete the file
      await fs.unlink(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);

      return {
        result: { filePath, deleted: true },
        rollbackData: { filePath, originalContent, originalStats }
      };
    },

    async rollback(rollbackData) {
      const { filePath, originalContent } = rollbackData;
      
      // Recreate the file
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, originalContent, 'utf8');
      
      console.log(`🔄 Restored deleted file: ${filePath}`);
      return { filePath, restored: true };
    },

    async validate(params) {
      const errors = [];
      if (!params.filePath) errors.push('filePath is required');
      
      return { valid: errors.length === 0, errors };
    }
  }
};

/**
 * Git Actions
 */
const GIT_ACTIONS = {
  // Git commit action
  gitCommit: {
    name: 'Git Commit',
    description: 'Create a git commit with specified message',
    category: 'git',
    requiresApproval: false,
    rollbackable: true,

    async execute(params, context) {
      const { message, files = [], workingDirectory = process.cwd() } = params;
      
      if (!message) {
        throw new Error('Commit message is required');
      }

      // Get current HEAD for rollback
      const currentHead = await this.executeGit(['rev-parse', 'HEAD'], workingDirectory);
      
      // Add files if specified
      if (files.length > 0) {
        await this.executeGit(['add', ...files], workingDirectory);
      } else {
        await this.executeGit(['add', '.'], workingDirectory);
      }

      // Create commit
      const commitResult = await this.executeGit(['commit', '-m', message], workingDirectory);
      const newHead = await this.executeGit(['rev-parse', 'HEAD'], workingDirectory);

      console.log(`📝 Git commit created: ${message}`);

      return {
        result: { 
          commitHash: newHead.stdout.trim(),
          message,
          files: files.length || 'all'
        },
        rollbackData: { 
          previousHead: currentHead.stdout.trim(),
          workingDirectory 
        }
      };
    },

    async rollback(rollbackData) {
      const { previousHead, workingDirectory } = rollbackData;
      
      // Reset to previous HEAD
      await this.executeGit(['reset', '--hard', previousHead], workingDirectory);
      
      console.log(`🔄 Git reset to: ${previousHead}`);
      return { resetTo: previousHead };
    },

    async executeGit(args, cwd) {
      return new Promise((resolve, reject) => {
        const process = spawn('git', args, { cwd, stdio: 'pipe' });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => stdout += data.toString());
        process.stderr.on('data', (data) => stderr += data.toString());
        
        process.on('close', (code) => {
          if (code === 0) {
            resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
          } else {
            reject(new Error(`Git command failed: ${stderr}`));
          }
        });
      });
    },

    async validate(params) {
      const errors = [];
      if (!params.message) errors.push('Commit message is required');
      
      return { valid: errors.length === 0, errors };
    }
  },

  // Git branch action
  gitCreateBranch: {
    name: 'Git Create Branch',
    description: 'Create a new git branch',
    category: 'git',
    requiresApproval: false,
    rollbackable: true,

    async execute(params, context) {
      const { branchName, fromBranch = 'HEAD', workingDirectory = process.cwd() } = params;
      
      // Check if branch already exists
      try {
        await this.executeGit(['rev-parse', '--verify', branchName], workingDirectory);
        throw new Error(`Branch ${branchName} already exists`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          // Branch doesn't exist, which is what we want
        } else {
          throw error;
        }
      }

      // Create branch
      await this.executeGit(['checkout', '-b', branchName, fromBranch], workingDirectory);
      
      console.log(`🌿 Created git branch: ${branchName}`);

      return {
        result: { branchName, fromBranch },
        rollbackData: { branchName, workingDirectory }
      };
    },

    async rollback(rollbackData) {
      const { branchName, workingDirectory } = rollbackData;
      
      // Switch to main/master and delete the branch
      try {
        await this.executeGit(['checkout', 'main'], workingDirectory);
      } catch {
        await this.executeGit(['checkout', 'master'], workingDirectory);
      }
      
      await this.executeGit(['branch', '-D', branchName], workingDirectory);
      
      console.log(`🗑️ Deleted git branch: ${branchName}`);
      return { deletedBranch: branchName };
    },

    async executeGit(args, cwd) {
      return new Promise((resolve, reject) => {
        const process = spawn('git', args, { cwd, stdio: 'pipe' });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => stdout += data.toString());
        process.stderr.on('data', (data) => stderr += data.toString());
        
        process.on('close', (code) => {
          if (code === 0) {
            resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
          } else {
            reject(new Error(`Git command failed: ${stderr}`));
          }
        });
      });
    },

    async validate(params) {
      const errors = [];
      if (!params.branchName) errors.push('Branch name is required');
      
      return { valid: errors.length === 0, errors };
    }
  }
};

/**
 * System Actions
 */
const SYSTEM_ACTIONS = {
  // Execute shell command
  executeCommand: {
    name: 'Execute Command',
    description: 'Execute a shell command',
    category: 'system',
    requiresApproval: true,
    rollbackable: false,

    async execute(params, context) {
      const { command, args = [], workingDirectory = process.cwd(), timeout = 30000 } = params;
      
      return new Promise((resolve, reject) => {
        const process = spawn(command, args, {
          cwd: workingDirectory,
          stdio: 'pipe',
          timeout
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => stdout += data.toString());
        process.stderr.on('data', (data) => stderr += data.toString());

        process.on('close', (code) => {
          const result = {
            command,
            args,
            exitCode: code,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            success: code === 0
          };

          if (code === 0) {
            console.log(`✅ Command executed: ${command} ${args.join(' ')}`);
            resolve(result);
          } else {
            console.error(`❌ Command failed: ${command} ${args.join(' ')} (exit code: ${code})`);
            reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
          }
        });

        process.on('error', (error) => {
          reject(new Error(`Command execution error: ${error.message}`));
        });
      });
    },

    async validate(params) {
      const errors = [];
      if (!params.command) errors.push('Command is required');
      
      return { valid: errors.length === 0, errors };
    }
  },

  // HTTP request action
  httpRequest: {
    name: 'HTTP Request',
    description: 'Make an HTTP request',
    category: 'network',
    requiresApproval: false,
    rollbackable: false,

    async execute(params, context) {
      const { url, method = 'GET', headers = {}, body, timeout = 10000 } = params;
      
      // Use fetch API (assuming Node.js 18+ or polyfill)
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeout)
      });

      const responseData = await response.text();
      let parsedData;
      
      try {
        parsedData = JSON.parse(responseData);
      } catch {
        parsedData = responseData;
      }

      console.log(`🌐 HTTP ${method} ${url}: ${response.status}`);

      return {
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: parsedData,
        success: response.ok
      };
    },

    async validate(params) {
      const errors = [];
      if (!params.url) errors.push('URL is required');
      
      try {
        new URL(params.url);
      } catch {
        errors.push('Valid URL is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  }
};

/**
 * Document Processing Actions
 */
const DOCUMENT_ACTIONS = {
  // Parse document
  parseDocument: {
    name: 'Parse Document',
    description: 'Parse and analyze a document',
    category: 'document',
    requiresApproval: false,
    rollbackable: false,

    async execute(params, context) {
      const { filePath, format = 'auto', extractImages = false } = params;
      
      // Read file
      const content = await fs.readFile(filePath, 'utf8');
      const stats = await fs.stat(filePath);

      // Basic parsing (extend with actual parsing logic)
      const parsed = {
        filePath,
        format: format === 'auto' ? this.detectFormat(filePath) : format,
        size: stats.size,
        wordCount: content.split(/\s+/).length,
        lineCount: content.split('\n').length,
        modified: stats.mtime.toISOString(),
        content: format === 'json' ? JSON.parse(content) : content
      };

      console.log(`📄 Parsed document: ${filePath} (${parsed.wordCount} words)`);
      return parsed;
    },

    detectFormat(filePath) {
      const ext = path.extname(filePath).toLowerCase();
      const formatMap = {
        '.md': 'markdown',
        '.txt': 'text',
        '.json': 'json',
        '.yml': 'yaml',
        '.yaml': 'yaml',
        '.html': 'html',
        '.xml': 'xml'
      };
      return formatMap[ext] || 'text';
    },

    async validate(params) {
      const errors = [];
      if (!params.filePath) errors.push('filePath is required');
      
      return { valid: errors.length === 0, errors };
    }
  }
};

/**
 * Get all default actions
 */
function getAllDefaultActions() {
  return {
    ...FILE_ACTIONS,
    ...GIT_ACTIONS,
    ...SYSTEM_ACTIONS,
    ...DOCUMENT_ACTIONS
  };
}

/**
 * Register all default actions with an ActionRegistry
 */
function registerDefaultActions(actionRegistry) {
  const actions = getAllDefaultActions();
  const registeredIds = [];

  for (const [key, actionDef] of Object.entries(actions)) {
    try {
      const actionId = actionRegistry.registerAction({
        id: key,
        ...actionDef,
        registeredBy: 'system:default-actions'
      });
      registeredIds.push(actionId);
    } catch (error) {
      console.error(`❌ Failed to register default action ${key}:`, error.message);
    }
  }

  console.log(`✅ Registered ${registeredIds.length} default actions`);
  return registeredIds;
}

module.exports = {
  FILE_ACTIONS,
  GIT_ACTIONS,
  SYSTEM_ACTIONS,
  DOCUMENT_ACTIONS,
  getAllDefaultActions,
  registerDefaultActions
};