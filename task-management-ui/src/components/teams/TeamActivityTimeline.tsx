import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  UserPlus, 
  FolderPlus, 
  CheckCircle, 
  MessageCircle,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { TeamService } from '../../services/team/team-service';
import { formatDate, formatRelativeTime } from '../../utils';

interface ActivityItem {
  id: string;
  type: 'member_added' | 'project_created' | 'task_completed' | 'comment_added';
  description: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface TeamActivityTimelineProps {
  teamId: string;
}

export const TeamActivityTimeline: React.FC<TeamActivityTimelineProps> = ({
  teamId
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadTeamActivity();
  }, [teamId]);

  const loadTeamActivity = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const activityData = await TeamService.getTeamActivity(teamId, 30);
      
      // Transform the activity data to match our interface
      const transformedActivities: ActivityItem[] = activityData.recentActivities.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        user: activity.user,
        createdAt: activity.createdAt,
        metadata: activity.metadata
      }));
      
      setActivities(transformedActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team activity');
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'member_added':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'project_created':
        return <FolderPlus className="w-4 h-4 text-green-600" />;
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      case 'comment_added':
        return <MessageCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'member_added':
        return 'bg-blue-100';
      case 'project_created':
        return 'bg-green-100';
      case 'task_completed':
        return 'bg-purple-100';
      case 'comment_added':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTeamActivity}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recent Activity</h3>
          <Calendar className="w-4 h-4 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1">
              Team activity will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-start space-x-3">
                {/* Activity Icon */}
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">
                          {activity.user.firstName} {activity.user.lastName}
                        </span>{' '}
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline Line */}
                {index < displayedActivities.length - 1 && (
                  <div className="absolute left-6 mt-10 w-px h-6 bg-gray-200" 
                       style={{ marginLeft: '1rem' }} />
                )}
              </div>
            ))}

            {/* Show More/Less Button */}
            {activities.length > 5 && (
              <div className="pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full text-sm"
                >
                  {showAll ? 'Show Less' : `Show ${activities.length - 5} More`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};