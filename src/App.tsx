
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
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

function App() {
  const { isInitialized, error } = useDbInit();
  
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing database...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
            <p className="font-semibold">Error initializing database</p>
            <p className="text-sm">{error.message}</p>
          </div>
          <p className="text-muted-foreground">
            Please refresh the page to try again.
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
