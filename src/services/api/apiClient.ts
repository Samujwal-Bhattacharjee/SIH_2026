import { mockApi } from './mockApi';
import { realApi } from './realApi';

// Determine whether to use mock or real API adapter
// Defaults to true (Mock mode with synthetic dataset)
const isMockMode = import.meta.env.VITE_USE_MOCK_API !== 'false';

export const apiClient = isMockMode ? mockApi : realApi;

export const isUsingMockApi = () => isMockMode;
