-- Enable the uuid-ossp extension to generate UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    is_verified BOOLEAN DEFAULT FALSE
    verification_token VARCHAR
    reset_token VARCHAR()
);



-- Create the files table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255),
    description TEXT,
    download_count INT DEFAULT 0,
    email_count INT DEFAULT 0
);


