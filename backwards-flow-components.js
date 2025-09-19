/**
 * BACKWARDS FLOW COMPONENTS
 * Document Generator Lifestyle Platform
 * 
 * Implementation components for the 5-step backwards documentation flow
 * Working backwards from Todo/Planning (Step 5) to Credit-Only Economy (Step 1)
 */

const crypto = require('crypto');
// TodoWrite service is integrated inline for demo purposes

class BackwardsFlowComponents {
  constructor(config = {}) {
    this.config = {
      creditLimit: config.creditLimit || 10000,
      leakThreshold: config.leakThreshold || 0.1, // 10% remaining triggers leak
      chargebackWindow: config.chargebackWindow || 0, // No chargebacks allowed
      ...config
    };
    
    // Initialize all 5 steps in reverse order
    this.steps = this.initializeSteps();
    
    console.log('🔄 Backwards Flow Components initialized');
    console.log('📋 Working backwards from Step 5 to Step 1');
  }
  
  initializeSteps() {
    return {
      // Step 5: Todo/Planning Integration (END STATE)
      5: {
        name: 'Todo/Planning Integration',
        components: {
          TodoWrite: this.createTodoWriteComponent(),
          AchievementTracker: this.createAchievementTracker(),
          CreditMonitor: this.createCreditMonitor(),
          BudgetAllocator: this.createBudgetAllocator()
        },
        validate: () => this.validateStep5()
      },
      
      // Step 4: Anti-Chargeback Protection
      4: {
        name: 'Anti-Chargeback Protection',
        components: {
          SignatureVerifier: this.createSignatureVerifier(),
          DisputeHandler: this.createDisputeHandler(),
          AuditTrail: this.createAuditTrail(),
          LegalBinding: this.createLegalBinding()
        },
        validate: () => this.validateStep4()
      },
      
      // Step 3: Controlled Leak Mechanism
      3: {
        name: 'Controlled Leak Mechanism',
        components: {
          LeakDetector: this.createLeakDetector(),
          CapacityMonitor: this.createCapacityMonitor(),
          AlertSystem: this.createAlertSystem(),
          FeatureDegrader: this.createFeatureDegrader()
        },
        validate: () => this.validateStep3()
      },
      
      // Step 2: Document Signing Integration
      2: {
        name: 'Document Signing Integration',
        components: {
          DocuSignWrapper: this.createDocuSignWrapper(),
          ContractStorage: this.createContractStorage(),
          SignatureVerification: this.createSignatureVerification(),
          TermsEngine: this.createTermsEngine()
        },
        validate: () => this.validateStep2()
      },
      
      // Step 1: Credit-Only Economy (START STATE)
      1: {
        name: 'Credit-Only Economy',
        components: {
          CreditVault: this.createCreditVault(),
          BalanceEnforcer: this.createBalanceEnforcer(),
          TransactionLock: this.createTransactionLock(),
          PrepaidManager: this.createPrepaidManager()
        },
        validate: () => this.validateStep1()
      }
    };
  }
  
  // ========== STEP 5: TODO/PLANNING INTEGRATION ==========
  
  createTodoWriteComponent() {
    return {
      name: 'TodoWrite',
      description: 'Tracks all credit usage plans and achievements',
      
      async trackCreditUsage(userId, action, creditCost) {
        const todo = {
          id: crypto.randomUUID(),
          userId,
          action,
          creditCost,
          status: 'pending',
          createdAt: new Date()
        };
        
        // Check if user has enough credits (requires Step 1)
        const hasCredits = await this.steps[1].components.CreditVault.checkBalance(userId, creditCost);
        if (!hasCredits) {
          todo.status = 'blocked_insufficient_credits';
          
          // Trigger leak mechanism (Step 3)
          await this.steps[3].components.LeakDetector.detectLowBalance(userId);
        }
        
        return todo;
      },
      
      async completeTodo(todoId, userId) {
        // Record achievement
        await this.steps[5].components.AchievementTracker.recordAchievement(userId, 'task_completed');
        
        // Update audit trail (Step 4)
        await this.steps[4].components.AuditTrail.log({
          action: 'todo_completed',
          todoId,
          userId,
          timestamp: new Date()
        });
      }
    };
  }
  
