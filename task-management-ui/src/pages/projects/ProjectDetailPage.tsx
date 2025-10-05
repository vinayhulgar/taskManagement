import React from 'react';
import { useParams } from 'react-router-dom';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Project Details</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Project detail page for project ID: {projectId}</p>
        <p className="text-gray-600">To be implemented in later tasks</p>
      </div>
    </div>
  );
};

export default ProjectDetailPage;