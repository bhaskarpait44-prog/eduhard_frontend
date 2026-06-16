import { useState, useCallback, useEffect } from 'react';
import { aiInsightsApi } from '../api';
import useToast from './useToast';

export const useStudentRisk = (page = 1, limit = 50) => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toastError } = useToast();

  const fetchRiskStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await aiInsightsApi.getRiskStudents(page, limit);
      if (res.success) {
        // Backend returns { students, pagination } after my update
        if (res.data.students) {
          setStudents(res.data.students);
          setPagination(res.data.pagination);
        } else {
          setStudents(res.data);
        }
      }
    } catch (err) {
      toastError('Failed to load at-risk students');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [toastError, page, limit]);

  useEffect(() => {
    fetchRiskStudents();
  }, [fetchRiskStudents]);

  return { students, pagination, isLoading, refetch: fetchRiskStudents };
};
