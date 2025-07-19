#!/usr/bin/env python3
"""
Simplified service adapter creation for Soulfra services
"""

import os
import json
from pathlib import Path

# Load service catalog
with open('soulfra-service-catalog.json', 'r') as f:
    CATALOG = json.load(f)

def create_service_adapter(service_id: str, service_data: dict):
    """Create a simple TypeScript adapter for a Soulfra service"""
    
    # Convert service-name to ServiceName
    service_name_parts = service_id.split('-')
    service_name_camel = ''.join(part.capitalize() for part in service_name_parts)
    service_name = service_name_camel[0].lower() + service_name_camel[1:]
    
    # Get service details
    title = service_data['name']
    price = service_data['price']
    description = service_data['metadata'].get('description', 'Automated service from Soulfra')
    
    # Create service file
    service_content = f"""import path from 'path';
import fs from 'fs/promises';
import {{ v4 as uuidv4 }} from 'uuid';
import {{ logger }} from '../utils/logger';
import {{ prisma }} from '../utils/database';
import {{ uploadToS3, downloadFromS3 }} from '../utils/storage';
import {{ ProcessingError }} from '../utils/errors';
import {{ spawn }} from 'child_process';

export interface {service_name_camel}Config {{
  [key: string]: any;
}}

export interface {service_name_camel}Result {{
  outputFileUrl: string;
  metadata: any;
  processingCost: number;
}}

/**
 * {title} Service
 * Price: ${price/100}
 * {description.split(chr(10))[0] if description else ''}
 */
export async function process{service_name_camel}(
  jobId: string,
  config: {service_name_camel}Config,
  progressCallback?: (progress: number) => void
): Promise<{service_name_camel}Result> {{
  const updateProgress = (progress: number) => {{
    progressCallback?.(progress);
  }};

  updateProgress(5);

  try {{
    const job = await prisma.job.findUnique({{ where: {{ id: jobId }} }});
    if (!job) throw new ProcessingError('Job not found');

    logger.info('Starting {service_name} processing', {{ jobId }});

    // Download and process
    const inputBuffer = await downloadFromS3(job.inputFileUrl);
    const tempDir = path.join('/tmp', `{service_name}-${{jobId}}`);
    await fs.mkdir(tempDir, {{ recursive: true }});
    
    const inputPath = path.join(tempDir, 'input.zip');
    await fs.writeFile(inputPath, inputBuffer);
    
    updateProgress(20);
    
    // Call Soulfra service via wrapper
    const result = await new Promise<any>((resolve, reject) => {{
      const proc = spawn('python3', [
        path.join(__dirname, '../../scripts/soulfra-service-wrapper.py'),
        path.join(__dirname, '../soulfra-scripts/{service_id}.py'),
        '--input', inputPath,
        '--output', tempDir,
        '--job-mode'
      ]);
      
      let output = '';
      proc.stdout.on('data', (data) => {{
        const str = data.toString();
        output += str;
        const match = str.match(/progress: (\\d+)/);
        if (match) updateProgress(20 + (parseInt(match[1]) * 0.6));
      }});
      
      proc.stderr.on('data', (data) => console.error(data.toString()));
      
      proc.on('close', (code) => {{
        if (code !== 0) reject(new Error('Processing failed'));
        else {{
          const jsonMatch = output.match(/\\{{[^{{}}]*\\}}/);
          resolve(jsonMatch ? JSON.parse(jsonMatch[0]) : {{ success: true }});
        }}
      }});
    }});
    
    updateProgress(80);
    
    // Upload result
    const outputPath = path.join(tempDir, 'output.zip');
    if (!(await fs.stat(outputPath).catch(() => null))) {{
      // Create output zip if not exists
      const archiver = await import('archiver');
      const output = fs.createWriteStream(outputPath);
      const archive = archiver.create('zip', {{ zlib: {{ level: 9 }} }});
      archive.pipe(output);
      archive.directory(tempDir, false);
      await archive.finalize();
    }}
    
    const outputBuffer = await fs.readFile(outputPath);
    const outputUrl = await uploadToS3(outputBuffer, `{service_name}/${{jobId}}/output.zip`);
    
    await fs.rm(tempDir, {{ recursive: true, force: true }});
    updateProgress(100);
    
    return {{
      outputFileUrl: outputUrl,
      metadata: result.metadata || {{}},
      processingCost: 0.001
    }};
    
  }} catch (error) {{
    logger.error('{service_name} processing failed', {{ jobId, error }});
    throw error;
  }}
}}
"""
    
    # Write service file
    service_path = Path(f'src/services/{service_name}.service.ts')
    service_path.parent.mkdir(parents=True, exist_ok=True)
    service_path.write_text(service_content)
    
    # Create job processor
    job_content = f"""import Bull from 'bull';
import {{ logger }} from '../utils/logger';
import {{ prisma }} from '../utils/database';
import {{ process{service_name_camel}, {service_name_camel}Config }} from '../services/{service_name}.service';

export const {service_name}Queue = new Bull('{service_name}-jobs', {{
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
}});

interface JobData {{
  jobId: string;
  config?: {service_name_camel}Config;
}}

{service_name}Queue.process('process', async (job) => {{
  const {{ jobId, config }} = job.data as JobData;
  
  try {{
    await prisma.job.update({{
      where: {{ id: jobId }},
      data: {{ status: 'PROCESSING' }}
    }});

    const result = await process{service_name_camel}(jobId, config || {{}}, (progress) => {{
      job.progress(progress);
    }});

    await prisma.job.update({{
      where: {{ id: jobId }},
      data: {{ 
        status: 'COMPLETED',
        outputFileUrl: result.outputFileUrl,
        progress: 100,
        processingEndedAt: new Date()
      }}
    }});

    logger.info('{service_name} completed', {{ jobId }});
    return result;

  }} catch (error) {{
    logger.error('{service_name} failed', {{ jobId, error }});
    await prisma.job.update({{
      where: {{ id: jobId }},
      data: {{ 
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingEndedAt: new Date()
      }}
    }});
    throw error;
  }}
}});

export default {service_name}Queue;
"""
    
    # Write job file
    job_path = Path(f'src/jobs/{service_name}.job.ts')
    job_path.parent.mkdir(parents=True, exist_ok=True)
    job_path.write_text(job_content)
    
    return service_name

