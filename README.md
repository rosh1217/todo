# Todo Master

A beautiful, responsive, full-stack Todo application built with Express and Vanilla JS.

## Project Structure

```
todo-master/
├── database/
│   └── data.json       # File-based database
├── public/             # Frontend assets served statically
│   ├── index.html
│   ├── script.js
│   └── style.css
├── apiroute.js         # API routes for CRUD operations
├── server.js           # Express application entry point
├── package.json        # Node.js dependencies and scripts
└── vercel.json         # Vercel deployment configuration
```

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).
2. Clone this repository or download the project files.
3. Open a terminal in the project directory.
4. Install dependencies:

```bash
npm install
```

## Running locally

Start the development server using:

```bash
npm start
# or
npm run dev
```

The application will be running at `http://localhost:3000`. Open this URL in your browser to interact with the Todo app.

## API Endpoints

The API interacts with the file-based store in `database/data.json`.

| Method | Endpoint         | Description                   |
|--------|------------------|-------------------------------|
| GET    | `/api/todos`     | Retrieve all todos            |
| POST   | `/api/todos`     | Create a new todo             |
| PUT    | `/api/todos/:id` | Update an existing todo by ID |
| DELETE | `/api/todos/:id` | Delete a todo by ID           |

## Deployment

This project is configured to be deployed easily on [Vercel](https://vercel.com).

1. Install the Vercel CLI or connect the repository to your Vercel dashboard.
2. Run `vercel` in the project directory.
3. The `vercel.json` file ensures that API routes are mapped correctly and frontend files are served as static assets.

**Note**: Vercel serverless functions have a read-only filesystem except for `/tmp`. While the `data.json` persistence mechanism works perfectly locally, on Vercel data persistence may require an external database depending on your configuration.

## Troubleshooting

- **404 Errors on API routes**: Ensure `server.js` is running locally. If on Vercel, ensure `vercel.json` maps `/api/(.*)` to `server.js`.
- **500 Errors / Crash**: Check if `database/data.json` contains valid JSON. If corrupted, clear its contents to an empty array `[]`.
- **Changes not saving**: Check directory permissions for `database/data.json`. The server needs read/write access.
