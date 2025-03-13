
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AppLayout from "@/components/layout/AppLayout";

// Sample data for charts
const habitData = [
  { name: "Mon", completed: 4 },
  { name: "Tue", completed: 3 },
  { name: "Wed", completed: 5 },
  { name: "Thu", completed: 2 },
  { name: "Fri", completed: 3 },
  { name: "Sat", completed: 4 },
  { name: "Sun", completed: 1 },
];

const taskData = [
  { name: "Mon", completed: 7, total: 10 },
  { name: "Tue", completed: 5, total: 8 },
  { name: "Wed", completed: 9, total: 12 },
  { name: "Thu", completed: 4, total: 6 },
  { name: "Fri", completed: 6, total: 9 },
  { name: "Sat", completed: 3, total: 5 },
  { name: "Sun", completed: 2, total: 4 },
];

const Insights = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-subtle">
            <CardHeader>
              <CardTitle>Habit Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={habitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="shadow-subtle">
            <CardHeader>
              <CardTitle>Task Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#e5e7eb" />
                  <Bar dataKey="completed" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Insights;
