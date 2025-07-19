import { useState, useEffect, useCallback } from 'react';
import { UseApiResult } from '../types';
import apiClient from '../api/client';

export function useApi<T>(
  apiCall: () => Promise<{ data: T; error?: string }>,
  dependencies: any[] = [],
  immediate: boolean = true
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall();
      
      if (response.error) {
        setError(response.error);
        setData(null);
      } else {
        setData(response.data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const refetch = useCallback(async () => {
    await execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// Specialized hooks for common API calls
export function useUser(userId: string) {
  return useApi(
    () => apiClient.getUser(userId),
    [userId],
    !!userId
  );
}

export function useUserStats(userId: string) {
  return useApi(
    () => apiClient.getUserStats(userId),
    [userId],
    !!userId
  );
}

export function useJob(jobId: string) {
  return useApi(
    () => apiClient.getJob(jobId),
    [jobId],
    !!jobId
  );
}

export function useProfiles() {
  return useApi(() => apiClient.getProfiles());
}

export function useActivityFeed(limit: number = 20, offset: number = 0) {
  return useApi(
    () => apiClient.getActivityFeed(limit, offset),
    [limit, offset]
  );
}

export function useReferralStats(userId: string) {
  return useApi(
    () => apiClient.getReferralStats(userId),
    [userId],
    !!userId
  );
}

export function useAchievements(userId: string) {
  return useApi(
    () => apiClient.getUserAchievements(userId),
    [userId],
    !!userId
  );
}

export function useChallenges(userId: string, type?: 'daily' | 'weekly' | 'special') {
  return useApi(
    () => apiClient.getChallenges(userId, type),
    [userId, type],
    !!userId
  );
}

export function useLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly') {
  return useApi(
    () => apiClient.getLeaderboard(period),
    [period]
  );
}

export function useGlobalStats() {
  return useApi(() => apiClient.getGlobalStats());
}