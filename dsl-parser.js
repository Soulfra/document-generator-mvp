#!/usr/bin/env node

/**
 * DSL PARSER
 * Parses SQUASH-LADDER DSL syntax into a parse tree
 * Implements recursive descent parsing with error recovery
 */

const { EventEmitter } = require('events');

// Token types
const TokenType = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  IDENTIFIER: 'IDENTIFIER',
  BOOLEAN: 'BOOLEAN',
  
  // Keywords
  SYSTEM: 'SYSTEM',
  TYPE: 'TYPE',
  ENUM: 'ENUM',
  FUNCTION: 'FUNCTION',
  EVENT: 'EVENT',
  ON: 'ON',
  EMIT: 'EMIT',
  REQUIRE: 'REQUIRE',
  RETURN: 'RETURN',
  IF: 'IF',
  ELSE: 'ELSE',
  FOR: 'FOR',
  FORALL: 'FORALL',
  IN: 'IN',
  LET: 'LET',
  ASYNC: 'ASYNC',
  AWAIT: 'AWAIT',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  
  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  MULTIPLY: 'MULTIPLY',
  DIVIDE: 'DIVIDE',
  POWER: 'POWER',
  MODULO: 'MODULO',
  ASSIGN: 'ASSIGN',
  PLUS_ASSIGN: 'PLUS_ASSIGN',
  EQ: 'EQ',
  NEQ: 'NEQ',
  LT: 'LT',
  GT: 'GT',
  LTE: 'LTE',
  GTE: 'GTE',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  DOT: 'DOT',
  ARROW: 'ARROW',
  QUESTION: 'QUESTION',
  
  // Delimiters
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  COMMA: 'COMMA',
  COLON: 'COLON',
  SEMICOLON: 'SEMICOLON',
  
  // Special
  EOF: 'EOF',
  NEWLINE: 'NEWLINE',
  COMMENT: 'COMMENT',
  DIRECTIVE: 'DIRECTIVE'
};

// Keywords map
const KEYWORDS = {
  'system': TokenType.SYSTEM,
  'type': TokenType.TYPE,
  'enum': TokenType.ENUM,
  'function': TokenType.FUNCTION,
  'event': TokenType.EVENT,
  'on': TokenType.ON,
  'emit': TokenType.EMIT,
  'require': TokenType.REQUIRE,
  'return': TokenType.RETURN,
  'if': TokenType.IF,
  'else': TokenType.ELSE,
  'for': TokenType.FOR,
  'forall': TokenType.FORALL,
  'in': TokenType.IN,
  'let': TokenType.LET,
  'async': TokenType.ASYNC,
  'await': TokenType.AWAIT,
  'true': TokenType.TRUE,
  'false': TokenType.FALSE
};

/**
 * Lexer - Tokenizes DSL source code
 */
class Lexer {
  constructor(source) {
    this.source = source;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }
  
  tokenize() {
    while (this.position < this.source.length) {
      this.skipWhitespace();
      
      if (this.position >= this.source.length) break;
      
      const token = this.nextToken();
      if (token && token.type !== TokenType.COMMENT) {
        this.tokens.push(token);
      }
    }
    
    this.tokens.push(this.makeToken(TokenType.EOF, null));
    return this.tokens;
  }
  
