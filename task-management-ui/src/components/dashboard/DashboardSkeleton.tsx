import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Skeleton } from '../ui/Loading';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton variant="text" width="200px" height="32px" />
          <Skeleton variant="text" width="300px" height="20px" />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="80px" height="16px" />
                  <Skeleton variant="text" width="60px" height="32px" />
                </div>
                <Skeleton variant="rectangular" width="48px" height="48px" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks Widget Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton variant="text" width="80px" height="24px" />
            <Skeleton variant="text" width="60px" height="32px" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" width="70%" height="16px" />
                      <div className="flex items-center space-x-2">
                        <Skeleton variant="text" width="60px" height="20px" />
                        <Skeleton variant="text" width="80px" height="20px" />
                      </div>
                    </div>
                    <Skeleton variant="circular" width="24px" height="24px" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton variant="text" width="120px" height="24px" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Skeleton variant="circular" width="32px" height="32px" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="80%" height="16px" />
                    <Skeleton variant="text" width="40%" height="12px" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Progress Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton variant="text" width="120px" height="24px" />
            <Skeleton variant="text" width="60px" height="32px" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <Skeleton variant="text" width="60%" height="16px" />
                      <Skeleton variant="text" width="60px" height="20px" />
                    </div>
                    <Skeleton variant="text" width="30px" height="16px" />
                  </div>
                  <Skeleton variant="rectangular" width="100%" height="8px" />
                  <div className="flex items-center justify-between mt-2">
                    <Skeleton variant="text" width="50%" height="12px" />
                    <Skeleton variant="text" width="30%" height="12px" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const TaskSummaryCardSkeleton: React.FC = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="80px" height="16px" />
          <Skeleton variant="text" width="60px" height="32px" />
        </div>
        <Skeleton variant="rectangular" width="48px" height="48px" />
      </div>
    </CardContent>
  </Card>
);

export const MyTasksWidgetSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton variant="text" width="80px" height="24px" />
      <Skeleton variant="text" width="60px" height="32px" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="70%" height="16px" />
                <div className="flex items-center space-x-2">
                  <Skeleton variant="text" width="60px" height="20px" />
                  <Skeleton variant="text" width="80px" height="20px" />
                </div>
              </div>
              <Skeleton variant="circular" width="24px" height="24px" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const RecentActivitySkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <Skeleton variant="text" width="120px" height="24px" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-start space-x-3">
            <Skeleton variant="circular" width="32px" height="32px" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="80%" height="16px" />
              <Skeleton variant="text" width="40%" height="12px" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const ProjectProgressSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton variant="text" width="120px" height="24px" />
      <Skeleton variant="text" width="60px" height="32px" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 flex-1">
                <Skeleton variant="text" width="60%" height="16px" />
                <Skeleton variant="text" width="60px" height="20px" />
              </div>
              <Skeleton variant="text" width="30px" height="16px" />
            </div>
            <Skeleton variant="rectangular" width="100%" height="8px" />
            <div className="flex items-center justify-between mt-2">
              <Skeleton variant="text" width="50%" height="12px" />
              <Skeleton variant="text" width="30%" height="12px" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);