def main():
    print("🔧 Creating service adapters...")
    
    created = []
    for service_id, service_data in CATALOG['services'].items():
        try:
            name = create_service_adapter(service_id, service_data)
            created.append(name)
            print(f"✅ Created adapter for: {service_id}")
        except Exception as e:
            print(f"❌ Failed: {service_id} - {e}")
    
    print(f"\n✅ Created {len(created)} service adapters")
    
    # Update dashboard catalog
    new_services = []
    for service_id, service_data in CATALOG['services'].items():
        new_services.append({
            'id': service_id,
            'name': service_data['name'],
            'description': service_data['metadata'].get('description', '').split('\n')[0][:100],
            'price': service_data['price'],
            'features': service_data['features'][:5],
            'category': service_data['category'],
            'estimatedTime': service_data['estimated_time'],
            'confidence': service_data['confidence']
        })
    
    # Update dashboard route
    dashboard_path = Path('src/api/routes/dashboard.route.ts')
    if dashboard_path.exists():
        content = dashboard_path.read_text()
        
        # Find SERVICE_CATALOG array
        import_marker = "const SERVICE_CATALOG: ServiceOffering[] = ["
        if import_marker in content:
            # Add new services after existing ones
            new_services_str = ',\n  '.join([
                f"""{{
    id: '{s["id"]}',
    name: '{s["name"]}',
    description: '{s["description"]}',
    price: {s["price"]},
    features: {json.dumps(s["features"])},
    category: '{s["category"]}',
    estimatedTime: '{s["estimatedTime"]}',
    confidence: {s["confidence"]}
  }}""" for s in new_services if s['id'] not in ['cleanup', 'documentation', 'api-generation', 'test-generation', 'security-analysis']
            ])
            
            # Insert before closing bracket
            content = content.replace('];', f""",
  // Soulfra-imported services
  {new_services_str}
];""")
            
            dashboard_path.write_text(content)
            print("\n✅ Updated dashboard.route.ts with new services")

if __name__ == '__main__':
    main()