  nextToken() {
    const ch = this.current();
    
    // Numbers
    if (this.isDigit(ch)) {
      return this.readNumber();
    }
    
    // Strings
    if (ch === '"' || ch === "'") {
      return this.readString(ch);
    }
    
    // Identifiers and keywords
    if (this.isLetter(ch) || ch === '_') {
      return this.readIdentifier();
    }
    
    // Directives (@directive)
    if (ch === '@') {
      return this.readDirective();
    }
    
    // Comments
    if (ch === '/' && this.peek() === '/') {
      return this.readComment();
    }
    
    // Two-character operators
    const twoChar = ch + this.peek();
    switch (twoChar) {
      case '==': this.advance(2); return this.makeToken(TokenType.EQ, twoChar);
      case '!=': this.advance(2); return this.makeToken(TokenType.NEQ, twoChar);
      case '<=': this.advance(2); return this.makeToken(TokenType.LTE, twoChar);
      case '>=': this.advance(2); return this.makeToken(TokenType.GTE, twoChar);
      case '&&': this.advance(2); return this.makeToken(TokenType.AND, twoChar);
      case '||': this.advance(2); return this.makeToken(TokenType.OR, twoChar);
      case '->': this.advance(2); return this.makeToken(TokenType.ARROW, twoChar);
      case '+=': this.advance(2); return this.makeToken(TokenType.PLUS_ASSIGN, twoChar);
      case '**': this.advance(2); return this.makeToken(TokenType.POWER, twoChar);
    }
    
    // Single-character tokens
    this.advance();
    switch (ch) {
      case '+': return this.makeToken(TokenType.PLUS, ch);
      case '-': return this.makeToken(TokenType.MINUS, ch);
      case '*': return this.makeToken(TokenType.MULTIPLY, ch);
      case '/': return this.makeToken(TokenType.DIVIDE, ch);
      case '%': return this.makeToken(TokenType.MODULO, ch);
      case '=': return this.makeToken(TokenType.ASSIGN, ch);
      case '<': return this.makeToken(TokenType.LT, ch);
      case '>': return this.makeToken(TokenType.GT, ch);
      case '!': return this.makeToken(TokenType.NOT, ch);
      case '.': return this.makeToken(TokenType.DOT, ch);
      case '?': return this.makeToken(TokenType.QUESTION, ch);
      case '(': return this.makeToken(TokenType.LPAREN, ch);
      case ')': return this.makeToken(TokenType.RPAREN, ch);
      case '{': return this.makeToken(TokenType.LBRACE, ch);
      case '}': return this.makeToken(TokenType.RBRACE, ch);
      case '[': return this.makeToken(TokenType.LBRACKET, ch);
      case ']': return this.makeToken(TokenType.RBRACKET, ch);
      case ',': return this.makeToken(TokenType.COMMA, ch);
      case ':': return this.makeToken(TokenType.COLON, ch);
      case ';': return this.makeToken(TokenType.SEMICOLON, ch);
      case '\n': 
        this.line++;
        this.column = 1;
        return this.makeToken(TokenType.NEWLINE, ch);
      default:
        throw this.error(`Unexpected character: ${ch}`);
    }
  }
  
  readNumber() {
    const start = this.position;
    
    while (this.isDigit(this.current())) {
      this.advance();
    }
    
    // Decimal part
    if (this.current() === '.' && this.isDigit(this.peek())) {
      this.advance(); // Skip '.'
      while (this.isDigit(this.current())) {
        this.advance();
      }
    }
    
    const value = this.source.substring(start, this.position);
    return this.makeToken(TokenType.NUMBER, parseFloat(value));
  }
  
  readString(quote) {
    this.advance(); // Skip opening quote
    const start = this.position;
    
    while (this.current() !== quote && !this.isAtEnd()) {
      if (this.current() === '\\') {
        this.advance(); // Skip escape character
      }
      if (this.current() === '\n') {
        this.line++;
        this.column = 0;
      }
      this.advance();
    }
    
    if (this.isAtEnd()) {
      throw this.error('Unterminated string');
    }
    
    const value = this.source.substring(start, this.position);
    this.advance(); // Skip closing quote
    
    return this.makeToken(TokenType.STRING, this.processEscapes(value));
  }
  
  readIdentifier() {
    const start = this.position;
    
    while (this.isAlphaNumeric(this.current()) || this.current() === '_') {
      this.advance();
    }
    
    const value = this.source.substring(start, this.position);
    const type = KEYWORDS[value] || TokenType.IDENTIFIER;
    
    return this.makeToken(type, value);
  }
  
  readDirective() {
    const start = this.position;
    this.advance(); // Skip '@'
    
    while (this.isAlphaNumeric(this.current())) {
      this.advance();
    }
    
    const value = this.source.substring(start, this.position);
    return this.makeToken(TokenType.DIRECTIVE, value);
  }
  
