import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Welcome back, {user?.firstName || 'User'}! 
        </p>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🎉 Authentication Bypassed!</h2>
          <p className="text-gray-600 mb-4">
            You can now test the application without login requirements.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Teams</h3>
              <p className="text-blue-700 text-sm">Manage your teams</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900">Projects</h3>
              <p className="text-green-700 text-sm">Track your projects</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900">Tasks</h3>
              <p className="text-purple-700 text-sm">Organize your tasks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;