
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
import { Loader2, AlertCircle } from 'lucide-react';

const queryClient = new QueryClient();

function App() {
  const { isInitialized, error, isLoading } = useDbInit();
  
  if (isLoading || !isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-xl font-medium mb-2">Initializing ZenTracker</p>
          <p className="text-muted-foreground">This may take a moment...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="font-semibold">Database Initialization Error</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
          <p className="text-muted-foreground">
            Please try refreshing the page. If the problem persists, check your browser's localStorage settings or try a different browser.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
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
