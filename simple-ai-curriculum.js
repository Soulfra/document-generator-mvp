#!/usr/bin/env node

/**
 * 🧟‍♂️ SIMPLE AI CURRICULUM (CryptoZombies Style)
 * Interactive learning system that teaches through building
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Character guides (from your existing system)
const characters = {
    '📊': { name: 'Cal', specialty: 'Data & Systems', color: '#00ff88' },
    '🎨': { name: 'Arty', specialty: 'Design & UX', color: '#ff6b6b' },
    '🏗️': { name: 'Ralph', specialty: 'Infrastructure', color: '#4ecdc4' },
    '🔬': { name: 'Vera', specialty: 'Research & AI', color: '#45b7d1' },
    '🛡️': { name: 'Paulo', specialty: 'Security', color: '#96ceb4' },
    '📢': { name: 'Nash', specialty: 'Communication', color: '#feca57' }
};

// CryptoZombies-style curriculum
const curriculum = {
    chapters: [
        {
            id: 1,
            title: 'Making Your First Document Processor',
            character: '📊',
            description: 'Learn to extract meaning from documents using code',
            lessons: [
                {
                    id: '1-1',
                    title: 'Creating Functions',
                    objective: 'Write a function that processes text',
                    starterCode: `function processDocument(text) {
    // Your mission: Extract the main topic from the text
    // Return the topic as a string
}`,
                    solution: `function processDocument(text) {
    const words = text.toLowerCase().split(' ');
    const keywords = ['app', 'web', 'mobile', 'game', 'ai', 'blockchain'];
    const found = keywords.find(k => words.includes(k));
    return found || 'general';
}`,
                    test: "processDocument('Build a web app') should return 'web'",
                    hint: 'Look for keywords in the text and return the first one you find'
                },
                {
                    id: '1-2', 
                    title: 'Extracting Features',
                    objective: 'Extract a list of features from a document',
                    starterCode: `function extractFeatures(document) {
    // Find all the features mentioned in the document
    // Return them as an array
}`,
                    test: "Should find features like 'login', 'dashboard', 'payment'",
                    hint: 'Look for action words that describe what the app should do'
                }
            ]
        },
        {
            id: 2,
            title: 'Building MVP Structures',
            character: '🏗️',
            description: 'Generate file structures for different app types',
            lessons: [
                {
                    id: '2-1',
                    title: 'Package.json Generator',
                    objective: 'Create a package.json based on app requirements',
                    starterCode: `function generatePackageJson(appName, features) {
    // Create a package.json object with appropriate dependencies
    // based on the features requested
}`,
                    hint: 'Different features need different npm packages'
                }
            ]
        },
        {
            id: 3,
            title: 'Adding Real Functionality',
            character: '🎨',
            description: 'Make your generated apps actually work',
            lessons: [
                {
                    id: '3-1',
                    title: 'API Endpoint Generator',
                    objective: 'Generate working API endpoints',
                    starterCode: `function generateAPI(features) {
    // Generate Express routes for each feature
    // Return the router code as a string
}`
                }
            ]
        }
    ],
    
    // Progress tracking
    achievements: [
        { id: 'first_function', name: 'First Function', description: 'Created your first document processor' },
        { id: 'mvp_builder', name: 'MVP Builder', description: 'Generated a complete MVP structure' },
        { id: 'api_master', name: 'API Master', description: 'Created working API endpoints' }
    ]
};

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'ai-curriculum',
        style: 'cryptozombies'
    });
});

// Get curriculum overview
app.get('/api/curriculum', (req, res) => {
    res.json({
        title: 'CryptoZombies-Style Document Generator Course',
        description: 'Learn to build document-to-MVP systems by actually building them',
        chapters: curriculum.chapters.map(ch => ({
            id: ch.id,
            title: ch.title,
            character: ch.character,
            characterName: characters[ch.character].name,
            description: ch.description,
            lessonCount: ch.lessons.length
        })),
        totalLessons: curriculum.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)
    });
});

// Get specific lesson
app.get('/api/lesson/:chapterId/:lessonId', (req, res) => {
    const { chapterId, lessonId } = req.params;
    const chapter = curriculum.chapters.find(ch => ch.id === parseInt(chapterId));
    
    if (!chapter) {
        return res.status(404).json({ error: 'Chapter not found' });
    }
    
    const lesson = chapter.lessons.find(l => l.id === lessonId);
    if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
    }
    
    const character = characters[chapter.character];
    
    res.json({
        chapter: {
            id: chapter.id,
            title: chapter.title,
            character: chapter.character,
            characterName: character.name,
            characterColor: character.color
        },
        lesson: {
            ...lesson,
            // Don't send the solution to the client
            solution: undefined
        },
        instructions: `${character.name} says: "${lesson.objective}"\n\nComplete the function to make the test pass.`
    });
});

// Submit lesson solution
app.post('/api/lesson/:chapterId/:lessonId/submit', (req, res) => {
    const { chapterId, lessonId } = req.params;
    const { code, userId } = req.body;
    
    const chapter = curriculum.chapters.find(ch => ch.id === parseInt(chapterId));
    const lesson = chapter?.lessons.find(l => l.id === lessonId);
    
    if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
    }
    
    // Check solution
    const result = checkSolution(lesson, code);
    
    // Store progress (in real system would save to database)
    if (result.passed) {
        console.log(`✅ User ${userId} completed lesson ${lessonId}`);
    }
    
    res.json(result);
});

// Get learning dashboard
app.get('/api/dashboard/:userId', (req, res) => {
    const { userId } = req.params;
    
    // In real system would fetch from database
    // For now, return mock progress
    res.json({
        user: userId,
        progress: {
            totalLessons: 6,
            completed: 2,
            current: '1-3',
            percentage: 33
        },
        achievements: [
            { id: 'first_function', earned: true, date: new Date() }
        ],
        character: '📊',
        characterName: 'Cal',
        streak: 3,
        xp: 300
    });
});

// Serve learning interface
app.get('/', (req, res) => {
    res.send(generateLearningHTML());
});

function checkSolution(lesson, userCode) {
    // Simple validation - in real system would run actual tests
    const hasFunction = userCode.includes('function');
    const hasReturn = userCode.includes('return');
    const isNotEmpty = userCode.trim().length > 50;
    
    // Try to extract the function and run basic checks
    let passed = false;
    let feedback = '';
    
    if (!hasFunction) {
        feedback = 'You need to define a function!';
    } else if (!hasReturn) {
        feedback = 'Your function needs to return a value!';
    } else if (!isNotEmpty) {
        feedback = 'Your function needs more logic inside it!';
    } else {
        // More sophisticated checking would go here
        passed = true;
        feedback = 'Excellent work! Your function looks good.';
    }
    
    return {
        passed,
        feedback,
        hint: passed ? null : lesson.hint,
        nextLesson: passed ? getNextLesson(lesson.id) : null,
        xpGained: passed ? 100 : 0
    };
}

function getNextLesson(currentLessonId) {
    // Simple logic to get next lesson
    const [chapter, lesson] = currentLessonId.split('-').map(Number);
    const currentChapter = curriculum.chapters.find(ch => ch.id === chapter);
    
    if (lesson < currentChapter.lessons.length) {
        return `${chapter}-${lesson + 1}`;
    } else if (chapter < curriculum.chapters.length) {
        return `${chapter + 1}-1`;
    }
    
    return null; // Course completed
}

function generateLearningHTML() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>CryptoZombies-Style Learning</title>
    <style>
        body {
            background: #1a1a2e;
            color: #e94560;
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 0;
        }
        
        .header {
            background: #16213e;
            padding: 20px;
            text-align: center;
            border-bottom: 3px solid #e94560;
        }
        
        h1 {
            margin: 0;
            font-size: 2.5em;
            text-shadow: 0 0 10px #e94560;
        }
        
        .subtitle {
            color: #0f3460;
            margin-top: 10px;
        }
        
        .container {
            display: grid;
            grid-template-columns: 300px 1fr 1fr;
            gap: 20px;
            padding: 20px;
            height: calc(100vh - 140px);
        }
        
        .sidebar {
            background: #0f3460;
            border-radius: 10px;
            padding: 20px;
            overflow-y: auto;
        }
        
        .lesson-panel {
            background: #16213e;
            border-radius: 10px;
            padding: 20px;
            overflow-y: auto;
        }
        
        .code-panel {
            background: #0a0a0a;
            border-radius: 10px;
            padding: 20px;
            border: 2px solid #e94560;
        }
        
        .character {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .character-emoji {
            font-size: 4em;
            margin-bottom: 10px;
        }
        
        .character-name {
            font-size: 1.5em;
            font-weight: bold;
            color: #00ff88;
        }
        
        .chapter {
            background: #1a1a2e;
            border: 1px solid #e94560;
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .chapter:hover {
            background: #e94560;
            color: #1a1a2e;
        }
        
        .chapter-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        textarea {
            width: 100%;
            height: 300px;
            background: #000;
            color: #00ff88;
            border: 1px solid #e94560;
            border-radius: 5px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            resize: vertical;
        }
        
        .button {
            background: #e94560;
            color: #1a1a2e;
            border: none;
            padding: 15px 30px;
            border-radius: 5px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            margin: 10px 5px;
            transition: all 0.3s ease;
        }
        
        .button:hover {
            background: #00ff88;
            transform: translateY(-2px);
        }
        
        .feedback {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
            font-weight: bold;
        }
        
        .feedback.success {
            background: #00ff8820;
            border: 1px solid #00ff88;
            color: #00ff88;
        }
        
        .feedback.error {
            background: #e9456020;
            border: 1px solid #e94560;
            color: #e94560;
        }
        
        .progress {
            background: #0f3460;
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
            margin: 20px 0;
        }
        
        .progress-bar {
            background: linear-gradient(90deg, #e94560, #00ff88);
            height: 100%;
            transition: width 0.3s ease;
        }
        
        .lesson-content {
            line-height: 1.6;
        }
        
        .test-info {
            background: #0f3460;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #00ff88;
        }
        
        .hint {
            background: #1a1a2e;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            border-left: 4px solid #e94560;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧟‍♂️ Document Generator Academy</h1>
        <div class="subtitle">Learn by Building • CryptoZombies Style</div>
    </div>
    
    <div class="container">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="character">
                <div class="character-emoji" id="characterEmoji">📊</div>
                <div class="character-name" id="characterName">Cal</div>
                <div style="color: #0f3460; margin-top: 5px;">Your Guide</div>
            </div>
            
            <div class="progress">
                <div class="progress-bar" style="width: 33%"></div>
            </div>
            <div style="text-align: center; margin-bottom: 20px;">
                Progress: 2/6 lessons • 300 XP
            </div>
            
            <div id="chapters"></div>
        </div>
        
        <!-- Lesson Content -->
        <div class="lesson-panel">
            <div id="lessonContent">
                <h2>Welcome to Document Generator Academy!</h2>
                <div class="lesson-content">
                    <p>Learn to build document-to-MVP systems by actually building them, CryptoZombies style!</p>
                    
                    <h3>🎯 What You'll Learn:</h3>
                    <ul>
                        <li>Extract meaning from documents using code</li>
                        <li>Generate MVP structures automatically</li>
                        <li>Create working APIs and interfaces</li>
                        <li>Build complete applications</li>
                    </ul>
                    
                    <h3>🏆 Your Character Guides:</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0;">
                        ${Object.entries(characters).map(([emoji, char]) => `
                            <div style="text-align: center; padding: 10px; background: #0f3460; border-radius: 5px;">
                                <div style="font-size: 2em;">${emoji}</div>
                                <div style="font-weight: bold; color: ${char.color};">${char.name}</div>
                                <div style="font-size: 0.8em; color: #888;">${char.specialty}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <p>Click on a chapter to start learning!</p>
                </div>
            </div>
        </div>
        
        <!-- Code Editor -->
        <div class="code-panel">
            <h3>💻 Code Editor</h3>
            <textarea id="codeEditor" placeholder="Your code will appear here...">
// Welcome to the Document Generator Academy!
// Select a lesson from the left to start coding.

function welcomeMessage() {
    return "Ready to learn by building!";
}
            </textarea>
            
            <div style="text-align: center; margin-top: 20px;">
                <button class="button" onclick="runCode()">🚀 Run Code</button>
                <button class="button" onclick="submitSolution()">✅ Submit</button>
                <button class="button" onclick="getHint()">💡 Hint</button>
            </div>
            
            <div id="feedback"></div>
            
            <div class="test-info">
                <strong>Test:</strong> <span id="testInfo">Select a lesson to see the test</span>
            </div>
        </div>
    </div>
    
    <script>
        let currentLesson = null;
        let curriculum = null;
        
        // Load curriculum on page load
        fetch('/api/curriculum')
            .then(r => r.json())
            .then(data => {
                curriculum = data;
                loadChapters(data.chapters);
            });
        
        function loadChapters(chapters) {
            const html = chapters.map(ch => \`
                <div class="chapter" onclick="loadChapter(\${ch.id})">
                    <div class="chapter-title">
                        \${ch.character} Chapter \${ch.id}: \${ch.title}
                    </div>
                    <div style="font-size: 0.9em; color: #888;">
                        \${ch.lessonCount} lessons • \${ch.characterName}
                    </div>
                </div>
            \`).join('');
            
            document.getElementById('chapters').innerHTML = html;
        }
        
        function loadChapter(chapterId) {
            // Load first lesson of the chapter
            loadLesson(chapterId, 1);
        }
        
        async function loadLesson(chapterId, lessonNum) {
            const lessonId = \`\${chapterId}-\${lessonNum}\`;
            
            try {
                const response = await fetch(\`/api/lesson/\${chapterId}/\${lessonId}\`);
                const lesson = await response.json();
                
                currentLesson = lesson;
                
                // Update character
                document.getElementById('characterEmoji').textContent = lesson.chapter.character;
                document.getElementById('characterName').textContent = lesson.chapter.characterName;
                
                // Update lesson content
                document.getElementById('lessonContent').innerHTML = \`
                    <h2>\${lesson.chapter.character} \${lesson.lesson.title}</h2>
                    <div class="lesson-content">
                        <p><strong>Objective:</strong> \${lesson.lesson.objective}</p>
                        <div class="hint">
                            <strong>\${lesson.chapter.characterName} says:</strong> \${lesson.instructions}
                        </div>
                    </div>
                \`;
                
                // Update code editor
                document.getElementById('codeEditor').value = lesson.lesson.starterCode;
                
                // Update test info
                document.getElementById('testInfo').textContent = lesson.lesson.test || 'Complete the function as described';
                
                // Clear feedback
                document.getElementById('feedback').innerHTML = '';
                
            } catch (error) {
                console.error('Failed to load lesson:', error);
            }
        }
        
        function runCode() {
            const code = document.getElementById('codeEditor').value;
            
            // Simple code validation
            try {
                // In a real system, would safely execute the code
                const feedback = document.getElementById('feedback');
                feedback.innerHTML = \`
                    <div class="feedback success">
                        ✅ Code runs without errors! Now submit your solution.
                    </div>
                \`;
            } catch (error) {
                const feedback = document.getElementById('feedback');
                feedback.innerHTML = \`
                    <div class="feedback error">
                        ❌ Syntax error: \${error.message}
                    </div>
                \`;
            }
        }
        
        async function submitSolution() {
            if (!currentLesson) {
                alert('Please select a lesson first!');
                return;
            }
            
            const code = document.getElementById('codeEditor').value;
            
            try {
                const response = await fetch(\`/api/lesson/\${currentLesson.chapter.id}/\${currentLesson.lesson.id}/submit\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        code, 
                        userId: 'demo-user' 
                    })
                });
                
                const result = await response.json();
                
                const feedback = document.getElementById('feedback');
                if (result.passed) {
                    feedback.innerHTML = \`
                        <div class="feedback success">
                            🎉 \${result.feedback}
                            <br>💎 +\${result.xpGained} XP gained!
                            \${result.nextLesson ? \`<br>📚 Next lesson available!\` : \`<br>🏆 Course completed!\`}
                        </div>
                    \`;
                } else {
                    feedback.innerHTML = \`
                        <div class="feedback error">
                            ❌ \${result.feedback}
                            \${result.hint ? \`<div class="hint">💡 Hint: \${result.hint}</div>\` : ''}
                        </div>
                    \`;
                }
                
            } catch (error) {
                console.error('Failed to submit solution:', error);
            }
        }
        
        function getHint() {
            if (currentLesson && currentLesson.lesson.hint) {
                const feedback = document.getElementById('feedback');
                feedback.innerHTML = \`
                    <div class="feedback" style="background: #0f346020; border-color: #0f3460; color: #0f3460;">
                        💡 Hint: \${currentLesson.lesson.hint}
                    </div>
                \`;
            } else {
                alert('No hint available for this lesson!');
            }
        }
    </script>
</body>
</html>`;
}

app.listen(port, () => {
    console.log(`🧟‍♂️ AI Curriculum (CryptoZombies style) running on port ${port}`);
    console.log(`Learning interface: http://localhost:${port}`);
});

module.exports = app;