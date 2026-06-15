import { useState, useCallback, useEffect } from 'react';
import { aiInsightsApi } from '../api';
import useToast from './useToast';

export const useAIInsights = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toastError } = useToast();

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await aiInsightsApi.getDashboardInsights();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      toastError('Failed to load AI insights');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { data, isLoading, refetch: fetchInsights };
};
