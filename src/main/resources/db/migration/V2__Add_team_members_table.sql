-- Create team_members table for team membership management
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invited_by UUID,
    CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_team_members_invited_by FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_team_members_team_user UNIQUE (team_id, user_id)
);

-- Create indexes for performance optimization
CREATE INDEX idx_team_member_team ON team_members(team_id);
CREATE INDEX idx_team_member_user ON team_members(user_id);
CREATE INDEX idx_team_member_invited_by ON team_members(invited_by);