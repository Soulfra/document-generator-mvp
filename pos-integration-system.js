/**
 * POS Integration System - Physical transaction endpoints for QR code purchases
 * Completes the research → visual → QR → purchase pipeline
 * Integrates with Universal Slug Router, Character Engine, and QR Bridge System
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class POSIntegrationSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // POS configuration
    this.config = {
      // Terminal compatibility
      terminals: {
        types: ['countertop', 'mobile', 'kiosk', 'tablet', 'desktop'],
        displaySizes: {
          countertop: { width: 40, height: 8 },    // Character display
          mobile: { width: 320, height: 480 },      // Pixel display
          kiosk: { width: 1024, height: 768 },      // Touch display
          tablet: { width: 768, height: 1024 },     // Touch display
          desktop: { width: 1920, height: 1080 }    // Full display
        },
        characterSupport: {
          ascii: true,                               // Basic ASCII characters
          unicode: false,                            // Limited Unicode on older terminals
          emoji: false,                              // No emoji support on most POS
          maxLineLength: 40,                         // Max characters per line
          maxLines: 8                                // Max lines on display
        }
      },
      
      // Payment processing
      payments: {
        methods: ['card', 'cash', 'mobile', 'crypto', 'loyalty'],
        processors: ['stripe', 'square', 'paypal', 'crypto_gateway'],
        currencies: ['USD', 'EUR', 'GBP', 'CAD', 'BTC', 'ETH'],
        taxCalculation: true,
        tipSupport: true,
        loyaltyPrograms: true,
        subscriptionSupport: true
      },
      
      // Product catalog
      products: {
        categories: {
          research: {
            name: 'Research Access',
            basePrice: 15.99,
            tax: 0.08,
            description: 'Digital research paper access'
          },
          visual: {
            name: 'Visual Content',
            basePrice: 9.99,
            tax: 0.08,
            description: 'Pixel art and visual content'
          },
          character: {
            name: 'Character Merchandise',
            basePrice: 24.99,
            tax: 0.10,
            description: 'Character-themed physical items'
          },
          gaming: {
            name: 'Game Content',
            basePrice: 19.99,
            tax: 0.08,
            description: 'Tycoon game premium features'
          },
          subscription: {
            name: 'Premium Access',
            basePrice: 49.99,
            tax: 0.08,
            description: 'Monthly premium access to all content'
          }
        },
        bundling: true,
        discountSupport: true,
        dynamicPricing: true
      },
      
      // Receipt and printing
      receipts: {
        formats: ['thermal', 'inkjet', 'email', 'sms', 'digital'],
        qrCodeOnReceipt: true,
        characterOnReceipt: true,
        brandingEnabled: true,
        customFooter: true,
        environmentalMode: true        // Digital-first receipts
      },
      
      // Integration features
      integration: {
        inventoryTracking: true,
        analyticsEnabled: true,
        loyaltyIntegration: true,
        characterSyncEnabled: true,    // Sync character purchases
        researchTrackingEnabled: true, // Track research purchases
        crossDomainPurchases: true     // Enable cross-domain buying
      }
    };
    
    // POS state
    this.state = {
      // Active transactions
      transactions: new Map(),           // transaction_id -> transaction_data
      activeTerminals: new Map(),        // terminal_id -> terminal_state
      sessionCarts: new Map(),           // session_id -> cart_data
      
      // Product catalog
      productCatalog: new Map(),         // product_id -> product_data
      pricingRules: new Map(),           // rule_id -> pricing_rule
      discountCodes: new Map(),          // code -> discount_data
      
      // Character purchases
      characterPurchases: new Map(),     // character_id -> purchase_history[]
      characterInventory: new Map(),     // character_id -> inventory_items[]
      
      // Analytics
      salesAnalytics: new Map(),         // date -> sales_data
      productAnalytics: new Map(),       // product_id -> analytics_data
      terminalAnalytics: new Map(),      // terminal_id -> usage_data
      
      // Receipt tracking
      receiptHistory: new Map(),         // receipt_id -> receipt_data
      digitalReceipts: new Map()         // email/phone -> receipt_ids[]
    };
    
    // POS engines
    this.engines = {
      // Payment processing
      paymentEngine: this.createPaymentEngine(),
      
      // Product management
      productEngine: this.createProductEngine(),
      
      // Receipt generation
      receiptEngine: this.createReceiptEngine(),
      
      // Terminal management
      terminalEngine: this.createTerminalEngine(),
      
      // Analytics engine
      analyticsEngine: this.createAnalyticsEngine()
    };
    
    // External integrations
    this.integrations = {
      slugRouter: null,                  // Universal Slug Router
      characterEngine: null,             // Character Engine
      qrBridge: null,                    // QR Bridge System
      deepLinkingBridge: null            // Deep Linking Bridge
    };
    
    console.log('💳 POS Integration System initializing...');
  }
  
  /**
   * Initialize POS system and connect to other systems
   */
  async initialize() {
    try {
      console.log('🚀 Starting POS Integration System...');
      
      // Connect to integrated systems
      await this.connectToIntegratedSystems();
      
      // Initialize payment processing
      await this.engines.paymentEngine.initialize();
      
      // Setup product catalog
      await this.initializeProductCatalog();
      
      // Configure terminals
      await this.engines.terminalEngine.initialize();
      
      // Setup receipt system
      await this.engines.receiptEngine.initialize();
      
      // Initialize analytics
      await this.engines.analyticsEngine.initialize();
      
      // Start POS server
      await this.startPOSServer();
      
      console.log('✅ POS Integration System ready');
      this.emit('pos_system_ready');
      
      return true;
      
    } catch (error) {
      console.error('❌ POS system initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Process QR code scan at POS terminal
   */
  async processQRScan(qrId, terminalId, options = {}) {
    const scanStart = Date.now();
    
    try {
      console.log(`💳 Processing QR scan at terminal ${terminalId}: ${qrId}`);
      
      // Get QR data from bridge system
      const qrData = await this.getQRData(qrId);
      if (!qrData) {
        throw new Error(`QR code not found: ${qrId}`);
      }
      
      // Get terminal configuration
      const terminal = this.state.activeTerminals.get(terminalId);
      if (!terminal) {
        throw new Error(`Terminal not found: ${terminalId}`);
      }
      
      // Convert QR content to purchasable products
      const products = await this.convertQRToProducts(qrData, terminal);
      
      // Create transaction
      const transaction = await this.createTransaction(products, terminal, {
        qrId: qrId,
        qrData: qrData,
        scanTimestamp: Date.now(),
        ...options
      });
      
      // Display transaction on terminal
      await this.displayTransactionOnTerminal(transaction, terminal);
      
      const processingTime = Date.now() - scanStart;
      
      console.log(`✅ QR scan processed in ${processingTime}ms: ${transaction.id}`);
      
      this.emit('qr_scan_processed', {
        qrId,
        terminalId,
        transaction,
        processingTime
      });
      
      return transaction;
      
    } catch (error) {
      const processingTime = Date.now() - scanStart;
      console.error(`❌ QR scan processing failed after ${processingTime}ms:`, error.message);
      
      this.emit('qr_scan_failed', {
        qrId,
        terminalId,
        error: error.message,
        processingTime
      });
      
      throw error;
    }
  }
  
  /**
   * Process payment for transaction
   */
  async processPayment(transactionId, paymentData, options = {}) {
    const paymentStart = Date.now();
    
    try {
      console.log(`💰 Processing payment for transaction: ${transactionId}`);
      
      // Get transaction data
      const transaction = this.state.transactions.get(transactionId);
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }
      
      // Validate payment data
      const validatedPayment = await this.engines.paymentEngine.validatePayment(paymentData);
      
      // Calculate final amount (including tax, tips, discounts)
      const finalAmount = await this.calculateFinalAmount(transaction, paymentData);
      
      // Process payment through appropriate processor
      const paymentResult = await this.engines.paymentEngine.processPayment(
        validatedPayment,
        finalAmount,
        transaction
      );
      
      // Update transaction
      transaction.payment = {
        ...paymentResult,
        method: paymentData.method,
        amount: finalAmount,
        processedAt: Date.now(),
        status: paymentResult.success ? 'completed' : 'failed'
      };
      
      transaction.status = paymentResult.success ? 'completed' : 'failed';
      transaction.completedAt = Date.now();
      
      // Generate receipt
      const receipt = await this.engines.receiptEngine.generateReceipt(transaction);
      transaction.receipt = receipt;
      
      // Handle character purchases if applicable
      if (transaction.metadata.qrData?.content?.type === 'character') {
        await this.processCharacterPurchase(transaction);
      }
      
      // Update analytics
      await this.engines.analyticsEngine.recordSale(transaction);
      
      // Send digital receipt if requested
      if (paymentData.emailReceipt || paymentData.smsReceipt) {
        await this.sendDigitalReceipt(transaction, paymentData);
      }
      
      const processingTime = Date.now() - paymentStart;
      
      console.log(`✅ Payment processed in ${processingTime}ms: ${paymentResult.success ? 'SUCCESS' : 'FAILED'}`);
      
      this.emit('payment_processed', {
        transactionId,
        paymentResult,
        transaction,
        processingTime
      });
      
      return {
        success: paymentResult.success,
        transaction,
        receipt,
        processingTime
      };
      
    } catch (error) {
      const processingTime = Date.now() - paymentStart;
      console.error(`❌ Payment processing failed after ${processingTime}ms:`, error.message);
      
      this.emit('payment_failed', {
        transactionId,
        error: error.message,
        processingTime
      });
      
      throw error;
    }
  }
  
  /**
   * Create payment processing engine
   */
  createPaymentEngine() {
    return {
      initialize: async () => {
        console.log('💰 Payment engine initialized');
      },
      
      validatePayment: async (paymentData) => {
        // Validate payment method and data
        const validation = {
          method: paymentData.method,
          valid: true,
          errors: []
        };
        
        switch (paymentData.method) {
          case 'card':
            if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
              validation.valid = false;
              validation.errors.push('Missing card information');
            }
            break;
          case 'mobile':
            if (!paymentData.mobileWallet || !paymentData.token) {
              validation.valid = false;
              validation.errors.push('Missing mobile payment information');
            }
            break;
          case 'crypto':
            if (!paymentData.wallet || !paymentData.signature) {
              validation.valid = false;
              validation.errors.push('Missing crypto payment information');
            }
            break;
        }
        
        if (!validation.valid) {
          throw new Error(`Payment validation failed: ${validation.errors.join(', ')}`);
        }
        
        return paymentData;
      },
      
      processPayment: async (paymentData, amount, transaction) => {
        // Mock payment processing - in real implementation would integrate with actual processors
        const paymentResult = {
          transactionId: crypto.randomUUID(),
          amount: amount,
          currency: transaction.currency || 'USD',
          method: paymentData.method,
          
          // Mock successful payment
          success: Math.random() > 0.05, // 95% success rate
          processorResponse: this.generateMockProcessorResponse(paymentData.method),
          
          timestamp: Date.now(),
          fees: this.calculatePaymentFees(amount, paymentData.method)
        };
        
        if (!paymentResult.success) {
          paymentResult.errorCode = 'PAYMENT_DECLINED';
          paymentResult.errorMessage = 'Payment was declined by processor';
        }
        
        return paymentResult;
      },
      
      calculatePaymentFees: (amount, method) => {
        const feeRates = {
          card: 0.029,      // 2.9%
          mobile: 0.025,    // 2.5%
          crypto: 0.015,    // 1.5%
          cash: 0,          // No fees
          loyalty: 0        // No fees
        };
        
        const rate = feeRates[method] || 0.03;
        return amount * rate;
      }
    };
  }
  
  /**
   * Create product management engine
   */
  createProductEngine() {
    return {
      convertQRToProducts: async (qrData, terminal) => {
        const products = [];
        const content = qrData.content || qrData.embeddedData;
        
        // Determine product based on QR content type
        switch (content.type) {
          case 'research':
            products.push({
              id: `research_${content.id}`,
              name: content.title || 'Research Paper Access',
              category: 'research',
              price: this.config.products.categories.research.basePrice,
              description: content.abstract || 'Access to research document',
              metadata: {
                documentId: content.id,
                authors: content.authors,
                keywords: content.keywords
              }
            });
            break;
            
          case 'visual':
            products.push({
              id: `visual_${content.id}`,
              name: content.title || 'Visual Content',
              category: 'visual',
              price: this.config.products.categories.visual.basePrice,
              description: 'Pixel art and visual content access',
              metadata: {
                visualId: content.id,
                format: content.format,
                style: content.style
              }
            });
            break;
            
          case 'character':
            // Character merchandise
            products.push({
              id: `character_merch_${content.characterId}`,
              name: `${content.name} Merchandise`,
              category: 'character',
              price: this.config.products.categories.character.basePrice,
              description: `Physical merchandise for character ${content.name}`,
              metadata: {
                characterId: content.characterId,
                characterType: content.type,
                domain: content.domain
              }
            });
            
            // Digital character access
            products.push({
              id: `character_digital_${content.characterId}`,
              name: `${content.name} Digital Access`,
              category: 'gaming',
              price: this.config.products.categories.gaming.basePrice,
              description: `Digital access to character ${content.name}`,
              metadata: {
                characterId: content.characterId,
                renderingFormats: content.availableFormats
              }
            });
            break;
            
          default:
            // Generic digital content
            products.push({
              id: `generic_${content.id}`,
              name: content.title || 'Digital Content',
              category: 'research',
              price: this.config.products.categories.research.basePrice,
              description: 'Digital content access',
              metadata: content
            });
        }
        
        return products;
      },
      
      calculateBundleDiscount: (products) => {
        if (products.length < 2) return 0;
        
        // Bundle discounts
        const discountRates = {
          2: 0.10,  // 10% for 2 items
          3: 0.15,  // 15% for 3 items
          4: 0.20,  // 20% for 4+ items
        };
        
        const count = Math.min(products.length, 4);
        return discountRates[count] || 0.20;
      }
    };
  }
  
  /**
   * Create receipt generation engine
   */
  createReceiptEngine() {
    return {
      initialize: async () => {
        console.log('🧾 Receipt engine initialized');
      },
      
      generateReceipt: async (transaction) => {
        const receipt = {
          id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          transactionId: transaction.id,
          timestamp: Date.now(),
          
          // Receipt header
          header: {
            businessName: 'Document Generator Store',
            address: '123 Research Blvd, Innovation City',
            phone: '(555) 123-4567',
            website: 'docgen.com'
          },
          
          // Transaction details
          transaction: {
            id: transaction.id,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            terminalId: transaction.terminalId,
            cashierId: transaction.cashierId || 'SELF_SERVICE'
          },
          
          // Line items
          items: transaction.products.map(product => ({
            name: product.name,
            quantity: 1,
            price: product.price,
            total: product.price,
            category: product.category
          })),
          
          // Totals
          totals: {
            subtotal: transaction.subtotal,
            tax: transaction.tax,
            discount: transaction.discount || 0,
            tip: transaction.tip || 0,
            total: transaction.total
          },
          
          // Payment information
          payment: {
            method: transaction.payment?.method || 'pending',
            amount: transaction.payment?.amount || transaction.total,
            change: transaction.payment?.change || 0
          },
          
          // QR code for digital receipt
          qrCode: await this.generateReceiptQR(transaction),
          
          // Character information if applicable
          characters: this.extractCharacterInfo(transaction),
          
          // Footer
          footer: {
            thankYou: 'Thank you for supporting research and creativity!',
            returns: 'Digital content is non-refundable',
            website: 'Visit docgen.com for more content'
          }
        };
        
        // Generate different formats
        receipt.formats = {
          thermal: this.generateThermalReceipt(receipt),
          digital: this.generateDigitalReceipt(receipt),
          email: this.generateEmailReceipt(receipt)
        };
        
        return receipt;
      },
      
      generateThermalReceipt: (receipt) => {
        // 40-character wide thermal receipt format
        const lines = [];
        
        // Header
        lines.push('========================================');
        lines.push('       DOCUMENT GENERATOR STORE        ');
        lines.push('========================================');
        lines.push('');
        
        // Transaction info
        lines.push(`Date: ${receipt.transaction.date}  Time: ${receipt.transaction.time}`);
        lines.push(`Terminal: ${receipt.transaction.terminalId}`);
        lines.push(`Transaction: ${receipt.transaction.id.substring(0, 16)}`);
        lines.push('');
        
        // Items
        receipt.items.forEach(item => {
          lines.push(`${item.name.substring(0, 30).padEnd(30)} $${item.price.toFixed(2)}`);
        });
        
        lines.push('----------------------------------------');
        
        // Totals
        lines.push(`Subtotal:                    $${receipt.totals.subtotal.toFixed(2)}`);
        if (receipt.totals.discount > 0) {
          lines.push(`Discount:                   -$${receipt.totals.discount.toFixed(2)}`);
        }
        lines.push(`Tax:                         $${receipt.totals.tax.toFixed(2)}`);
        if (receipt.totals.tip > 0) {
          lines.push(`Tip:                         $${receipt.totals.tip.toFixed(2)}`);
        }
        lines.push(`TOTAL:                       $${receipt.totals.total.toFixed(2)}`);
        
        lines.push('');
        lines.push(`Payment: ${receipt.payment.method.toUpperCase()}`);
        lines.push('');
        
        // Characters if applicable
        if (receipt.characters && receipt.characters.length > 0) {
          lines.push('Characters Purchased:');
          receipt.characters.forEach(char => {
            lines.push(`  ${char.name} (${char.type})`);
          });
          lines.push('');
        }
        
        // Footer
        lines.push('Thank you for supporting research!');
        lines.push('Visit docgen.com for more content');
        lines.push('');
        lines.push('QR for digital receipt:');
        lines.push('[QR CODE PLACEHOLDER]');
        lines.push('');
        lines.push('========================================');
        
        return lines.join('\n');
      }
    };
  }
  
  /**
   * Create terminal management engine
   */
  createTerminalEngine() {
    return {
      initialize: async () => {
        console.log('🖥️ Terminal engine initialized');
        
        // Initialize default terminals
        this.initializeDefaultTerminals();
      },
      
      initializeDefaultTerminals: () => {
        const terminals = [
          {
            id: 'terminal_001',
            type: 'countertop',
            location: 'Main Counter',
            display: this.config.terminals.displaySizes.countertop,
            capabilities: ['qr_scan', 'card_payment', 'receipt_print'],
            status: 'active'
          },
          {
            id: 'terminal_002',
            type: 'tablet',
            location: 'Mobile Station',
            display: this.config.terminals.displaySizes.tablet,
            capabilities: ['qr_scan', 'touch_interface', 'mobile_payment'],
            status: 'active'
          },
          {
            id: 'kiosk_001',
            type: 'kiosk',
            location: 'Self-Service Area',
            display: this.config.terminals.displaySizes.kiosk,
            capabilities: ['qr_scan', 'touch_interface', 'self_service', 'card_payment'],
            status: 'active'
          }
        ];
        
        terminals.forEach(terminal => {
          this.state.activeTerminals.set(terminal.id, terminal);
        });
        
        console.log(`📱 Initialized ${terminals.length} terminals`);
      },
      
      displayOnTerminal: async (terminalId, content) => {
        const terminal = this.state.activeTerminals.get(terminalId);
        if (!terminal) {
          throw new Error(`Terminal not found: ${terminalId}`);
        }
        
        // Format content for terminal display
        const formattedContent = this.formatContentForTerminal(content, terminal);
        
        // In real implementation, would send to actual terminal
        console.log(`🖥️ Displaying on ${terminalId}:`, formattedContent);
        
        return formattedContent;
      }
    };
  }
  
  /**
   * Create analytics engine
   */
  createAnalyticsEngine() {
    return {
      initialize: async () => {
        console.log('📊 Analytics engine initialized');
      },
      
      recordSale: async (transaction) => {
        const saleDate = new Date().toISOString().split('T')[0];
        
        // Update daily sales
        const dailySales = this.state.salesAnalytics.get(saleDate) || {
          date: saleDate,
          totalSales: 0,
          totalRevenue: 0,
          transactions: [],
          productsSold: new Map(),
          paymentMethods: new Map()
        };
        
        dailySales.totalSales++;
        dailySales.totalRevenue += transaction.total;
        dailySales.transactions.push(transaction.id);
        
        // Track payment method
        const paymentMethod = transaction.payment?.method || 'unknown';
        dailySales.paymentMethods.set(
          paymentMethod,
          (dailySales.paymentMethods.get(paymentMethod) || 0) + 1
        );
        
        // Track products sold
        transaction.products.forEach(product => {
          dailySales.productsSold.set(
            product.category,
            (dailySales.productsSold.get(product.category) || 0) + 1
          );
        });
        
        this.state.salesAnalytics.set(saleDate, dailySales);
        
        console.log(`📊 Recorded sale: $${transaction.total} via ${paymentMethod}`);
      },
      
      getSalesReport: async (dateRange) => {
        const report = {
          period: dateRange,
          totalRevenue: 0,
          totalTransactions: 0,
          averageTransaction: 0,
          topProducts: [],
          paymentMethodBreakdown: new Map(),
          dailyBreakdown: []
        };
        
        // Aggregate data from date range
        for (const [date, sales] of this.state.salesAnalytics) {
          if (this.isDateInRange(date, dateRange)) {
            report.totalRevenue += sales.totalRevenue;
            report.totalTransactions += sales.totalSales;
            report.dailyBreakdown.push(sales);
            
            // Aggregate payment methods
            for (const [method, count] of sales.paymentMethods) {
              report.paymentMethodBreakdown.set(
                method,
                (report.paymentMethodBreakdown.get(method) || 0) + count
              );
            }
          }
        }
        
        report.averageTransaction = report.totalRevenue / report.totalTransactions;
        
        return report;
      }
    };
  }
  
  // Helper methods
  
  async getQRData(qrId) {
    // Get QR data from QR Bridge System
    if (this.integrations.qrBridge) {
      return this.integrations.qrBridge.state.qrCodes.get(qrId);
    }
    
    // Mock QR data for demonstration
    return {
      id: qrId,
      content: {
        type: 'research',
        id: 'cancer_botanical_therapy',
        title: 'Botanical Cancer Therapy Research',
        authors: ['Dr. Maya Chen']
      }
    };
  }
  
  async convertQRToProducts(qrData, terminal) {
    return this.engines.productEngine.convertQRToProducts(qrData, terminal);
  }
  
  async createTransaction(products, terminal, metadata = {}) {
    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      terminalId: terminal.id,
      products: products,
      
      // Calculate totals
      subtotal: products.reduce((sum, p) => sum + p.price, 0),
      tax: 0,
      discount: 0,
      tip: 0,
      total: 0,
      
      // Transaction metadata
      metadata: metadata,
      currency: 'USD',
      status: 'pending',
      createdAt: Date.now(),
      
      // Customer info
      customerId: metadata.customerId,
      loyaltyId: metadata.loyaltyId
    };
    
    // Calculate tax
    const avgTaxRate = Object.values(this.config.products.categories)
      .reduce((sum, cat) => sum + (cat.tax || 0), 0) / 
      Object.keys(this.config.products.categories).length;
    
    transaction.tax = transaction.subtotal * avgTaxRate;
    
    // Apply bundle discount if applicable
    if (products.length > 1) {
      const discountRate = this.engines.productEngine.calculateBundleDiscount(products);
      transaction.discount = transaction.subtotal * discountRate;
    }
    
    // Calculate final total
    transaction.total = transaction.subtotal + transaction.tax - transaction.discount;
    
    // Store transaction
    this.state.transactions.set(transaction.id, transaction);
    
    return transaction;
  }
  
  async displayTransactionOnTerminal(transaction, terminal) {
    const displayContent = {
      type: 'transaction_summary',
      transaction: transaction,
      products: transaction.products.map(p => ({
        name: p.name,
        price: `$${p.price.toFixed(2)}`
      })),
      total: `$${transaction.total.toFixed(2)}`
    };
    
    return this.engines.terminalEngine.displayOnTerminal(terminal.id, displayContent);
  }
  
  async calculateFinalAmount(transaction, paymentData) {
    let finalAmount = transaction.total;
    
    // Add tip if provided
    if (paymentData.tip) {
      finalAmount += paymentData.tip;
      transaction.tip = paymentData.tip;
    }
    
    // Apply loyalty discounts
    if (paymentData.loyaltyDiscount) {
      finalAmount -= paymentData.loyaltyDiscount;
      transaction.loyaltyDiscount = paymentData.loyaltyDiscount;
    }
    
    return finalAmount;
  }
  
  async processCharacterPurchase(transaction) {
    const characterData = transaction.metadata.qrData?.content;
    
    if (characterData && characterData.characterId) {
      // Record character purchase
      const purchases = this.state.characterPurchases.get(characterData.characterId) || [];
      purchases.push({
        transactionId: transaction.id,
        purchaseType: 'merchandise',
        amount: transaction.total,
        timestamp: Date.now()
      });
      
      this.state.characterPurchases.set(characterData.characterId, purchases);
      
      // Add to character inventory if applicable
      const inventory = this.state.characterInventory.get(characterData.characterId) || [];
      inventory.push({
        itemType: 'merchandise',
        purchaseDate: Date.now(),
        transactionId: transaction.id
      });
      
      this.state.characterInventory.set(characterData.characterId, inventory);
      
      console.log(`🎭 Recorded character purchase for ${characterData.characterId}`);
    }
  }
  
  async sendDigitalReceipt(transaction, paymentData) {
    const receipt = transaction.receipt;
    
    if (paymentData.email) {
      // Store digital receipt
      const emailReceipts = this.state.digitalReceipts.get(paymentData.email) || [];
      emailReceipts.push(receipt.id);
      this.state.digitalReceipts.set(paymentData.email, emailReceipts);
      
      console.log(`📧 Digital receipt sent to ${paymentData.email}`);
    }
    
    if (paymentData.phone) {
      // Store SMS receipt reference
      const phoneReceipts = this.state.digitalReceipts.get(paymentData.phone) || [];
      phoneReceipts.push(receipt.id);
      this.state.digitalReceipts.set(paymentData.phone, phoneReceipts);
      
      console.log(`📱 SMS receipt sent to ${paymentData.phone}`);
    }
  }
  
  // Mock implementations
  generateMockProcessorResponse(method) {
    const responses = {
      card: { authCode: 'AUTH123456', last4: '1234' },
      mobile: { walletId: 'WALLET789', tokenId: 'TOKEN456' },
      crypto: { txHash: '0xabc123def456', blockHeight: 12345 }
    };
    
    return responses[method] || { status: 'processed' };
  }
  
  async generateReceiptQR(transaction) {
    return {
      url: `https://pos.docgen.com/receipt/${transaction.receipt?.id}`,
      data: `receipt_${transaction.id}`
    };
  }
  
  extractCharacterInfo(transaction) {
    const qrData = transaction.metadata.qrData;
    
    if (qrData?.content?.type === 'character') {
      return [{
        id: qrData.content.characterId,
        name: qrData.content.name,
        type: qrData.content.type
      }];
    }
    
    return [];
  }
  
  generateDigitalReceipt(receipt) {
    return {
      format: 'html',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
          <h2>Document Generator Store</h2>
          <p>Transaction: ${receipt.transaction.id}</p>
          <p>Date: ${receipt.transaction.date} ${receipt.transaction.time}</p>
          <hr>
          ${receipt.items.map(item => 
            `<div style="display: flex; justify-content: space-between;">
              <span>${item.name}</span>
              <span>$${item.price.toFixed(2)}</span>
            </div>`
          ).join('')}
          <hr>
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>Total:</span>
            <span>$${receipt.totals.total.toFixed(2)}</span>
          </div>
        </div>
      `
    };
  }
  
  generateEmailReceipt(receipt) {
    return {
      subject: `Receipt for Transaction ${receipt.transaction.id}`,
      body: `Thank you for your purchase!\n\nTransaction Details:\n${receipt.formats.thermal}`
    };
  }
  
  formatContentForTerminal(content, terminal) {
    const { width } = terminal.display;
    
    if (content.type === 'transaction_summary') {
      const lines = [];
      lines.push('Transaction Summary'.padStart((width + 'Transaction Summary'.length) / 2));
      lines.push('-'.repeat(width));
      
      content.products.forEach(product => {
        const line = `${product.name.substring(0, width-10)} ${product.price.padStart(8)}`;
        lines.push(line);
      });
      
      lines.push('-'.repeat(width));
      lines.push(`Total: ${content.total}`.padStart(width));
      
      return lines.join('\n');
    }
    
    return JSON.stringify(content);
  }
  
  isDateInRange(date, range) {
    // Simple date range check
    return true; // Mock implementation
  }
  
  // System integration
  async connectToIntegratedSystems() {
    try {
      // Connect to Universal Slug Router
      const UniversalSlugRouter = require('./universal-slug-router.js');
      this.integrations.slugRouter = new UniversalSlugRouter();
      
      // Connect to Character Engine
      const { JavaCompatibleCharacterEngine } = require('./java-compatible-character-engine.js');
      this.integrations.characterEngine = new JavaCompatibleCharacterEngine();
      
      // Connect to QR Bridge System
      const QRCodeBridgeSystem = require('./qr-code-bridge-system.js');
      this.integrations.qrBridge = new QRCodeBridgeSystem();
      
      console.log('🔗 Connected to integrated systems');
      
    } catch (error) {
      console.log('🔧 Using mock integrations for demonstration');
    }
  }
  
  async initializeProductCatalog() {
    // Initialize default product catalog
    const products = Object.entries(this.config.products.categories).map(([key, category]) => ({
      id: `product_${key}`,
      category: key,
      name: category.name,
      basePrice: category.basePrice,
      tax: category.tax,
      description: category.description
    }));
    
    products.forEach(product => {
      this.state.productCatalog.set(product.id, product);
    });
    
    console.log(`📦 Initialized ${products.length} products in catalog`);
  }
  
  async startPOSServer() {
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    // QR scan endpoint
    app.post('/api/pos/scan/:terminalId', async (req, res) => {
      try {
        const { qrId } = req.body;
        const transaction = await this.processQRScan(qrId, req.params.terminalId, req.body.options);
        res.json(transaction);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Payment processing endpoint
    app.post('/api/pos/payment/:transactionId', async (req, res) => {
      try {
        const result = await this.processPayment(req.params.transactionId, req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Receipt retrieval
    app.get('/api/pos/receipt/:receiptId', async (req, res) => {
      try {
        const receipt = this.state.receiptHistory.get(req.params.receiptId);
        if (receipt) {
          res.json(receipt);
        } else {
          res.status(404).json({ error: 'Receipt not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Sales analytics
    app.get('/api/pos/analytics', async (req, res) => {
      try {
        const report = await this.engines.analyticsEngine.getSalesReport(req.query.dateRange);
        res.json(report);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    const PORT = process.env.POS_PORT || 3700;
    app.listen(PORT, () => {
      console.log(`✅ POS Server running on port ${PORT}`);
      console.log(`💳 QR Scan: http://localhost:${PORT}/api/pos/scan/:terminalId`);
    });
  }
}

