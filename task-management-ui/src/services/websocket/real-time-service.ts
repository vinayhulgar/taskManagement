import { webSocketService, WebSocketMessage } from './websocket-service';
import { useTasksStore } from '../../stores/tasks-store';
import { useNotificationsStore } from '../../stores/notifications-store';
import { useTeamsStore } from '../../stores/teams-store';
import { useProjectsStore } from '../../stores/projects-store';

export interface UserPresence {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
}

export interface TaskUpdateEvent {
  taskId: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed';
  task: any;
  userId: string;
  username: string;
}

export interface NotificationEvent {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'comment_added' | 'project_updated' | 'team_invitation';
  title: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

export interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  userId: string;
  username: string;
  entityType: 'task' | 'project' | 'team';
  entityId: string;
  timestamp: string;
  metadata?: any;
}

export class RealTimeService {
  private userPresenceMap = new Map<string, UserPresence>();
  private connectionListeners: Array<(connected: boolean) => void> = [];
  private presenceListeners: Array<(users: UserPresence[]) => void> = [];

  constructor() {
    this.setupEventHandlers();
  }

  async connect(): Promise<void> {
    try {
      await webSocketService.connect();
      this.subscribeToUserPresence();
    } catch (error) {
      console.error('Failed to connect to real-time service:', error);
      throw error;
    }
  }

  disconnect(): void {
    webSocketService.disconnect();
    this.userPresenceMap.clear();
  }

  // Connection status
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  isConnected(): boolean {
    return webSocketService.isConnected();
  }

  // User presence
  onPresenceChange(callback: (users: UserPresence[]) => void): () => void {
    this.presenceListeners.push(callback);
    return () => {
      const index = this.presenceListeners.indexOf(callback);
      if (index > -1) {
        this.presenceListeners.splice(index, 1);
      }
    };
  }

  getOnlineUsers(): UserPresence[] {
    return Array.from(this.userPresenceMap.values()).filter(
      user => user.status === 'online'
    );
  }

  getUserPresence(userId: string): UserPresence | undefined {
    return this.userPresenceMap.get(userId);
  }

  // Task updates
  subscribeToTaskUpdates(projectId?: string): void {
    webSocketService.send({
      type: 'subscribe_task_updates',
      payload: { projectId },
    });
  }

  unsubscribeFromTaskUpdates(projectId?: string): void {
    webSocketService.send({
      type: 'unsubscribe_task_updates',
      payload: { projectId },
    });
  }

  // Project updates
  subscribeToProjectUpdates(projectId: string): void {
    webSocketService.send({
      type: 'subscribe_project_updates',
      payload: { projectId },
    });
  }

  unsubscribeFromProjectUpdates(projectId: string): void {
    webSocketService.send({
      type: 'unsubscribe_project_updates',
      payload: { projectId },
    });
  }

  // Team updates
  subscribeToTeamUpdates(teamId: string): void {
    webSocketService.send({
      type: 'subscribe_team_updates',
      payload: { teamId },
    });
  }

  unsubscribeFromTeamUpdates(teamId: string): void {
    webSocketService.send({
      type: 'unsubscribe_team_updates',
      payload: { teamId },
    });
  }

  private setupEventHandlers(): void {
    // Connection events
    webSocketService.on('connection', (message) => {
      const { connected } = message.payload;
      this.connectionListeners.forEach(callback => callback(connected));
    });

    // User presence events
    webSocketService.on('user_presence_update', (message) => {
      this.handleUserPresenceUpdate(message.payload);
    });

    webSocketService.on('user_presence_list', (message) => {
      this.handleUserPresenceList(message.payload);
    });

    // Task events
    webSocketService.on('task_update', (message) => {
      this.handleTaskUpdate(message.payload);
    });

    webSocketService.on('task_created', (message) => {
      this.handleTaskUpdate({ ...message.payload, action: 'created' });
    });

    webSocketService.on('task_deleted', (message) => {
      this.handleTaskUpdate({ ...message.payload, action: 'deleted' });
    });

    // Notification events
    webSocketService.on('notification', (message) => {
      this.handleNotification(message.payload);
    });

    // Activity events
    webSocketService.on('activity', (message) => {
      this.handleActivity(message.payload);
    });

    // Project events
    webSocketService.on('project_update', (message) => {
      this.handleProjectUpdate(message.payload);
    });

    // Team events
    webSocketService.on('team_update', (message) => {
      this.handleTeamUpdate(message.payload);
    });

    // Error handling
    webSocketService.on('error', (message) => {
      console.error('WebSocket error:', message.payload);
    });
  }

