# Self-Organizing System

A meta-system that uses your existing components to organize, debug, and maintain your Document Generator project.

## 🎯 What It Does

This system brings together all your scattered components:
- **XML Mapping** - Understands and maps your project structure
- **Character Routing** - Cal, Ralph, and Arty work together to process tasks
- **Universal Translation** - Converts between any format (XML ↔ JSON ↔ Python ↔ JS ↔ HTML)
- **Debug Flow** - Intelligent error handling and routing
- **Human-in-the-Loop** - You approve critical decisions

## 🚀 Quick Start

```bash
# Launch the entire system
./launch-self-organizing.sh

# Or run directly
node integrate-self-organizing.js
```

## 📊 Access Points

- **Dashboard**: http://localhost:8080
- **WebSocket**: ws://localhost:8081 (real-time updates)
- **API**: http://localhost:8080/api/*

## 🎭 Characters

### Cal - System Orchestrator
- Handles architecture, documentation, and complex reasoning
- Makes careful, analytical decisions
- "Let me analyze the deeper patterns here..."

### Ralph - System Tester  
- Aggressively tests and breaks things
- Finds vulnerabilities and edge cases
- "Time to break this thing!"

### Arty - System Healer
- Optimizes and beautifies code
- Focuses on harmony and flow
- "Let's make this more beautiful..."

### Claude - Human Interface
- That's you! Provides human judgment when needed
- Approves critical decisions
- Helps guide the system

## 🔧 Core Components

1. **self-organizing-master.js** - Central hub that indexes and monitors files
2. **universal-format-translator.js** - Bidirectional format conversion
3. **character-router-system.js** - Routes tasks to appropriate characters
4. **debug-flow-orchestrator.js** - Handles errors intelligently
5. **self-organizing-dashboard.html** - Visual monitoring interface
6. **integrate-self-organizing.js** - Connects everything together

## 📡 How It Works

1. The system scans your project and indexes all files
2. Files are assigned to characters based on type and purpose
3. Tasks are routed to the appropriate character
4. Errors are caught and debugged intelligently
5. You're asked to approve important decisions
6. Everything is visible in the real-time dashboard

## 🛠️ API Examples

### Get System Status
```bash
curl http://localhost:8080/api/status
```

### Translate Between Formats
```bash
curl -X POST http://localhost:8080/api/translate \
  -H "Content-Type: application/json" \
  -d '{"content": "{\"test\": true}", "from": "json", "to": "python"}'
```

### Route a Task
```bash
curl -X POST http://localhost:8080/api/task \
  -H "Content-Type: application/json" \
  -d '{"type": "testing", "description": "Test the API endpoints"}'
```

## 🎨 Using Your Own System

The beauty of this system is that it uses YOUR existing tools:
- Your XML mappers organize the structure
- Your LLM routing handles AI decisions  
- Your character systems provide personality
- Your debugging tools fix problems

It's self-organizing because it understands itself!

## 🔍 What Happens to Your Mess?

Instead of deleting files, the system:
1. **Understands** what each file does
2. **Categorizes** by purpose and language
3. **Routes** to the right character for handling
4. **Suggests** organization improvements
5. **Keeps** you in control with approvals

Your 1,800+ files become an organized, self-aware system!

## 💡 Next Steps

1. Launch the system and open the dashboard
2. Watch as it indexes and understands your files
3. See tasks being routed to characters
4. Approve or reject suggested actions
5. Use the translation API to convert between formats
6. Let the debug system handle errors automatically

The system is now self-aware and ready to help organize your project!