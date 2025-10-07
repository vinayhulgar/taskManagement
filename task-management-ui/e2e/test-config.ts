// Test configuration for backend integration tests
export const TEST_CONFIG = {
  // Backend API configuration
  API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Test user credentials
  TEST_USERS: {
    ADMIN: {
      email: 'admin@taskmanagement.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User'
    },
    REGULAR_USER: {
      email: 'user@taskmanagement.com',
      password: 'user123',
      firstName: 'Regular',
      lastName: 'User'
    },
    TEST_USER: {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    }
  },
  
  // Test timeouts
  TIMEOUTS: {
    DEFAULT: 10000,
    LONG: 30000,
    SHORT: 5000,
    NETWORK: 15000
  },
  
  // Test data
  TEST_DATA: {
    TEAM: {
      name: 'Integration Test Team',
      description: 'Team created for integration testing purposes'
    },
    PROJECT: {
      name: 'Integration Test Project',
      description: 'Project created for integration testing purposes'
    },
    TASK: {
      title: 'Integration Test Task',
      description: 'Task created for integration testing purposes',
      priority: 'HIGH'
    }
  },
  
  // WebSocket configuration
  WEBSOCKET: {
    URL: process.env.WS_URL || 'ws://localhost:8080/ws',
    RECONNECT_ATTEMPTS: 3,
    RECONNECT_DELAY: 1000
  },
  
  // Test flags
  FLAGS: {
    SKIP_BACKEND_CHECK: process.env.SKIP_BACKEND_CHECK === 'true',
    ENABLE_REAL_TIME_TESTS: process.env.ENABLE_REAL_TIME_TESTS !== 'false',
    ENABLE_PERFORMANCE_TESTS: process.env.ENABLE_PERFORMANCE_TESTS !== 'false',
    ENABLE_CROSS_BROWSER_TESTS: process.env.ENABLE_CROSS_BROWSER_TESTS === 'true'
  }
};

// Helper functions for tests
export const TEST_HELPERS = {
  // Generate unique test data
  generateUniqueEmail: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  generateUniqueTeamName: () => `Test Team ${Date.now()}`,
  generateUniqueProjectName: () => `Test Project ${Date.now()}`,
  generateUniqueTaskTitle: () => `Test Task ${Date.now()}`,
  
  // Date helpers
  getFutureDate: (days: number = 7) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  },
  
  getPastDate: (days: number = 7) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  },
  
  // Wait helpers
  waitForElement: async (page: any, selector: string, timeout: number = TEST_CONFIG.TIMEOUTS.DEFAULT) => {
    return page.waitForSelector(selector, { timeout });
  },
  
  waitForResponse: async (page: any, urlPattern: string | RegExp, timeout: number = TEST_CONFIG.TIMEOUTS.NETWORK) => {
    return page.waitForResponse(urlPattern, { timeout });
  },
  
  // Authentication helpers
  loginUser: async (page: any, userType: keyof typeof TEST_CONFIG.TEST_USERS = 'TEST_USER') => {
    const user = TEST_CONFIG.TEST_USERS[userType];
    
    await page.goto('/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/.*\/dashboard/, { timeout: TEST_CONFIG.TIMEOUTS.DEFAULT });
  },
  
  // API helpers
  checkBackendHealth: async () => {
    try {
      const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  },
  
  // WebSocket helpers
  establishWebSocketConnection: (url: string = TEST_CONFIG.WEBSOCKET.URL) => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      
      ws.onopen = () => resolve(ws);
      ws.onerror = (error) => reject(error);
      
      setTimeout(() => reject(new Error('WebSocket connection timeout')), TEST_CONFIG.TIMEOUTS.DEFAULT);
    });
  },
  
  // Error simulation helpers
  simulateNetworkError: async (page: any, urlPattern: string | RegExp) => {
    await page.route(urlPattern, route => route.abort());
  },
  
  simulateSlowNetwork: async (page: any, urlPattern: string | RegExp, delay: number = 5000) => {
    await page.route(urlPattern, async route => {
      await new Promise(resolve => setTimeout(resolve, delay));
      await route.continue();
    });
  },
  
  simulateServerError: async (page: any, urlPattern: string | RegExp, status: number = 500) => {
    await page.route(urlPattern, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server error' })
      });
    });
  },
  
  // Performance helpers
  measurePageLoadTime: async (page: any, url: string) => {
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  },
  
  measureApiResponseTime: async (page: any, apiCall: () => Promise<any>) => {
    const startTime = Date.now();
    await apiCall();
    return Date.now() - startTime;
  }
};

// Test data factories
export const TEST_FACTORIES = {
  createTestUser: (overrides: Partial<any> = {}) => ({
    firstName: 'Test',
    lastName: 'User',
    email: TEST_HELPERS.generateUniqueEmail(),
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    ...overrides
  }),
  
  createTestTeam: (overrides: Partial<any> = {}) => ({
    name: TEST_HELPERS.generateUniqueTeamName(),
    description: 'Team created for testing purposes',
    ...overrides
  }),
  
  createTestProject: (overrides: Partial<any> = {}) => ({
    name: TEST_HELPERS.generateUniqueProjectName(),
    description: 'Project created for testing purposes',
    startDate: new Date().toISOString().split('T')[0],
    endDate: TEST_HELPERS.getFutureDate(30),
    ...overrides
  }),
  
  createTestTask: (overrides: Partial<any> = {}) => ({
    title: TEST_HELPERS.generateUniqueTaskTitle(),
    description: 'Task created for testing purposes',
    priority: 'MEDIUM',
    dueDate: TEST_HELPERS.getFutureDate(7),
    ...overrides
  })
};

// Assertion helpers
export const TEST_ASSERTIONS = {
  // Check if element is visible with timeout
  expectVisible: async (page: any, selector: string, timeout: number = TEST_CONFIG.TIMEOUTS.DEFAULT) => {
    await page.waitForSelector(selector, { state: 'visible', timeout });
  },
  
  // Check if element contains text
  expectText: async (page: any, selector: string, text: string) => {
    const element = await page.locator(selector);
    await element.waitFor({ state: 'visible' });
    const content = await element.textContent();
    if (!content?.includes(text)) {
      throw new Error(`Expected element ${selector} to contain text "${text}", but got "${content}"`);
    }
  },
  
  // Check API response
  expectApiResponse: async (response: any, expectedStatus: number = 200) => {
    if (response.status() !== expectedStatus) {
      const body = await response.text();
      throw new Error(`Expected status ${expectedStatus}, got ${response.status()}. Response: ${body}`);
    }
  },
  
  // Check if URL matches pattern
  expectUrl: async (page: any, pattern: string | RegExp, timeout: number = TEST_CONFIG.TIMEOUTS.DEFAULT) => {
    await page.waitForURL(pattern, { timeout });
  }
};