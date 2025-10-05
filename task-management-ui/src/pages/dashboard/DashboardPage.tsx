import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome back!</h2>
        <p className="text-gray-600">
          Hello {user?.firstName} {user?.lastName}, this is your dashboard.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Email: {user?.email}
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;