  createAchievementTracker() {
    return {
      name: 'AchievementTracker',
      description: 'Tracks user achievements for efficient credit use',
      achievements: new Map(),
      
      async recordAchievement(userId, achievementType) {
        const achievement = {
          id: crypto.randomUUID(),
          userId,
          type: achievementType,
          timestamp: new Date(),
          creditBonus: this.calculateCreditBonus(achievementType)
        };
        
        this.achievements.set(achievement.id, achievement);
        
        // Award bonus credits if applicable
        if (achievement.creditBonus > 0) {
          await this.steps[1].components.CreditVault.addBonusCredits(userId, achievement.creditBonus);
        }
        
        return achievement;
      },
      
      calculateCreditBonus(achievementType) {
        const bonuses = {
          'efficient_spender': 100,
          'task_completed': 10,
          'no_disputes': 500,
          'signed_all_terms': 50
        };
        
        return bonuses[achievementType] || 0;
      }
    };
  }
  
  createCreditMonitor() {
    return {
      name: 'CreditMonitor',
      description: 'Real-time monitoring of credit usage and balance',
      
      async monitorUsage(userId) {
        // Get current balance from Step 1
        const balance = await this.steps[1].components.CreditVault.getBalance(userId);
        
        // Check if approaching leak threshold (Step 3)
        const percentRemaining = balance / this.config.creditLimit;
        if (percentRemaining <= this.config.leakThreshold) {
          await this.steps[3].components.AlertSystem.sendLowBalanceAlert(userId, percentRemaining);
        }
        
        return {
          userId,
          balance,
          percentRemaining,
          isLeaking: percentRemaining <= this.config.leakThreshold
        };
      }
    };
  }
  
