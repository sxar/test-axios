# TestAxios - Axios HTTP Client Test Application

A comprehensive test application demonstrating all features of the Axios HTTP client library. This application serves as both a testing harness and an educational tool for understanding Axios functionality.

## Overview

TestAxios provides 13 interactive test scenarios organized into 4 categories:

### Tab 1: HTTP Methods & Basics (3 scenarios)
1. **GET Requests** - Basic GET requests with query parameters and headers
2. **POST, PUT, PATCH Requests** - Data-sending HTTP methods with JSON bodies
3. **DELETE & Other Methods** - DELETE, HEAD, and OPTIONS methods

### Tab 2: Configuration & Features (3 scenarios)
4. **Headers & Authentication** - Header management and auth patterns
5. **Timeouts & Cancellation** - Timeout handling and request cancellation
6. **Response Types & Transformation** - Response type handling and transformations

### Tab 3: Interceptors & Error Handling (3 scenarios)
7. **Request Interceptors** - Request interception and modification
8. **Response Interceptors** - Response interception and transformation
9. **Error Handling** - Comprehensive error handling

### Tab 4: Advanced Features (4 scenarios)
10. **File Upload** - File upload with progress tracking
11. **File Download** - File downloads with progress tracking
12. **Custom Instances & Defaults** - Axios instance configuration
13. **Real-World Patterns** - Common real-world usage patterns

## Architecture

This application consists of two parts:

1. **React Frontend** (Vite + TypeScript) - Interactive UI for testing Axios features
2. **Express Backend API** (Node.js) - RESTful API endpoints for testing HTTP requests

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

## Running the Application

The application requires both the API server and the frontend to be running:

### Option 1: Run Both Simultaneously (Recommended)

```bash
npm run dev
```

This starts both the API server (port 3001) and the Vite dev server (port 5173) concurrently.

### Option 2: Run Separately

Terminal 1 - API Server:
```bash
npm run dev:api
```

Terminal 2 - Frontend:
```bash
npm run dev:client
```

## Accessing the Application

Once running, open your browser to:
- **Frontend**: http://localhost:5173
- **API Server**: http://localhost:3001

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Starts the API server (3001) and the Vite dev server (5173) together |
| `npm run dev:api` | Starts only the API server |
| `npm run dev:client` | Starts only the Vite dev server |
| `npm run build` | Production build of the frontend into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs ESLint over the project |
| `npm run typecheck` | Type-checks the frontend without emitting files |

## API Endpoints

The Express API server provides the following endpoints:

### User Management
- `GET /api/users` - List users (supports pagination, search, filters)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update entire user
- `PATCH /api/users/:id` - Partially update user
- `DELETE /api/users/:id` - Delete user
- `HEAD /api/users` - Get headers only
- `OPTIONS /api/users` - Get allowed methods

### Authentication & Testing
- `GET /api/protected` - Protected endpoint (requires auth)
- `GET /api/error/:code` - Simulate error responses
- `GET /api/slow?delay=ms` - Simulate slow responses

### Data Endpoints
- `GET /api/posts` - Get posts
- `GET /api/comments` - Get comments
- `GET /api/stats` - Get statistics
- `GET /api/activity` - Get activity log
- `GET /api/text` - Returns plain text
- `GET /api/wrapped` - Returns wrapped JSON
- `GET /api/flaky` - Flaky endpoint for retry testing

### File Operations
- `POST /api/upload` - Single file upload
- `POST /api/upload/multiple` - Multiple file upload
- `GET /api/download/:filename` - File download

## Project Structure

