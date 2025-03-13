
import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border border-destructive/20 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold text-destructive mb-4">Something went wrong</h2>
        <div className="mb-4 p-3 bg-destructive/10 rounded text-sm overflow-x-auto">
          <p className="font-mono whitespace-pre-wrap">{error.message}</p>
          {error.stack && (
            <details className="mt-2">
              <summary className="cursor-pointer text-muted-foreground">Stack trace</summary>
              <pre className="text-xs mt-2 text-muted-foreground whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={resetErrorBoundary}
            variant="outline"
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
