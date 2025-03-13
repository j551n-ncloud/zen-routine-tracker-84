
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
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const queryClient = new QueryClient();

function App() {
  const { isInitialized, error, isLoading, attempts, maxAttempts } = useDbInit();
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center max-w-md p-6 bg-card border rounded-lg shadow-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium mb-2">Initializing database...</p>
          <p className="text-muted-foreground mb-4">
            {attempts > 0 ? `Attempt ${attempts}/${maxAttempts}` : "Setting up your local database"}
          </p>
          <div className="w-full bg-secondary rounded-full h-2 mb-6">
            <div 
              className="bg-primary h-2 rounded-full transition-all" 
              style={{ width: `${(attempts / maxAttempts) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-muted-foreground">
            This may take a moment. Please be patient.
          </p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center max-w-md p-6 bg-card border border-destructive/20 rounded-lg shadow-md">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <h2 className="text-lg font-bold text-destructive mb-2">Database Initialization Failed</h2>
          <div className="bg-destructive/10 p-4 rounded-md mb-4 text-left">
            <p className="text-sm font-mono whitespace-pre-wrap">{error.message}</p>
          </div>
          <p className="text-muted-foreground mb-4">
            There was a problem setting up the local database. This could be due to network issues or browser compatibility.
          </p>
          <Button 
            className="w-full" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh and Try Again
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Tip: Try using a different browser like Chrome or Firefox if the issue persists.
          </p>
        </div>
      </div>
    );
  }
  
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center max-w-md p-6 bg-card border rounded-lg shadow-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Preparing application...</p>
          <p className="text-muted-foreground">
            Almost ready!
          </p>
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