  createBudgetAllocator() {
    return {
      name: 'BudgetAllocator',
      description: 'Allocates credits to different features/tasks',
      allocations: new Map(),
      
      async allocateBudget(userId, allocations) {
        const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);
        const balance = await this.steps[1].components.CreditVault.getBalance(userId);
        
        if (totalAllocated > balance) {
          throw new Error('Cannot allocate more than available balance');
        }
        
        // Store allocation
        this.allocations.set(userId, {
          allocations,
          totalAllocated,
          remainingBalance: balance - totalAllocated,
          timestamp: new Date()
        });
        
        // Create signed agreement for allocation (Step 2)
        await this.steps[2].components.DocuSignWrapper.createAllocationAgreement(userId, allocations);
        
        return this.allocations.get(userId);
      }
    };
  }
  
  // ========== STEP 4: ANTI-CHARGEBACK PROTECTION ==========
  
  createSignatureVerifier() {
    return {
      name: 'SignatureVerifier',
      description: 'Verifies all transaction signatures',
      
      async verifySignature(transactionId, signature) {
        // Get stored signature from Step 2
        const storedSignature = await this.steps[2].components.SignatureVerification.getSignature(transactionId);
        
        if (!storedSignature) {
          throw new Error('No signature found for transaction');
        }
        
        const isValid = crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(storedSignature)
        );
        
        if (!isValid) {
          // Log failed verification attempt
          await this.steps[4].components.AuditTrail.log({
            action: 'signature_verification_failed',
            transactionId,
            timestamp: new Date()
          });
        }
        
        return isValid;
      }
    };
  }
  
  createDisputeHandler() {
    return {
      name: 'DisputeHandler',
      description: 'Handles disputes (always favors platform)',
      
      async handleDispute(userId, transactionId, reason) {
        // Verify signature exists (no signature = no service)
        const hasSignature = await this.steps[4].components.SignatureVerifier.verifySignature(
          transactionId,
          await this.steps[2].components.SignatureVerification.getSignature(transactionId)
        );
        
        if (!hasSignature) {
          return {
            status: 'rejected',
            reason: 'No valid signature found',
            resolution: 'Transaction stands - no signature, no dispute'
          };
        }
        
        // Check if within chargeback window (always 0 for AMEX-style)
        const dispute = {
          id: crypto.randomUUID(),
          userId,
          transactionId,
          reason,
          status: 'rejected',
          resolution: 'All transactions are final per signed terms',
          timestamp: new Date()
        };
        
        // Log dispute attempt
        await this.steps[4].components.AuditTrail.log({
          action: 'dispute_rejected',
          disputeId: dispute.id,
          userId,
          transactionId
        });
        
        // Trigger alert for dispute attempt (Step 3)
        await this.steps[3].components.AlertSystem.sendDisputeAttemptAlert(userId);
        
        return dispute;
      }
    };
  }
  
  createAuditTrail() {
    return {
      name: 'AuditTrail',
      description: 'Immutable audit log of all actions',
      logs: [],
      
      async log(entry) {
        const logEntry = {
          id: crypto.randomUUID(),
          ...entry,
          hash: this.generateHash(entry),
          previousHash: this.logs.length > 0 ? this.logs[this.logs.length - 1].hash : null
        };
        
        this.logs.push(logEntry);
        
        // Store critical logs in contract storage (Step 2)
        if (this.isCriticalAction(entry.action)) {
          await this.steps[2].components.ContractStorage.storeAuditLog(logEntry);
        }
        
        return logEntry;
      },
      
      generateHash(entry) {
        return crypto.createHash('sha256')
          .update(JSON.stringify(entry))
          .digest('hex');
      },
      
      isCriticalAction(action) {
        const criticalActions = [
          'credit_purchase',
          'signature_verification_failed',
          'dispute_rejected',
          'terms_accepted'
        ];
        
        return criticalActions.includes(action);
      }
    };
  }
  
  createLegalBinding() {
    return {
      name: 'LegalBinding',
      description: 'Creates legally binding agreements',
      
      async createBinding(userId, transactionId, terms) {
        // Get user signature from Step 2
        const signature = await this.steps[2].components.DocuSignWrapper.getUserSignature(userId);
        
        if (!signature) {
          throw new Error('User must sign terms before transactions');
        }
        
        const binding = {
          id: crypto.randomUUID(),
          userId,
          transactionId,
          terms,
          signature,
          legalStatus: 'binding',
          enforceable: true,
          jurisdiction: 'Delaware, USA',
          timestamp: new Date()
        };
        
        // Store in contract system (Step 2)
        await this.steps[2].components.ContractStorage.storeBinding(binding);
        
        return binding;
      }
    };
  }
  
  // ========== STEP 3: CONTROLLED LEAK MECHANISM ==========
  
  createLeakDetector() {
    return {
      name: 'LeakDetector',
      description: 'Detects when users approach credit limits',
      leakStates: new Map(),
      
      async detectLowBalance(userId) {
        const balance = await this.steps[1].components.CreditVault.getBalance(userId);
        const percentRemaining = balance / this.config.creditLimit;
        
        if (percentRemaining <= this.config.leakThreshold) {
          const leakState = {
            userId,
            balance,
            percentRemaining,
            leakLevel: this.calculateLeakLevel(percentRemaining),
            detectedAt: new Date()
          };
          
          this.leakStates.set(userId, leakState);
          
          // Trigger feature degradation
          await this.steps[3].components.FeatureDegrader.degradeFeatures(userId, leakState.leakLevel);
          
          return leakState;
        }
        
        return null;
      },
      
      calculateLeakLevel(percentRemaining) {
        if (percentRemaining <= 0.01) return 'critical';
        if (percentRemaining <= 0.05) return 'severe';
        if (percentRemaining <= 0.1) return 'moderate';
        return 'low';
      }
    };
  }
  
  createCapacityMonitor() {
    return {
      name: 'CapacityMonitor',
      description: 'Monitors system capacity like burning stove analogy',
      capacityStates: new Map(),
      
      async checkCapacity(userId) {
        const balance = await this.steps[1].components.CreditVault.getBalance(userId);
        const usage = this.config.creditLimit - balance;
        const capacityPercent = (usage / this.config.creditLimit) * 100;
        
        const state = {
          userId,
          capacityPercent,
          status: this.getCapacityStatus(capacityPercent),
          warnings: this.getCapacityWarnings(capacityPercent),
          timestamp: new Date()
        };
        
        this.capacityStates.set(userId, state);
        
        // Send alerts based on capacity
        if (capacityPercent >= 70) {
          await this.steps[3].components.AlertSystem.sendCapacityWarning(userId, capacityPercent);
        }
        
        return state;
      },
      
      getCapacityStatus(percent) {
        if (percent >= 90) return 'burning';
        if (percent >= 80) return 'hot';
        if (percent >= 70) return 'warming';
        return 'cool';
      },
      
      getCapacityWarnings(percent) {
        const warnings = [];
        if (percent >= 90) warnings.push('🔥 SYSTEM BURNING - Immediate action required');
        if (percent >= 80) warnings.push('🌡️ System running hot - Consider reducing usage');
        if (percent >= 70) warnings.push('⚠️ Approaching capacity limits');
        return warnings;
      }
    };
  }
  
  createAlertSystem() {
    return {
      name: 'AlertSystem',
      description: 'Multi-channel alert system',
      alerts: [],
      
      async sendLowBalanceAlert(userId, percentRemaining) {
        const alert = {
          id: crypto.randomUUID(),
          userId,
          type: 'low_balance',
          severity: percentRemaining <= 0.05 ? 'critical' : 'warning',
          message: `Credit balance at ${(percentRemaining * 100).toFixed(1)}% - Features degrading`,
          channels: ['email', 'in_app', 'sms'],
          timestamp: new Date()
        };
        
        this.alerts.push(alert);
        
        // Log alert in audit trail (Step 4)
        await this.steps[4].components.AuditTrail.log({
          action: 'alert_sent',
          alertId: alert.id,
          type: alert.type,
          userId
        });
        
        return alert;
      },
      
      async sendCapacityWarning(userId, capacityPercent) {
        const alert = {
          id: crypto.randomUUID(),
          userId,
          type: 'capacity_warning',
          severity: capacityPercent >= 90 ? 'critical' : 'warning',
          message: `System capacity at ${capacityPercent.toFixed(1)}%`,
          visualWarning: capacityPercent >= 90 ? '🔥🔥🔥' : '⚠️',
          timestamp: new Date()
        };
        
        this.alerts.push(alert);
        return alert;
      },
      
      async sendDisputeAttemptAlert(userId) {
        const alert = {
          id: crypto.randomUUID(),
          userId,
          type: 'dispute_attempt',
          severity: 'info',
          message: 'Dispute attempt recorded - All transactions are final',
          timestamp: new Date()
        };
        
        this.alerts.push(alert);
        return alert;
      }
    };
  }
  
  createFeatureDegrader() {
    return {
      name: 'FeatureDegrader',
      description: 'Gradually degrades features as credits run low',
      degradationStates: new Map(),
      
      async degradeFeatures(userId, leakLevel) {
        const degradations = {
          low: {
            disabled: [],
            limited: ['advanced_features'],
            warnings: ['Consider reloading credits']
          },
          moderate: {
            disabled: ['advanced_features'],
            limited: ['ai_features', 'bulk_operations'],
            warnings: ['Service degradation in effect', 'Reload credits to restore features']
          },
          severe: {
            disabled: ['advanced_features', 'ai_features', 'bulk_operations'],
            limited: ['basic_operations'],
            warnings: ['Severe limitations active', 'Only basic features available']
          },
          critical: {
            disabled: ['all_features'],
            limited: [],
            warnings: ['Account frozen', 'Reload credits immediately']
          }
        };
        
        const state = degradations[leakLevel];
        this.degradationStates.set(userId, {
          ...state,
          leakLevel,
          appliedAt: new Date()
        });
        
        // Lock transactions if critical (Step 1)
        if (leakLevel === 'critical') {
          await this.steps[1].components.TransactionLock.lockUser(userId);
        }
        
        return state;
      }
    };
  }
  
  // ========== STEP 2: DOCUMENT SIGNING INTEGRATION ==========
  
  createDocuSignWrapper() {
    return {
      name: 'DocuSignWrapper',
      description: 'Wraps all transactions with digital signatures',
      signatures: new Map(),
      
      async getUserSignature(userId) {
        return this.signatures.get(userId);
      },
      
      async signTerms(userId, terms) {
        const signature = {
          id: crypto.randomUUID(),
          userId,
          terms,
          signatureData: this.generateSignature(userId, terms),
          timestamp: new Date(),
          ipAddress: '127.0.0.1', // Would be real IP in production
          deviceId: 'test-device' // Would be real device ID
        };
        
        this.signatures.set(userId, signature);
        
        // Store in contract storage
        await this.steps[2].components.ContractStorage.storeSignature(signature);
        
        // Log signing event (Step 4)
        await this.steps[4].components.AuditTrail.log({
          action: 'terms_signed',
          userId,
          signatureId: signature.id
        });
        
        return signature;
      },
      
      async createAllocationAgreement(userId, allocations) {
        const agreement = {
          id: crypto.randomUUID(),
          userId,
          type: 'budget_allocation',
          allocations,
          terms: this.generateAllocationTerms(allocations),
          requiresSignature: true,
          timestamp: new Date()
        };
        
        // Store agreement
        await this.steps[2].components.ContractStorage.storeAgreement(agreement);
        
        return agreement;
      },
      
      generateSignature(userId, terms) {
        return crypto.createHash('sha256')
          .update(`${userId}:${JSON.stringify(terms)}:${Date.now()}`)
          .digest('hex');
      },
      
      generateAllocationTerms(allocations) {
        return {
          title: 'Credit Allocation Agreement',
          body: 'User agrees to allocate credits as specified. All allocations are final.',
          allocations,
          legalText: 'By signing, you acknowledge that all credit allocations are non-refundable.'
        };
      }
    };
  }
  
  createContractStorage() {
    return {
      name: 'ContractStorage',
      description: 'Immutable contract storage system',
      contracts: new Map(),
      signatures: new Map(),
      agreements: new Map(),
      bindings: new Map(),
      auditLogs: new Map(),
      
      async storeSignature(signature) {
        this.signatures.set(signature.id, {
          ...signature,
          storedAt: new Date(),
          immutable: true
        });
      },
      
      async storeAgreement(agreement) {
        this.agreements.set(agreement.id, {
          ...agreement,
          storedAt: new Date(),
          immutable: true
        });
      },
      
      async storeBinding(binding) {
        this.bindings.set(binding.id, {
          ...binding,
          storedAt: new Date(),
          immutable: true
        });
      },
      
      async storeAuditLog(logEntry) {
        this.auditLogs.set(logEntry.id, {
          ...logEntry,
          storedAt: new Date(),
          immutable: true
        });
      },
      
      async retrieveContract(contractId) {
        return this.contracts.get(contractId) ||
               this.agreements.get(contractId) ||
               this.bindings.get(contractId);
      }
    };
  }
  
  createSignatureVerification() {
    return {
      name: 'SignatureVerification',
      description: 'Verifies digital signatures',
      
      async getSignature(transactionId) {
        // Retrieve from contract storage
        const contracts = this.steps[2].components.ContractStorage;
        
        // Search through all storage types
        for (const [id, contract] of contracts.bindings) {
          if (contract.transactionId === transactionId) {
            return contract.signature;
          }
        }
        
        return null;
      },
      
      async verifyUserHasSigned(userId) {
        const signature = await this.steps[2].components.DocuSignWrapper.getUserSignature(userId);
        return !!signature;
      }
    };
  }
  
  createTermsEngine() {
    return {
      name: 'TermsEngine',
      description: 'Generates and enforces terms',
      
      generateTerms(userId, transactionType) {
        return {
          version: '1.0.0',
          userId,
          transactionType,
          terms: [
            'All transactions are final',
            'No refunds or chargebacks allowed',
            'Credits expire after 365 days',
            'Platform reserves right to modify features',
            'Disputes resolved in Delaware courts'
          ],
          acceptanceRequired: true,
          timestamp: new Date()
        };
      },
      
      async enforceTerms(userId, action) {
        // Check if user has signed terms
        const hasSigned = await this.steps[2].components.SignatureVerification.verifyUserHasSigned(userId);
        
        if (!hasSigned) {
          throw new Error('User must accept terms before performing actions');
        }
        
        // Check if action violates terms
        if (action === 'chargeback' || action === 'refund') {
          throw new Error('Action violates signed terms - all transactions are final');
        }
        
        return true;
      }
    };
  }
  
  // ========== STEP 1: CREDIT-ONLY ECONOMY ==========
  
  createCreditVault() {
    return {
      name: 'CreditVault',
      description: 'Secure storage for user credits',
      balances: new Map(),
      
      async getBalance(userId) {
        return this.balances.get(userId) || 0;
      },
      
      async checkBalance(userId, amount) {
        const balance = await this.getBalance(userId);
        return balance >= amount;
      },
      
      async addCredits(userId, amount) {
        const currentBalance = await this.getBalance(userId);
        const newBalance = currentBalance + amount;
        
        this.balances.set(userId, newBalance);
        
        // Log credit addition (Step 4)
        await this.steps[4].components.AuditTrail.log({
          action: 'credits_added',
          userId,
          amount,
          newBalance,
          timestamp: new Date()
        });
        
        return newBalance;
      },
      
      async deductCredits(userId, amount) {
        const currentBalance = await this.getBalance(userId);
        
        if (currentBalance < amount) {
          throw new Error('Insufficient credits');
        }
        
        const newBalance = currentBalance - amount;
        this.balances.set(userId, newBalance);
        
        // Check for leak condition (Step 3)
        await this.steps[3].components.LeakDetector.detectLowBalance(userId);
        
        return newBalance;
      },
      
      async addBonusCredits(userId, amount) {
        // Bonus credits from achievements
        return this.addCredits(userId, amount);
      }
    };
  }
  
  createBalanceEnforcer() {
    return {
      name: 'BalanceEnforcer',
      description: 'Enforces strict balance rules - no debt allowed',
      
      async enforceTransaction(userId, amount) {
        const vault = this.steps[1].components.CreditVault;
        const hasBalance = await vault.checkBalance(userId, amount);
        
        if (!hasBalance) {
          // Log failed transaction attempt (Step 4)
          await this.steps[4].components.AuditTrail.log({
            action: 'transaction_blocked_insufficient_funds',
            userId,
            attemptedAmount: amount,
            currentBalance: await vault.getBalance(userId),
            timestamp: new Date()
          });
          
          throw new Error('Transaction blocked - insufficient credits');
        }
        
        // Proceed with transaction
        return vault.deductCredits(userId, amount);
      }
    };
  }
  
  createTransactionLock() {
    return {
      name: 'TransactionLock',
      description: 'Locks accounts at zero balance',
      lockedUsers: new Set(),
      
      async lockUser(userId) {
        this.lockedUsers.add(userId);
        
        // Log lock event (Step 4)
        await this.steps[4].components.AuditTrail.log({
          action: 'account_locked',
          userId,
          reason: 'zero_balance',
          timestamp: new Date()
        });
        
        // Send critical alert (Step 3)
        await this.steps[3].components.AlertSystem.sendLowBalanceAlert(userId, 0);
        
        return true;
      },
      
      async unlockUser(userId) {
        const balance = await this.steps[1].components.CreditVault.getBalance(userId);
        
        if (balance > 0) {
          this.lockedUsers.delete(userId);
          
          // Log unlock event (Step 4)
          await this.steps[4].components.AuditTrail.log({
            action: 'account_unlocked',
            userId,
            newBalance: balance,
            timestamp: new Date()
          });
          
          return true;
        }
        
        return false;
      },
      
      async isLocked(userId) {
        return this.lockedUsers.has(userId);
      }
    };
  }
  
  createPrepaidManager() {
    return {
      name: 'PrepaidManager',
      description: 'Manages prepaid credit packages',
      packages: {
        starter: { credits: 1000, price: 10 },
        professional: { credits: 5000, price: 45 },
        enterprise: { credits: 10000, price: 80 },
        unlimited_monthly: { credits: 50000, price: 299 }
      },
      
      async purchasePackage(userId, packageType) {
        const packageInfo = this.packages[packageType];
        
        if (!packageInfo) {
          throw new Error('Invalid package type');
        }
        
        // User must sign terms first (Step 2)
        const hasSigned = await this.steps[2].components.SignatureVerification.verifyUserHasSigned(userId);
        if (!hasSigned) {
          throw new Error('Must accept terms before purchasing credits');
        }
        
        // Add credits to vault
        await this.steps[1].components.CreditVault.addCredits(userId, packageInfo.credits);
        
        // Create binding agreement (Step 4)
        await this.steps[4].components.LegalBinding.createBinding(
          userId,
          crypto.randomUUID(),
          {
            type: 'credit_purchase',
            package: packageType,
            credits: packageInfo.credits,
            price: packageInfo.price,
            nonRefundable: true
          }
        );
        
        // Unlock account if it was locked
        await this.steps[1].components.TransactionLock.unlockUser(userId);
        
        return {
          success: true,
          package: packageType,
          creditsAdded: packageInfo.credits,
          newBalance: await this.steps[1].components.CreditVault.getBalance(userId)
        };
      }
    };
  }
  
  // ========== VALIDATION METHODS ==========
  
  async validateStep5() {
    // Step 5 requires all previous steps
    const step4Valid = await this.validateStep4();
    
    return step4Valid && 
           this.steps[5].components.TodoWrite &&
           this.steps[5].components.AchievementTracker &&
           this.steps[5].components.CreditMonitor &&
           this.steps[5].components.BudgetAllocator;
  }
  
  async validateStep4() {
    // Step 4 requires Step 3 and below
    const step3Valid = await this.validateStep3();
    
    return step3Valid &&
           this.steps[4].components.SignatureVerifier &&
           this.steps[4].components.DisputeHandler &&
           this.steps[4].components.AuditTrail &&
           this.steps[4].components.LegalBinding;
  }
  
  async validateStep3() {
    // Step 3 requires Step 2 and Step 1
    const step2Valid = await this.validateStep2();
    
    return step2Valid &&
           this.steps[3].components.LeakDetector &&
           this.steps[3].components.CapacityMonitor &&
           this.steps[3].components.AlertSystem &&
           this.steps[3].components.FeatureDegrader;
  }
  
  async validateStep2() {
    // Step 2 requires Step 1
    const step1Valid = await this.validateStep1();
    
    return step1Valid &&
           this.steps[2].components.DocuSignWrapper &&
           this.steps[2].components.ContractStorage &&
           this.steps[2].components.SignatureVerification &&
           this.steps[2].components.TermsEngine;
  }
  
  async validateStep1() {
    // Step 1 is the foundation - always valid if components exist
    return this.steps[1].components.CreditVault &&
           this.steps[1].components.BalanceEnforcer &&
           this.steps[1].components.TransactionLock &&
           this.steps[1].components.PrepaidManager;
  }
  
  // ========== EXECUTION FLOW ==========
  
  async executeBackwardsFlow() {
    console.log('🔄 Executing backwards flow validation...\n');
    
    // Validate from Step 5 backwards to Step 1
    for (let step = 5; step >= 1; step--) {
      const isValid = await this.steps[step].validate();
      console.log(`Step ${step} (${this.steps[step].name}): ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      
      if (!isValid) {
        console.log(`⚠️ Flow broken at Step ${step} - requires previous steps`);
        return false;
      }
    }
    
    console.log('\n✅ All steps validated successfully!');
    console.log('🚀 System ready for credit-only economy with full protection');
    
    return true;
  }
  
  // ========== DEMO FLOW ==========
  
  async runDemoFlow(userId = 'demo-user') {
    console.log('\n🎮 Running Leak Mechanism Test...\n');
    
    try {
      // 1. Initialize user with credits
      console.log('1️⃣ Initializing user with 1000 credits...');
      await this.steps[1].components.CreditVault.addCredits(userId, 1000);
      console.log(`   Initial balance: 1000 credits`);
      
      // 2. Test controlled spending to trigger leak
      console.log('\n2️⃣ Testing spending pattern to trigger leak mechanism...');
      
      for (let i = 1; i <= 10; i++) {
        const amount = 100;
        
        // Check balance before transaction
        const balanceBefore = await this.steps[1].components.CreditVault.getBalance(userId);
        
        if (balanceBefore >= amount) {
          // Make transaction
          await this.steps[1].components.BalanceEnforcer.enforceTransaction(userId, amount);
          
          // Monitor usage and check for leak
          const monitor = await this.steps[5].components.CreditMonitor.monitorUsage(userId);
          console.log(`   Transaction ${i}: Balance: ${monitor.balance}, Remaining: ${(monitor.percentRemaining * 100).toFixed(1)}%`);
          
          // Check if leak triggered
          if (monitor.isLeaking) {
            console.log('   🚨 LEAK DETECTED - System triggering protection mechanisms!');
            
            // Get degradation state
            const degradation = this.steps[3].components.FeatureDegrader.degradationStates.get(userId);
            if (degradation) {
              console.log(`   🔧 Feature degradation applied: ${degradation.leakLevel}`);
              console.log(`   📋 Disabled features: ${degradation.disabled.join(', ')}`);
              console.log(`   ⚠️  Warnings: ${degradation.warnings.join(', ')}`);
            }
            break;
          }
        } else {
          console.log(`   ❌ Transaction ${i} blocked - insufficient credits`);
          break;
        }
      }
      
      // 3. Test dispute handling (should fail due to anti-chargeback)
      console.log('\n3️⃣ Testing anti-chargeback protection...');
      const testTransactionId = crypto.randomUUID();
      
      // First store a signature for the transaction
      const mockSignature = crypto.createHash('sha256').update(testTransactionId).digest('hex');
      await this.steps[2].components.ContractStorage.signatures.set(testTransactionId, {
        id: testTransactionId,
        userId,
        signatureData: mockSignature,
        storedAt: new Date()
      });
      
      // Now attempt dispute
      const dispute = await this.steps[4].components.DisputeHandler.handleDispute(
        userId,
        testTransactionId,
        'I want a refund - this leak system is unfair!'
      );
      
      console.log(`   📋 Dispute Result: ${dispute.status}`);
      console.log(`   📋 Resolution: ${dispute.resolution}`);
      
      console.log('\n✅ Leak Mechanism and Anti-Chargeback Protection Test Completed!');
      console.log('🔒 System successfully prevented chargebacks while managing credit limits');
      
    } catch (error) {
      console.error('❌ Demo flow error:', error.message);
    }
  }
}

// Export the class
module.exports = BackwardsFlowComponents;

// Run if called directly
if (require.main === module) {
  const system = new BackwardsFlowComponents();
  
  // Execute validation
  system.executeBackwardsFlow().then(async (valid) => {
    if (valid) {
      // Run demo
      await system.runDemoFlow();
    }
  });
}