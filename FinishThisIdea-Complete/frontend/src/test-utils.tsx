import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Create a custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create a new QueryClient for each test to ensure isolation
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock API client for testing
export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
};

// Mock implementations for common API responses
export const mockResponses = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date().toISOString(),
  },
  project: {
    id: '1',
    title: 'Test Project',
    description: 'A test project',
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    userId: '1',
  },
  projects: [
    {
      id: '1',
      title: 'Test Project 1',
      description: 'First test project',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      userId: '1',
    },
    {
      id: '2',
      title: 'Test Project 2',
      description: 'Second test project',
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      userId: '1',
    },
  ],
  stats: {
    totalProjects: 10,
    completedProjects: 8,
    totalUsers: 100,
    totalRevenue: 1000,
  },
};

// Helper function to wait for async operations
export const waitFor = async (callback: () => void | Promise<void>, timeout = 1000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};

// Helper to create mock file for upload testing
export const createMockFile = (
  name = 'test.zip',
  size = 1024,
  type = 'application/zip'
): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Helper to create mock FileList for input testing
export const createMockFileList = (files: File[]): FileList => {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    ...files,
  };
  return fileList as FileList;
};

// Mock localStorage for testing
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock sessionStorage for testing
export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Helper to setup localStorage mock
export const setupLocalStorageMock = () => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
  });
};

// Helper to setup sessionStorage mock
export const setupSessionStorageMock = () => {
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
  });
};

// Helper to mock URL.createObjectURL
export const setupURLMock = () => {
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'mocked-url'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn(),
  });
};

// Helper to mock window.location
export const mockLocation = (url: string) => {
  const location = new URL(url);
  Object.defineProperty(window, 'location', {
    value: {
      ...location,
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
    writable: true,
  });
};

// Helper to create mock event
export const createMockEvent = (type: string, eventInit?: EventInit) => {
  return new Event(type, eventInit);
};

// Helper to create mock mouse event
export const createMockMouseEvent = (type: string, eventInit?: MouseEventInit) => {
  return new MouseEvent(type, eventInit);
};

// Helper to create mock keyboard event
export const createMockKeyboardEvent = (type: string, eventInit?: KeyboardEventInit) => {
  return new KeyboardEvent(type, eventInit);
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Override the default render with our custom render
export { customRender as render };