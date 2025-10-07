-- Test user data for H2 database
-- Password is 'password123' encoded with BCrypt
INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at, last_login) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    'test@example.com', 
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFDYZt5qkB7CqQrOgX6zMRG', 
    'Test', 
    'User', 
    'MEMBER', 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP, 
    NULL
);

-- Admin user
INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at, last_login) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440001', 
    'admin@example.com', 
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFDYZt5qkB7CqQrOgX6zMRG', 
    'Admin', 
    'User', 
    'ADMIN', 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP, 
    NULL
);