```
test-axios/
├── api/
│   ├── server.js              # Express API server
│   └── uploads/               # File upload directory
├── src/
│   ├── components/
│   │   ├── shared/
│   │   │   ├── DisplayCard.tsx       # Reusable card component
│   │   │   └── RenderCounter.tsx     # Render tracking component
│   │   ├── tab1/
│   │   │   ├── GetRequests.tsx
│   │   │   ├── PostPutPatch.tsx
│   │   │   └── DeleteAndOthers.tsx
│   │   ├── tab2/
│   │   │   ├── HeadersAuth.tsx
│   │   │   ├── TimeoutsCancellation.tsx
│   │   │   └── ResponseTypes.tsx
│   │   ├── tab3/
│   │   │   ├── RequestInterceptors.tsx
│   │   │   ├── ResponseInterceptors.tsx
│   │   │   └── ErrorHandling.tsx
│   │   ├── tab4/
│   │   │   ├── FileUpload.tsx
│   │   │   ├── FileDownload.tsx
│   │   │   ├── CustomInstances.tsx
│   │   │   └── RealWorldPatterns.tsx
│   │   └── PlaceholderScenario.tsx   # Template for new scenarios
│   ├── utils/
│   │   └── api.ts             # Axios configuration
│   ├── App.tsx                # Main application with navigation
│   ├── App.css                # Complete styling (CSS variables)
│   ├── index.css              # Tailwind directives
│   └── main.tsx               # React entry point
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Key Features

### Educational Content
Each scenario includes:
- **⚙️ SETUP** - Explains UI element → Axios code mappings
- **✓ WHAT THIS TESTS** - Lists features being validated
- Collapsible sections accessible via icon buttons

### Interactive Testing
- Live HTTP requests to the API server
- Real-time response display
- Status codes and timing information
- Error handling demonstrations

### Skyramp-Ready
- All interactive elements have `data-testid` attributes
- Designed for automated test recording
- Clear user interaction patterns

## Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript 5.5.3** - Type safety
- **Vite 5.4.2** - Build tool and dev server
- **Tailwind CSS 3.4.1** - Utility-first CSS
- **Axios 1.7.9** - HTTP client
- **Lucide React 0.344.0** - Icons
- **Classnames 2.5.1** - Conditional CSS classes

### Backend
- **Express 4.18.2** - Web framework
- **CORS 2.8.5** - Cross-origin requests
- **Multer 1.4.5** - File upload handling

### Development
- **Concurrently 8.2.2** - Run multiple commands
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript linting

## Design System

The application follows the TestSweet design system with:
- Poppins font family
- Consistent color scheme (CSS variables)
- #BDBDBD hover states
- Responsive layouts
- Smooth animations

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Development

### Adding New Scenarios

1. Create a new component in `src/components/tabX/`
2. Follow the pattern in `GetRequests.tsx`
3. Include ⚙️ SETUP and ✓ WHAT THIS TESTS sections
4. Add `data-testid` attributes to all interactive elements
5. Import and add to `menuItems` array in `App.tsx`

### Running TypeScript Checks

```bash
npm run typecheck
```

### Running Linter

```bash
npm run lint
```

## Implementation Status

### ✅ Completed (13 of 13 scenarios) - 100% Complete!

All scenarios have been fully implemented with interactive testing capabilities, educational content, and comprehensive code examples.

- Project setup and configuration
- Express API server with all endpoints
- Full navigation structure (13 scenarios)
- Shared components (DisplayCard, RenderCounter)
- Complete styling (App.css with CSS variables)
- **Tab 1 scenarios (3/3):** GET, POST/PUT/PATCH, DELETE/HEAD/OPTIONS
- **Tab 2 scenarios (3/3):** Headers & Authentication, Timeouts & Cancellation, Response Types
- **Tab 3 scenarios (3/3):** Request Interceptors, Response Interceptors, Error Handling
- **Tab 4 scenarios (4/4):** File Upload, File Download, Custom Instances & Defaults, Real-World Patterns

## Features

Each scenario includes:
- Interactive testing interface with real HTTP requests
- Educational content (⚙️ SETUP and ✓ WHAT THIS TESTS sections)
- Live response display with status codes and timing
- Comprehensive code examples
- data-testid attributes for automated testing with Skyramp
- Error handling demonstrations

## License

MIT

## Author

Built with Anthropic Claude and the Claude Code SDK.
