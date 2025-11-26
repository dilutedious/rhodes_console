# Rhodes Console

A modified Arknights Rhodes Console application that works with offline mock data.

## What Changed

The original application was designed to fetch data from the arknights.global API, which has changed its structure and no longer provides direct JSON responses. This modified version includes a workaround:

1. A mock API server that serves static data to the application
2. A client-side proxy script that intercepts fetch requests to arknights.global and redirects them to local mock data

## How to Run

### Method 1: Using the Local Express Server (Recommended)

1. Install Node.js if you don't have it already
2. Install the dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open your browser to http://localhost:3000

### Method 2: Using any HTTP server

If you prefer to use another HTTP server, just serve the files from this directory. The client-side proxy script will handle redirecting API requests to the local mock data.

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Verify that the `/static/proxy.js` script is loaded before the main application scripts in `index.html`
3. Ensure that the mock data file exists at `/static/mock-api/news-data.json` 