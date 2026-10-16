# Quick Start Guide

Get TestAxios running in 3 simple steps!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Start the Application

```bash
npm run dev
```

This command starts both:
- **API Server** on http://localhost:3001
- **Frontend** on http://localhost:5173

You should see output like:
```
✓ API server running on http://localhost:3001
  VITE v5.4.8  ready in 432 ms
  ➜  Local:   http://localhost:5173/
```

## Step 3: Open in Browser

Navigate to http://localhost:5173

You'll see the TestAxios application with:
- Sidebar navigation on the left
- 4 expandable categories
- 13 test scenarios

## First Test

1. Click on **"GET Requests"** in the sidebar
2. The default URL is `/api/users`
3. Click the **"Send GET Request"** button
4. View the response showing user data from the API

## Exploring Features

### Toggle Info Sections

Each scenario has two info buttons in the top right:
- **⚙️** - Shows SETUP information (UI → Code mappings)
- **✓** - Shows WHAT THIS TESTS (features being validated)

### Try Different Scenarios

Navigate through the sidebar to explore:
- **Tab 1**: Basic HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- **Tab 2**: Configuration features (auth, timeouts, response types)
- **Tab 3**: Interceptors and error handling
- **Tab 4**: Advanced features (file upload/download, instances, patterns)

## Common Tasks

### Add Query Parameters

In the GET Requests scenario:
1. Click "Add Query Parameter"
2. Enter key: `page`, value: `1`
3. Enter key: `limit`, value: `5`
4. The computed URL updates automatically
5. Click "Send GET Request"

### Test POST Request

In the POST, PUT, PATCH scenario:
1. Select "POST" method
2. Edit the JSON in the textarea
3. Click "Send POST Request"
4. See the created resource in the response

### Test Authentication

In the Headers & Authentication scenario:
1. Try sending a request to `/api/protected` without auth → 401 error
2. Add a Bearer token header
3. Send request again → Success

## Troubleshooting

### Port Already in Use

If port 3001 or 5173 is already in use:

1. Kill the process using the port:
```bash
# On Mac/Linux
lsof -ti:3001 | xargs kill
lsof -ti:5173 | xargs kill

# On Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

2. Or modify ports in:
   - API: `api/server.js` (change the `PORT` constant). The frontend calls the API at
     `http://localhost:3001` directly (see `src/utils/api.ts` and the scenario components),
     so update those URLs as well when you change the API port.
   - Frontend: `vite.config.ts` (add a `server.port` option)

### API Server Not Starting

Make sure you have Node.js 18+ installed:
```bash
node --version
```

### Build Errors

Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Next Steps

- Explore all 13 scenarios
- Check the README.md for detailed documentation
- Review the API endpoints in `api/server.js`
- Examine component code in `src/components/`
- Customize and extend scenarios as needed

## Need Help?

- Read the full [README.md](./README.md)
- Review component source code
- Inspect browser console for errors
- Check API server logs in terminal

Happy testing! 🚀
