#!/usr/bin/env python3
"""
Create service adapters to integrate Soulfra services into FinishThisIdea
Wraps existing Soulfra functionality in our standardized service interface
"""

import os
import json
import shutil
from pathlib import Path
from typing import Dict, List

# Load service catalog
with open('soulfra-service-catalog.json', 'r') as f:
    CATALOG = json.load(f)

# Template for service adapter
SERVICE_ADAPTER_TEMPLATE = '''import path from 'path';
import fs from 'fs/promises';
import {{ v4 as uuidv4 }} from 'uuid';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { uploadToS3, downloadFromS3 } from '../utils/storage';
import { ProcessingError } from '../utils/errors';
import { spawn } from 'child_process';

export interface {ServiceName}Config {{
  // Service-specific configuration
  [key: string]: any;
}}

export interface {ServiceName}Result {{
  outputFileUrl: string;
  metadata: {{
    [key: string]: any;
  }};
  processingCost: number;
}}

/**
 * {ServiceTitle} Service
 * Adapted from Soulfra: {SourceFile}
 * {Description}
 */
export async function process{ServiceName}(
  jobId: string,
  config: {ServiceName}Config,
  progressCallback?: (progress: number) => void
): Promise<{ServiceName}Result> {{
  const updateProgress = (progress: number) => {{
    progressCallback?.(progress);
  }};

  updateProgress(5);

  try {{
    // Get job details
    const job = await prisma.job.findUnique({{
      where: {{ id: jobId }},
    }});

    if (!job) {{
      throw new ProcessingError('Job not found');
    }}

    logger.info('Starting {serviceName} processing', {{ jobId, config }});

    // Download input file
    updateProgress(10);
    const inputBuffer = await downloadFromS3(job.inputFileUrl);
    const tempDir = path.join('/tmp', `{serviceName}-${{jobId}}`);
    await fs.mkdir(tempDir, {{ recursive: true }});
    
    const inputPath = path.join(tempDir, 'input.zip');
    await fs.writeFile(inputPath, inputBuffer);
    
    updateProgress(20);
    
    // Call Soulfra service
    const result = await callSoulfraService('{soulfraScript}', inputPath, tempDir, (progress) => {{
      // Map progress from 20-80%
      updateProgress(20 + (progress * 0.6));
    }});
    
    updateProgress(80);
    
    // Package output
    const outputPath = path.join(tempDir, 'output.zip');
    await packageOutput(tempDir, outputPath);
    
    // Upload result
    const outputBuffer = await fs.readFile(outputPath);
    const s3Key = `{serviceName}/${{jobId}}/output.zip`;
    const outputUrl = await uploadToS3(outputBuffer, s3Key);
    
    updateProgress(95);
    
    // Cleanup
    await fs.rm(tempDir, {{ recursive: true, force: true }});
    
    updateProgress(100);
    
    return {{
      outputFileUrl: outputUrl,
      metadata: result.metadata || {{}},
      processingCost: calculateCost(result),
    }};
    
  }} catch (error) {{
    logger.error('{ServiceName} processing failed', {{ jobId, error }});
    throw error;
  }}
}}

async function callSoulfraService(
  scriptPath: string,
  inputPath: string,
  outputDir: string,
  progressCallback: (progress: number) => void
): Promise<any> {{
  return new Promise((resolve, reject) => {{
    const pythonProcess = spawn('python3', [
      scriptPath,
      '--input', inputPath,
      '--output', outputDir,
      '--job-mode'
    ]);
    
    let output = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {{
      output += data.toString();
      
      // Parse progress updates
      const progressMatch = data.toString().match(/progress:\s*(\d+)/);
      if (progressMatch) {{
        progressCallback(parseInt(progressMatch[1]) / 100);
      }}
    }});
    
    pythonProcess.stderr.on('data', (data) => {{
      error += data.toString();
    }});
    
    pythonProcess.on('close', (code) => {{
      if (code !== 0) {{
        reject(new Error(`Soulfra service failed: ${{error}}`));
      }} else {{
        try {{
          // Try to parse JSON output
          const jsonMatch = output.match(/\\{{.*\\}}/s);
          const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {{ success: true }};
          resolve(result);
        }} catch (e) {{
          resolve({{ success: true, output }});
        }}
      }}
    }});
  }});
}}

async function packageOutput(dir: string, outputPath: string): Promise<void> {{
  // Implementation depends on service output format
  // For now, create a simple zip of the directory
  const archiver = await import('archiver');
  const output = fs.createWriteStream(outputPath);
  const archive = archiver.create('zip', {{ zlib: {{ level: 9 }} }});
  
  archive.pipe(output);
  archive.directory(dir, false);
  await archive.finalize();
}}

function calculateCost(result: any): number {{
  // Basic cost calculation - can be enhanced based on actual usage
  return 0.001; // $0.001 base cost
}}
'''

# Job processor template
JOB_PROCESSOR_TEMPLATE = '''import Bull from 'bull';
import {{ logger }} from '../utils/logger';
import {{ prisma }} from '../utils/database';
import {{ process{ServiceName}, {ServiceName}Config }} from '../services/{serviceName}.service';

export const {serviceName}Queue = new Bull('{serviceName}-jobs', {{
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
}});

interface {ServiceName}JobData {{
  jobId: string;
  config?: {ServiceName}Config;
}}

{serviceName}Queue.process('process', async (job) => {{
  const {{ jobId, config }} = job.data as {ServiceName}JobData;
  
  try {{
    await prisma.job.update({{
      where: {{ id: jobId }},
      data: {{ status: 'PROCESSING' }},
    }});

    const result = await process{ServiceName}(jobId, config || {{}}, (progress) => {{
      job.progress(progress);
    }});

    await prisma.job.update({{
      where: {{ id: jobId }},
      data: {{ 
        status: 'COMPLETED',
        outputFileUrl: result.outputFileUrl,
        progress: 100,
        processingEndedAt: new Date()
      }},
    }});

    logger.info('{ServiceName} completed successfully', {{
      jobId,
      metadata: result.metadata,
      cost: result.processingCost
    }});

    return result;

  }} catch (error) {{
    logger.error('{ServiceName} failed', {{ jobId, error }});
    
    await prisma.job.update({{
      where: {{ id: jobId }},
      data: {{ 
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingEndedAt: new Date()
      }},
    }});

    throw error;
  }}
}});

export default {serviceName}Queue;
'''