module.exports = POSIntegrationSystem;

// Example usage demonstration
if (require.main === module) {
  async function demonstratePOSSystem() {
    console.log('💳 POS Integration System Demo');
    console.log('=' .repeat(50));
    
    const posSystem = new POSIntegrationSystem();
    
    try {
      // Initialize the POS system
      await posSystem.initialize();
      
      // Demo QR scan at terminal
      const transaction = await posSystem.processQRScan(
        'qr_research_cancer_botanical',
        'terminal_001',
        { customerId: 'customer_123' }
      );
      
      console.log(`💳 Created transaction: ${transaction.id}`);
      console.log(`💰 Total amount: $${transaction.total.toFixed(2)}`);
      
      // Demo payment processing
      const paymentResult = await posSystem.processPayment(transaction.id, {
        method: 'card',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        email: 'customer@example.com',
        tip: 2.00
      });
      
      console.log(`✅ Payment processed: ${paymentResult.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`🧾 Receipt ID: ${paymentResult.receipt.id}`);
      
      // Demo analytics
      const analytics = await posSystem.engines.analyticsEngine.getSalesReport({
        start: '2024-01-01',
        end: '2024-12-31'
      });
      
      console.log(`📊 Total revenue: $${analytics.totalRevenue.toFixed(2)}`);
      console.log(`📊 Total transactions: ${analytics.totalTransactions}`);
      
      console.log('\n✅ POS Integration System demonstration complete!');
      console.log('🎯 Full pipeline ready: Research → Visual → QR → Purchase → Receipt!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    }
  }
  
  demonstratePOSSystem().catch(console.error);
}