-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_notification_type ON notifications(type);
CREATE INDEX idx_notification_read ON notifications(is_read);
CREATE INDEX idx_notification_created ON notifications(created_at);
CREATE INDEX idx_notification_entity ON notifications(entity_type, entity_id);
CREATE INDEX idx_notification_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notification_user_created ON notifications(user_id, created_at);

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'User notifications for task and project updates';
COMMENT ON COLUMN notifications.user_id IS 'User who receives the notification';
COMMENT ON COLUMN notifications.type IS 'Type of notification (TASK_ASSIGNED, TASK_COMMENT, etc.)';
COMMENT ON COLUMN notifications.title IS 'Short title for the notification';
COMMENT ON COLUMN notifications.message IS 'Detailed notification message';
COMMENT ON COLUMN notifications.entity_type IS 'Type of related entity (Task, Project, etc.)';
COMMENT ON COLUMN notifications.entity_id IS 'ID of the related entity';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read';
COMMENT ON COLUMN notifications.read_at IS 'When the notification was marked as read';
COMMENT ON COLUMN notifications.created_at IS 'When the notification was created';