export interface DesignProject {
  id: string;
  title: string;
  arabicTitle: string;
  category: "apartment" | "shop" | "office";
  categoryLabel: string;
  budgetRange: string;
  duration: string;
  description: string;
  features: string[];
  style: string;
  marketingHook: string; // Specific marketing hook used for campaigns
  targetAudienceText: string; // Target audience description for ads
  imageUrl: string;
  metaTags: string[];
}

export interface AdCampaign {
  id: string;
  name: string;
  category: "apartment" | "shop" | "office";
  platform: "facebook" | "instagram" | "all";
  status: "النشط" | "مسودة" | "مكتمل" | "متوقف مؤقتاً";
  budget: number;
  spent: number;
  leadsCount: number;
  impressions: number;
  clicks: number;
  cpc: number; // Cost per click
  cpl: number; // Cost per lead
  ctr: number; // Click-through rate
  pixelId: string;
  targetAudience: string;
  adText: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  serviceNeeded: string; // 'apartment' | 'shop' | 'office'
  budget: string;
  campaignSource: string;
  status: "جديد" | "قيد التواصل" | "طلب عرض سعر" | "تم التعاقد" | "غير مهتم";
  notes: string;
  createdAt: string;
}

export interface PixelConfig {
  id: string;
  name: string;
  pixelId: string;
  isEnabled: boolean;
  platform: "facebook" | "instagram";
  trackPageViews: boolean;
  trackLeads: boolean;
  trackFormSubmits: boolean;
}

export interface MarketingCopyResult {
  hook: string;
  body: string;
  cta: string;
  hashtags: string;
  targetAudience: string;
  adImagePrompt: string;
}