  private subscribeToUserPresence(): void {
    webSocketService.send({
      type: 'subscribe_user_presence',
      payload: {},
    });
  }

  private handleUserPresenceUpdate(presence: UserPresence): void {
    this.userPresenceMap.set(presence.userId, presence);
    this.notifyPresenceListeners();
  }

  private handleUserPresenceList(presenceList: UserPresence[]): void {
    this.userPresenceMap.clear();
    presenceList.forEach(presence => {
      this.userPresenceMap.set(presence.userId, presence);
    });
    this.notifyPresenceListeners();
  }

  private notifyPresenceListeners(): void {
    const users = Array.from(this.userPresenceMap.values());
    this.presenceListeners.forEach(callback => callback(users));
  }

  private handleTaskUpdate(event: TaskUpdateEvent): void {
    const tasksStore = useTasksStore.getState();
    
    switch (event.action) {
      case 'created':
        tasksStore.addTask(event.task);
        break;
      case 'updated':
      case 'status_changed':
        tasksStore.updateTask(event.taskId, event.task);
        break;
      case 'deleted':
        tasksStore.removeTask(event.taskId);
        break;
    }

    // Show toast notification for task updates
    const notificationsStore = useNotificationsStore.getState();
    notificationsStore.addToast({
      id: `task-${event.taskId}-${Date.now()}`,
      type: 'info',
      title: 'Task Updated',
      message: `Task "${event.task.title}" was ${event.action} by ${event.username}`,
      duration: 3000,
    });
  }

  private handleNotification(notification: NotificationEvent): void {
    const notificationsStore = useNotificationsStore.getState();
    
    // Add to notifications list
    notificationsStore.addNotification(notification);
    
    // Show toast notification
    notificationsStore.addToast({
      id: notification.id,
      type: this.getToastTypeFromNotification(notification.type),
      title: notification.title,
      message: notification.message,
      duration: 5000,
    });
  }

  private handleActivity(activity: ActivityEvent): void {
    // Update activity feeds in relevant stores
    switch (activity.entityType) {
      case 'task':
        // Task activities are handled by task updates
        break;
      case 'project':
        const projectsStore = useProjectsStore.getState();
        projectsStore.addActivity(activity);
        break;
      case 'team':
        const teamsStore = useTeamsStore.getState();
        teamsStore.addActivity(activity);
        break;
    }
  }

  private handleProjectUpdate(event: any): void {
    const projectsStore = useProjectsStore.getState();
    
    switch (event.action) {
      case 'created':
        projectsStore.addProject(event.project);
        break;
      case 'updated':
        projectsStore.updateProject(event.projectId, event.project);
        break;
      case 'deleted':
        projectsStore.removeProject(event.projectId);
        break;
      case 'member_added':
      case 'member_removed':
        projectsStore.updateProjectMembers(event.projectId, event.members);
        break;
    }
  }

  private handleTeamUpdate(event: any): void {
    const teamsStore = useTeamsStore.getState();
    
    switch (event.action) {
      case 'created':
        teamsStore.addTeam(event.team);
        break;
      case 'updated':
        teamsStore.updateTeam(event.teamId, event.team);
        break;
      case 'deleted':
        teamsStore.removeTeam(event.teamId);
        break;
      case 'member_added':
      case 'member_removed':
        teamsStore.updateTeamMembers(event.teamId, event.members);
        break;
    }
  }

  private getToastTypeFromNotification(type: string): 'success' | 'error' | 'warning' | 'info' {
    switch (type) {
      case 'task_completed':
        return 'success';
      case 'task_assigned':
        return 'info';
      case 'team_invitation':
        return 'info';
      case 'project_updated':
        return 'info';
      case 'comment_added':
        return 'info';
      default:
        return 'info';
    }
  }
}

// Singleton instance
export const realTimeService = new RealTimeService();