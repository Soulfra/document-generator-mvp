// Core code analysis types for multi-language parsing system

export interface CodeAnalysis {
  projectInfo: {
    name: string;
    description: string;
    type: string; // webapp, api, library, etc.
    language: string;
    framework?: string;
    version?: string;
    baseUrl?: string;
  };
  apis: APIEndpoint[];
  dataModels: DataModel[];
  functions: FunctionSignature[];
  dependencies: Dependency[];
  testCoverage: TestMetrics;
  architecture: ArchitectureInfo;
  businessLogic: BusinessRule[];
  fileStructure: FileStructure;
}

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: Parameter[];
  requestBody?: any;
  responses: Record<string, any>;
  authentication?: string;
}

export interface DataModel {
  name: string;
  type: string; // table, document, etc.
  fields: Field[];
  relationships: Relationship[];
  indexes?: string[];
  description?: string;
  size?: number;
}

export interface Field {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  constraints?: string[];
}

export interface Relationship {
  type: string; // one-to-one, one-to-many, etc.
  target: string;
  description?: string;
}

export interface FunctionSignature {
  name: string;
  parameters: Parameter[];
  returnType: string;
  description?: string;
  complexity?: number;
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: any;
}

export interface Dependency {
  name: string;
  version: string;
  type: string; // production, development, peer
  description?: string;
}

export interface TestMetrics {
  coverage: number;
  totalTests: number;
  passingTests: number;
  testFiles: string[];
}

export interface ArchitectureInfo {
  pattern: string; // MVC, microservices, etc.
  layers: string[];
  components: Component[];
  integrations: string[];
}

export interface Component {
  name: string;
  type: string;
  purpose: string;
  dependencies: string[];
}

export interface BusinessRule {
  id: string;
  description: string;
  implementation?: string;
  category: string;
}

export interface FileStructure {
  totalFiles: number;
  directories: FileNode[];
  languages: Record<string, number>;
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  size?: number;
  language?: string;
}