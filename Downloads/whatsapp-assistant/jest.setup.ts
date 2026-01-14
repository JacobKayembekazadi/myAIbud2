import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test.convex.cloud';
process.env.NEXT_PUBLIC_APP_URL = 'https://test.example.com';
process.env.WAHA_API_URL = 'http://localhost:3000';
process.env.WAHA_API_KEY = 'test-key';
process.env.WAHA_WEBHOOK_SECRET = 'test-secret';
