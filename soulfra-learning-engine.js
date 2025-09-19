/**
 * SOULFRA LEARNING LOOP ENGINE
 * 
 * Horizontal learning progression system with quiz generation,
 * adaptive difficulty, and gamified skill trees.
 */

class SoulFraLearningEngine {
  constructor() {
    this.subjects = {
      'oauth_mastery': {
        name: 'OAuth Mastery',
        icon: '🔐',
        description: 'Master authentication flows and secure token management',
        level: 1,
        progress: 0,
        unlocked: true,
        skills: [
          'Basic OAuth flow understanding',
          'GitHub authentication',
          'Google OAuth integration', 
          'Token security best practices',
          'Multi-service orchestration'
        ]
      },
      'voice_fluency': {
        name: 'Voice Fluency',
        icon: '🎤',
        description: 'Perfect your voice commands and natural language interaction',
        level: 1,
        progress: 0,
        unlocked: true,
        skills: [
          'Clear pronunciation',
          'Command recognition accuracy',
          'Natural language patterns',
          'Voice biometric consistency',
          'Advanced voice automation'
        ]
      },
      'security_awareness': {
        name: 'Security Awareness',
        icon: '🛡️',
        description: 'Understand security principles and threat mitigation',
        level: 1,
        progress: 0,
        unlocked: false,
        skills: [
          'Token storage principles',
          'Keychain security',
          'Threat recognition',
          'Privacy protection',
          'Security audit practices'
        ]
      },
      'system_integration': {
        name: 'System Integration',
        icon: '🔗',
        description: 'Connect services and build automated workflows',
        level: 1,
        progress: 0,
        unlocked: false,
        skills: [
          'Service connections',
          'API understanding',
          'Workflow automation',
          'Error handling',
          'Performance optimization'
        ]
      },
      'automation_skills': {
        name: 'Automation Skills',
        icon: '🤖',
        description: 'Build intelligent automation and advanced workflows',
        level: 1,
        progress: 0,
        unlocked: false,
        skills: [
          'Complex workflow design',
          'Conditional logic',
          'Event-driven automation',
          'Custom integrations',
          'AI-powered workflows'
        ]
      },
      'git_mastery': {
        name: 'Git Mastery',
        icon: '🌳',
        description: 'Master voice-controlled Git operations and repository management',
        level: 1,
        progress: 0,
        unlocked: false,
        skills: [
          'Basic Git commands',
          'Branch management',
          'Smart commits with AI',
          'Permission control',
          'Advanced repository workflows'
        ]
      }
    };
    
    this.quizBank = this.initializeQuizBank();
    this.currentQuiz = null;
    this.quizHistory = [];
    this.learningPaths = this.initializeLearningPaths();
    this.achievements = [];
    
    this.setupEventHandlers();
  }
  
  // === LEARNING SESSION MANAGEMENT ===
  
  startLearningSession(subject) {
    if (!this.subjects[subject] || !this.subjects[subject].unlocked) {
      throw new Error(`Subject ${subject} is not available`);
    }
    
    const session = {
      subject,
      startTime: Date.now(),
      level: this.subjects[subject].level,
      activities: [],
      score: 0,
      attempts: 0
    };
    
    console.log(`🎓 Starting learning session: ${this.subjects[subject].name} (Level ${session.level})`);
    this.emit('sessionStarted', session);
    
    return session;
  }
  
  endLearningSession(session) {
    const duration = Date.now() - session.startTime;
    const accuracy = session.attempts > 0 ? (session.score / session.attempts) * 100 : 0;
    
    const summary = {
      ...session,
      duration,
      accuracy,
      endTime: Date.now()
    };
    
    // Update subject progress
    this.updateSubjectProgress(session.subject, summary);
    
    // Save progress
    this.saveLearningProgress();
    
    console.log('📊 Learning session complete:', summary);
    this.emit('sessionEnded', summary);
    
    return summary;
  }
  
  // === QUIZ GENERATION SYSTEM ===
  
  generateQuiz(subject, level = 1, count = 5) {
    const subjectQuizzes = this.quizBank[subject] || [];
    const levelQuizzes = subjectQuizzes.filter(q => q.level <= level);
    
    if (levelQuizzes.length === 0) {
      throw new Error(`No quizzes available for ${subject} at level ${level}`);
    }
    
    // Select random questions
    const selectedQuestions = this.shuffleArray(levelQuizzes)
      .slice(0, Math.min(count, levelQuizzes.length));
    
    this.currentQuiz = {
      id: `quiz_${Date.now()}`,
      subject,
      level,
      questions: selectedQuestions,
      currentQuestion: 0,
      score: 0,
      startTime: Date.now(),
      responses: []
    };
    
    this.emit('quizGenerated', this.currentQuiz);
    return this.currentQuiz;
  }
  
