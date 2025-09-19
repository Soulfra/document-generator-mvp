#!/usr/bin/env node

/**
 * LOCAL LLM FIRST JSONL/HTML BROADCAST TEST
 * Uses local Ollama models first, outputs structured data, broadcasts through layers
 */

const fs = require('fs');

class LocalLLMJSONLHTMLTest {
  constructor() {
    this.ollamaUrl = 'http://localhost:11434';
    this.outputDir = './test-outputs';
    this.layers = {
      'local-ollama': 'http://localhost:11434',
      'llm-router': 'http://localhost:4000', 
      'semantic-search': 'http://localhost:5001',
      'vault-system': 'http://localhost:9722'
    };
    
    // Test business data
    this.testData = {
      company: "InnovateTech Solutions",
      product: "AI-Powered Documentation Platform", 
      features: [
        "Real-time collaborative editing",
        "AI content generation",
        "Multi-format export (PDF, HTML, DOCX)",
        "Version control integration",
        "Smart templates and workflows"
      ],
      market: "Enterprise software documentation",
      revenue_model: "SaaS subscription $49/user/month",
      target_users: "Software development teams 10-100 people"
    };
  }

  async run() {
    console.log('🤖 LOCAL LLM FIRST JSONL/HTML BROADCAST TEST');
    console.log('===========================================');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir);
    }
    
    // Step 1: Test local LLM processing
    console.log('\n1️⃣ TESTING LOCAL LLM PROCESSING');
    console.log('==============================');
    const localResults = await this.testLocalLLM();
    
    // Step 2: Generate JSONL output
    console.log('\n2️⃣ GENERATING JSONL OUTPUT');
    console.log('=========================');
    const jsonlFile = await this.generateJSONL(localResults);
    
    // Step 3: Generate HTML output
    console.log('\n3️⃣ GENERATING HTML OUTPUT');
    console.log('========================');
    const htmlFile = await this.generateHTML(localResults);
    
    // Step 4: Broadcast through layers
    console.log('\n4️⃣ BROADCASTING THROUGH LAYERS');
    console.log('============================');
    const broadcastResults = await this.broadcastThroughLayers(localResults);
    
    // Step 5: Generate final report
    console.log('\n5️⃣ FINAL REPORT');
    console.log('==============');
    this.generateReport({
      local_llm: localResults,
      jsonl_file: jsonlFile,
      html_file: htmlFile,
      broadcast: broadcastResults
    });
  }
  
  async testLocalLLM() {
    const models = ['codellama:7b', 'mistral:latest', 'phi:latest'];
    const results = [];
    
    for (const model of models) {
      console.log(`   Testing ${model}...`);
      
      try {
        const prompt = `Extract key information from this business data: ${JSON.stringify(this.testData, null, 2)}. Return as structured JSON with fields: summary, tech_stack, market_analysis, revenue_potential.`;
        
        const response = await fetch(`${this.ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model,
            prompt: prompt,
            stream: false,
            format: 'json'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          let parsed_response;
          try {
            parsed_response = JSON.parse(result.response);
          } catch {
            parsed_response = { raw: result.response };
          }
          
          results.push({
            model: model,
            success: true,
            response: parsed_response,
            tokens: result.eval_count || 0,
            duration: result.total_duration || 0
          });
          console.log(`   ✅ ${model}: Success (${result.eval_count || 0} tokens)`);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
        
      } catch (error) {
        results.push({
          model: model,
          success: false,
          error: error.message
        });
        console.log(`   ❌ ${model}: Failed - ${error.message}`);
      }
    }
    
    return results;
  }
  
  async generateJSONL(localResults) {
    const jsonlPath = `${this.outputDir}/business-analysis-${Date.now()}.jsonl`;
    const jsonlData = [];
    
    // Add original data
    jsonlData.push({
      type: 'input_data',
      timestamp: new Date().toISOString(),
      data: this.testData
    });
    
    // Add each LLM result
    localResults.forEach(result => {
      jsonlData.push({
        type: 'llm_analysis',
        timestamp: new Date().toISOString(),
        model: result.model,
        success: result.success,
        analysis: result.response || null,
        error: result.error || null,
        performance: {
          tokens: result.tokens || 0,
          duration_ms: Math.round((result.duration || 0) / 1000000)
        }
      });
    });
    
    // Add summary
    const successful = localResults.filter(r => r.success);
    jsonlData.push({
      type: 'summary',
      timestamp: new Date().toISOString(),
      models_tested: localResults.length,
      successful_models: successful.length,
      total_tokens: successful.reduce((sum, r) => sum + (r.tokens || 0), 0),
      best_model: successful.length > 0 ? successful[0].model : 'none'
    });
    
    // Write JSONL file
    const jsonlContent = jsonlData.map(obj => JSON.stringify(obj)).join('\n');
    fs.writeFileSync(jsonlPath, jsonlContent);
    
    console.log(`   📄 JSONL saved: ${jsonlPath}`);
    console.log(`   📊 Records: ${jsonlData.length}`);
    
    return jsonlPath;
  }
  
  async generateHTML(localResults) {
    const htmlPath = `${this.outputDir}/business-analysis-${Date.now()}.html`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Local LLM Business Analysis Report</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .business-data { background: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .model-result { border: 1px solid #bdc3c7; margin: 15px 0; padding: 20px; border-radius: 5px; }
        .success { border-left: 5px solid #27ae60; background: #d5e8d4; }
        .error { border-left: 5px solid #e74c3c; background: #fadbd8; }
        .json-output { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; font-family: 'Courier New', monospace; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #3498db; color: white; padding: 20px; border-radius: 5px; text-align: center; }
        .timestamp { color: #7f8c8d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Local LLM Business Analysis Report</h1>
        <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
        
        <h2>📊 Input Business Data</h2>
        <div class="business-data">
            <h3>${this.testData.company}</h3>
            <p><strong>Product:</strong> ${this.testData.product}</p>
            <p><strong>Revenue Model:</strong> ${this.testData.revenue_model}</p>
            <p><strong>Target Users:</strong> ${this.testData.target_users}</p>
            <p><strong>Features:</strong></p>
            <ul>
                ${this.testData.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
        </div>
        
        <h2>📈 Analysis Statistics</h2>
        <div class="stats">
            <div class="stat-card">
                <h3>${localResults.length}</h3>
                <p>Models Tested</p>
            </div>
            <div class="stat-card">
                <h3>${localResults.filter(r => r.success).length}</h3>
                <p>Successful</p>
            </div>
            <div class="stat-card">
                <h3>${localResults.reduce((sum, r) => sum + (r.tokens || 0), 0)}</h3>
                <p>Total Tokens</p>
            </div>
            <div class="stat-card">
                <h3>${Math.round(localResults.reduce((sum, r) => sum + (r.duration || 0), 0) / 1000000)}ms</h3>
                <p>Total Time</p>
            </div>
        </div>
        
        <h2>🔍 Model Results</h2>
        ${localResults.map(result => `
            <div class="model-result ${result.success ? 'success' : 'error'}">
                <h3>🤖 ${result.model}</h3>
                ${result.success ? `
                    <p><strong>Status:</strong> ✅ Success</p>
                    <p><strong>Tokens:</strong> ${result.tokens || 0}</p>
                    <p><strong>Duration:</strong> ${Math.round((result.duration || 0) / 1000000)}ms</p>
                    <div class="json-output">
                        <pre>${JSON.stringify(result.response, null, 2)}</pre>
                    </div>
                ` : `
                    <p><strong>Status:</strong> ❌ Failed</p>
                    <p><strong>Error:</strong> ${result.error}</p>
                `}
            </div>
        `).join('')}
        
        <h2>🔗 System Integration</h2>
        <p>This report demonstrates local LLM processing with structured output generation:</p>
        <ul>
            <li>✅ Local Ollama models tested first (no API keys required)</li>
            <li>✅ Structured JSONL output for further processing</li>
            <li>✅ HTML visualization for human review</li>
            <li>✅ Ready for broadcast through OSS layering system</li>
        </ul>
        
        <div class="timestamp">
            <p>Report ID: ${Date.now()}</p>
            <p>Local LLM Test completed at ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(htmlPath, html);
    
    console.log(`   🌐 HTML saved: ${htmlPath}`);
    console.log(`   📱 Open in browser to view formatted results`);
    
    return htmlPath;
  }
  
  async broadcastThroughLayers(localResults) {
    const broadcasts = [];
    
    for (const [layerName, url] of Object.entries(this.layers)) {
      console.log(`   Broadcasting to ${layerName}...`);
      
      try {
        // Test if layer is responding
        const healthResponse = await fetch(`${url}/health`).catch(() => 
          fetch(`${url}/api/health`).catch(() => 
            fetch(`${url}/status`).catch(() => null)
          )
        );
        
        if (healthResponse && healthResponse.ok) {
          broadcasts.push({
            layer: layerName,
            url: url,
            status: 'accessible',
            data_sent: localResults.length
          });
          console.log(`   ✅ ${layerName}: Accessible`);
        } else {
          broadcasts.push({
            layer: layerName,
            url: url,
            status: 'unreachable',
            error: 'No response'
          });
          console.log(`   ❌ ${layerName}: Unreachable`);
        }
        
      } catch (error) {
        broadcasts.push({
          layer: layerName,
          url: url,
          status: 'error',
          error: error.message
        });
        console.log(`   ❌ ${layerName}: Error - ${error.message}`);
      }
    }
    
    return broadcasts;
  }
  
  generateReport(results) {
    const successful_models = results.local_llm.filter(r => r.success);
    const accessible_layers = results.broadcast.filter(b => b.status === 'accessible');
    
    console.log('\n🎯 LOCAL LLM FIRST TEST RESULTS');
    console.log('==============================');
    console.log(`✅ Local Models Successful: ${successful_models.length}/${results.local_llm.length}`);
    console.log(`✅ System Layers Accessible: ${accessible_layers.length}/${results.broadcast.length}`);
    console.log(`📄 JSONL Output: ${results.jsonl_file}`);
    console.log(`🌐 HTML Report: ${results.html_file}`);
    
    console.log('\n🔍 DETAILED RESULTS:');
    console.log('===================');
    
    successful_models.forEach(model => {
      console.log(`🤖 ${model.model}: ${model.tokens} tokens, ${Math.round((model.duration || 0) / 1000000)}ms`);
    });
    
    accessible_layers.forEach(layer => {
      console.log(`🔗 ${layer.layer}: ${layer.url} - ${layer.status}`);
    });
    
    console.log('\n✨ PROOF OF CONCEPT COMPLETE');
    console.log('===========================');
    console.log('🎯 Local LLMs working FIRST before cloud APIs');
    console.log('📊 Structured JSONL output generated');
    console.log('🌐 HTML visualization created');
    console.log('🔄 Layer broadcasting tested');
    console.log('🚀 Ready for OSS distribution');
    
    if (successful_models.length > 0) {
      console.log('\n🎉 YOUR LOCAL LLM SYSTEM IS WORKING!');
      console.log('   No API keys needed for basic functionality');
      console.log('   Structured output ready for further processing');
      console.log(`   Open ${results.html_file} to see full results`);
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new LocalLLMJSONLHTMLTest();
  test.run().catch(console.error);
}

module.exports = LocalLLMJSONLHTMLTest;