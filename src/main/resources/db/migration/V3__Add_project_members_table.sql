-- Create project_members table for project assignments
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_project_member_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_member_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate assignments
    CONSTRAINT uk_project_member_project_user UNIQUE (project_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_project_member_project ON project_members(project_id);
CREATE INDEX idx_project_member_user ON project_members(user_id);
CREATE INDEX idx_project_member_assigned_by ON project_members(assigned_by);

-- Add comments for documentation
COMMENT ON TABLE project_members IS 'Project member assignments linking users to specific projects';
COMMENT ON COLUMN project_members.id IS 'Unique identifier for the project member assignment';
COMMENT ON COLUMN project_members.project_id IS 'Reference to the project';
COMMENT ON COLUMN project_members.user_id IS 'Reference to the assigned user';
COMMENT ON COLUMN project_members.assigned_by IS 'Reference to the user who made the assignment';
COMMENT ON COLUMN project_members.assigned_at IS 'Timestamp when the assignment was created';