  readComment() {
    const start = this.position;
    this.advance(2); // Skip '//'
    
    while (this.current() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }
    
    const value = this.source.substring(start + 2, this.position);
    return this.makeToken(TokenType.COMMENT, value.trim());
  }
  
  // Helper methods
  current() {
    return this.source[this.position] || '\0';
  }
  
  peek(offset = 1) {
    return this.source[this.position + offset] || '\0';
  }
  
  advance(count = 1) {
    for (let i = 0; i < count; i++) {
      this.position++;
      this.column++;
    }
  }
  
  isAtEnd() {
    return this.position >= this.source.length;
  }
  
  isDigit(ch) {
    return ch >= '0' && ch <= '9';
  }
  
  isLetter(ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
  }
  
  isAlphaNumeric(ch) {
    return this.isLetter(ch) || this.isDigit(ch);
  }
  
  skipWhitespace() {
    while (' \t\r'.includes(this.current())) {
      this.advance();
    }
  }
  
  processEscapes(str) {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  }
  
  makeToken(type, value) {
    return {
      type,
      value,
      line: this.line,
      column: this.column - (value ? value.toString().length : 0)
    };
  }
  
  error(message) {
    return new Error(`Lexer error at ${this.line}:${this.column}: ${message}`);
  }
}

/**
 * Parser - Recursive descent parser for SQUASH-LADDER DSL
 */
class DSLParser extends EventEmitter {
  constructor() {
    super();
    this.tokens = [];
    this.current = 0;
    this.errors = [];
  }
  
  parse(source) {
    // Tokenize source
    const lexer = new Lexer(source);
    this.tokens = lexer.tokenize();
    this.current = 0;
    this.errors = [];
    
    // Parse program
    const program = this.parseProgram();
    
    if (this.errors.length > 0) {
      const error = new Error(`Parse errors: ${this.errors.length} errors found`);
      error.errors = this.errors;
      throw error;
    }
    
    return program;
  }
  
  // Program := (TypeDef | SystemDef)*
  parseProgram() {
    const definitions = [];
    
    while (!this.isAtEnd()) {
      // Skip newlines
      while (this.match(TokenType.NEWLINE)) {}
      
      if (this.isAtEnd()) break;
      
      if (this.check(TokenType.TYPE)) {
        definitions.push(this.parseTypeDef());
      } else if (this.check(TokenType.SYSTEM)) {
        definitions.push(this.parseSystemDef());
      } else if (this.check(TokenType.DIRECTIVE)) {
        definitions.push(this.parseDirective());
      } else {
        this.error('Expected type or system definition');
        this.synchronize();
      }
    }
    
    return {
      type: 'Program',
      definitions,
      location: this.location()
    };
  }
  
  // TypeDef := 'type' IDENTIFIER '=' TypeExpr
  parseTypeDef() {
    this.consume(TokenType.TYPE, "Expected 'type'");
    const name = this.consume(TokenType.IDENTIFIER, "Expected type name").value;
    this.consume(TokenType.ASSIGN, "Expected '='");
    const typeExpr = this.parseTypeExpr();
    
    return {
      type: 'TypeDefinition',
      name,
      typeExpr,
      location: this.location()
    };
  }
  
  // SystemDef := 'system' IDENTIFIER '{' SystemBody '}'
  parseSystemDef() {
    const startLoc = this.location();
    this.consume(TokenType.SYSTEM, "Expected 'system'");
    const name = this.consume(TokenType.IDENTIFIER, "Expected system name").value;
    this.consume(TokenType.LBRACE, "Expected '{'");
    
    const body = this.parseSystemBody();
    
    this.consume(TokenType.RBRACE, "Expected '}'");
    
    return {
      type: 'SystemDefinition',
      name,
      ...body,
      location: startLoc
    };
  }
  
