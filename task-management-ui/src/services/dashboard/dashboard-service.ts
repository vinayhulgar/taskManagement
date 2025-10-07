import { apiClient } from '../api';
import { Activity, ApiResponse } from '../../types';
import { TaskService, TaskStatsResponse } from '../task/task-service';
import { ProjectService, ProjectStatsResponse } from '../project/project-service';

export interface DashboardStats {
  taskStats: TaskStatsResponse;
  projectStats: ProjectStatsResponse;
  recentActivities: Activity[];
}

export interface ActivitySearchParams {
  limit?: number;
  days?: number;
  entityType?: string;
  entityId?: string;
}

export class DashboardService {
  private static readonly DASHBOARD_ENDPOINTS = {
    STATS: '/dashboard/stats',
    ACTIVITIES: '/dashboard/activities',
    RECENT_ACTIVITIES: '/dashboard/recent-activities',
    OVERVIEW: '/dashboard/overview',
  } as const;

  /**
   * Get dashboard overview data
   */
  static async getDashboardOverview(): Promise<DashboardStats> {
    try {
      // Fetch all data in parallel
      const [taskStats, projectStats, activities] = await Promise.all([
        TaskService.getTaskStats(),
        ProjectService.getProjectStats(),
        this.getRecentActivities({ limit: 10, days: 7 }),
      ]);

      return {
        taskStats,
        projectStats,
        recentActivities: activities,
      };
    } catch (error) {
      console.error('Failed to fetch dashboard overview:', error);
      throw error;
    }
  }

  /**
   * Get recent activities
   */
  static async getRecentActivities(params: ActivitySearchParams = {}): Promise<Activity[]> {
    const searchParams = new URLSearchParams();

    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.days) searchParams.append('days', params.days.toString());
    if (params.entityType) searchParams.append('entityType', params.entityType);
    if (params.entityId) searchParams.append('entityId', params.entityId);

    try {
      const response = await apiClient.get<ApiResponse<Activity[]>>(
        `${this.DASHBOARD_ENDPOINTS.RECENT_ACTIVITIES}?${searchParams.toString()}`
      );

      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<{
    tasks: TaskStatsResponse;
    projects: ProjectStatsResponse;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        tasks: TaskStatsResponse;
        projects: ProjectStatsResponse;
      }>>(this.DASHBOARD_ENDPOINTS.STATS);

      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Fallback to individual service calls
      const [taskStats, projectStats] = await Promise.all([
        TaskService.getTaskStats(),
        ProjectService.getProjectStats(),
      ]);

      return {
        tasks: taskStats,
        projects: projectStats,
      };
    }
  }

  /**
   * Refresh dashboard data
   */
  static async refreshDashboard(): Promise<DashboardStats> {
    return this.getDashboardOverview();
  }
}

export default DashboardService;