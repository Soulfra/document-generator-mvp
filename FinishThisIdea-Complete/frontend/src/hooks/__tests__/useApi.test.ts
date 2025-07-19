import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@/test-utils';
import { useApi } from '../useApi';

// Mock the API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@/api/client', () => ({
  default: mockApiClient,
}));

describe('useApi Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('successfully fetches data', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockApiCall = vi.fn().mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useApi(mockApiCall));

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    it('handles API errors correctly', async () => {
      const errorMessage = 'Network error';
      const mockApiCall = vi.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useApi(mockApiCall));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(errorMessage);
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    it('shows loading state initially when immediate is true', () => {
      const mockApiCall = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useApi(mockApiCall, [], true));

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('does not execute immediately when immediate is false', () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() => useApi(mockApiCall, [], false));

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(mockApiCall).not.toHaveBeenCalled();
    });
  });

  describe('Refetch functionality', () => {
    it('refetches data when refetch is called', async () => {
      const mockData1 = { id: 1, name: 'First' };
      const mockData2 = { id: 2, name: 'Second' };
      const mockApiCall = vi.fn()
        .mockResolvedValueOnce({ data: mockData1 })
        .mockResolvedValueOnce({ data: mockData2 });

      const { result } = renderHook(() => useApi(mockApiCall));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData1);

      // Refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2);
      });

      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });

    it('handles refetch errors', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockApiCall = vi.fn()
        .mockResolvedValueOnce({ data: mockData })
        .mockRejectedValueOnce(new Error('Refetch failed'));

      const { result } = renderHook(() => useApi(mockApiCall));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);

      // Refetch with error
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBe('Refetch failed');
      });

      expect(result.current.data).toBe(null);
    });
  });

  describe('Error handling', () => {
    it('handles API response errors', async () => {
      const errorMessage = 'API Error';
      const mockApiCall = vi.fn().mockResolvedValue({ 
        data: null, 
        error: errorMessage 
      });

      const { result } = renderHook(() => useApi(mockApiCall));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(errorMessage);
    });

    it('handles thrown errors', async () => {
      const mockApiCall = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApi(mockApiCall));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe('Network error');
    });

    it('handles non-Error thrown values', async () => {
      const mockApiCall = vi.fn().mockRejectedValue('String error');

      const { result } = renderHook(() => useApi(mockApiCall));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe('An error occurred');
    });
  });

  describe('Dependencies', () => {
    it('re-executes when dependencies change', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: { id: 1 } });
      let dependency = 'initial';

      const { rerender } = renderHook(
        ({ dep }) => useApi(() => mockApiCall(dep), [dep]),
        { initialProps: { dep: dependency } }
      );

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith('initial');
      });

      // Change dependency
      dependency = 'updated';
      rerender({ dep: dependency });

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith('updated');
      });

      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });

    it('does not re-execute when dependencies stay the same', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: { id: 1 } });
      const dependency = 'constant';

      const { rerender } = renderHook(
        () => useApi(() => mockApiCall(dependency), [dependency])
      );

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledTimes(1);
      });

      // Re-render with same dependency
      rerender();

      // Should not call again
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading states', () => {
    it('sets loading to true during API call', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const mockApiCall = vi.fn().mockReturnValue(promise);

      const { result } = renderHook(() => useApi(mockApiCall));

      expect(result.current.loading).toBe(true);

      // Resolve the promise
      resolvePromise!({ data: { id: 1 } });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('sets loading to true during refetch', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() => useApi(mockApiCall));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start refetch
      result.current.refetch();

      // Should be loading again
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});