  // Parse system body sections
  parseSystemBody() {
    const body = {
      version: null,
      description: null,
      types: {},
      inputs: [],
      outputs: [],
      config: {},
      subsystems: {},
      state: {},
      rules: {},
      functions: {},
      events: {},
      orchestration: null
    };
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      // Skip newlines
      while (this.match(TokenType.NEWLINE)) {}
      
      if (this.check(TokenType.RBRACE)) break;
      
      const section = this.peek().value;
      
      switch (section) {
        case 'version':
          this.advance();
          this.consume(TokenType.COLON, "Expected ':'");
          body.version = this.consume(TokenType.STRING, "Expected version string").value;
          break;
          
        case 'description':
          this.advance();
          this.consume(TokenType.COLON, "Expected ':'");
          body.description = this.consume(TokenType.STRING, "Expected description").value;
          break;
          
        case 'types':
          this.advance();
          this.consume(TokenType.COLON, "Expected ':'");
          body.types = this.parseBlock(this.parseTypeEntry.bind(this));
          break;
          
        case 'inputs':
          this.advance();
          this.consume(TokenType.COLON, "Expected ':'");
          body.inputs = this.parseArray();
          break;
          
        case 'outputs':
          this.advance();
          this.consume(TokenType.COLON, "Expected ':'");
          body.outputs = this.parseArray();
          break;
          
        case 'config':
          this.advance();
          this.consume(TokenType.COLON, "Expected ':'");
          body.config = this.parseBlock(this.parseConfigEntry.bind(this));
          break;
          
        case 'subsystems':
          this.advance();
          this.consume(TokenType.COLON, "Expected ':'");
          body.subsystems = this.parseBlock(this.parseSubsystem.bind(this));
          break;
          
        case 'state':
          this.advance();
          this.consume(TokenType.COLON, "Expected ':'");
          body.state = this.parseBlock(this.parseStateEntry.bind(this));
          break;
          
        case 'rules':
          this.advance();
          this.consume(TokenType.COLON, "Expected ':'");
          body.rules = this.parseBlock(this.parseRuleEntry.bind(this));
          break;
          
        case 'functions':
          this.advance();
          this.consume(TokenType.COLON, "Expected ':'");
          body.functions = this.parseBlock(this.parseFunctionDef.bind(this));
          break;
          
        case 'events':
          this.advance();
          this.consume(TokenType.COLON, "Expected ':'");
          body.events = this.parseBlock(this.parseEventDef.bind(this));
          break;
          
        case 'orchestration':
          this.advance();
          this.consume(TokenType.COLON, "Expected ':'");
          body.orchestration = this.parseBlock(this.parseOrchestrationEntry.bind(this));
          break;
          
        default:
          this.error(`Unknown system section: ${section}`);
          this.synchronize();
      }
    }
    
