import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/theme-provider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Habits from "./pages/Habits";
import Tasks from "./pages/Tasks";
import CalendarPage from "./pages/Calendar";
import Insights from "./pages/Insights";
import Achievements from "./pages/Achievements";
import Settings from "./pages/Settings";
import DailyRoutine from "./pages/DailyRoutine";
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
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/daily-routine" element={<DailyRoutine />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
