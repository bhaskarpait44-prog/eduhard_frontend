import { useState, useCallback, useEffect } from 'react';
import { aiInsightsApi } from '../api';
import useToast from './useToast';

export const useAIInsights = (sessionId) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toastError } = useToast();

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await aiInsightsApi.getDashboardInsights(sessionId);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err);
      toastError('Failed to load AI insights');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [toastError, sessionId]);

  useEffect(() => {
    if (sessionId) fetchInsights();
  }, [fetchInsights, sessionId]);

  return { data, isLoading, error, refetch: fetchInsights };
};
