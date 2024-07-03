# File-Server Project

## Overview

The File-Server project is a web application that allows users to upload, download, share, and manage files using AWS S3 as the storage backend and PostgreSQL as the database. The application is built with Node.js, Express.js, and EJS for the templating engine.

## Features

- **User Authentication**: Secure login and registration system.
- **File Upload**: Upload files to AWS S3.
- **File Download**: Download files from AWS S3.
- **File Sharing**: Generate shareable links for files.
- **File Search**: Search files by filename.
- **File Caching**: Implement caching with Redis for faster file retrieval.

## Prerequisites

- Node.js and npm
- AWS RDS PostgreSQL
- AWS Account with S3 bucket
- Redis

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/ignatus-anim/file-server.git
    cd file-server
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set up environment variables:

    Create a `.env` file in the root directory and add the following:
    ```
    AWS_ACCESS_KEY_ID=your_aws_access_key_id
    AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
    AWS_REGION=your_aws_region
    AWS_BUCKET_NAME=your_s3_bucket_name
    DATABASE_URL=your_postgresql_database_url
    REDIS_URL=your_redis_url
    ```

4. Set up PostgreSQL:
    - Create a database and run the SQL script to create tables.
    - You can use a tool like pgAdmin or run the script directly from the terminal:
    ```sh
    psql -U your_username -d your_database -f path/to/tables.sql
    ```

5. Set up Redis:
    - Make sure Redis is installed and running.
    - Configure the `REDIS_URL` in your `.env` file.

## Running the Application

1. Start the server:
    ```sh
    npm start
    ```

2. Open your browser and navigate to:
    ```
    http://localhost:3000
    ```

## Project Structure

- **controllers/**: Contains the logic for handling requests.
- **models/**: Contains the database interaction logic.
- **routes/**: Contains the route definitions.
- **views/**: Contains the EJS templates.
- **middleware/**: Contains custom middleware.
- **public/**: Contains static files (CSS).

## Routes

### Authentication

- `GET /auth/login`: Render login page.
- `POST /auth/login`: Handle login form submission.
- `GET /auth/register`: Render registration page.
- `POST /auth/register`: Handle registration form submission.
- `GET /auth/logout`: Log out the user.

### File Management

- `GET /files/upload`: Render file upload page.
- `POST /files/upload`: Handle file upload.
- `GET /files/list`: List all files for the authenticated user.
- `GET /files/download/:id`: Download a specific file.
- `DELETE /files/delete/:id`: Delete a specific file.
- `GET /files/share/:id`: Generate a shareable link for a file.
- `GET /files/shared/:link`: Access a shared file.
- `GET /files/search`: Search for files by filename.

## Redis Caching

- Caches file listings for faster retrieval.
- Invalidate cache on file upload, deletion, or update.

## AWS S3 Configuration

- Ensure your AWS S3 bucket has the appropriate permissions.
- Use pre-signed URLs for secure file access.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Create a new Pull Request.


