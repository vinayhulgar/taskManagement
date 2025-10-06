import { apiClient } from '../api';
import { 
  User, 
  UserProfileForm, 
  ApiResponse, 
  PaginatedResponse,
  FilterState,
  SortState 
} from '../../types';

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
}

export interface UserSearchParams {
  query?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface UserStatsResponse {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
}

export class UserService {
  private static readonly USER_ENDPOINTS = {
    USERS: '/users',
    USER_BY_ID: (id: string) => `/users/${id}`,
    CURRENT_USER: '/users/me',
    UPDATE_PROFILE: '/users/me',
    UPLOAD_AVATAR: '/users/me/avatar',
    SEARCH: '/users/search',
    STATS: '/users/stats',
    DEACTIVATE: (id: string) => `/users/${id}/deactivate`,
    ACTIVATE: (id: string) => `/users/${id}/activate`,
  } as const;

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      this.USER_ENDPOINTS.CURRENT_USER
    );

    return response.data.data;
  }

  /**
   * Update current user profile
   */
  static async updateProfile(userData: UserProfileForm): Promise<User> {
    const updateData: UserUpdateRequest = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
    };

    const response = await apiClient.put<ApiResponse<User>>(
      this.USER_ENDPOINTS.UPDATE_PROFILE,
      updateData
    );

    return response.data.data;
  }

  /**
   * Upload user avatar
   */
  static async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post<ApiResponse<User>>(
      this.USER_ENDPOINTS.UPLOAD_AVATAR,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      this.USER_ENDPOINTS.USER_BY_ID(id)
    );

    return response.data.data;
  }

  /**
   * Get all users with pagination and filtering
   */
  static async getUsers(params: UserSearchParams = {}): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams();

    if (params.query) searchParams.append('query', params.query);
    if (params.role) searchParams.append('role', params.role);
    if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.order) searchParams.append('order', params.order);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
      `${this.USER_ENDPOINTS.USERS}?${searchParams.toString()}`
    );

    return response.data.data;
  }

  /**
   * Search users by query
   */
  static async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[]>>(
      `${this.USER_ENDPOINTS.SEARCH}?query=${encodeURIComponent(query)}&limit=${limit}`
    );

    return response.data.data;
  }

  /**
   * Get user statistics (admin only)
   */
  static async getUserStats(): Promise<UserStatsResponse> {
    const response = await apiClient.get<ApiResponse<UserStatsResponse>>(
      this.USER_ENDPOINTS.STATS
    );

    return response.data.data;
  }

  /**
   * Deactivate user (admin only)
   */
  static async deactivateUser(id: string): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      this.USER_ENDPOINTS.DEACTIVATE(id)
    );

    return response.data.data;
  }

  /**
   * Activate user (admin only)
   */
  static async activateUser(id: string): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      this.USER_ENDPOINTS.ACTIVATE(id)
    );

    return response.data.data;
  }

  /**
   * Update user by ID (admin only)
   */
  static async updateUser(id: string, userData: UserUpdateRequest): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      this.USER_ENDPOINTS.USER_BY_ID(id),
      userData
    );

    return response.data.data;
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      this.USER_ENDPOINTS.USER_BY_ID(id)
    );
  }

  /**
   * Get users for assignment (simplified user objects)
   */
  static async getUsersForAssignment(projectId?: string, teamId?: string): Promise<User[]> {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (teamId) params.append('teamId', teamId);

    const response = await apiClient.get<ApiResponse<User[]>>(
      `${this.USER_ENDPOINTS.USERS}/assignable?${params.toString()}`
    );

    return response.data.data;
  }

  /**
   * Validate email availability
   */
  static async validateEmail(email: string): Promise<{ available: boolean }> {
    const response = await apiClient.post<ApiResponse<{ available: boolean }>>(
      `${this.USER_ENDPOINTS.USERS}/validate-email`,
      { email }
    );

    return response.data.data;
  }

  /**
   * Get user activity summary
   */
  static async getUserActivity(
    userId: string, 
    days: number = 30
  ): Promise<{
    tasksCreated: number;
    tasksCompleted: number;
    commentsAdded: number;
    projectsJoined: number;
    lastActivity: string;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.USER_ENDPOINTS.USER_BY_ID(userId)}/activity?days=${days}`
    );

    return response.data.data;
  }
}

export default UserService;