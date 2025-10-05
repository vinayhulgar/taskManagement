-- Add composite indexes for common query patterns

-- Composite index for task filtering by project and status
CREATE INDEX idx_task_project_status ON tasks(project_id, status);

-- Composite index for task filtering by project and assignee
CREATE INDEX idx_task_project_assignee ON tasks(project_id, assignee_id);

-- Composite index for task filtering by assignee and status
CREATE INDEX idx_task_assignee_status ON tasks(assignee_id, status);

-- Composite index for task filtering by project, status, and priority
CREATE INDEX idx_task_project_status_priority ON tasks(project_id, status, priority);

-- Index for task due date filtering with non-null values
CREATE INDEX idx_task_due_date_not_null ON tasks(due_date) WHERE due_date IS NOT NULL;

-- Composite index for project filtering by team and status
CREATE INDEX idx_project_team_status ON projects(team_id, status);

-- Index for recent activities (created_at descending)
CREATE INDEX idx_task_created_at_desc ON tasks(created_at DESC);
CREATE INDEX idx_project_created_at_desc ON projects(created_at DESC);

-- Partial index for active tasks only
CREATE INDEX idx_task_active ON tasks(project_id, assignee_id) 
WHERE status IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW');

-- Partial index for overdue tasks
CREATE INDEX idx_task_overdue ON tasks(assignee_id, due_date) 
WHERE due_date < CURRENT_TIMESTAMP AND status NOT IN ('COMPLETED', 'BLOCKED');

-- Index for team member lookups
CREATE INDEX idx_team_member_user ON team_members(user_id);
CREATE INDEX idx_team_member_team ON team_members(team_id);

-- Index for project member lookups
CREATE INDEX idx_project_member_user ON project_members(user_id);
CREATE INDEX idx_project_member_project ON project_members(project_id);

-- Index for comment lookups by task
CREATE INDEX idx_comment_task ON comments(task_id);
CREATE INDEX idx_comment_created_at_desc ON comments(created_at DESC);

-- Index for activity lookups
CREATE INDEX idx_activity_user ON activities(user_id);
CREATE INDEX idx_activity_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activity_created_at_desc ON activities(created_at DESC);

-- Index for notification lookups
CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_notification_read_status ON notifications(user_id, is_read);
CREATE INDEX idx_notification_created_at_desc ON notifications(created_at DESC);

-- Add statistics for query planner optimization
ANALYZE users;
ANALYZE teams;
ANALYZE projects;
ANALYZE tasks;
ANALYZE team_members;
ANALYZE project_members;
ANALYZE comments;
ANALYZE activities;
ANALYZE notifications;