// Configuration for the application
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bir-zum.uz',
    useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'development',
    timeout: 30000,
    retryAttempts: 3
  },
  
  // App Configuration
  app: {
    name: 'Kelajak Merosi Admin',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }
}

// Helper function to check if mock data should be used
export const shouldUseMockData = (): boolean => {
  return config.api.useMockData
}

// Helper function to get API base URL
export const getApiBaseUrl = (): string => {
  return config.api.baseUrl
}
