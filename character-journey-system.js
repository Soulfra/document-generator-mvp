#!/usr/bin/env node

/**
 * 🎭 CHARACTER JOURNEY SYSTEM
 * Character guides that help users discover skills and find opportunities
 * 
 * "cal can spawn or whatever and start working with them towards their journey 
 * or whatnot and then they can figure out all the paths and learn new skills 
 * and learn to market them on our job boards"
 */

const express = require('express');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class CharacterJourneySystem {
  constructor() {
    this.app = express();
    this.port = 13000;
    this.wss = null;
    
    // Database
    this.dbPath = path.join(__dirname, 'character-journey.db');
    this.db = null;
    
    // Active journeys
    this.activeJourneys = new Map();
    
    // Character personalities and skills
    this.characters = {
      cal: {
        name: 'Cal',
        emoji: '📊',
        personality: 'analytical',
        teachingStyle: 'systematic',
        skills: {
          technical: ['System Design', 'Database Architecture', 'API Development', 'DevOps', 'Cloud Infrastructure'],
          soft: ['Problem Solving', 'Technical Documentation', 'System Thinking', 'Process Optimization']
        },
        assessmentQuestions: [
          {
            id: 'cal_1',
            question: "When you see a complex system, what's your first instinct?",
            options: [
              { text: "Map out all the components", weight: { technical: 3, analytical: 2 } },
              { text: "Find the bottlenecks", weight: { technical: 2, strategic: 2 } },
              { text: "Understand the data flow", weight: { technical: 3, analytical: 3 } },
              { text: "Look for optimization opportunities", weight: { technical: 2, creative: 1 } }
            ]
          },
          {
            id: 'cal_2',
            question: "Your ideal work environment involves:",
            options: [
              { text: "Building scalable systems", weight: { technical: 3, builder: 3 } },
              { text: "Analyzing performance metrics", weight: { analytical: 3, technical: 2 } },
              { text: "Designing architectures", weight: { creative: 2, technical: 3 } },
              { text: "Automating processes", weight: { technical: 3, efficiency: 3 } }
            ]
          }
        ],
        careerPaths: [
          { title: 'Systems Architect', requiredSkills: ['System Design', 'Cloud Infrastructure'], demandLevel: 'high' },
          { title: 'DevOps Engineer', requiredSkills: ['DevOps', 'Process Optimization'], demandLevel: 'very high' },
          { title: 'Database Administrator', requiredSkills: ['Database Architecture', 'System Thinking'], demandLevel: 'medium' },
          { title: 'Platform Engineer', requiredSkills: ['API Development', 'Cloud Infrastructure'], demandLevel: 'high' }
        ]
      },
      arty: {
        name: 'Arty',
        emoji: '🎨',
        personality: 'creative',
        teachingStyle: 'inspirational',
        skills: {
          technical: ['UI Design', 'UX Research', 'Prototyping', 'Design Systems', 'Front-end Basics'],
          soft: ['Creative Thinking', 'Visual Communication', 'Empathy', 'Storytelling', 'Collaboration']
        },
        assessmentQuestions: [
          {
            id: 'arty_1',
            question: "What excites you most about a new project?",
            options: [
              { text: "Creating beautiful interfaces", weight: { creative: 3, visual: 3 } },
              { text: "Understanding user needs", weight: { empathy: 3, analytical: 2 } },
              { text: "Experimenting with new ideas", weight: { creative: 3, innovative: 3 } },
              { text: "Building cohesive experiences", weight: { systematic: 2, creative: 2 } }
            ]
          },
          {
            id: 'arty_2',
            question: "Your design process usually starts with:",
            options: [
              { text: "Sketching concepts", weight: { creative: 3, visual: 2 } },
              { text: "User research", weight: { analytical: 2, empathy: 3 } },
              { text: "Mood boards", weight: { visual: 3, creative: 2 } },
              { text: "Competitive analysis", weight: { analytical: 3, strategic: 2 } }
            ]
          }
        ],
        careerPaths: [
          { title: 'UX Designer', requiredSkills: ['UX Research', 'Prototyping'], demandLevel: 'very high' },
          { title: 'UI Designer', requiredSkills: ['UI Design', 'Visual Communication'], demandLevel: 'high' },
          { title: 'Product Designer', requiredSkills: ['Design Systems', 'Empathy'], demandLevel: 'very high' },
          { title: 'Creative Director', requiredSkills: ['Storytelling', 'Creative Thinking'], demandLevel: 'medium' }
        ]
      },
      ralph: {
        name: 'Ralph',
        emoji: '⚔️',
        personality: 'strategic',
        teachingStyle: 'challenging',
        skills: {
          technical: ['Strategic Planning', 'Market Analysis', 'Project Management', 'Risk Assessment', 'Data Analysis'],
          soft: ['Leadership', 'Decision Making', 'Negotiation', 'Critical Thinking', 'Team Building']
        },
        assessmentQuestions: [
          {
            id: 'ralph_1',
            question: "In a competitive situation, you prefer to:",
            options: [
              { text: "Analyze all possible moves", weight: { strategic: 3, analytical: 3 } },
              { text: "Strike first with bold action", weight: { leadership: 3, risk_taking: 3 } },
              { text: "Build strategic alliances", weight: { strategic: 3, collaborative: 2 } },
              { text: "Outmaneuver through innovation", weight: { creative: 2, strategic: 2 } }
            ]
          },
          {
            id: 'ralph_2',
            question: "Your leadership style is best described as:",
            options: [
              { text: "Lead by example", weight: { leadership: 3, integrity: 3 } },
              { text: "Empower the team", weight: { leadership: 2, collaborative: 3 } },
              { text: "Data-driven decisions", weight: { analytical: 3, strategic: 2 } },
              { text: "Visionary guidance", weight: { leadership: 3, creative: 2 } }
            ]
          }
        ],
        careerPaths: [
          { title: 'Product Manager', requiredSkills: ['Strategic Planning', 'Leadership'], demandLevel: 'very high' },
          { title: 'Business Strategist', requiredSkills: ['Market Analysis', 'Critical Thinking'], demandLevel: 'high' },
          { title: 'Project Manager', requiredSkills: ['Project Management', 'Team Building'], demandLevel: 'high' },
          { title: 'Management Consultant', requiredSkills: ['Risk Assessment', 'Decision Making'], demandLevel: 'medium' }
        ]
      },
      vera: {
        name: 'Vera',
        emoji: '🔬',
        personality: 'analytical',
        teachingStyle: 'methodical',
        skills: {
          technical: ['Data Science', 'Machine Learning', 'Statistical Analysis', 'Research Methods', 'Python/R'],
          soft: ['Analytical Thinking', 'Attention to Detail', 'Scientific Method', 'Communication of Insights', 'Curiosity']
        },
        assessmentQuestions: [
          {
            id: 'vera_1',
            question: "When presented with data, you first:",
            options: [
              { text: "Look for patterns", weight: { analytical: 3, pattern_recognition: 3 } },
              { text: "Question the source", weight: { critical_thinking: 3, methodical: 2 } },
              { text: "Run statistical tests", weight: { technical: 3, methodical: 3 } },
              { text: "Visualize relationships", weight: { analytical: 2, creative: 2 } }
            ]
          },
          {
            id: 'vera_2',
            question: "Your research approach is:",
            options: [
              { text: "Hypothesis-driven", weight: { scientific: 3, methodical: 3 } },
              { text: "Exploratory analysis", weight: { curious: 3, analytical: 2 } },
              { text: "Experimental design", weight: { scientific: 3, technical: 2 } },
              { text: "Data mining", weight: { technical: 3, analytical: 2 } }
            ]
          }
        ],
        careerPaths: [
          { title: 'Data Scientist', requiredSkills: ['Data Science', 'Machine Learning'], demandLevel: 'very high' },
          { title: 'Research Analyst', requiredSkills: ['Research Methods', 'Statistical Analysis'], demandLevel: 'high' },
          { title: 'ML Engineer', requiredSkills: ['Machine Learning', 'Python/R'], demandLevel: 'very high' },
          { title: 'Quantitative Analyst', requiredSkills: ['Statistical Analysis', 'Analytical Thinking'], demandLevel: 'high' }
        ]
      },
      paulo: {
        name: 'Paulo',
        emoji: '💼',
        personality: 'pragmatic',
        teachingStyle: 'practical',
        skills: {
          technical: ['Business Analysis', 'Financial Modeling', 'Operations Management', 'Process Design', 'ERP Systems'],
          soft: ['Business Acumen', 'Stakeholder Management', 'Problem Solving', 'Change Management', 'Communication']
        },
        assessmentQuestions: [
          {
            id: 'paulo_1',
            question: "In business, success means:",
            options: [
              { text: "Maximizing efficiency", weight: { efficiency: 3, analytical: 2 } },
              { text: "Creating value", weight: { strategic: 3, business: 3 } },
              { text: "Building relationships", weight: { collaborative: 3, business: 2 } },
              { text: "Sustainable growth", weight: { strategic: 2, long_term: 3 } }
            ]
          },
          {
            id: 'paulo_2',
            question: "Your approach to problems is:",
            options: [
              { text: "Find the root cause", weight: { analytical: 3, methodical: 2 } },
              { text: "Quick wins first", weight: { pragmatic: 3, efficiency: 2 } },
              { text: "Systematic improvement", weight: { methodical: 3, process: 3 } },
              { text: "Cost-benefit analysis", weight: { analytical: 3, business: 3 } }
            ]
          }
        ],
        careerPaths: [
          { title: 'Business Analyst', requiredSkills: ['Business Analysis', 'Stakeholder Management'], demandLevel: 'high' },
          { title: 'Operations Manager', requiredSkills: ['Operations Management', 'Process Design'], demandLevel: 'high' },
          { title: 'Financial Analyst', requiredSkills: ['Financial Modeling', 'Business Acumen'], demandLevel: 'very high' },
          { title: 'Management Consultant', requiredSkills: ['Problem Solving', 'Change Management'], demandLevel: 'medium' }
        ]
      },
      nash: {
        name: 'Nash',
        emoji: '🎭',
        personality: 'expressive',
        teachingStyle: 'engaging',
        skills: {
          technical: ['Content Strategy', 'SEO/SEM', 'Social Media', 'Analytics', 'Marketing Automation'],
          soft: ['Storytelling', 'Creativity', 'Empathy', 'Persuasion', 'Trend Awareness', 'Networking']
        },
        assessmentQuestions: [
          {
            id: 'nash_1',
            question: "Great content should:",
            options: [
              { text: "Tell a compelling story", weight: { storytelling: 3, creative: 3 } },
              { text: "Drive engagement", weight: { strategic: 2, analytical: 2 } },
              { text: "Build communities", weight: { collaborative: 3, empathy: 2 } },
              { text: "Convert audiences", weight: { business: 3, persuasive: 3 } }
            ]
          },
          {
            id: 'nash_2',
            question: "Your communication style is:",
            options: [
              { text: "Authentic and personal", weight: { authentic: 3, empathy: 2 } },
              { text: "Data-driven narratives", weight: { analytical: 2, storytelling: 2 } },
              { text: "Visually compelling", weight: { creative: 3, visual: 2 } },
              { text: "Emotionally resonant", weight: { empathy: 3, storytelling: 3 } }
            ]
          }
        ],
        careerPaths: [
          { title: 'Content Strategist', requiredSkills: ['Content Strategy', 'Storytelling'], demandLevel: 'high' },
          { title: 'Social Media Manager', requiredSkills: ['Social Media', 'Trend Awareness'], demandLevel: 'high' },
          { title: 'Marketing Manager', requiredSkills: ['Marketing Automation', 'Analytics'], demandLevel: 'very high' },
          { title: 'Brand Storyteller', requiredSkills: ['Storytelling', 'Creativity'], demandLevel: 'medium' }
        ]
      }
    };
    
    this.setupMiddleware();
    this.initializeDatabase();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  async initializeDatabase() {
    this.db = new sqlite3.Database(this.dbPath);
    
    const schema = `
      CREATE TABLE IF NOT EXISTS user_journeys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        journey_id TEXT UNIQUE NOT NULL,
        account_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        journey_stage TEXT DEFAULT 'assessment', -- assessment, skill_discovery, path_selection, learning, job_ready
        assessment_results TEXT, -- JSON
        discovered_skills TEXT, -- JSON array
        selected_path TEXT,
        learning_progress TEXT, -- JSON
        achievements TEXT, -- JSON array
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS skill_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        journey_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        answer_index INTEGER,
        weights_applied TEXT, -- JSON
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (journey_id) REFERENCES user_journeys(journey_id)
      );
      
      CREATE TABLE IF NOT EXISTS learning_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        journey_id TEXT NOT NULL,
        activity_type TEXT NOT NULL, -- tutorial, challenge, project, quiz
        activity_id TEXT NOT NULL,
        status TEXT DEFAULT 'started', -- started, completed, skipped
        score INTEGER,
        time_spent INTEGER, -- seconds
        metadata TEXT, -- JSON
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (journey_id) REFERENCES user_journeys(journey_id)
      );
      
      CREATE TABLE IF NOT EXISTS skill_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        verification_type TEXT, -- self_assessed, quiz_passed, project_completed, peer_reviewed
        verification_data TEXT, -- JSON
        confidence_level INTEGER, -- 1-100
        verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS job_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        journey_id TEXT NOT NULL,
        job_title TEXT NOT NULL,
        match_score INTEGER, -- 1-100
        missing_skills TEXT, -- JSON array
        recommended_learning TEXT, -- JSON array
        applied BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (journey_id) REFERENCES user_journeys(journey_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_journeys_account ON user_journeys(account_id);
      CREATE INDEX IF NOT EXISTS idx_journeys_stage ON user_journeys(journey_stage);
      CREATE INDEX IF NOT EXISTS idx_skills_account ON skill_verifications(account_id);
    `;
    
    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ port: 13001 });
    
    this.wss.on('connection', (ws) => {
      const connectionId = Date.now().toString();
      console.log(`🎭 Journey connection: ${connectionId}`);
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleJourneyMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      });
    });
  }

  async handleJourneyMessage(ws, data) {
    switch (data.type) {
      case 'start_journey':
        await this.startJourney(ws, data);
        break;
        
      case 'submit_assessment':
        await this.processAssessment(ws, data);
        break;
        
      case 'select_path':
        await this.selectCareerPath(ws, data);
        break;
        
      case 'complete_activity':
        await this.completeActivity(ws, data);
        break;
        
      case 'verify_skill':
        await this.verifySkill(ws, data);
        break;
    }
  }

  setupRoutes() {
    // Journey interface
    this.app.get('/journey', (req, res) => {
      res.send(this.generateJourneyInterface());
    });

    // Start journey
    this.app.post('/api/journey/start', async (req, res) => {
      try {
        const { accountId, characterId, sessionId } = req.body;
        const journey = await this.createJourney(accountId, characterId, sessionId);
        res.json(journey);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get journey status
    this.app.get('/api/journey/:journeyId', async (req, res) => {
      try {
        const journey = await this.getJourney(req.params.journeyId);
        res.json(journey);
      } catch (error) {
        res.status(404).json({ error: 'Journey not found' });
      }
    });

    // Submit assessment answer
    this.app.post('/api/journey/:journeyId/assessment', async (req, res) => {
      try {
        const { questionId, answerIndex } = req.body;
        const result = await this.recordAssessmentAnswer(
          req.params.journeyId,
          questionId,
          answerIndex
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get skill recommendations
    this.app.get('/api/journey/:journeyId/recommendations', async (req, res) => {
      try {
        const recommendations = await this.getSkillRecommendations(req.params.journeyId);
        res.json(recommendations);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get job matches
    this.app.get('/api/journey/:journeyId/jobs', async (req, res) => {
      try {
        const jobs = await this.getJobMatches(req.params.journeyId);
        res.json(jobs);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Verify skill
    this.app.post('/api/skills/verify', async (req, res) => {
      try {
        const { accountId, skillName, verificationType, verificationData } = req.body;
        const verification = await this.createSkillVerification(
          accountId,
          skillName,
          verificationType,
          verificationData
        );
        res.json(verification);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  // Journey management
  async createJourney(accountId, characterId, sessionId) {
    const journeyId = `journey_${accountId}_${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO user_journeys (journey_id, account_id, character_id) VALUES (?, ?, ?)`,
        [journeyId, accountId, characterId],
        (err) => {
          if (err) reject(err);
          else {
            const journey = {
              journeyId,
              accountId,
              character: this.characters[characterId],
              stage: 'assessment',
              nextStep: 'Complete personality assessment'
            };
            
            this.activeJourneys.set(journeyId, journey);
            resolve(journey);
          }
        }
      );
    });
  }

  async getJourney(journeyId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM user_journeys WHERE journey_id = ?`,
        [journeyId],
        (err, row) => {
          if (err) reject(err);
          else if (!row) reject(new Error('Journey not found'));
          else {
            const journey = {
              ...row,
              assessment_results: JSON.parse(row.assessment_results || '{}'),
              discovered_skills: JSON.parse(row.discovered_skills || '[]'),
              learning_progress: JSON.parse(row.learning_progress || '{}'),
              achievements: JSON.parse(row.achievements || '[]'),
              character: this.characters[row.character_id]
            };
            resolve(journey);
          }
        }
      );
    });
  }

  async recordAssessmentAnswer(journeyId, questionId, answerIndex) {
    const journey = await this.getJourney(journeyId);
    const character = this.characters[journey.character_id];
    const question = character.assessmentQuestions.find(q => q.id === questionId);
    
    if (!question) {
      throw new Error('Question not found');
    }
    
    const selectedOption = question.options[answerIndex];
    const weights = selectedOption.weight;
    
    // Record answer
    await new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO skill_assessments (journey_id, question_id, answer_index, weights_applied) 
         VALUES (?, ?, ?, ?)`,
        [journeyId, questionId, answerIndex, JSON.stringify(weights)],
        (err) => err ? reject(err) : resolve()
      );
    });
    
    // Check if assessment complete
    const answeredCount = await this.getAnsweredQuestionCount(journeyId);
    const totalQuestions = character.assessmentQuestions.length;
    
    if (answeredCount >= totalQuestions) {
      // Calculate results
      const results = await this.calculateAssessmentResults(journeyId);
      
      // Update journey stage
      await this.updateJourneyStage(journeyId, 'skill_discovery', results);
      
      return {
        complete: true,
        results,
        nextStage: 'skill_discovery'
      };
    }
    
    return {
      complete: false,
      progress: answeredCount / totalQuestions,
      nextQuestion: character.assessmentQuestions[answeredCount]
    };
  }

  async calculateAssessmentResults(journeyId) {
    const answers = await new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM skill_assessments WHERE journey_id = ?`,
        [journeyId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // Aggregate weights
    const weightTotals = {};
    answers.forEach(answer => {
      const weights = JSON.parse(answer.weights_applied);
      Object.entries(weights).forEach(([trait, weight]) => {
        weightTotals[trait] = (weightTotals[trait] || 0) + weight;
      });
    });
    
    // Normalize and identify strengths
    const maxWeight = Math.max(...Object.values(weightTotals));
    const strengths = Object.entries(weightTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([trait, weight]) => ({
        trait,
        score: Math.round((weight / maxWeight) * 100)
      }));
    
    return {
      strengths,
      profile: weightTotals,
      timestamp: new Date().toISOString()
    };
  }

  async getSkillRecommendations(journeyId) {
    const journey = await this.getJourney(journeyId);
    const character = this.characters[journey.character_id];
    const assessmentResults = journey.assessment_results;
    
    // Match skills based on assessment strengths
    const recommendations = {
      technical: [],
      soft: [],
      learningPaths: []
    };
    
    // Recommend technical skills based on profile
    if (assessmentResults.strengths) {
      const topStrength = assessmentResults.strengths[0].trait;
      
      // Filter relevant technical skills
      recommendations.technical = character.skills.technical.filter(skill => {
        // Logic to match skills with strengths
        return true; // Simplified - would have mapping logic
      });
      
      recommendations.soft = character.skills.soft.slice(0, 3);
      
      // Suggest learning paths
      recommendations.learningPaths = character.careerPaths
        .sort((a, b) => {
          // Sort by demand level and skill match
          const demandScore = { 'very high': 3, 'high': 2, 'medium': 1 };
          return demandScore[b.demandLevel] - demandScore[a.demandLevel];
        })
        .slice(0, 3);
    }
    
    return recommendations;
  }

  async getJobMatches(journeyId) {
    const journey = await this.getJourney(journeyId);
    const character = this.characters[journey.character_id];
    const verifiedSkills = await this.getUserVerifiedSkills(journey.account_id);
    
    // Calculate match scores for each career path
    const jobMatches = character.careerPaths.map(path => {
      const requiredSkills = path.requiredSkills;
      const matchedSkills = requiredSkills.filter(skill => 
        verifiedSkills.some(vs => vs.skill_name === skill)
      );
      
      const matchScore = Math.round((matchedSkills.length / requiredSkills.length) * 100);
      const missingSkills = requiredSkills.filter(skill => 
        !matchedSkills.includes(skill)
      );
      
      return {
        jobTitle: path.title,
        matchScore,
        matchedSkills,
        missingSkills,
        demandLevel: path.demandLevel,
        readyToApply: matchScore >= 70
      };
    });
    
    // Store job matches
    for (const match of jobMatches) {
      await this.storeJobMatch(journeyId, match);
    }
    
    return jobMatches.sort((a, b) => b.matchScore - a.matchScore);
  }

  async getUserVerifiedSkills(accountId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM skill_verifications WHERE account_id = ? ORDER BY confidence_level DESC`,
        [accountId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async createSkillVerification(accountId, skillName, verificationType, verificationData) {
    const confidenceMap = {
      self_assessed: 40,
      quiz_passed: 70,
      project_completed: 85,
      peer_reviewed: 90
    };
    
    const confidenceLevel = confidenceMap[verificationType] || 50;
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO skill_verifications 
         (account_id, skill_name, verification_type, verification_data, confidence_level) 
         VALUES (?, ?, ?, ?, ?)`,
        [accountId, skillName, verificationType, JSON.stringify(verificationData), confidenceLevel],
        function(err) {
          if (err) reject(err);
          else resolve({
            id: this.lastID,
            skillName,
            verificationType,
            confidenceLevel
          });
        }
      );
    });
  }

  // Helper methods
  async getAnsweredQuestionCount(journeyId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT COUNT(*) as count FROM skill_assessments WHERE journey_id = ?`,
        [journeyId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });
  }

  async updateJourneyStage(journeyId, newStage, results = null) {
    const updateData = [newStage];
    let query = `UPDATE user_journeys SET journey_stage = ?, last_updated = CURRENT_TIMESTAMP`;
    
    if (results) {
      query += `, assessment_results = ?`;
      updateData.push(JSON.stringify(results));
    }
    
    query += ` WHERE journey_id = ?`;
    updateData.push(journeyId);
    
    return new Promise((resolve, reject) => {
      this.db.run(query, updateData, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async storeJobMatch(journeyId, match) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO job_matches 
         (journey_id, job_title, match_score, missing_skills, recommended_learning) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          journeyId,
          match.jobTitle,
          match.matchScore,
          JSON.stringify(match.missingSkills),
          JSON.stringify(match.recommendedLearning || [])
        ],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  generateJourneyInterface() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>🎭 Your Character Journey</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #e0e0e0;
            margin: 0;
            padding: 0;
            min-height: 100vh;
        }
        
        .journey-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .character-header {
            text-align: center;
            padding: 40px 0;
            position: relative;
        }
        
        .character-avatar {
            font-size: 120px;
            margin-bottom: 20px;
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        
        .character-name {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 10px;
            color: #00ff41;
            text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
        }
        
        .character-role {
            font-size: 20px;
            opacity: 0.8;
        }
        
        .journey-progress {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .progress-bar {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            height: 30px;
            overflow: hidden;
            margin: 20px 0;
        }
        
        .progress-fill {
            background: linear-gradient(90deg, #00ff41 0%, #00cc33 100%);
            height: 100%;
            width: 0%;
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            font-weight: bold;
        }
        
        .stage-indicators {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
        }
        
        .stage {
            text-align: center;
            font-size: 12px;
            opacity: 0.6;
        }
        
        .stage.active {
            opacity: 1;
            color: #00ff41;
        }
        
        .content-area {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 30px;
            margin: 20px 0;
            min-height: 400px;
        }
        
        .assessment-question {
            text-align: center;
            padding: 40px 0;
        }
        
        .question-text {
            font-size: 24px;
            margin-bottom: 40px;
            line-height: 1.4;
        }
        
        .answer-options {
            display: grid;
            gap: 15px;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .answer-option {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid transparent;
            border-radius: 10px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 16px;
        }
        
        .answer-option:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: #00ff41;
            transform: translateX(5px);
        }
        
        .skill-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            margin: 15px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
        }
        
        .skill-card:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }
        
        .skill-info {
            flex: 1;
        }
        
        .skill-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .skill-description {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .skill-action {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .skill-action:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .job-match-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 25px;
            margin: 20px 0;
            border: 2px solid transparent;
            transition: all 0.3s ease;
        }
        
        .job-match-card.high-match {
            border-color: #00ff41;
        }
        
        .job-match-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .job-title {
            font-size: 22px;
            font-weight: 600;
        }
        
        .match-score {
            font-size: 28px;
            font-weight: 700;
            color: #00ff41;
        }
        
        .demand-level {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 15px;
        }
        
        .demand-level.very-high {
            background: rgba(0, 255, 65, 0.2);
            color: #00ff41;
        }
        
        .demand-level.high {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
        }
        
        .demand-level.medium {
            background: rgba(23, 162, 184, 0.2);
            color: #17a2b8;
        }
        
        .skills-match {
            margin: 15px 0;
        }
        
        .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
        }
        
        .skill-tag {
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 14px;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .skill-tag.matched {
            background: rgba(0, 255, 65, 0.2);
            color: #00ff41;
        }
        
        .skill-tag.missing {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
        }
        
        .apply-button {
            background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
            color: #000;
            border: none;
            padding: 15px 40px;
            border-radius: 30px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            margin-top: 20px;
        }
        
        .apply-button:hover {
            transform: scale(1.02);
            box-shadow: 0 5px 20px rgba(0, 255, 65, 0.4);
        }
        
        .apply-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .floating-chat {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            cursor: pointer;
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
        }
        
        .floating-chat:hover {
            transform: scale(1.1);
        }
    </style>
</head>
<body>
    <div class="journey-container">
        <div class="character-header">
            <div class="character-avatar" id="characterAvatar">🎭</div>
            <h1 class="character-name" id="characterName">Loading...</h1>
            <p class="character-role" id="characterRole">Preparing your journey</p>
        </div>
        
        <div class="journey-progress">
            <h3>Your Journey Progress</h3>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill">0%</div>
            </div>
            <div class="stage-indicators">
                <div class="stage active" id="stage-assessment">Assessment</div>
                <div class="stage" id="stage-discovery">Skill Discovery</div>
                <div class="stage" id="stage-path">Path Selection</div>
                <div class="stage" id="stage-learning">Learning</div>
                <div class="stage" id="stage-ready">Job Ready</div>
            </div>
        </div>
        
        <div class="content-area" id="contentArea">
            <div class="loading" style="text-align: center; padding: 100px 0;">
                <div style="font-size: 60px; margin-bottom: 20px;">⏳</div>
                <p>Preparing your personalized journey...</p>
            </div>
        </div>
    </div>
    
    <div class="floating-chat" id="characterChat">
        <span id="chatCharacterEmoji">💬</span>
    </div>
    
    <script>
        let ws = null;
        let currentJourney = null;
        let currentCharacter = null;
        let currentQuestion = 0;
        
        // Initialize WebSocket
        function initWebSocket() {
            ws = new WebSocket('ws://localhost:13001');
            
            ws.onopen = () => {
                console.log('Connected to journey system');
                loadJourney();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleJourneyUpdate(data);
            };
            
            ws.onclose = () => {
                setTimeout(initWebSocket, 3000);
            };
        }
        
        // Load journey from URL params
        async function loadJourney() {
            const params = new URLSearchParams(window.location.search);
            const sessionId = params.get('session');
            const characterId = params.get('character');
            
            if (!sessionId || !characterId) {
                showError('Missing session or character information');
                return;
            }
            
            try {
                // Get or create journey
                const response = await fetch('/api/journey/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accountId: sessionId, // In real app, would lookup from session
                        characterId,
                        sessionId
                    })
                });
                
                const journey = await response.json();
                currentJourney = journey;
                currentCharacter = journey.character;
                
                updateCharacterDisplay();
                showCurrentStage();
            } catch (error) {
                console.error('Error loading journey:', error);
                showError('Failed to load journey');
            }
        }
        
        function updateCharacterDisplay() {
            document.getElementById('characterAvatar').textContent = currentCharacter.emoji;
            document.getElementById('characterName').textContent = currentCharacter.name;
            document.getElementById('characterRole').textContent = currentCharacter.role;
            document.getElementById('chatCharacterEmoji').textContent = currentCharacter.emoji;
        }
        
        function showCurrentStage() {
            const stage = currentJourney.stage;
            
            // Update progress indicators
            const stages = ['assessment', 'discovery', 'path', 'learning', 'ready'];
            const currentIndex = stages.indexOf(stage.replace('skill_', '').replace('job_', ''));
            const progress = ((currentIndex + 1) / stages.length) * 100;
            
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressFill').textContent = Math.round(progress) + '%';
            
            // Update active stage
            document.querySelectorAll('.stage').forEach(el => el.classList.remove('active'));
            document.getElementById(\`stage-\${stage.replace('_', '-')}\`).classList.add('active');
            
            // Show appropriate content
            switch (stage) {
                case 'assessment':
                    showAssessment();
                    break;
                case 'skill_discovery':
                    showSkillDiscovery();
                    break;
                case 'path_selection':
                    showPathSelection();
                    break;
                case 'learning':
                    showLearning();
                    break;
                case 'job_ready':
                    showJobMatches();
                    break;
            }
        }
        
        function showAssessment() {
            const question = currentCharacter.assessmentQuestions[currentQuestion];
            
            const content = \`
                <div class="assessment-question">
                    <h2 class="question-text">\${question.question}</h2>
                    <div class="answer-options">
                        \${question.options.map((opt, i) => \`
                            <div class="answer-option" onclick="submitAnswer('\${question.id}', \${i})">
                                \${opt.text}
                            </div>
                        \`).join('')}
                    </div>
                </div>
            \`;
            
            document.getElementById('contentArea').innerHTML = content;
        }
        
        async function submitAnswer(questionId, answerIndex) {
            try {
                const response = await fetch(\`/api/journey/\${currentJourney.journeyId}/assessment\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questionId, answerIndex })
                });
                
                const result = await response.json();
                
                if (result.complete) {
                    currentJourney.stage = 'skill_discovery';
                    currentJourney.assessmentResults = result.results;
                    showCurrentStage();
                } else {
                    currentQuestion++;
                    showAssessment();
                }
            } catch (error) {
                console.error('Error submitting answer:', error);
            }
        }
        
        async function showSkillDiscovery() {
            try {
                const response = await fetch(\`/api/journey/\${currentJourney.journeyId}/recommendations\`);
                const recommendations = await response.json();
                
                const content = \`
                    <div>
                        <h2>🎯 Your Skill Recommendations</h2>
                        <p>\${currentCharacter.name} has analyzed your responses and found these skills match your strengths:</p>
                        
                        <h3>Technical Skills</h3>
                        \${recommendations.technical.map(skill => \`
                            <div class="skill-card">
                                <div class="skill-info">
                                    <div class="skill-name">\${skill}</div>
                                    <div class="skill-description">Essential for your career path</div>
                                </div>
                                <button class="skill-action" onclick="learnSkill('\${skill}')">
                                    Learn
                                </button>
                            </div>
                        \`).join('')}
                        
                        <h3>Soft Skills</h3>
                        \${recommendations.soft.map(skill => \`
                            <div class="skill-card">
                                <div class="skill-info">
                                    <div class="skill-name">\${skill}</div>
                                    <div class="skill-description">Complement your technical abilities</div>
                                </div>
                                <button class="skill-action" onclick="learnSkill('\${skill}')">
                                    Develop
                                </button>
                            </div>
                        \`).join('')}
                        
                        <button class="apply-button" onclick="moveToJobMatching()">
                            See Job Matches
                        </button>
                    </div>
                \`;
                
                document.getElementById('contentArea').innerHTML = content;
            } catch (error) {
                console.error('Error loading recommendations:', error);
            }
        }
        
        async function showJobMatches() {
            try {
                const response = await fetch(\`/api/journey/\${currentJourney.journeyId}/jobs\`);
                const jobs = await response.json();
                
                const content = \`
                    <div>
                        <h2>💼 Your Job Matches</h2>
                        <p>Based on your skills and interests, here are your best career opportunities:</p>
                        
                        \${jobs.map(job => \`
                            <div class="job-match-card \${job.matchScore >= 70 ? 'high-match' : ''}">
                                <div class="job-match-header">
                                    <h3 class="job-title">\${job.jobTitle}</h3>
                                    <div class="match-score">\${job.matchScore}%</div>
                                </div>
                                
                                <span class="demand-level \${job.demandLevel.replace(' ', '-')}">\${job.demandLevel} demand</span>
                                
                                <div class="skills-match">
                                    <strong>Matched Skills:</strong>
                                    <div class="skills-list">
                                        \${job.matchedSkills.map(skill => \`
                                            <span class="skill-tag matched">\${skill}</span>
                                        \`).join('')}
                                    </div>
                                </div>
                                
                                \${job.missingSkills.length > 0 ? \`
                                    <div class="skills-match">
                                        <strong>Skills to Learn:</strong>
                                        <div class="skills-list">
                                            \${job.missingSkills.map(skill => \`
                                                <span class="skill-tag missing">\${skill}</span>
                                            \`).join('')}
                                        </div>
                                    </div>
                                \` : ''}
                                
                                <button class="apply-button" \${!job.readyToApply ? 'disabled' : ''} 
                                        onclick="applyToJob('\${job.jobTitle}')">
                                    \${job.readyToApply ? 'Apply Now' : 'Learn Required Skills First'}
                                </button>
                            </div>
                        \`).join('')}
                    </div>
                \`;
                
                document.getElementById('contentArea').innerHTML = content;
            } catch (error) {
                console.error('Error loading job matches:', error);
            }
        }
        
        function learnSkill(skill) {
            // Would open learning module
            alert(\`Learning module for \${skill} would open here`);
        }
        
        function moveToJobMatching() {
            currentJourney.stage = 'job_ready';
            showCurrentStage();
        }
        
        function applyToJob(jobTitle) {
            // Would open job application
            alert(\`Application for \${jobTitle} would open here`);
        }
        
        function showError(message) {
            document.getElementById('contentArea').innerHTML = \`
                <div style="text-align: center; padding: 100px 0;">
                    <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
                    <p>\${message}</p>
                </div>
            \`;
        }
        
        function handleJourneyUpdate(data) {
            // Handle real-time updates
            console.log('Journey update:', data);
        }
        
        // Character chat
        document.getElementById('characterChat').addEventListener('click', () => {
            alert(\`\${currentCharacter.name} says: "\${currentCharacter.greeting}"`);
        });
        
        // Initialize
        initWebSocket();
    </script>
</body>
</html>
    `;
  }

  async start() {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`
🎭 CHARACTER JOURNEY SYSTEM LAUNCHED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Journey Interface: http://localhost:${this.port}/journey
🔌 WebSocket: ws://localhost:13001
📊 API Base: http://localhost:${this.port}/api

🎯 CHARACTER GUIDES:
• Cal (📊) - Systems & Technical paths
• Arty (🎨) - Creative & Design paths
• Ralph (⚔️) - Strategy & Management paths
• Vera (🔬) - Research & Data paths
• Paulo (💼) - Business & Operations paths
• Nash (🎭) - Content & Communications paths

📚 JOURNEY STAGES:
1. Assessment - Personality & strengths discovery
2. Skill Discovery - Personalized recommendations
3. Path Selection - Career path matching
4. Learning - Skill development & verification
5. Job Ready - Matched opportunities

🚀 FEATURES:
• Personalized skill assessments
• Character-guided learning paths
• Skill verification system
• Job match scoring
• Progress tracking
• Achievement system

💼 JOB BOARD INTEGRATION:
• Automatic skill matching
• Demand level indicators
• Missing skill identification
• Application readiness scoring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
        resolve();
      });
    });
  }
}

// Start the Character Journey System
if (require.main === module) {
  const journeySystem = new CharacterJourneySystem();
  journeySystem.start().catch(console.error);
}

module.exports = CharacterJourneySystem;