    return body;
  }
  
  // Parse various entry types
  parseTypeEntry() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected type name").value;
    this.consume(TokenType.COLON, "Expected ':'");
    const typeExpr = this.parseTypeExpr();
    return { name, typeExpr };
  }
  
  parseConfigEntry() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected config name").value;
    this.consume(TokenType.COLON, "Expected ':'");
    const value = this.parsePrimary();
    return { name, value };
  }
  
  parseStateEntry() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected state variable name").value;
    this.consume(TokenType.COLON, "Expected ':'");
    const type = this.parseTypeExpr();
    
    let initialValue = null;
    if (this.match(TokenType.ASSIGN)) {
      initialValue = this.parseExpression();
    }
    
    return { name, type, initialValue };
  }
  
  parseRuleEntry() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected rule name").value;
    this.consume(TokenType.COLON, "Expected ':'");
    const expression = this.parseExpression();
    return { name, expression };
  }
  
  parseSubsystem() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected subsystem name").value;
    this.consume(TokenType.COLON, "Expected ':'");
    this.consume(TokenType.LBRACE, "Expected '{'");
    
    const properties = {};
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      while (this.match(TokenType.NEWLINE)) {}
      
      if (this.check(TokenType.RBRACE)) break;
      
      const propName = this.consume(TokenType.IDENTIFIER, "Expected property name").value;
      this.consume(TokenType.COLON, "Expected ':'");
      
      let value;
      if (this.check(TokenType.LBRACKET)) {
        value = this.parseArray();
      } else if (this.check(TokenType.TRUE) || this.check(TokenType.FALSE)) {
        value = this.advance().type === TokenType.TRUE;
      } else {
        value = this.parsePrimary();
      }
      
      properties[propName] = value;
    }
    
    this.consume(TokenType.RBRACE, "Expected '}'");
    
    return { name, properties };
  }
  
  parseFunctionDef() {
    const isAsync = this.match(TokenType.ASYNC);
    const name = this.consume(TokenType.IDENTIFIER, "Expected function name").value;
    
    this.consume(TokenType.LPAREN, "Expected '('");
    const params = this.parseParameterList();
    this.consume(TokenType.RPAREN, "Expected ')'");
    
    let returnType = null;
    if (this.match(TokenType.COLON)) {
      returnType = this.parseTypeExpr();
    }
    
    this.consume(TokenType.LBRACE, "Expected '{'");
    const body = this.parseStatements();
    this.consume(TokenType.RBRACE, "Expected '}'");
    
    return {
      name,
      function: {
        type: 'FunctionDefinition',
        isAsync,
        params,
        returnType,
        body,
        location: this.location()
      }
    };
  }
  
  parseEventDef() {
    if (this.match(TokenType.EVENT)) {
      // Event declaration
      const name = this.consume(TokenType.IDENTIFIER, "Expected event name").value;
      this.consume(TokenType.LPAREN, "Expected '('");
      const params = this.parseParameterList();
      this.consume(TokenType.RPAREN, "Expected ')'");
      
      return {
        name,
        event: {
          type: 'EventDeclaration',
          params,
          location: this.location()
        }
      };
    } else if (this.match(TokenType.ON)) {
      // Event handler
      const eventName = this.consume(TokenType.IDENTIFIER, "Expected event name").value;
      this.consume(TokenType.LPAREN, "Expected '('");
      const params = this.parseParameterList();
      this.consume(TokenType.RPAREN, "Expected ')'");
      this.consume(TokenType.LBRACE, "Expected '{'");
      const body = this.parseStatements();
      this.consume(TokenType.RBRACE, "Expected '}'");
      
      return {
        name: `on_${eventName}`,
        handler: {
          type: 'EventHandler',
          eventName,
          params,
          body,
          location: this.location()
        }
      };
    }
  }
  
  // Parse expressions
  parseExpression() {
    return this.parseOr();
  }
  
  parseOr() {
    let expr = this.parseAnd();
    
    while (this.match(TokenType.OR)) {
      const op = this.previous();
      const right = this.parseAnd();
      expr = {
        type: 'BinaryExpression',
        operator: op.type,
        left: expr,
        right,
        location: this.location()
      };
    }
    
    return expr;
  }
  
  parseAnd() {
    let expr = this.parseEquality();
    
    while (this.match(TokenType.AND)) {
      const op = this.previous();
      const right = this.parseEquality();
      expr = {
        type: 'BinaryExpression',
        operator: op.type,
        left: expr,
        right,
        location: this.location()
      };
    }
    
    return expr;
  }
  
  parseEquality() {
    let expr = this.parseComparison();
    
    while (this.match(TokenType.EQ, TokenType.NEQ)) {
      const op = this.previous();
      const right = this.parseComparison();
      expr = {
        type: 'BinaryExpression',
        operator: op.type,
        left: expr,
        right,
        location: this.location()
      };
    }
    
    return expr;
  }
  
  parseComparison() {
    let expr = this.parseAddition();
    
    while (this.match(TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE)) {
      const op = this.previous();
      const right = this.parseAddition();
      expr = {
        type: 'BinaryExpression',
        operator: op.type,
        left: expr,
        right,
        location: this.location()
      };
    }
    
    return expr;
  }
  
  parseAddition() {
    let expr = this.parseMultiplication();
    
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const op = this.previous();
      const right = this.parseMultiplication();
      expr = {
        type: 'BinaryExpression',
        operator: op.type,
        left: expr,
        right,
        location: this.location()
      };
    }
    
    return expr;
  }
  
  parseMultiplication() {
    let expr = this.parsePower();
    
    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
      const op = this.previous();
      const right = this.parsePower();
      expr = {
        type: 'BinaryExpression',
        operator: op.type,
        left: expr,
        right,
        location: this.location()
      };
    }
    
    return expr;
  }
  
  parsePower() {
    let expr = this.parseUnary();
    
    if (this.match(TokenType.POWER)) {
      const right = this.parsePower(); // Right associative
      expr = {
        type: 'BinaryExpression',
        operator: TokenType.POWER,
        left: expr,
        right,
        location: this.location()
      };
    }
    
    return expr;
  }
  
  parseUnary() {
    if (this.match(TokenType.NOT, TokenType.MINUS)) {
      const op = this.previous();
      const expr = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator: op.type,
        operand: expr,
        location: this.location()
      };
    }
    
    return this.parsePostfix();
  }
  
  parsePostfix() {
    let expr = this.parsePrimary();
    
    while (true) {
      if (this.match(TokenType.DOT)) {
        const property = this.consume(TokenType.IDENTIFIER, "Expected property name").value;
        expr = {
          type: 'MemberExpression',
          object: expr,
          property,
          location: this.location()
        };
      } else if (this.match(TokenType.LBRACKET)) {
        const index = this.parseExpression();
        this.consume(TokenType.RBRACKET, "Expected ']'");
        expr = {
          type: 'IndexExpression',
          object: expr,
          index,
          location: this.location()
        };
      } else if (this.match(TokenType.LPAREN)) {
        const args = this.parseArgumentList();
        this.consume(TokenType.RPAREN, "Expected ')'");
        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: args,
          location: this.location()
        };
      } else {
        break;
      }
    }
    
    return expr;
  }
  
  parsePrimary() {
    // Literals
    if (this.match(TokenType.NUMBER)) {
      return {
        type: 'NumberLiteral',
        value: this.previous().value,
        location: this.location()
      };
    }
    
    if (this.match(TokenType.STRING)) {
      return {
        type: 'StringLiteral',
        value: this.previous().value,
        location: this.location()
      };
    }
    
    if (this.match(TokenType.TRUE, TokenType.FALSE)) {
      return {
        type: 'BooleanLiteral',
        value: this.previous().type === TokenType.TRUE,
        location: this.location()
      };
    }
    
    // Identifier
    if (this.match(TokenType.IDENTIFIER)) {
      return {
        type: 'Identifier',
        name: this.previous().value,
        location: this.location()
      };
    }
    
    // Parenthesized expression
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RPAREN, "Expected ')'");
      return expr;
    }
    
    // Array literal
    if (this.check(TokenType.LBRACKET)) {
      return this.parseArrayLiteral();
    }
    
    // Object literal
    if (this.check(TokenType.LBRACE)) {
      return this.parseObjectLiteral();
    }
    
    // Special keywords
    if (this.match(TokenType.FORALL)) {
      return this.parseForall();
    }
    
    throw this.error('Expected expression');
  }
  
  // Parse helper methods
  parseArray() {
    this.consume(TokenType.LBRACKET, "Expected '['");
    const elements = [];
    
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      elements.push(this.parseExpression());
      if (!this.match(TokenType.COMMA)) break;
    }
    
    this.consume(TokenType.RBRACKET, "Expected ']'");
    return elements;
  }
  
  parseArrayLiteral() {
    const elements = this.parseArray();
    return {
      type: 'ArrayLiteral',
      elements,
      location: this.location()
    };
  }
  
  parseObjectLiteral() {
    this.consume(TokenType.LBRACE, "Expected '{'");
    const properties = [];
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      while (this.match(TokenType.NEWLINE)) {}
      
      if (this.check(TokenType.RBRACE)) break;
      
      const key = this.consume(TokenType.IDENTIFIER, "Expected property key").value;
      this.consume(TokenType.COLON, "Expected ':'");
      const value = this.parseExpression();
      
      properties.push({ key, value });
      
      if (!this.match(TokenType.COMMA)) break;
    }
    
    this.consume(TokenType.RBRACE, "Expected '}'");
    
    return {
      type: 'ObjectLiteral',
      properties,
      location: this.location()
    };
  }
  
  parseBlock(parseEntry) {
    this.consume(TokenType.LBRACE, "Expected '{'");
    const entries = {};
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      while (this.match(TokenType.NEWLINE)) {}
      
      if (this.check(TokenType.RBRACE)) break;
      
      const entry = parseEntry();
      if (entry.name) {
        entries[entry.name] = entry;
      }
    }
    
    this.consume(TokenType.RBRACE, "Expected '}'");
    return entries;
  }
  
  parseParameterList() {
    const params = [];
    
    while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
      const name = this.consume(TokenType.IDENTIFIER, "Expected parameter name").value;
      
      let type = null;
      if (this.match(TokenType.COLON)) {
        type = this.parseTypeExpr();
      }
      
      params.push({ name, type });
      
      if (!this.match(TokenType.COMMA)) break;
    }
    
    return params;
  }
  
  parseArgumentList() {
    const args = [];
    
    while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
      args.push(this.parseExpression());
      if (!this.match(TokenType.COMMA)) break;
    }
    
    return args;
  }
  
  parseStatements() {
    const statements = [];
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      while (this.match(TokenType.NEWLINE)) {}
      
      if (this.check(TokenType.RBRACE)) break;
      
      statements.push(this.parseStatement());
    }
    
    return statements;
  }
  
  parseStatement() {
    // Control flow
    if (this.match(TokenType.IF)) return this.parseIfStatement();
    if (this.match(TokenType.FOR)) return this.parseForStatement();
    if (this.match(TokenType.RETURN)) return this.parseReturnStatement();
    if (this.match(TokenType.LET)) return this.parseLetStatement();
    if (this.match(TokenType.REQUIRE)) return this.parseRequireStatement();
    if (this.match(TokenType.EMIT)) return this.parseEmitStatement();
    
    // Expression statement
    const expr = this.parseExpression();
    return {
      type: 'ExpressionStatement',
      expression: expr,
      location: this.location()
    };
  }
  
  parseIfStatement() {
    this.consume(TokenType.LPAREN, "Expected '(' after 'if'");
    const condition = this.parseExpression();
    this.consume(TokenType.RPAREN, "Expected ')' after condition");
    
    this.consume(TokenType.LBRACE, "Expected '{'");
    const thenBranch = this.parseStatements();
    this.consume(TokenType.RBRACE, "Expected '}'");
    
    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      this.consume(TokenType.LBRACE, "Expected '{'");
      elseBranch = this.parseStatements();
      this.consume(TokenType.RBRACE, "Expected '}'");
    }
    
    return {
      type: 'IfStatement',
      condition,
      thenBranch,
      elseBranch,
      location: this.location()
    };
  }
  
  parseReturnStatement() {
    let value = null;
    if (!this.check(TokenType.NEWLINE) && !this.check(TokenType.RBRACE)) {
      value = this.parseExpression();
    }
    
    return {
      type: 'ReturnStatement',
      value,
      location: this.location()
    };
  }
  
  parseLetStatement() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected variable name").value;
    this.consume(TokenType.ASSIGN, "Expected '='");
    const value = this.parseExpression();
    
    return {
      type: 'LetStatement',
      name,
      value,
      location: this.location()
    };
  }
  
  parseRequireStatement() {
    this.consume(TokenType.LPAREN, "Expected '(' after 'require'");
    const condition = this.parseExpression();
    this.consume(TokenType.COMMA, "Expected ','");
    const message = this.parseExpression();
    this.consume(TokenType.RPAREN, "Expected ')'");
    
    return {
      type: 'RequireStatement',
      condition,
      message,
      location: this.location()
    };
  }
  
  parseEmitStatement() {
    const eventName = this.consume(TokenType.IDENTIFIER, "Expected event name").value;
    this.consume(TokenType.LPAREN, "Expected '('");
    const args = this.parseArgumentList();
    this.consume(TokenType.RPAREN, "Expected ')'");
    
    return {
      type: 'EmitStatement',
      eventName,
      arguments: args,
      location: this.location()
    };
  }
  
  parseForall() {
    this.consume(TokenType.LPAREN, "Expected '(' after 'forall'");
    const variable = this.consume(TokenType.IDENTIFIER, "Expected variable name").value;
    this.consume(TokenType.IN, "Expected 'in'");
    const collection = this.parseExpression();
    this.consume(TokenType.RPAREN, "Expected ')'");
    
    this.consume(TokenType.LBRACE, "Expected '{'");
    const body = this.parseExpression();
    this.consume(TokenType.RBRACE, "Expected '}'");
    
    return {
      type: 'ForallExpression',
      variable,
      collection,
      body,
      location: this.location()
    };
  }
  
  parseTypeExpr() {
    // For now, just parse identifiers as types
    // TODO: Implement full type expression parsing
    if (this.match(TokenType.IDENTIFIER)) {
      const name = this.previous().value;
      
      // Check for array type
      if (this.match(TokenType.LBRACKET)) {
        this.consume(TokenType.RBRACKET, "Expected ']'");
        return {
          type: 'ArrayType',
          elementType: { type: 'NamedType', name },
          location: this.location()
        };
      }
      
      // Check for optional type
      if (this.match(TokenType.QUESTION)) {
        return {
          type: 'OptionalType',
          baseType: { type: 'NamedType', name },
          location: this.location()
        };
      }
      
      return {
        type: 'NamedType',
        name,
        location: this.location()
      };
    }
    
    // Object type
    if (this.check(TokenType.LBRACE)) {
      return this.parseObjectType();
    }
    
    throw this.error('Expected type expression');
  }
  
  parseObjectType() {
    this.consume(TokenType.LBRACE, "Expected '{'");
    const properties = {};
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      while (this.match(TokenType.NEWLINE)) {}
      
      if (this.check(TokenType.RBRACE)) break;
      
      const name = this.consume(TokenType.IDENTIFIER, "Expected property name").value;
      this.consume(TokenType.COLON, "Expected ':'");
      const type = this.parseTypeExpr();
      
      properties[name] = type;
      
      if (!this.match(TokenType.COMMA)) break;
    }
    
    this.consume(TokenType.RBRACE, "Expected '}'");
    
    return {
      type: 'ObjectType',
      properties,
      location: this.location()
    };
  }
  
  parseOrchestrationEntry() {
    const name = this.consume(TokenType.IDENTIFIER, "Expected orchestration property").value;
    this.consume(TokenType.COLON, "Expected ':'");
    
    if (this.check(TokenType.LBRACE)) {
      const value = this.parseBlock(this.parseConfigEntry.bind(this));
      return { name, value };
    } else {
      const value = this.parsePrimary();
      return { name, value };
    }
  }
  
  parseDirective() {
    const directive = this.advance();
    const name = directive.value.substring(1); // Remove '@'
    
    let args = null;
    if (this.match(TokenType.LPAREN)) {
      args = this.parseArgumentList();
      this.consume(TokenType.RPAREN, "Expected ')'");
    }
    
    let body = null;
    if (this.match(TokenType.LBRACE)) {
      body = this.parseStatements();
      this.consume(TokenType.RBRACE, "Expected '}'");
    }
    
    return {
      type: 'Directive',
      name,
      arguments: args,
      body,
      location: this.location()
    };
  }
  
  // Helper methods
  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  
  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }
  
  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  
  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }
  
  peek(offset = 0) {
    return this.tokens[this.current + offset] || { type: TokenType.EOF };
  }
  
  previous() {
    return this.tokens[this.current - 1];
  }
  
  consume(type, message) {
    if (this.check(type)) return this.advance();
    throw this.error(message);
  }
  
  error(message) {
    const token = this.peek();
    const error = new Error(`${message} at ${token.line}:${token.column}`);
    error.line = token.line;
    error.column = token.column;
    this.errors.push(error);
    return error;
  }
  
  synchronize() {
    this.advance();
    
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;
      
      switch (this.peek().type) {
        case TokenType.SYSTEM:
        case TokenType.TYPE:
        case TokenType.FUNCTION:
        case TokenType.EVENT:
        case TokenType.IF:
        case TokenType.FOR:
        case TokenType.RETURN:
          return;
      }
      
      this.advance();
    }
  }
  
  location() {
    const token = this.previous();
    return {
      line: token.line,
      column: token.column
    };
  }
}

module.exports = DSLParser;