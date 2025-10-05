import React from 'react';
import { useParams } from 'react-router-dom';

const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Team Details</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Team detail page for team ID: {teamId}</p>
        <p className="text-gray-600">To be implemented in later tasks</p>
      </div>
    </div>
  );
};

export default TeamDetailPage;