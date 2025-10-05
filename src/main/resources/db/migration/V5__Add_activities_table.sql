-- Create activities table for audit logging
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    old_values TEXT,
    new_values TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_activity_user ON activities(user_id);
CREATE INDEX idx_activity_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activity_action ON activities(action);
CREATE INDEX idx_activity_timestamp ON activities(timestamp);
CREATE INDEX idx_activity_user_entity ON activities(user_id, entity_type);
CREATE INDEX idx_activity_user_timestamp ON activities(user_id, timestamp);

-- Add comments for documentation
COMMENT ON TABLE activities IS 'Audit trail for all CRUD operations';
COMMENT ON COLUMN activities.user_id IS 'User who performed the action';
COMMENT ON COLUMN activities.entity_type IS 'Type of entity (User, Team, Project, Task, etc.)';
COMMENT ON COLUMN activities.entity_id IS 'ID of the affected entity';
COMMENT ON COLUMN activities.action IS 'Action performed (CREATE, UPDATE, DELETE, etc.)';
COMMENT ON COLUMN activities.details IS 'Human-readable description of the action';
COMMENT ON COLUMN activities.old_values IS 'JSON representation of old values (for updates/deletes)';
COMMENT ON COLUMN activities.new_values IS 'JSON representation of new values (for creates/updates)';
COMMENT ON COLUMN activities.timestamp IS 'When the action occurred';