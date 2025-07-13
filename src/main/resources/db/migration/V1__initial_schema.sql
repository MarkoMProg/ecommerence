CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_complete BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    is_furry BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE bio (
    id BIGSERIAL PRIMARY KEY,
    user_profile_id BIGINT NOT NULL,
    role VARCHAR(255),
    skill VARCHAR(255),
    skill_level VARCHAR(50) CHECK (skill_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    FOREIGN KEY (user_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    time TIMESTAMP
);

CREATE TABLE event_bio (
    id BIGSERIAL PRIMARY KEY,
    user_profile_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    motivation VARCHAR(50) CHECK (motivation IN ('Learning', 'Achievement', 'Social', 'Career', 'Innovation')),
    commitment_level VARCHAR(50) CHECK (commitment_level IN ('Casual', 'Moderate', 'Intense')),
    roles VARCHAR(255),
    looking_roles VARCHAR(255),
    FOREIGN KEY (user_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE (user_profile_id, event_id)
);

CREATE TABLE connections (
    id BIGSERIAL PRIMARY KEY,
    user1_id UUID NOT NULL,
    user2_id UUID NOT NULL,
    user1_status VARCHAR(50) NOT NULL,
    user2_status VARCHAR(50) NOT NULL,
    datetime TIMESTAMP NOT NULL,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user1_id, user2_id)
);

CREATE TABLE chat (
    id BIGSERIAL PRIMARY KEY,
    user1_id UUID NOT NULL,
    user2_id UUID NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sender_id UUID NOT NULL,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO users (id, email, password_hash, profile_complete) VALUES
('11111111-1111-1111-1111-111111111111', 'alice@example.com', 'hashed_password1', TRUE),
('22222222-2222-2222-2222-222222222222', 'bob@example.com', 'hashed_password2', TRUE),
('33333333-3333-3333-3333-333333333333', 'charlie@example.com', 'hashed_password3', TRUE),
('44444444-4444-4444-4444-444444444444', 'dave@example.com', 'hashed_password4', TRUE);

INSERT INTO user_profiles (user_id, is_furry) VALUES
('11111111-1111-1111-1111-111111111111', TRUE),
('22222222-2222-2222-2222-222222222222', TRUE),
('33333333-3333-3333-3333-333333333333', FALSE),
('44444444-4444-4444-4444-444444444444', FALSE);

INSERT INTO bio (user_profile_id, role, skill, skill_level) VALUES
(1, 'Frontend Developer', 'React', 'Intermediate'),
(2, 'Backend Developer', 'Python', 'Advanced'),
(3, 'UI/UX Designer', 'Figma', 'Beginner'),
(4, 'Product Manager', 'Agile', 'Expert');

INSERT INTO events (name, location, time) VALUES
('Hackathon 2025', 'San Francisco', '2025-08-01 09:00:00'),
('Tech Meetup', 'New York', '2025-08-15 18:00:00');

INSERT INTO event_bio (user_profile_id, event_id, motivation, commitment_level, roles, looking_roles) VALUES
(1, 1, 'Learning', 'Moderate', 'Frontend Developer', 'Backend Developer, Product Manager'),
(2, 1, 'Achievement', 'Intense', 'Backend Developer', 'Frontend Developer, UI/UX Designer'),
(3, 1, 'Social', 'Casual', 'UI/UX Designer', 'Product Manager, Pitcher/Presenter'),
(4, 2, 'Career', 'Moderate', 'Product Manager', 'Frontend Developer, Data Analyst');

INSERT INTO connections (user1_id, user2_id, user1_status, user2_status, datetime) VALUES
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'ACCEPTED', 'ACCEPTED', '2025-07-13 09:00:00');

INSERT INTO chat (user1_id, user2_id, message, timestamp, is_read, sender_id) VALUES
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Hi, let’s collaborate!', '2025-07-13 09:05:00', FALSE, '11111111-1111-1111-1111-111111111111');