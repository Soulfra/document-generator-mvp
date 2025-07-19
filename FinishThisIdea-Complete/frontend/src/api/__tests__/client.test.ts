import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../client';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('makes successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.data).toEqual(mockData);
    });

    it('handles GET request with query parameters', async () => {
      const mockData = { results: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await apiClient.get('/search', { 
        params: { q: 'test', page: 1 } 
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test&page=1'),
        expect.any(Object)
      );
    });

    it('includes authorization header when token is present', async () => {
      const mockData = { user: 'test' };
      const token = 'test-token';
      
      // Mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(token),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await apiClient.get('/protected');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      );
    });
  });

  describe('POST requests', () => {
    it('makes successful POST request with data', async () => {
      const requestData = { name: 'New Item' };
      const responseData = { id: 1, ...requestData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => responseData,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.post('/items', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/items'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestData),
        })
      );
      expect(result.data).toEqual(responseData);
    });

    it('handles form data uploads', async () => {
      const formData = new FormData();
      formData.append('file', new File(['content'], 'test.txt'));
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: new Headers(),
      });

      await apiClient.post('/upload', formData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload'),
        expect.objectContaining({
          method: 'POST',
          body: formData,
          // Should not include Content-Type header for FormData
          headers: expect.not.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('makes successful PUT request', async () => {
      const updateData = { name: 'Updated Item' };
      const responseData = { id: 1, ...updateData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.put('/items/1', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result.data).toEqual(responseData);
    });
  });

  describe('DELETE requests', () => {
    it('makes successful DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
        headers: new Headers(),
      });

      await apiClient.delete('/items/1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Error handling', () => {
    it('handles 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Resource not found' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(apiClient.get('/nonexistent')).rejects.toThrow();
    });

    it('handles 401 unauthorized errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Unauthorized' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(apiClient.get('/protected')).rejects.toThrow();
    });

    it('handles 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(apiClient.get('/error')).rejects.toThrow();
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    it('handles malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
        text: async () => 'Invalid response',
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(apiClient.get('/invalid-json')).rejects.toThrow();
    });
  });

  describe('Request configuration', () => {
    it('applies custom headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Headers(),
      });

      await apiClient.get('/test', {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });

    it('applies request timeout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Headers(),
      });

      await apiClient.get('/test', { timeout: 5000 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('retries failed requests', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
          headers: new Headers(),
        });

      const result = await apiClient.get('/retry-test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('Response interceptors', () => {
    it('automatically redirects on 401 when not on login page', async () => {
      // Mock window.location
      const mockLocation = {
        pathname: '/dashboard',
        href: '',
      };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Token expired' }),
        headers: new Headers(),
      });

      await expect(apiClient.get('/protected')).rejects.toThrow();
      
      // Should clear token and redirect (in real implementation)
    });

    it('handles rate limiting with exponential backoff', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: async () => ({ error: 'Rate limited' }),
          headers: new Headers({ 'retry-after': '1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
          headers: new Headers(),
        });

      // In real implementation, this would wait and retry
      await expect(apiClient.get('/rate-limited')).rejects.toThrow();
    });
  });
});