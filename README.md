# FileBridge

FileBridge is a full-stack file sharing web app built with Node.js, Express, EJS, MongoDB, and Multer.

## Features

- User registration and login
- Upload, rename, move, delete, and download files
- Access control: private, public, specific users, specific groups, share links
- Search and filtering by name, tags, type, and timestamps
- Sorting by size, date, and name
- Favorites and tags for quick organization
- Group-based permissions and collaboration
- Storage usage and aggregation stats
- Activity logs for key actions

## Tech Stack

- Node.js, Express, EJS
- MongoDB with Mongoose
- Multer for uploads
- Express session with MongoDB store

## Setup

1. Install dependencies: `npm install`
2. Create a `.env` file from `.env.example` and update values
3. Run the app:
   - Development: `npm run dev`
   - Production: `npm start`

## Data Model Notes

- Indexes on `userId`, `email`, and file access fields
- Text index on file names and tags for search
- Aggregation pipelines for storage summaries
- Array updates for group membership and favorites
