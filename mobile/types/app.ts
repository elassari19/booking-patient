export interface AppState {
  isInitialized: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    enabled: boolean;
    appointments: boolean;
    messages: boolean;
    marketing: boolean;
  };
  networkStatus: 'online' | 'offline';
  version: string;
}
