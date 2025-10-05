-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(500),
    owner_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_teams_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNING',
    start_date DATE,
    end_date DATE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    parent_task_id UUID,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    status VARCHAR(20) NOT NULL DEFAULT 'TODO',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    assignee_id UUID,
    due_date TIMESTAMP,
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_parent FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance optimization
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_role ON users(role);

CREATE INDEX idx_team_name ON teams(name);
CREATE INDEX idx_team_owner ON teams(owner_id);

CREATE INDEX idx_project_team ON projects(team_id);
CREATE INDEX idx_project_status ON projects(status);
CREATE INDEX idx_project_created_by ON projects(created_by);

CREATE INDEX idx_task_project ON tasks(project_id);
CREATE INDEX idx_task_parent ON tasks(parent_task_id);
CREATE INDEX idx_task_assignee ON tasks(assignee_id);
CREATE INDEX idx_task_status ON tasks(status);
CREATE INDEX idx_task_priority ON tasks(priority);
CREATE INDEX idx_task_due_date ON tasks(due_date);
CREATE INDEX idx_task_created_by ON tasks(created_by);

-- Add constraints for enum values
ALTER TABLE users ADD CONSTRAINT chk_user_role 
    CHECK (role IN ('ADMIN', 'MANAGER', 'MEMBER'));

ALTER TABLE projects ADD CONSTRAINT chk_project_status 
    CHECK (status IN ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'));

ALTER TABLE tasks ADD CONSTRAINT chk_task_status 
    CHECK (status IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'));

ALTER TABLE tasks ADD CONSTRAINT chk_task_priority 
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

-- Add validation constraints
ALTER TABLE users ADD CONSTRAINT chk_user_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE teams ADD CONSTRAINT chk_team_name_length 
    CHECK (LENGTH(name) >= 3 AND LENGTH(name) <= 50);

ALTER TABLE projects ADD CONSTRAINT chk_project_name_length 
    CHECK (LENGTH(name) >= 3 AND LENGTH(name) <= 100);

ALTER TABLE projects ADD CONSTRAINT chk_project_dates 
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

ALTER TABLE tasks ADD CONSTRAINT chk_task_title_length 
    CHECK (LENGTH(title) >= 3 AND LENGTH(title) <= 200);