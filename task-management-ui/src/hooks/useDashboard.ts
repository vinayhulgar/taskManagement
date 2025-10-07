import { useState, useEffect, useCallback } from 'react';
import { DashboardService, DashboardStats } from '../services/dashboard';
import { TaskService } from '../services/task/task-service';
import { ProjectService } from '../services/project/project-service';
import { useTasksStore } from '../stores/tasks-store';
import { useProjectsStore } from '../stores/projects-store';
import { Activity, Task, Project } from '../types';

export interface UseDashboardReturn {
  // Data
  stats: DashboardStats | null;
  myTasks: Task[];
  myProjects: Project[];
  recentActivities: Activity[];
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshActivities: () => Promise<void>;
}

export const useDashboard = (): UseDashboardReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get data from stores
  const { tasks, setTasks, setLoading: setTasksLoading } = useTasksStore();
  const { projects, setProjects, setLoading: setProjectsLoading } = useProjectsStore();

  // Filter tasks and projects for current user
  const myTasks = tasks.filter(task => task.assigneeId); // In real app, filter by current user ID
  const myProjects = projects.filter(project => project.createdById); // In real app, filter by current user ID

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch dashboard overview
      const dashboardStats = await DashboardService.getDashboardOverview();
      setStats(dashboardStats);
      setRecentActivities(dashboardStats.recentActivities);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchMyTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      const tasks = await TaskService.getMyTasks();
      setTasks(tasks);
    } catch (err) {
      console.error('Failed to fetch my tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  }, [setTasks, setTasksLoading]);

  const fetchMyProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const projects = await ProjectService.getMyProjects();
      setProjects(projects);
    } catch (err) {
      console.error('Failed to fetch my projects:', err);
    } finally {
      setProjectsLoading(false);
    }
  }, [setProjects, setProjectsLoading]);

  const fetchRecentActivities = useCallback(async () => {
    try {
      const activities = await DashboardService.getRecentActivities({ limit: 10, days: 7 });
      setRecentActivities(activities);
    } catch (err) {
      console.error('Failed to fetch recent activities:', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchDashboardData(true),
      fetchMyTasks(),
      fetchMyProjects(),
    ]);
  }, [fetchDashboardData, fetchMyTasks, fetchMyProjects]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    fetchMyTasks();
    fetchMyProjects();
  }, [fetchDashboardData, fetchMyTasks, fetchMyProjects]);

  return {
    // Data
    stats,
    myTasks,
    myProjects,
    recentActivities,
    
    // Loading states
    isLoading,
    isRefreshing,
    
    // Error states
    error,
    
    // Actions
    refresh,
    refreshTasks: fetchMyTasks,
    refreshProjects: fetchMyProjects,
    refreshActivities: fetchRecentActivities,
  };
};