  submitQuizAnswer(answer, isVoiceInput = false) {
    if (!this.currentQuiz) {
      throw new Error('No active quiz');
    }
    
    const question = this.currentQuiz.questions[this.currentQuiz.currentQuestion];
    const isCorrect = this.checkAnswer(question, answer);
    
    const response = {
      questionIndex: this.currentQuiz.currentQuestion,
      question: question.question,
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      isVoiceInput,
      timestamp: Date.now()
    };
    
    this.currentQuiz.responses.push(response);
    
    if (isCorrect) {
      this.currentQuiz.score++;
      this.emit('correctAnswer', response);
    } else {
      this.emit('incorrectAnswer', response);
    }
    
    // Move to next question
    this.currentQuiz.currentQuestion++;
    
    // Check if quiz is complete
    if (this.currentQuiz.currentQuestion >= this.currentQuiz.questions.length) {
      return this.completeQuiz();
    }
    
    this.emit('questionAnswered', response);
    return this.getCurrentQuestion();
  }
  
  checkAnswer(question, userAnswer) {
    const correct = question.correctAnswer.toLowerCase().trim();
    const user = userAnswer.toLowerCase().trim();
    
    // Exact match
    if (user === correct) return true;
    
    // Check for acceptable alternatives
    if (question.acceptableAnswers) {
      return question.acceptableAnswers.some(alt => 
        alt.toLowerCase().trim() === user
      );
    }
    
    // Fuzzy matching for voice input
    return this.fuzzyMatch(user, correct) > 0.8;
  }
  
