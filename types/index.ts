// types/index.ts
export interface User {
    _id?: string;
    email: string;
    name: string;
    createdAt: Date;
    settings?: UserSettings;
  }
  
  export interface UserSettings {
    productiveCategories: string[];
    unproductiveCategories: string[];
    workingHours: {
      start: string;
      end: string;
    };
    notifications: boolean;
  }
  
  export interface TimeEntry {
    _id?: string;
    userId: string;
    url: string;
    domain: string;
    title: string;
    timeSpent: number; // in seconds
    category: 'productive' | 'unproductive' | 'neutral';
    timestamp: Date;
    sessionId: string;
  }
  
  export interface WebsiteCategory {
    _id?: string;
    domain: string;
    category: 'productive' | 'unproductive' | 'neutral';
    isDefault: boolean;
  }
  
  export interface ProductivityReport {
    userId: string;
    period: 'daily' | 'weekly' | 'monthly';
    startDate: Date;
    endDate: Date;
    totalTime: number;
    productiveTime: number;
    unproductiveTime: number;
    neutralTime: number;
    topSites: Array<{
      domain: string;
      timeSpent: number;
      category: string;
    }>;
    dailyBreakdown?: Array<{
      date: Date;
      totalTime: number;
      productiveTime: number;
    }>;
  }