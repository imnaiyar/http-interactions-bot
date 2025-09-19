-- Migration number: 0001 	 2025-09-19T12:09:07.583Z

-- Create table for storing GitHub user preferences
CREATE TABLE github_user_preferences (
    user_id TEXT PRIMARY KEY,
    default_repo TEXT,
    github_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_github_preferences_user_id ON github_user_preferences(user_id);