import { useState, useEffect, useCallback } from 'react';
import { aiAnalysisApi } from '../api';

const useAiAnalysis = (sessionId) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiAnalysisApi.getDashboardSummary(sessionId);
      if (response.success) {
        setSummary(response.data.summary);
      } else {
        setError(response.message || 'Failed to fetch AI analysis');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch AI analysis');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) fetchDashboardSummary();
  }, [fetchDashboardSummary, sessionId]);

  return {
    summary,
    loading,
    error,
    fetchDashboardSummary
  };
};

export default useAiAnalysis;
