class ApiClient {
  private baseURL: string;
  private wsConnection: WebSocket | null = null;

  constructor(baseURL: string = 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  // Generic request handler with automatic retry and error handling
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ data: T; error?: string }> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers },
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null as T, error: data.message || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { 
        data: null as T, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  // File upload with progress tracking
  async uploadFile(
    file: File, 
    profileId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ data: any; error?: string }> {
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('profileId', profileId);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ data });
          } catch (error) {
            resolve({ data: null, error: 'Invalid response format' });
          }
        } else {
          resolve({ data: null, error: `Upload failed: ${xhr.statusText}` });
        }
      };

      xhr.onerror = () => {
        resolve({ data: null, error: 'Upload failed' });
      };

      xhr.open('POST', `${this.baseURL}/api/upload`);
      xhr.send(formData);
    });
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    const wsUrl = this.baseURL.replace('http', 'ws') + '/ws';
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onopen = () => {
      console.log('WebSocket connected');
    };

    this.wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    this.wsConnection.onclose = () => {
      console.log('WebSocket disconnected');
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        this.connectWebSocket(onMessage, onError);
      }, 3000);
    };
  }

  disconnectWebSocket() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // Job management
  async createJob(fileId: string, profileId: string) {
    return this.request('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ fileId, profileId }),
    });
  }

  async getJob(jobId: string) {
    return this.request(`/api/jobs/${jobId}`);
  }

  async getJobStatus(jobId: string) {
    return this.request(`/api/jobs/${jobId}/status`);
  }

  // Profile management
  async getProfiles() {
    return this.request('/api/profiles');
  }

  async getProfile(profileId: string) {
    return this.request(`/api/profiles/${profileId}`);
  }

  async createCustomProfile(profile: any) {
    return this.request('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  // User management
  async getUser(userId: string) {
    return this.request(`/api/users/${userId}`);
  }

  async updateUser(userId: string, updates: any) {
    return this.request(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getUserStats(userId: string) {
    return this.request(`/api/users/${userId}/stats`);
  }

  // Referral system
  async createReferralCode(userId: string) {
    return this.request('/api/referrals/code', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async getReferralStats(userId: string) {
    return this.request(`/api/referrals/${userId}/stats`);
  }

  async trackReferral(referralCode: string, newUserId: string) {
    return this.request('/api/referrals/track', {
      method: 'POST',
      body: JSON.stringify({ referralCode, newUserId }),
    });
  }

  // Activity feed
  async getActivityFeed(limit: number = 20, offset: number = 0) {
    return this.request(`/api/activity?limit=${limit}&offset=${offset}`);
  }

  async createActivity(activity: any) {
    return this.request('/api/activity', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  }

  // Achievements and gamification
  async getUserAchievements(userId: string) {
    return this.request(`/api/users/${userId}/achievements`);
  }

  async unlockAchievement(userId: string, achievementId: string) {
    return this.request(`/api/users/${userId}/achievements/${achievementId}`, {
      method: 'POST',
    });
  }

  async getChallenges(userId: string, type?: 'daily' | 'weekly' | 'special') {
    const query = type ? `?type=${type}` : '';
    return this.request(`/api/users/${userId}/challenges${query}`);
  }

  async updateChallengeProgress(userId: string, challengeId: string, progress: number) {
    return this.request(`/api/users/${userId}/challenges/${challengeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    });
  }

  // Social features
  async shareResults(userId: string, jobId: string, platform: string) {
    return this.request('/api/social/share', {
      method: 'POST',
      body: JSON.stringify({ userId, jobId, platform }),
    });
  }

  async generateShareImage(jobId: string, template: string = 'before-after') {
    return this.request(`/api/social/image/${jobId}?template=${template}`);
  }

  // Leaderboard
  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly') {
    return this.request(`/api/leaderboard?period=${period}`);
  }

  // Payment and credits
  async getUserCredits(userId: string) {
    return this.request(`/api/users/${userId}/credits`);
  }

  async createPayment(amount: number, userId: string) {
    return this.request('/api/payments', {
      method: 'POST',
      body: JSON.stringify({ amount, userId }),
    });
  }

  async processPayment(paymentId: string, paymentMethodId: string) {
    return this.request(`/api/payments/${paymentId}/process`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId }),
    });
  }

  // Analytics and insights
  async getGlobalStats() {
    return this.request('/api/stats/global');
  }

  async getUserInsights(userId: string) {
    return this.request(`/api/users/${userId}/insights`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;