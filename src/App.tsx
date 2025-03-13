
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Habits from "./pages/Habits";
import Tasks from "./pages/Tasks";
import CalendarPage from "./pages/Calendar";
import Insights from "./pages/Insights";
import Achievements from "./pages/Achievements";
import Settings from "./pages/Settings";
import DailyRoutine from "./pages/DailyRoutine";
import PrivateRoute from "./components/auth/PrivateRoute";
import { useDbInit } from './hooks/use-db-init';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

const queryClient = new QueryClient();

function App() {
  const { isInitialized, error, isLoading, retryCount, maxRetries } = useDbInit();
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center max-w-md p-6 border rounded-lg shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-xl font-medium mb-2">Initializing ZenTracker</p>
          <p className="text-muted-foreground mb-4">This may take a moment...</p>
          <div className="w-full bg-secondary rounded-full h-2.5 mb-2">
            <div className="bg-primary h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground mt-4">
              Retry attempt {retryCount}/{maxRetries}...
            </p>
          )}
        </div>
      </div>
    );
  }
  
  if (!isInitialized && error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center max-w-md p-6 border rounded-lg shadow-sm">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="font-semibold">Database Initialization Error</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
          
          <p className="text-muted-foreground mb-4">
            {retryCount >= maxRetries 
              ? "Maximum retry attempts reached. Please try manually refreshing the page."
              : "ZenTracker is having trouble initializing the database. Retrying automatically..."}
          </p>

          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors inline-flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </button>
          
          <div className="mt-4 text-xs text-muted-foreground">
            <p>If the problem persists, try:</p>
            <ul className="list-disc list-inside mt-1 text-left">
              <li>Clearing your browser cache</li>
              <li>Using a different browser</li>
              <li>Checking your internet connection</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <PrivateRoute>
                    <Index />
                  </PrivateRoute>
                } />
                <Route path="/habits" element={
                  <PrivateRoute>
                    <Habits />
                  </PrivateRoute>
                } />
                <Route path="/tasks" element={
                  <PrivateRoute>
                    <Tasks />
                  </PrivateRoute>
                } />
                <Route path="/calendar" element={
                  <PrivateRoute>
                    <CalendarPage />
                  </PrivateRoute>
                } />
                <Route path="/insights" element={
                  <PrivateRoute>
                    <Insights />
                  </PrivateRoute>
                } />
                <Route path="/achievements" element={
                  <PrivateRoute>
                    <Achievements />
                  </PrivateRoute>
                } />
                <Route path="/daily-routine" element={
                  <PrivateRoute>
                    <DailyRoutine />
                  </PrivateRoute>
                } />
                <Route path="/settings" element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
