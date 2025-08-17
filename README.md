# Kelajak Merosi Admin Panel

Admin panel for managing test templates, subjects, questions, and users.

## Features

- **Test Templates Management**: Create, edit, delete test templates
- **Subjects Management**: Manage academic subjects
- **Questions Management**: Handle test questions and options
- **User Management**: Admin user administration
- **Authentication**: Phone number + OTP login system

## Development Setup

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

### Mock Data vs Real API

The application can work with either mock data (for development) or a real API. By default, it uses mock data in development mode.

#### Using Mock Data (Default in Development)

The application automatically uses mock data when:
- `NODE_ENV=development` (default in dev mode)
- `NEXT_PUBLIC_USE_MOCK_DATA=true`

Mock data includes:
- Sample test templates
- Sample subjects
- Sample questions

#### Using Real API

To use the real API:

1. Set environment variable:
   ```bash
   NEXT_PUBLIC_USE_MOCK_DATA=false
   ```

2. Ensure the API server is running at the configured base URL

3. The API endpoints should be available at:
   - `GET /api/test-templates` - List test templates
   - `POST /api/test-templates` - Create test template
   - `PUT /api/test-templates/:id` - Update test template
   - `DELETE /api/test-templates/:id` - Delete test template
   - `GET /api/subjects` - List subjects
   - `GET /api/questions` - List questions

### Configuration

Configuration is managed in `lib/config.ts`:

```typescript
export const config = {
  api: {
    baseUrl: 'https://api.bir-zum.uz',
    useMockData: true, // or false for real API
    timeout: 30000,
    retryAttempts: 3
  }
}
```

### Environment Variables

Create a `.env.local` file (not tracked by git):

```bash
# API Configuration
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_API_BASE_URL=https://api.bir-zum.uz

# Development settings
NODE_ENV=development
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/            # Admin panel pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── ui/               # Reusable UI components
│   └── theme-provider.tsx # Theme context
├── lib/                   # Utility libraries
│   ├── api.ts            # API service with mock data fallback
│   ├── config.ts         # Configuration management
│   └── utils.ts          # Utility functions
├── hooks/                 # Custom React hooks
└── styles/                # Additional styles
```

## API Service

The `ApiService` class in `lib/api.ts` provides:

- **Automatic fallback**: If real API fails, falls back to mock data
- **Mock data management**: CRUD operations on mock data
- **Authentication**: Token management and refresh
- **Error handling**: Graceful degradation

### Mock Data Operations

When using mock data, all CRUD operations work locally:
- Create operations generate new IDs
- Update operations modify local data
- Delete operations remove from local storage
- Data persists during the session

## Troubleshooting

### API Connection Issues

If you see "No static resource" errors:
1. Check if the API server is running
2. Verify the API base URL in configuration
3. Ensure the API endpoints exist
4. Use mock data for development: `NEXT_PUBLIC_USE_MOCK_DATA=true`

### Mock Data Not Loading

1. Check browser console for errors
2. Verify `NODE_ENV` is set to 'development'
3. Check if `NEXT_PUBLIC_USE_MOCK_DATA` is set to 'true'

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with both mock data and real API
5. Submit a pull request

## License

This project is proprietary software.
