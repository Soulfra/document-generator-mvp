// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  title?: string;
  company?: string;
  location?: string;
  website?: string;
  bio?: string;
  joinDate: string;
  lastActive: string;
  isVerified: boolean;
  level: number;
  xp: number;
  credits: number;
}

export interface UserStats {
  totalCleanups: number;
  linesProcessed: number;
  issuesFixed: number;
  averageSizeReduction: number;
  languagesUsed: string[];
  totalSavingsGenerated: number;
  joinDate: string;
  lastActive: string;
  rank: number;
  totalUsers: number;
  streak: number;
  perfectCleanups: number;
}

// Job Types
export interface Job {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  file: {
    name: string;
    size: number;
    type: string;
    language: string;
  };
  profile: CodeProfile;
  results?: JobResults;
  createdAt: string;
  completedAt?: string;
  estimatedTime?: number;
}

export interface JobResults {
  beforeStats: {
    lines: number;
    issues: number;
    size: number;
    complexity: number;
  };
  afterStats: {
    lines: number;
    issues: number;
    size: number;
    complexity: number;
  };
  improvements: {
    linesRemoved: number;
    linesAdded: number;
    issuesFixed: number;
    sizeReduction: number;
    complexityReduction: number;
  };
  changes: CodeChange[];
  downloadUrl: string;
  reportUrl?: string;
}

export interface CodeChange {
  type: 'add' | 'remove' | 'modify';
  file: string;
  lineNumber: number;
  before?: string;
  after?: string;
  reason: string;
  category: 'formatting' | 'dead_code' | 'optimization' | 'refactor' | 'bug_fix';
}

// Profile Types
export interface CodeProfile {
  id: string;
  name: string;
  description: string;
  language: string;
  icon: string;
  color: string;
  isDefault: boolean;
  isCustom: boolean;
  rules: ProfileRule[];
  settings: ProfileSettings;
  popularity: number;
  createdBy?: string;
}

export interface ProfileRule {
  id: string;
  category: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'info' | 'warning' | 'error';
  autoFix: boolean;
}

export interface ProfileSettings {
  indentSize: number;
  useSpaces: boolean;
  maxLineLength: number;
  semicolons: boolean;
  quotes: 'single' | 'double';
  trailingCommas: boolean;
  bracketSpacing: boolean;
}

// Referral Types
export interface ReferralCode {
  code: string;
  userId: string;
  uses: number;
  maxUses?: number;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  thisMonth: number;
  conversionRate: number;
  recentReferrals: ReferralActivity[];
}

export interface ReferralActivity {
  id: string;
  referredUser: {
    name: string;
    avatar: string;
  };
  date: string;
  status: 'pending' | 'completed' | 'used_service';
  earning: number;
}

// Activity Types
export interface ActivityItem {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    location?: string;
  };
  action: {
    type: 'cleanup' | 'optimization' | 'dead_code' | 'formatting' | 'refactor';
    description: string;
    stats: {
      linesProcessed?: number;
      issuesFixed?: number;
      sizeReduced?: number;
      filesAffected?: number;
    };
  };
  timestamp: Date;
  language: string;
  projectType?: string;
  isPublic: boolean;
}

// Achievement Types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'cleanup' | 'efficiency' | 'social' | 'milestone' | 'special';
  progress: {
    current: number;
    target: number;
    unit: string;
  };
  unlocked: boolean;
  unlockedAt?: string;
  reward: {
    type: 'credit' | 'badge' | 'title' | 'feature';
    value: string;
  };
}

export interface UserLevel {
  current: number;
  xp: number;
  xpToNext: number;
  title: string;
  perks: string[];
}

// Challenge Types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  progress: {
    current: number;
    target: number;
    unit: string;
  };
  reward: {
    xp: number;
    credits?: number;
    badge?: string;
  };
  expiresAt: string;
  completed: boolean;
  isNew?: boolean;
}

// Social Types
export interface ShareResult {
  url: string;
  imageUrl?: string;
  text: string;
  hashtags: string[];
}

export interface SocialStats {
  shares: number;
  likes: number;
  comments: number;
  reach: number;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'github';
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    name: string;
    avatar: string;
    title?: string;
  };
  stats: {
    score: number;
    cleanups: number;
    linesProcessed: number;
    streak: number;
  };
  badge?: string;
  isCurrentUser?: boolean;
}

// Payment Types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: 'payment' | 'refund' | 'credit';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'achievement' | 'referral' | 'challenge' | 'system' | 'social';
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'job_update' | 'activity_update' | 'achievement_unlock' | 'challenge_complete' | 'user_online';
  payload: any;
  timestamp: string;
}

// Global Stats Types
export interface GlobalStats {
  totalUsers: number;
  totalCleanups: number;
  linesProcessedToday: number;
  activeUsers: number;
  averageProcessingTime: number;
  topLanguages: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
  recentActivity: ActivityItem[];
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Form Types
export interface UploadFormData {
  file: File;
  profileId: string;
  options?: {
    makePublic?: boolean;
    notifyOnComplete?: boolean;
  };
}

export interface ProfileFormData {
  name: string;
  description: string;
  language: string;
  rules: ProfileRule[];
  settings: ProfileSettings;
}

// Hook Types
export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseWebSocketResult {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
}

// Component Props Types
export interface ComponentWithVariant {
  variant?: 'default' | 'compact' | 'minimal';
}

export interface ComponentWithLoading {
  loading?: boolean;
}

export interface ComponentWithError {
  error?: string | null;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;