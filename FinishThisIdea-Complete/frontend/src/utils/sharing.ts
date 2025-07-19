/**
 * SOCIAL SHARING UTILITIES
 * 
 * Utilities for sharing content across social media platforms
 * and handling clipboard operations
 */

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Share on Twitter
 */
export function shareOnTwitter(text: string, url?: string, hashtags?: string[]): void {
  const params = new URLSearchParams();
  params.append('text', text);
  
  if (url) {
    params.append('url', url);
  }
  
  if (hashtags && hashtags.length > 0) {
    params.append('hashtags', hashtags.join(','));
  }
  
  const twitterUrl = `https://twitter.com/intent/tweet?${params.toString()}`;
  window.open(twitterUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Share on LinkedIn
 */
export function shareOnLinkedIn(url: string, title?: string, summary?: string): void {
  const params = new URLSearchParams();
  params.append('url', url);
  
  if (title) {
    params.append('title', title);
  }
  
  if (summary) {
    params.append('summary', summary);
  }
  
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
  window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Share on Facebook
 */
export function shareOnFacebook(url: string, quote?: string): void {
  const params = new URLSearchParams();
  params.append('u', url);
  
  if (quote) {
    params.append('quote', quote);
  }
  
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
  window.open(facebookUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Share via email
 */
export function shareViaEmail(subject: string, body: string, to?: string): void {
  const params = new URLSearchParams();
  params.append('subject', subject);
  params.append('body', body);
  
  if (to) {
    params.append('to', to);
  }
  
  const emailUrl = `mailto:?${params.toString()}`;
  window.location.href = emailUrl;
}

/**
 * Generate a unique ID for tracking
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Generate QR code data URL using our backend service
 */
export async function generateQRCode(text: string, options?: {
  width?: number;
  type?: 'referral' | 'share';
  referralCode?: string;
}): Promise<string> {
  try {
    const { width = 200, type = 'share', referralCode } = options || {};
    
    let endpoint = '/api/qr/share';
    let payload: any = {
      url: text,
      options: { width }
    };

    // Use referral endpoint if referral code is provided
    if (type === 'referral' && referralCode) {
      endpoint = '/api/qr/referral';
      payload = {
        referralCode,
        baseUrl: text.split('?')[0],
        options: { width }
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('QR generation failed');
    }

    const data = await response.json();
    return data.data.dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    // Fallback to external service
    const encodedText = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${options?.width || 200}x${options?.width || 200}&data=${encodedText}`;
  }
}

/**
 * Web Share API (native sharing on mobile)
 */
export async function nativeShare(data: ShareData): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share(data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Native share failed:', error);
    return false;
  }
}

/**
 * Check if native sharing is supported
 */
export function isNativeShareSupported(): boolean {
  return 'share' in navigator;
}

/**
 * Share with fallback to native or social media
 */
export async function smartShare(options: {
  title: string;
  text: string;
  url: string;
  platform?: 'twitter' | 'linkedin' | 'facebook' | 'email';
}): Promise<void> {
  const { title, text, url, platform } = options;
  
  // Try native share first on mobile
  if (isNativeShareSupported() && !platform) {
    const shared = await nativeShare({ title, text, url });
    if (shared) return;
  }
  
  // Fallback to platform-specific sharing
  switch (platform) {
    case 'twitter':
      shareOnTwitter(text, url);
      break;
    case 'linkedin':
      shareOnLinkedIn(url, title, text);
      break;
    case 'facebook':
      shareOnFacebook(url, text);
      break;
    case 'email':
      shareViaEmail(title, `${text}\n\n${url}`);
      break;
    default:
      // Copy to clipboard as ultimate fallback
      const fullText = `${text}\n${url}`;
      await copyToClipboard(fullText);
  }
}

/**
 * Track sharing events
 */
export function trackShare(platform: string, content: string, userId?: string): void {
  // This would integrate with your analytics service
  console.log('Share tracked:', { platform, content, userId, timestamp: new Date() });
  
  // Example: Send to analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'share', {
      method: platform,
      content_type: 'referral',
      item_id: content,
    });
  }
}

/**
 * Generate share statistics
 */
export interface ShareStats {
  platform: string;
  shares: number;
  clicks: number;
  conversions: number;
}

/**
 * Share URL builder for tracking
 */
export function buildTrackableUrl(baseUrl: string, source: string, medium: string, campaign: string): string {
  const url = new URL(baseUrl);
  url.searchParams.append('utm_source', source);
  url.searchParams.append('utm_medium', medium);
  url.searchParams.append('utm_campaign', campaign);
  return url.toString();
}

/**
 * Get share text templates
 */
export const shareTemplates = {
  referral: {
    twitter: (code: string) => 
      `🚀 Just discovered FinishThisIdea - AI code cleanup that actually works! Use code ${code} for a FREE first cleanup. Both of us win! 💻✨ #CodeCleanup #AI #Developer`,
    linkedin: (code: string) => 
      `I've been using FinishThisIdea for AI-powered code cleanup and it's been a game-changer for my productivity. Use my referral code ${code} to try it free!`,
    email: (code: string) => 
      `Hi! I wanted to share FinishThisIdea with you - it's an AI tool that cleans up code automatically. Use my code ${code} to get your first cleanup free. It's saved me hours of work!`,
  },
  achievement: {
    twitter: (achievement: string) => 
      `🏆 Just unlocked "${achievement}" on @FinishThisIdea! The AI code cleanup tool keeps getting better. Who else is crushing their code quality goals? 💪 #CodeQuality #Achievement`,
    linkedin: (achievement: string) => 
      `Proud to have achieved "${achievement}" using FinishThisIdea's AI code cleanup platform. It's amazing how much cleaner and more maintainable code becomes with the right tools.`,
  },
  showcase: {
    twitter: (improvements: string) => 
      `🔥 Check out what FinishThisIdea's AI did to my code: ${improvements}! This tool is seriously impressive. #CodeCleanup #AI #Programming`,
    linkedin: (improvements: string) => 
      `Amazing results from FinishThisIdea's AI code analysis: ${improvements}. This tool is transforming how I approach code quality and maintenance.`,
  },
};

/**
 * Get platform-specific share constraints
 */
export const shareLimits = {
  twitter: {
    maxLength: 280,
    imageSupported: true,
    videoSupported: true,
  },
  linkedin: {
    maxLength: 1300,
    imageSupported: true,
    videoSupported: true,
  },
  facebook: {
    maxLength: 63206,
    imageSupported: true,
    videoSupported: true,
  },
  email: {
    maxLength: Infinity,
    imageSupported: false,
    videoSupported: false,
  },
};

/**
 * Truncate text for platform limits
 */
export function truncateForPlatform(text: string, platform: keyof typeof shareLimits): string {
  const limit = shareLimits[platform].maxLength;
  if (text.length <= limit) return text;
  
  return text.substring(0, limit - 3) + '...';
}