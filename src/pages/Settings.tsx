
import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download, Upload, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const Settings = () => {
  const [darkMode, setDarkMode] = useLocalStorage("dark-mode", false);
  const [notifications, setNotifications] = useLocalStorage("notifications", true);
  const [soundAlerts, setSoundAlerts] = useLocalStorage("sound-alerts", false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState("");

  // Apply dark mode on mount and when it changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    toast.success(`${checked ? "Dark" : "Light"} mode activated`);
  };

  // Export all app data
  const handleExportData = () => {
    try {
      // Get all localStorage data
      const dataToExport: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("zen-tracker-") || 
            key.includes("-energy-") ||
            key.includes("-breaks") ||
            key.includes("-tasks") ||
            key.includes("-habits") ||
            key.includes("-priorities") ||
            key.includes("focus-") ||
            key.includes("dark-mode") ||
            key.includes("notifications") ||
            key.includes("sound-alerts")) {
          try {
            dataToExport[key] = JSON.parse(localStorage.getItem(key) || "null");
          } catch (e) {
            dataToExport[key] = localStorage.getItem(key);
          }
        }
      }

      // Create a JSON file
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      // Create download link
      const exportFileDefaultName = `zen-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  // Import app data
  const handleImportData = () => {
    try {
      if (!importData) {
        toast.error("No data to import");
        return;
      }

      const parsedData = JSON.parse(importData);
      
      // Apply imported data to localStorage
      for (const [key, value] of Object.entries(parsedData)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
      
      setImportDialogOpen(false);
      toast.success("Data imported successfully. Reloading app...");
      
      // Reload the page after a brief delay to apply all changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import data. Invalid format.");
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setImportData(content);
      } catch (error) {
        toast.error("Failed to read file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        
        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle between light and dark theme
                </p>
              </div>
              <Switch 
                id="dark-mode" 
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Enable notifications for tasks and habits
                </p>
              </div>
              <Switch 
                id="notifications" 
                checked={notifications}
                onCheckedChange={(checked) => setNotifications(checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound">Sound Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound when timer ends
                </p>
              </div>
              <Switch 
                id="sound" 
                checked={soundAlerts}
                onCheckedChange={(checked) => setSoundAlerts(checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Export your data to back up or transfer to another device, or import previously exported data.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="file-upload">Upload data file</Label>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('file-upload')?.click()}
                className="w-full mt-2"
              >
                <Upload className="mr-2 h-4 w-4" />
                Select File
              </Button>
            </div>
            
            <Separator />
            
            <div>
              <Label htmlFor="import-data">Or paste data here</Label>
              <Textarea
                id="import-data"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste exported JSON data here..."
                className="mt-2 font-mono text-xs"
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportData}>
              <Save className="mr-2 h-4 w-4" />
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Settings;
