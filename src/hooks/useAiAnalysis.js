import { useState, useEffect, useCallback } from 'react';
import { aiAnalysisApi } from '../api';

const useAiAnalysis = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiAnalysisApi.getDashboardSummary();
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
  }, []);

  return {
    summary,
    loading,
    error,
    fetchDashboardSummary
  };
};

export default useAiAnalysis;
