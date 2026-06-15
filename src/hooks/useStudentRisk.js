import { useState, useCallback, useEffect } from 'react';
import { aiInsightsApi } from '../api';
import useToast from './useToast';

export const useStudentRisk = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toastError } = useToast();

  const fetchRiskStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await aiInsightsApi.getRiskStudents();
      if (res.success) {
        setStudents(res.data);
      }
    } catch (err) {
      toastError('Failed to load at-risk students');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchRiskStudents();
  }, [fetchRiskStudents]);

  return { students, isLoading, refetch: fetchRiskStudents };
};
