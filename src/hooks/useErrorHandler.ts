import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface ErrorDetails {
  message: string;
  code?: string;
  details?: any;
  shouldNotify?: boolean;
}

export interface UseErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  notifyUser?: boolean;
  fallbackMessage?: string;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const {
    showToast = true,
    logToConsole = true,
    notifyUser = true,
    fallbackMessage = 'Ocorreu um erro inesperado. Por favor, tente novamente.'
  } = options;

  const [error, setError] = useState<ErrorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorCountRef = useRef(0);
  const lastErrorTimeRef = useRef(0);

  const handleError = useCallback((error: unknown, context?: string): ErrorDetails => {
    let errorDetails: ErrorDetails;

    // Previne spam de erros (máximo 3 erros por minuto)
    const now = Date.now();
    if (now - lastErrorTimeRef.current < 60000) {
      errorCountRef.current++;
      if (errorCountRef.current > 3) {
        return {
          message: 'Muitos erros em sequência. Por favor, recarregue a página.',
          code: 'ERROR_SPAM_PREVENTION',
          shouldNotify: false
        };
      }
    } else {
      errorCountRef.current = 1;
      lastErrorTimeRef.current = now;
    }

    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        code: (error as any).code,
        details: error.stack
      };
    } else if (typeof error === 'string') {
      errorDetails = { message: error };
    } else if (error && typeof error === 'object') {
      const err = error as any;
      errorDetails = {
        message: err.message || fallbackMessage,
        code: err.code,
        details: err
      };
    } else {
      errorDetails = { message: fallbackMessage };
    }

    // Adiciona contexto se fornecido
    if (context) {
      errorDetails.message = `${context}: ${errorDetails.message}`;
    }

    if (logToConsole) {
      console.error('Error:', errorDetails);
      if (context) {
        console.error('Context:', context);
      }
    }

    setError(errorDetails);

    if (showToast && notifyUser && errorDetails.shouldNotify !== false) {
      toast.error(errorDetails.message, {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#ef4444',
          color: '#fff',
          border: '1px solid #dc2626'
        }
      });
    }

    // Log to external service if available
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: errorDetails.message,
        fatal: false
      });
    }

    return errorDetails;
  }, [fallbackMessage, logToConsole, notifyUser, showToast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleAsync = useCallback(async <T,>(
    promise: Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      const result = await promise;
      setIsLoading(false);
      clearError();
      return result;
    } catch (err) {
      setIsLoading(false);
      handleError(err, context);
      return null;
    }
  }, [handleError, clearError]);

  const retry = useCallback(async <T,>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    delay = 1000
  ): Promise<T | null> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();
        clearError();
        return result;
      } catch (err) {
        if (attempt === maxAttempts) {
          handleError(err, `Tentativa ${attempt} falhou`);
          return null;
        }
        
        // Espera antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    return null;
  }, [handleError, clearError]);

  return {
    error,
    isLoading,
    handleError,
    clearError,
    handleAsync,
    retry
  };
};

// Hook para validação de formulários com acessibilidade
export const useFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: any, rules: ValidationRule[]) => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        setErrors(prev => ({ ...prev, [name]: error }));
        return error;
      }
    }
    setErrors(prev => ({ ...prev, [name]: '' }));
    return null;
  }, []);

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const getFieldProps = useCallback((name: string, rules?: ValidationRule[]) => ({
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    onBlur: () => handleBlur(name),
    onChange: (value: any) => rules && validateField(name, value, rules)
  }), [errors, handleBlur, validateField]);

  const getErrorProps = useCallback((name: string) => ({
    id: `${name}-error`,
    role: 'alert',
    'aria-live': 'polite'
  }), []);

  return {
    errors,
    touched,
    validateField,
    handleBlur,
    getFieldProps,
    getErrorProps,
    setErrors,
    setTouched
  };
};

// Tipos para validação
type ValidationRule = (value: any) => string | null;

// Validadores comuns
export const validators = {
  required: (message = 'Este campo é obrigatório') => (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return null;
  },

  email: (message = 'Por favor, insira um email válido') => (value: any) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message;
    }
    return null;
  },

  minLength: (min: number, message?: string) => (value: any) => {
    if (value && value.length < min) {
      return message || `Mínimo de ${min} caracteres`;
    }
    return null;
  },

  maxLength: (max: number, message?: string) => (value: any) => {
    if (value && value.length > max) {
      return message || `Máximo de ${max} caracteres`;
    }
    return null;
  },

  numeric: (message = 'Deve ser um número') => (value: any) => {
    if (value && isNaN(Number(value))) {
      return message;
    }
    return null;
  },

  min: (min: number, message?: string) => (value: any) => {
    if (value && Number(value) < min) {
      return message || `Deve ser no mínimo ${min}`;
    }
    return null;
  },

  max: (max: number, message?: string) => (value: any) => {
    if (value && Number(value) > max) {
      return message || `Deve ser no máximo ${max}`;
    }
    return null;
  }
};