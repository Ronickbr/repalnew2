import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export const useLoadingState = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: undefined,
    progress: undefined
  });

  const startLoading = useCallback((message?: string, progress?: number) => {
    setLoadingState({
      isLoading: true,
      message,
      progress
    });
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState({
      isLoading: false,
      message: undefined,
      progress: undefined
    });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      progress
    }));
  }, []);

  return {
    ...loadingState,
    startLoading,
    stopLoading,
    updateProgress
  };
};