def create_service_adapter(service_id: str, service_data: Dict):
    """Create TypeScript adapter for a Soulfra service"""
    
    # Convert service-name to ServiceName
    service_name_parts = service_id.split('-')
    service_name_camel = ''.join(part.capitalize() for part in service_name_parts)
    service_name = service_name_camel[0].lower() + service_name_camel[1:]
    
    # Get service details
    title = service_data['name']
    source_file = Path(service_data['primary_file']).name
    description = service_data['metadata'].get('description', 'Automated service from Soulfra')
    
    # Create service adapter
    adapter_content = SERVICE_ADAPTER_TEMPLATE.format(
        ServiceName=service_name_camel,
        serviceName=service_name,
        ServiceTitle=title,
        SourceFile=source_file,
        Description=description.replace('\n', '\n * '),
        soulfraScript=service_data['primary_file']
    )
    
    # Write service file
    service_path = Path(f'../src/services/{service_name}.service.ts')
    service_path.parent.mkdir(parents=True, exist_ok=True)
    service_path.write_text(adapter_content)
    
    # Create job processor
    job_content = JOB_PROCESSOR_TEMPLATE.format(
        ServiceName=service_name_camel,
        serviceName=service_name
    )
    
    # Write job processor
    job_path = Path(f'../src/jobs/{service_name}.job.ts')
    job_path.parent.mkdir(parents=True, exist_ok=True)
    job_path.write_text(job_content)
    
    return service_name

def copy_soulfra_scripts():
    """Copy Soulfra Python scripts to our project"""
    scripts_dir = Path('../src/soulfra-scripts')
    scripts_dir.mkdir(parents=True, exist_ok=True)
    
    copied_files = []
    
    for service_id, service_data in CATALOG['services'].items():
        primary_file = service_data['primary_file']
        if os.path.exists(primary_file):
            # Copy to our project
            dest_name = f"{service_id}.py"
            dest_path = scripts_dir / dest_name
            shutil.copy2(primary_file, dest_path)
            copied_files.append(dest_name)
            
            # Also copy FILE_READ_RULE.py if referenced
            source_dir = Path(primary_file).parent
            file_read_rule = source_dir / 'FILE_READ_RULE.py'
            if file_read_rule.exists() and not (scripts_dir / 'FILE_READ_RULE.py').exists():
                shutil.copy2(file_read_rule, scripts_dir / 'FILE_READ_RULE.py')
    
    return copied_files

def update_server_imports():
    """Generate import statements for server.ts"""
    imports = []
    queue_names = []
    
    for service_id in CATALOG['services'].keys():
        service_name = ''.join(part.capitalize() for part in service_id.split('-'))
        service_name = service_name[0].lower() + service_name[1:]
        
        imports.append(f"import '{service_name}Queue' from './jobs/{service_name}.job';")
        queue_names.append(f"{service_name}Queue")
    
    print("\n📝 Add these imports to server.ts:")
    print("\n".join(imports))
    print("\n📝 Add these to the queue array:")
    print(f"const queues = [{', '.join(queue_names)}];")

def main():
    print("🔧 Creating service adapters...")
    
    # Copy Soulfra scripts
    copied_files = copy_soulfra_scripts()
    print(f"📁 Copied {len(copied_files)} Soulfra scripts")
    
    # Create adapters for each service
    created_services = []
    for service_id, service_data in CATALOG['services'].items():
        try:
            service_name = create_service_adapter(service_id, service_data)
            created_services.append(service_name)
            print(f"✅ Created adapter for: {service_id}")
        except Exception as e:
            print(f"❌ Failed to create adapter for {service_id}: {e}")
    
    print(f"\n✅ Created {len(created_services)} service adapters")
    
    # Update dashboard route
    print("\n📝 Updating dashboard service catalog...")
    update_dashboard_catalog()
    
    # Update server imports
    update_server_imports()
    
    print("\n🚀 Next Steps:")
    print("1. Update src/server.ts with the new imports")
    print("2. Update src/api/routes/dashboard.route.ts with new services")
    print("3. Run: npm run build")
    print("4. Test services: npm run test:services")

def update_dashboard_catalog():
    """Update dashboard route with new services"""
    new_services = []
    
    for service_id, service_data in CATALOG['services'].items():
        service_entry = {
            'id': service_id,
            'name': service_data['name'],
            'price': service_data['price'],
            'category': service_data['category'],
            'features': service_data['features'],
            'estimatedTime': service_data['estimated_time'],
            'confidence': service_data['confidence']
        }
        new_services.append(service_entry)
    
    # Save for manual update
    with open('../new-service-catalog.json', 'w') as f:
        json.dump(new_services, f, indent=2)
    
    print(f"📄 New service catalog saved to: new-service-catalog.json")
    print("   Add these to SERVICE_CATALOG in dashboard.route.ts")

if __name__ == '__main__':
    os.chdir(Path(__file__).parent)
    main()