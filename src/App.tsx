
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
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

function App() {
  const { isInitialized, error, initAttempts } = useDbInit();
  
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6 border border-border rounded-lg shadow-md">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-xl font-semibold">Initializing database...</p>
          <p className="text-muted-foreground">This might take a moment...</p>
          
          {initAttempts > 0 && (
            <div className="mt-4 text-amber-600 dark:text-amber-400">
              <p>Initialization attempt {initAttempts + 1}...</p>
            </div>
          )}
          
          {initAttempts >= 2 && (
            <div className="p-4 bg-muted rounded-md text-sm">
              <p className="font-medium mb-2">Troubleshooting tips:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Make sure your internet connection is stable</li>
                <li>Try using a different browser</li>
                <li>Clear your browser cache and cookies</li>
                <li>Disable any browser extensions that might interfere</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6 border border-destructive/50 rounded-lg shadow-md">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
            <p className="font-semibold text-lg mb-2">Failed to initialize database</p>
            <p className="text-sm">{error.message}</p>
          </div>
          <p className="text-muted-foreground">
            Please try refreshing the page or use a different browser.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Page
          </Button>
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