  fuzzyMatch(str1, str2) {
    // Simple Levenshtein distance ratio
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
  }
  
  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null)
      .map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  completeQuiz() {
    if (!this.currentQuiz) return null;
    
    const quiz = this.currentQuiz;
    const accuracy = (quiz.score / quiz.questions.length) * 100;
    const duration = Date.now() - quiz.startTime;
    
    const result = {
      ...quiz,
      accuracy,
      duration,
      completedAt: Date.now()
    };
    
    // Save to history
    this.quizHistory.push(result);
    
    // Check for achievements
    this.checkAchievements(result);
    
    // Clear current quiz
    this.currentQuiz = null;
    
    this.emit('quizCompleted', result);
    return result;
  }
  
  getCurrentQuestion() {
    if (!this.currentQuiz) return null;
    
    const question = this.currentQuiz.questions[this.currentQuiz.currentQuestion];
    return {
      ...question,
      questionNumber: this.currentQuiz.currentQuestion + 1,
      totalQuestions: this.currentQuiz.questions.length,
      progress: ((this.currentQuiz.currentQuestion + 1) / this.currentQuiz.questions.length) * 100
    };
  }
  
  // === PROGRESS TRACKING ===
  
  updateSubjectProgress(subject, sessionSummary) {
    if (!this.subjects[subject]) return;
    
    const subjectData = this.subjects[subject];
    let progressGain = 0;
    
    // Calculate progress based on accuracy and activities
    if (sessionSummary.accuracy >= 80) {
      progressGain = 15; // High accuracy
    } else if (sessionSummary.accuracy >= 60) {
      progressGain = 10; // Medium accuracy
    } else {
      progressGain = 5; // Low accuracy but still learning
    }
    
    // Bonus for consistency
    if (sessionSummary.attempts >= 5) {
      progressGain += 5;
    }
    
    subjectData.progress += progressGain;
    
    // Level up check
    if (subjectData.progress >= 100) {
      this.levelUp(subject);
    }
    
    this.emit('progressUpdate', { 
      subject, 
      progress: subjectData.progress,
      level: subjectData.level
    });
  }
  
  levelUp(subject) {
    const subjectData = this.subjects[subject];
    const oldLevel = subjectData.level;
    
    subjectData.level++;
    subjectData.progress = 0;
    
    // Unlock new subjects
    this.checkUnlocks(subject, subjectData.level);
    
    // Award achievement
    this.awardAchievement({
      type: 'level_up',
      subject,
      level: subjectData.level,
      title: `${subjectData.name} Level ${subjectData.level}`,
      description: `Reached level ${subjectData.level} in ${subjectData.name}`,
      timestamp: Date.now()
    });
    
    console.log(`🎉 Level up! ${subjectData.name}: ${oldLevel} → ${subjectData.level}`);
    this.emit('levelUp', { subject, oldLevel, newLevel: subjectData.level });
  }
  
  checkUnlocks(completedSubject, level) {
    const unlockRules = {
      'oauth_mastery': {
        2: ['security_awareness', 'git_mastery'],
        3: ['system_integration']
      },
      'voice_fluency': {
        2: ['system_integration', 'git_mastery'],
        3: ['automation_skills']
      },
      'security_awareness': {
        2: ['automation_skills']
      },
      'git_mastery': {
        2: ['automation_skills'],
        3: ['system_integration']
      }
    };
    
    const rules = unlockRules[completedSubject];
    if (!rules || !rules[level]) return;
    
    rules[level].forEach(subject => {
      if (this.subjects[subject] && !this.subjects[subject].unlocked) {
        this.subjects[subject].unlocked = true;
        
        this.awardAchievement({
          type: 'subject_unlock',
          subject,
          title: `${this.subjects[subject].name} Unlocked!`,
          description: `You've unlocked the ${this.subjects[subject].name} subject`,
          timestamp: Date.now()
        });
        
        this.emit('subjectUnlocked', { subject });
      }
    });
  }
  
  // === ADAPTIVE LEARNING ===
  
  getRecommendedActivity(subject) {
    const subjectData = this.subjects[subject];
    if (!subjectData || !subjectData.unlocked) return null;
    
    const recentPerformance = this.getRecentPerformance(subject);
    
    // Adaptive difficulty
    if (recentPerformance.averageAccuracy > 85) {
      // Challenge with harder content
      return {
        type: 'quiz',
        difficulty: 'hard',
        count: 7,
        suggestion: 'Great work! Ready for more challenging questions?'
      };
    } else if (recentPerformance.averageAccuracy < 60) {
      // Review and reinforce
      return {
        type: 'review',
        difficulty: 'easy',
        count: 3,
        suggestion: 'Let\'s review the basics with some easier questions.'
      };
    } else {
      // Standard practice
      return {
        type: 'quiz',
        difficulty: 'medium',
        count: 5,
        suggestion: 'Ready for your next learning challenge?'
      };
    }
  }
  
  getRecentPerformance(subject, lastN = 5) {
    const recentQuizzes = this.quizHistory
      .filter(q => q.subject === subject)
      .slice(-lastN);
    
    if (recentQuizzes.length === 0) {
      return { averageAccuracy: 50, quizCount: 0 };
    }
    
    const totalAccuracy = recentQuizzes.reduce((sum, q) => sum + q.accuracy, 0);
    return {
      averageAccuracy: totalAccuracy / recentQuizzes.length,
      quizCount: recentQuizzes.length,
      lastQuiz: recentQuizzes[recentQuizzes.length - 1]
    };
  }
  
  // === ACHIEVEMENTS SYSTEM ===
  
  awardAchievement(achievement) {
    this.achievements.push(achievement);
    this.emit('achievementUnlocked', achievement);
  }
  
  checkAchievements(quizResult) {
    // Perfect score achievement
    if (quizResult.accuracy === 100) {
      this.awardAchievement({
        type: 'perfect_score',
        subject: quizResult.subject,
        title: 'Perfect Score!',
        description: 'Answered all questions correctly',
        timestamp: Date.now()
      });
    }
    
    // Speed demon achievement
    if (quizResult.duration < 60000 && quizResult.accuracy >= 80) {
      this.awardAchievement({
        type: 'speed_demon',
        subject: quizResult.subject,
        title: 'Speed Demon',
        description: 'Completed quiz quickly with high accuracy',
        timestamp: Date.now()
      });
    }
    
    // Consistent learner achievement
    const recentQuizzes = this.quizHistory
      .filter(q => q.subject === quizResult.subject)
      .slice(-5);
    
    if (recentQuizzes.length >= 5 && 
        recentQuizzes.every(q => q.accuracy >= 70)) {
      this.awardAchievement({
        type: 'consistent_learner',
        subject: quizResult.subject,
        title: 'Consistent Learner',
        description: 'Maintained good performance across multiple quizzes',
        timestamp: Date.now()
      });
    }
  }
  
  // === DATA PERSISTENCE ===
  
  saveLearningProgress() {
    const data = {
      subjects: this.subjects,
      quizHistory: this.quizHistory.slice(-50), // Keep last 50 quizzes
      achievements: this.achievements,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem('soulfra-learning-progress', JSON.stringify(data));
    } catch (error) {
      console.warn('Could not save learning progress:', error);
    }
  }
  
  loadLearningProgress() {
    try {
      const stored = localStorage.getItem('soulfra-learning-progress');
      if (stored) {
        const data = JSON.parse(stored);
        
        this.subjects = { ...this.subjects, ...data.subjects };
        this.quizHistory = data.quizHistory || [];
        this.achievements = data.achievements || [];
        
        console.log('📚 Learning progress loaded');
        return data;
      }
    } catch (error) {
      console.warn('Could not load learning progress:', error);
    }
    return null;
  }
  
  // === UTILITY METHODS ===
  
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  setupEventHandlers() {
    this.events = {};
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  // === PUBLIC API ===
  
  getSubjects() {
    return this.subjects;
  }
  
  getAchievements() {
    return this.achievements;
  }
  
  getQuizHistory(subject = null) {
    if (subject) {
      return this.quizHistory.filter(q => q.subject === subject);
    }
    return this.quizHistory;
  }
  
  getOverallProgress() {
    const unlockedSubjects = Object.entries(this.subjects)
      .filter(([_, data]) => data.unlocked);
    
    const totalLevels = unlockedSubjects.reduce((sum, [_, data]) => sum + data.level, 0);
    const totalProgress = unlockedSubjects.reduce((sum, [_, data]) => sum + data.progress, 0);
    
    return {
      unlockedSubjects: unlockedSubjects.length,
      totalSubjects: Object.keys(this.subjects).length,
      averageLevel: totalLevels / unlockedSubjects.length || 0,
      averageProgress: totalProgress / unlockedSubjects.length || 0,
      achievements: this.achievements.length
    };
  }
  
  // === QUIZ BANK INITIALIZATION ===
  
  initializeQuizBank() {
    return {
      oauth_mastery: [
        {
          level: 1,
          type: 'multiple_choice',
          question: 'What does OAuth stand for?',
          options: ['Open Authorization', 'Object Authentication', 'Online Auth', 'Open Access'],
          correctAnswer: 'Open Authorization',
          explanation: 'OAuth stands for Open Authorization, a standard for secure API authorization.'
        },
        {
          level: 1,
          type: 'voice',
          question: 'Say the command to login to GitHub',
          correctAnswer: 'soulfra login to github',
          acceptableAnswers: ['login to github', 'connect to github', 'sign into github'],
          explanation: 'The voice command starts with "SoulFra" followed by the action.'
        },
        {
          level: 2,
          type: 'multiple_choice',
          question: 'Where are OAuth tokens stored in SoulFra?',
          options: ['Plain text files', 'Browser localStorage', 'System keychain', 'Environment variables'],
          correctAnswer: 'System keychain',
          explanation: 'SoulFra uses the system keychain for secure token storage.'
        },
        {
          level: 2,
          type: 'voice',
          question: 'Say the command to show your GitHub token',
          correctAnswer: 'soulfra show github token',
          acceptableAnswers: ['show github token', 'get github token', 'display github token'],
          explanation: 'You can request to view tokens, but they are shown securely.'
        },
        {
          level: 3,
          type: 'open_ended',
          question: 'Explain the OAuth authorization code flow',
          correctAnswer: 'redirect to provider, user authorizes, receive code, exchange for token',
          explanation: 'The OAuth flow involves redirecting users to authorize, then exchanging codes for tokens.'
        }
      ],
      
      voice_fluency: [
        {
          level: 1,
          type: 'voice',
          question: 'Say the wake phrase to activate SoulFra',
          correctAnswer: 'soulfra',
          acceptableAnswers: ['soul fra', 'hey soulfra'],
          explanation: 'SoulFra responds to "SoulFra", "Soul Fra", or "Hey SoulFra".'
        },
        {
          level: 1,
          type: 'voice',
          question: 'Ask SoulFra what services are connected',
          correctAnswer: 'soulfra what is connected',
          acceptableAnswers: ['what is connected', 'show my connections', 'connection status'],
          explanation: 'Multiple phrases work for checking connection status.'
        },
        {
          level: 2,
          type: 'voice',
          question: 'Tell SoulFra to refresh all services',
          correctAnswer: 'soulfra refresh all',
          acceptableAnswers: ['refresh all', 'update status', 'sync everything'],
          explanation: 'Natural language variations are supported for system commands.'
        },
        {
          level: 3,
          type: 'multiple_choice',
          question: 'What factors improve voice recognition accuracy?',
          options: ['Speaking faster', 'Clear pronunciation', 'Background noise', 'Multiple speakers'],
          correctAnswer: 'Clear pronunciation',
          explanation: 'Clear, consistent pronunciation improves voice recognition accuracy.'
        }
      ],
      
      security_awareness: [
        {
          level: 1,
          type: 'multiple_choice',
          question: 'Why should tokens never be stored in plain text?',
          options: ['They expire quickly', 'They can be stolen', 'They are too long', 'They change often'],
          correctAnswer: 'They can be stolen',
          explanation: 'Plain text tokens can be easily stolen and misused by attackers.'
        },
        {
          level: 2,
          type: 'multiple_choice',
          question: 'What is the purpose of the system keychain?',
          options: ['Store passwords', 'Secure token storage', 'File encryption', 'Network security'],
          correctAnswer: 'Secure token storage',
          explanation: 'The system keychain provides encrypted storage for sensitive data like tokens.'
        }
      ],
      
      system_integration: [
        {
          level: 1,
          type: 'multiple_choice',
          question: 'What protocol does SoulFra use for OAuth callbacks?',
          options: ['FTP', 'HTTP', 'SMTP', 'SSH'],
          correctAnswer: 'HTTP',
          explanation: 'OAuth callbacks use HTTP/HTTPS protocol for secure communication.'
        },
        {
          level: 2,
          type: 'open_ended',
          question: 'Name two ways SoulFra interfaces can communicate',
          correctAnswer: 'api calls and events',
          explanation: 'Interfaces communicate via API calls and event systems.'
        }
      ],
      
      automation_skills: [
        {
          level: 1,
          type: 'multiple_choice',
          question: 'What triggers automated workflows in SoulFra?',
          options: ['Timer events', 'Voice commands', 'Service events', 'All of the above'],
          correctAnswer: 'All of the above',
          explanation: 'Workflows can be triggered by timers, voice commands, or service events.'
        }
      ],
      
      git_mastery: [
        {
          level: 1,
          type: 'voice',
          question: 'Say the voice command to check repository status',
          correctAnswer: 'soulfra show repository status',
          acceptableAnswers: ['show repository status', 'git status', 'repository status'],
          explanation: 'You can use various phrases to check Git repository status with SoulFra.'
        },
        {
          level: 1,
          type: 'multiple_choice',
          question: 'What does SoulFra Git automatically do when you create a commit?',
          options: ['Push to remote', 'Generate AI commit message', 'Create pull request', 'Delete local files'],
          correctAnswer: 'Generate AI commit message',
          explanation: 'SoulFra can automatically generate meaningful commit messages using AI analysis.'
        },
        {
          level: 2,
          type: 'voice',
          question: 'Say the command to create a new branch',
          correctAnswer: 'soulfra create branch',
          acceptableAnswers: ['create branch', 'new branch', 'create new branch'],
          explanation: 'SoulFra can create branches with AI-generated names or custom names you specify.'
        },
        {
          level: 2,
          type: 'multiple_choice',
          question: 'What permission levels can SoulFra set for branches?',
          options: ['Only public and private', 'Public, private, remixable', 'Only private', 'No permission control'],
          correctAnswer: 'Public, private, remixable',
          explanation: 'SoulFra supports multiple permission levels including remixable for community collaboration.'
        },
        {
          level: 3,
          type: 'voice',
          question: 'Say the command to make a branch remixable',
          correctAnswer: 'soulfra make branch remixable',
          acceptableAnswers: ['make branch remixable', 'set branch remixable', 'change to remixable'],
          explanation: 'Remixable branches allow community contributions and collaboration.'
        },
        {
          level: 3,
          type: 'open_ended',
          question: 'Explain the benefit of voice-controlled Git operations',
          correctAnswer: 'faster workflow hands-free natural language',
          explanation: 'Voice control makes Git operations faster, more natural, and accessible to non-technical users.'
        },
        {
          level: 4,
          type: 'multiple_choice',
          question: 'How does SoulFra integrate Git with CRM systems?',
          options: ['No integration', 'Manual export', 'Automated webhooks and tracking', 'Email notifications only'],
          correctAnswer: 'Automated webhooks and tracking',
          explanation: 'SoulFra automatically syncs Git activity with CRM systems for project tracking.'
        },
        {
          level: 5,
          type: 'voice',
          question: 'Say the command to push code and create a pull request',
          correctAnswer: 'soulfra push code',
          acceptableAnswers: ['push code', 'push changes', 'push and create pull request'],
          explanation: 'SoulFra can automatically create pull requests with AI-generated descriptions when pushing.'
        }
      ]
    };
  }
  
  initializeLearningPaths() {
    return {
      beginner: ['oauth_mastery', 'voice_fluency'],
      intermediate: ['security_awareness', 'system_integration', 'git_mastery'],
      advanced: ['automation_skills']
    };
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoulFraLearningEngine;
}