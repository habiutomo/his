import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function TaskList() {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Fetch tasks for the current user
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/user", userId],
    enabled: !!userId,
  });

  // Sort tasks by priority and due date
  const sortedTasks = tasks?.sort((a, b) => {
    // First sort by priority
    const priorityOrder = { urgent: 0, medium: 1, standard: 2 };
    const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - 
                         priorityOrder[b.priority as keyof typeof priorityOrder];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/user", userId] });
    },
  });

  const handleTaskComplete = (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">Tasks</CardTitle>
          <Button size="icon" variant="ghost" className="rounded-full">
            <Plus className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <ul className="divide-y divide-gray-200">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="py-3">
                <div className="flex items-start">
                  <Skeleton className="h-4 w-4 mt-1 rounded" />
                  <div className="ml-3 flex-1">
                    <Skeleton className="h-4 w-full max-w-[250px] mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="ml-2 h-5 w-16 rounded-full" />
                </div>
              </li>
            ))
          ) : sortedTasks?.length === 0 ? (
            <li className="py-8 text-center text-gray-500">
              No tasks found. Add a new task to get started.
            </li>
          ) : (
            sortedTasks?.map((task) => (
              <li key={task.id} className="py-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <Checkbox 
                      checked={task.status === "completed"}
                      onCheckedChange={() => handleTaskComplete(task.id, task.status)}
                      className="h-4 w-4 text-primary border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`text-sm font-medium ${task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due {format(new Date(task.dueDate), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </div>
                  <div className="ml-2">
                    <Badge variant={
                      task.priority === "urgent" ? "destructive" :
                      task.priority === "medium" ? "warning" :
                      "default"
                    }>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
