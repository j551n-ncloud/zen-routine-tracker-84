
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { FileDown, FileUp, RefreshCw, Trash2, UserCog, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { executeQuery } from "@/services/db-service";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";

// Define interface for user count row
interface UserCountRow {
  count: number;
}

// Define the form schema for user settings
const userSettingsSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  currentPassword: z.string().min(1, {
    message: "Current password is required.",
  }),
  newPassword: z.string().min(6, {
    message: "New password must be at least 6 characters.",
  }),
});

const Settings = () => {
  const { toast: uiToast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, login, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weekStartsOnMonday, setWeekStartsOnMonday] = useState(true);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Setup form
  const form = useForm<z.infer<typeof userSettingsSchema>>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      username: user?.username || "",
      currentPassword: "",
      newPassword: "",
    },
  });

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        currentPassword: "",
        newPassword: "",
      });
    }
  }, [user, form]);

  // Handle user settings submission
  const onSubmitUserSettings = async (values: z.infer<typeof userSettingsSchema>) => {
    setIsUpdatingUser(true);
    try {
      // Verify current password
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', user?.username)
        .eq('password', values.currentPassword)
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      if (!users || users.length === 0) {
        toast.error("Current password is incorrect");
        setIsUpdatingUser(false);
        return;
      }
      
      // Update username and password
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          username: values.username, 
          password: values.newPassword 
        })
        .eq('username', user?.username);
      
      if (updateError) {
        throw updateError;
      }
      
      toast.success("User settings updated successfully");
      setUserSettingsOpen(false);
      
      // Re-login with new credentials
      await logout();
      await login(values.username, values.newPassword);
    } catch (error) {
      console.error("Failed to update user settings:", error);
      toast.error("Failed to update user settings");
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleExportData = () => {
    // Get all data from localStorage
    const exportData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("zen-tracker") || 
          key?.includes("habits") || 
          key?.includes("tasks") || 
          key?.includes("focus") || 
          key?.includes("priorities") || 
          key?.includes("breaks") || 
          key?.includes("energy") || 
          key?.includes("calendar")) {
        try {
          exportData[key] = JSON.parse(localStorage.getItem(key) || "null");
        } catch {
          exportData[key] = localStorage.getItem(key);
        }
      }
    }
    
    // Create file and download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `zen-tracker-data-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("Data exported successfully");
  };

  const handleImportData = () => {
    try {
      const data = JSON.parse(importData);
      
      // Import data into localStorage
      Object.keys(data).forEach(key => {
        localStorage.setItem(key, JSON.stringify(data[key]));
      });
      
      setImportDialogOpen(false);
      setImportData("");
      toast.success("Data imported successfully");
      
      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error("Invalid data format");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    // Clear all app data from localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith("zen-tracker") || 
          key?.includes("habits") || 
          key?.includes("tasks") || 
          key?.includes("focus") || 
          key?.includes("priorities") || 
          key?.includes("breaks") || 
          key?.includes("energy") || 
          key?.includes("calendar")) {
        localStorage.removeItem(key);
      }
    }
    
    setResetConfirmOpen(false);
    toast.success("All data has been reset");
    
    // Reload the page to reflect changes
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        
        <div className="grid gap-6">
          {user?.isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>User Settings</CardTitle>
                <CardDescription>Manage your account credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Current Username</Label>
                    <p className="text-base">{user?.username}</p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setUserSettingsOpen(true)}
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    Change Credentials
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>Configure your app experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark theme
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for tasks and habits
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="week-start">Week Starts On Monday</Label>
                  <p className="text-sm text-muted-foreground">
                    Set Monday as the first day of the week
                  </p>
                </div>
                <Switch
                  id="week-start"
                  checked={weekStartsOnMonday}
                  onCheckedChange={setWeekStartsOnMonday}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export, import, or reset your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExportData}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setImportDialogOpen(true)}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </div>
              
              <Separator />
              
              <div className="pt-2">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setResetConfirmOpen(true)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset All Data
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This will permanently delete all your data and cannot be undone.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Import your previously exported Zen Tracker data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="import-file">Upload JSON File</Label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportData}
              disabled={!importData}
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Confirmation Dialog */}
      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset All Data</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your habits, tasks, and settings will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-destructive font-medium">Are you absolutely sure you want to continue?</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleResetData}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Reset Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* User Settings Dialog */}
      <Dialog open={userSettingsOpen} onOpenChange={setUserSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Account Credentials</DialogTitle>
            <DialogDescription>
              Update your username and password
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitUserSettings)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUserSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingUser}>
                  {isUpdatingUser ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Settings;
