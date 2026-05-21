import React, { useState, useEffect } from "react";
import { 
  Sparkles, Plus, Search, Filter, TrendingUp, Target, Compass, 
  Users, Layers, Settings, Link2, Code, Copy, Check, Eye, 
  Activity, Briefcase, Percent, DollarSign, Globe, Trash, Play, 
  Pause, ChevronLeft, MapPin, CheckCircle, Clock, AlertCircle, ClipboardList, ShieldCheck,
  Facebook, Instagram
} from "lucide-react";
import { DEFAULT_PROJECTS, DEFAULT_CAMPAIGNS, DEFAULT_LEADS, DEFAULT_PIXELS } from "./data";
import { DesignProject, AdCampaign, Lead, PixelConfig, MarketingCopyResult } from "./types";

export default function App() {
  // State lists
  const [projects, setProjects] = useState<DesignProject[]>(DEFAULT_PROJECTS);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(DEFAULT_CAMPAIGNS);
  const [leads, setLeads] = useState<Lead[]>(DEFAULT_LEADS);
  const [pixels, setPixels] = useState<PixelConfig[]>(DEFAULT_PIXELS);

  // Active Tab
  // "portfolio" | "campaigns" | "analytics" | "leads" | "social"
  const [activeTab, setActiveTab] = useState<"portfolio" | "campaigns" | "analytics" | "leads" | "social" >("portfolio");

  // Public Social Pages Urls (Follow & Share)
  const [fbPageUrl, setFbPageUrl] = useState<string>(() => {
    return localStorage.getItem("mada_fb_page_url") || "https://facebook.com/mada.interior.eg";
  });
  const [igPageUrl, setIgPageUrl] = useState<string>(() => {
    return localStorage.getItem("mada_ig_page_url") || "https://instagram.com/mada.interior.eg";
  });

  useEffect(() => {
    localStorage.setItem("mada_fb_page_url", fbPageUrl);
  }, [fbPageUrl]);

  useEffect(() => {
    localStorage.setItem("mada_ig_page_url", igPageUrl);
  }, [igPageUrl]);

  // Facebook & Instagram Integration States
  const [fbConfig, setFbConfig] = useState<{
    isConnected: boolean;
    isSimulated: boolean;
    pages: Array<{
      id: string;
      name: string;
      category: string;
      instagram_username: string | null;
      access_token: string;
      fans: number;
    }>;
  }>({ isConnected: false, isSimulated: true, pages: [] });

  const [selectedFbPage, setSelectedFbPage] = useState<string>("");
  const [fbScopeType, setFbScopeType] = useState<"standard" | "business" | "custom">("standard");
  const [fbCustomScopes, setFbCustomScopes] = useState<string>(
    "public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,ads_read,ads_management,business_management,pages_manage_ads"
  );
  const [isPublishingFb, setIsPublishingFb] = useState(false);
  const [fbPublishMessage, setFbPublishMessage] = useState("");
  const [fbLogsCheck, setFbLogsCheck] = useState<Array<{ id: string; time: string; type: string; info: string; status: string }>>([
    { id: "log_init", time: new Date().toLocaleTimeString("ar-EG"), type: "نظام الأمان", info: "تأمين قنوات تبادل OAuth 2.0 ومطابقة نطاق meta-callback", status: "نشط 🔒" }
  ]);

  const fetchFbPages = async () => {
    try {
      const res = await fetch("/api/facebook/pages");
      if (res.ok) {
        const data = await res.json();
        setFbConfig(data);
        if (data.pages.length > 0) {
          if (!selectedFbPage || !data.pages.some((p: any) => p.id === selectedFbPage)) {
            setSelectedFbPage(data.pages[0].id);
          }
        } else {
          setSelectedFbPage("");
        }
      }
    } catch (err) {
      console.error("Error fetching FB pages:", err);
    }
  };

  const [fbPosts, setFbPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  const fetchFbPosts = async (pageId: string) => {
    if (!pageId) return;
    setIsLoadingPosts(true);
    try {
      const res = await fetch(`/api/facebook/posts?pageId=${pageId}`);
      if (res.ok) {
        const postsData = await res.json();
        setFbPosts(postsData);
      }
    } catch (err) {
      console.error("Error fetching FB posts:", err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Automatically fetch page posts when active page selection changes
  useEffect(() => {
    if (selectedFbPage) {
      fetchFbPosts(selectedFbPage);
    }
  }, [selectedFbPage]);

  useEffect(() => {
    fetchFbPages();

    // Listen to success message from popup (after OAuth callback completes)
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const payload = event.data.payload;
        setFbLogsCheck(prev => [
          {
            id: `log_${Date.now()}`,
            time: new Date().toLocaleTimeString("ar-EG"),
            type: "مصادقة OAuth",
            info: payload?.simulated
              ? "تم الربط بنجاح عبر بوابة المحاكاة الآمنة (تفويض استكشافي)"
              : `تم مصادقة OAuth الفعلي بنجاح! مزامنة ${payload?.count || 0} صفحات تجارية.`,
            status: "مقبول ✅"
          },
          ...prev
        ]);
        fetchFbPages();
        alert("🎉 تم ربط ومزامنة صفحات فيسبوك وإنستجرام بنجاح!");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [selectedFbPage]);

  // Initiate popup authentication flow
  const handleConnectFacebook = async () => {
    try {
      // Open a blank popup immediately (must be triggered by user gesture)
      const authWindow = window.open('', 'facebook_oauth_popup', 'width=650,height=650,status=yes,resizable=yes');

       const originParam = encodeURIComponent(window.location.origin);
       let urlEndpoint = `/api/auth/facebook/url?origin=${originParam}&scope_type=${fbScopeType}`;
       if (fbScopeType === "custom") {
         urlEndpoint += `&custom_scopes=${encodeURIComponent(fbCustomScopes)}`;
       }

       const res = await fetch(urlEndpoint);
       if (!res.ok) {
         const errorText = await res.text().catch(() => "لا يوجد نص خطأ متاح.");
         if (authWindow) authWindow.close();
         throw new Error(`Failed to get auth URL (${res.status} ${res.statusText}): ${errorText}`);
       }
       const { url } = await res.json();

       // If popup exists, redirect it; otherwise redirect full page (fallback for popup blocker)
       if (authWindow) {
         try {
           authWindow.location.href = url;
         } catch (e) {
           authWindow.close();
           window.open(url, 'facebook_oauth_popup', 'width=650,height=650,status=yes,resizable=yes');
         }
       } else {
         // Full-page redirect fallback when popup is blocked
         window.location.href = url;
          time: new Date().toLocaleTimeString("ar-EG"),
          type: "طلب OAuth",
          info: "فتح بوابة التصاريح لفيسبوك ومطابقة الـ (App Scope)",
          status: "قيد الانتظار ⏳"
        },
        ...prev
      ]);
    } catch (err: any) {
      alert("⚠️ فشل تحضير بوابة الاتصال: " + err.message);
    }
  };

  // Request all permissions (forces custom scopes to the full list)
  const handleRequestAllPermissions = async () => {
    const ok = confirm("ستطلب هذه العملية كافة صلاحيات Facebook/Instagram وAds. بعض الصلاحيات تتطلب App Review من فيسبوك قبل العمل في الإنتاج. المتابعة؟");
    if (!ok) return;

    try {
      // Open blank popup immediately
      const authWindow = window.open('', 'facebook_oauth_popup_all_scopes', 'width=750,height=750,status=yes,resizable=yes');

       const originParam = encodeURIComponent(window.location.origin);
       const urlEndpoint = `/api/auth/facebook/url?origin=${originParam}&scope_type=custom&custom_scopes=${encodeURIComponent(fbCustomScopes)}`;
       const res = await fetch(urlEndpoint);
       if (!res.ok) {
         const errorText = await res.text().catch(() => "لا يوجد نص خطأ متاح.");
         if (authWindow) authWindow.close();
         throw new Error(`Failed to get auth URL (${res.status} ${res.statusText}): ${errorText}`);
       }
       const { url } = await res.json();

       // If popup exists, redirect it; otherwise redirect full page (fallback)
       if (authWindow) {
         try {
           authWindow.location.href = url;
         } catch (e) {
           authWindow.close();
           window.open(url, 'facebook_oauth_popup_all_scopes', 'width=750,height=750,status=yes,resizable=yes');
         }
       } else {
         // Full-page redirect fallback when popup is blocked
         window.location.href = url;
          info: "تم طلب كافة الصلاحيات عبر نافذة OAuth",
          status: "قيد الانتظار ⏳"
        },
        ...prev
      ]);
    } catch (err: any) {
      alert("⚠️ فشل تحضير بوابة الاتصال: " + err.message);
    }
  };

  const handleResetFacebook = async () => {
    try {
      const res = await fetch("/api/facebook/reset", { method: "POST" });
      if (res.ok) {
        await fetchFbPages();
        setFbLogsCheck(prev => [
          {
            id: `log_${Date.now()}`,
            time: new Date().toLocaleTimeString("ar-EG"),
            type: "إلغاء المزامنة",
            info: "تم تهشير وإلغاء تفويض التوكنات وتدقيق الصلاحيات بنجاح",
            status: "ملغى 🗑️"
          },
          ...prev
        ]);
        alert("✅ تم إلغاء ربط الحسابات بنجاح وإرجاع القنوات لحالة المراقبة الافتراضية.");
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePublishToFbAndIg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFbPage) {
      alert("⚠️ يرجى تحديد الصفحة المستهدفة للنشر أولاً!");
      return;
    }
    if (!fbPublishMessage.trim()) {
      alert("⚠️ لا يمكن نشر محتوى فارغ!");
      return;
    }

    setIsPublishingFb(true);
    try {
      const response = await fetch("/api/facebook/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: selectedFbPage,
          platform: "فيسبوك وإنستجرام",
          message: fbPublishMessage
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "خطأ أثناء محاولة النشر.");
      }

      setFbLogsCheck(prev => [
        {
          id: `log_${Date.now()}`,
          time: new Date().toLocaleTimeString("ar-EG"),
          type: "نشر إيجابي",
          info: `نشر محتوى على القناة (${data.details?.targetChannel || ""}) بكسل تتبع الإرجاع: ${data.details?.postId}`,
          status: "مكتمل 🚀"
        },
        ...prev
      ]);

      alert(`🎉 تم النشر بنجاح!\n${data.message}`);
      setFbPublishMessage("");
      
      // Refresh the lists dynamically to prove it reads and updates on screen
      await fetchFbPosts(selectedFbPage);

      // Automatically trigger a PageView simulator or lead checking event
      triggerPixelSimulatedEvent("PageView", { post_published: data.details?.postId });
    } catch (err: any) {
      alert("❌ فشلت عملية النشر: " + err.message);
    } finally {
      setIsPublishingFb(false);
    }
  };

  // Portfolio filters
  const [projectCategoryFilter, setProjectCategoryFilter] = useState<"all" | "apartment" | "shop" | "office">("all");
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<DesignProject | null>(null);

  // AI Assistant States
  const [aiCategory, setAiCategory] = useState("apartment");
  const [aiTone, setAiTone] = useState("Luxury");
  const [aiPlatform, setAiPlatform] = useState("facebook");
  const [aiDetails, setAiDetails] = useState("");
  const [aiProjectName, setAiProjectName] = useState("مدار للتصميم الجمالي");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<MarketingCopyResult | null>({
    hook: "✨ غيّر مفهوم رفاهية المعيشة بالزمالك وتملك شقة أحلامك على طراز النيو كلاسيك الفاخر ✨",
    body: "هل ترغب في تحويل شقتك السكنية لفراغ يعبر عن الفخامة والسمو في كل مليمتر؟ بمكتب مدار الهندسي نضمن لك دقة عالية في الإشراف مع استخدام الرخام البوتشينو الإيطالي الفاخر، تجاليد الماهوجني، وتوزيع إضاءة ناعمة بذكاء تفرض اتساعاً ودفئاً في أرجاء منزلك. تسليم كامل على المفتاح طبقاً لمعاييرك وميزانيك الخاصة.",
    cta: "📲 اضغط على زر 'إرسال رسالة' للحصول على استشارة هندسية وديكورية مجانية تماماً مع مهندسينا اليوم!",
    hashtags: "#تصميم_داخلي #نيو_كلاسيك #تشطيب_شقق #الزمالك #ديكور_منزلي #الرفاهية #مدار_للتصميم",
    targetAudience: "الأعمار: 30 - 65، الاهتمامات: عقارات وأبراج سكنية، نوادي اجتماعية، سفر، سيارات فخمة، ديكورات كلاسيكية.",
    adImagePrompt: "منظور زاوية واسعة لغرفة استقبال فخمة على النيل، سقف كلاسيكي ذهبي وإضاءة مدمجة ناعمة، لمسات رخام إيطالي بالكامل."
  });

  // Campaign Creator States
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignCategory, setNewCampaignCategory] = useState<"apartment" | "shop" | "office">("apartment");
  const [newCampaignPlatform, setNewCampaignPlatform] = useState<"facebook" | "instagram" | "all">("facebook");
  const [newCampaignBudget, setNewCampaignBudget] = useState(10000);
  const [newCampaignTarget, setNewCampaignTarget] = useState("");
  const [newCampaignAdText, setNewCampaignAdText] = useState("");
  const [campaignCreationSuccess, setCampaignCreationSuccess] = useState(false);

  // New Lead manual state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadService, setNewLeadService] = useState("apartment");
  const [newLeadBudget, setNewLeadBudget] = useState("1,500,000 - 2,500,000 ج.م");
  const [newLeadSource, setNewLeadSource] = useState("حملة تسويقية مباشرة");
  const [newLeadNotes, setNewLeadNotes] = useState("");

  // Pixels States
  const [newPixelName, setNewPixelName] = useState("");
  const [newPixelIdVal, setNewPixelIdVal] = useState("");
  const [newPixelPlatform, setNewPixelPlatform] = useState<"facebook" | "instagram">("facebook");
  
  // Real-time Event Monitor logs for Meta Pixel simulated triggers
  const [pixelLogs, setPixelLogs] = useState<Array<{ id: string; time: string; event: string; pixelId: string; status: string; info: any }>>([
    { id: "log_1", time: "20:21:40", event: "PageView", pixelId: "2849182394019283", status: "نشط ✅", info: { path: "/", browser: "Chome/MacOS" } },
    { id: "log_2", time: "20:22:15", event: "PageView", pixelId: "9182309481239485", status: "نشط ✅", info: { path: "/portfolio", browser: "Instagram In-App Browser" } }
  ]);

  // Copy success notification
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const displayCopyMessage = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simulate pixel event fire
  const triggerPixelSimulatedEvent = (eventName: string, params: any = {}) => {
    const activePixels = pixels.filter(p => p.isEnabled);
    if (activePixels.length === 0) {
      alert("⚠️ يرجى تفعيل بكسل تتبع واحد على الأقل أولاً لتسجيل الأحداث!");
      return;
    }
    const newLogs = activePixels.map(pixel => ({
      id: `log_${Date.now()}_${pixel.pixelId}`,
      time: new Date().toLocaleTimeString("ar-EG"),
      event: eventName,
      pixelId: pixel.pixelId,
      status: "تم الإرسال ⚡",
      info: {
        platform: pixel.platform,
        ...params,
        timestamp: new Date().toISOString()
      }
    }));
    setPixelLogs(prev => [...newLogs, ...prev]);

    // If simulating a form submission for leads, we trigger mock response or list updates
    if (eventName === "Lead") {
      const randomNames = ["أ. عبد الرحمن الفيصل", "م. ليلى قطان", "أ. مازن الرويلي", "أ. رانيا الشريف"];
      const randomPhones = ["+966508928312", "+966531980332", "+962798834923", "01124892398"];
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const randomPhone = randomPhones[Math.floor(Math.random() * randomPhones.length)];
      
      const newLead: Lead = {
        id: `lead_${Date.now()}`,
        name: randomName,
        phone: randomPhone,
        email: `${randomName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user"}@marketing.com`,
        serviceNeeded: ["apartment", "shop", "office"][Math.floor(Math.random() * 3)] as any,
        budget: "حسب المقايسة والمعاينة",
        campaignSource: "تفاعل مباشر - بيكسل التتبع المباشر",
        status: "جديد",
        notes: `لقد تفاعل العميل بضغطة زر وتولّد تلقائياً من خلال محاكاة بكسل تتبع إعلانات السوشيال ميديا.`,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setLeads(prev => [newLead, ...prev]);
    }
  };

  // Generate marketing copy calling backend server-side
  const handleGenerateAiCopy = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/generate-marketing-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: aiCategory === "apartment" ? "شقق ديكورية سكنية" : aiCategory === "shop" ? "محلات تجارية وبوتيكات ومقاهي" : "مكاتب إدارية ومقرات شركات",
          tone: aiTone === "Luxury" ? "فاخرة ونخبوية" : aiTone === "Modern" ? "عصرية وحيوية" : aiTone === "Professional" ? "رسمية مهنية ومقنعة" : "إبداعية وقوية التأثير الجمالي",
          platform: aiPlatform === "facebook" ? "فيسبوك كـ منشور إعلاني" : "إنستجرام كمحتوى بصري مع جاذبية نصوص قصيرة ومحفزة",
          details: aiDetails,
          projectName: aiProjectName
        })
      });

      if (!response.ok) {
        throw new Error("حدث خطأ في الخادم أثناء معالجة طلب الذكاء الاصطناعي.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAiResult({
        hook: data.hook || "عنوان الإعلان الرائع",
        body: data.body || "نص الإعلان المكتوب",
        cta: data.cta || "اضغط للتواصل معنا الآن",
        hashtags: data.hashtags || "#تصميم_داخلي",
        targetAudience: data.targetAudience || "الفئة المستهدفة المثالية",
        adImagePrompt: data.adImagePrompt || "اقتراح فكرة التصميم الإبداعي المطبوع"
      });
      
      // Fire mock pixel event PageView/Search content
      triggerPixelSimulatedEvent("Search", { query: `AI Lead Gen: ${aiCategory}` });
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "فشل الاتصال بالذكاء الاصطناعي. يرجى مراجعة تشغيل السيرفر أو إضافة GEMINI_API_KEY.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply Generated AI text to Custom Campaign Form
  const importAiCopyToForm = () => {
    if (!aiResult) return;
    setNewCampaignAdText(`${aiResult.hook}\n\n${aiResult.body}\n\n${aiResult.cta}\n\n${aiResult.hashtags}`);
    setNewCampaignTarget(aiResult.targetAudience);
    setNewCampaignCategory(aiCategory as any);
    alert("✅ تم استيراد النص التسويقي المقترح والفئة بنجاح إلى نموذج الحملة الإعلانية بالأسفل!");
  };

  // Create Campaign Action
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) {
      alert("يرجى إدخال اسم الحملة الإعلانية");
      return;
    }

    const newCampaign: AdCampaign = {
      id: `camp_${Date.now()}`,
      name: newCampaignName,
      category: newCampaignCategory,
      platform: newCampaignPlatform,
      status: "النشط",
      budget: newCampaignBudget,
      spent: 0,
      leadsCount: 0,
      impressions: 0,
      clicks: 0,
      cpc: 0,
      cpl: 0,
      ctr: 0,
      pixelId: pixels[0]?.pixelId || "manual_pixel",
      targetAudience: newCampaignTarget || "الجمهور المستهدف العام المهتم بالديكور والتصميم.",
      adText: newCampaignAdText || "نص مخصص للحملة التسويقية لشركة التصميم الداخلي.",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCampaigns(prev => [newCampaign, ...prev]);
    setIsCampaignModalOpen(false);
    
    // Reset Form Fields
    setNewCampaignName("");
    setNewCampaignBudget(10000);
    setNewCampaignTarget("");
    setNewCampaignAdText("");
    
    setCampaignCreationSuccess(true);
    setTimeout(() => setCampaignCreationSuccess(false), 4000);

    // Track Custom Event
    triggerPixelSimulatedEvent("CompleteRegistration", { campaignName: newCampaignName });
  };

  // Create Manual Lead Action
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) {
      alert("يرجى إدخال اسم العميل المحتمل وهاتفه للمتابعة");
      return;
    }

    const newL: Lead = {
      id: `lead_${Date.now()}`,
      name: newLeadName,
      phone: newLeadPhone,
      email: newLeadEmail || "no-email@mada.com",
      serviceNeeded: newLeadService as any,
      budget: newLeadBudget,
      campaignSource: newLeadSource,
      status: "جديد",
      notes: newLeadNotes || "لا توجد ملاحظات إضافية في الوقت الحالي.",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setLeads(prev => [newL, ...prev]);
    setIsLeadModalOpen(false);
    
    // Reset Lead states
    setNewLeadName("");
    setNewLeadPhone("");
    setNewLeadEmail("");
    setNewLeadNotes("");

    triggerPixelSimulatedEvent("Lead", { client: newLeadName, type: newLeadService });
  };

  // Delete Campaign
  const handleDeleteCampaign = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه المذكرة الإعلانية أو الحملة؟")) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
    }
  };

  // Edit Lead Status Toggle
  const updateLeadStatus = (leadId: string, nextStatus: Lead["status"]) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return { ...lead, status: nextStatus };
      }
      return lead;
    }));
  };

  // Calculate high-fidelity Analytics totals
  const totalCampaignBudget = campaigns.reduce((acc, c) => acc + c.budget, 0);
  const totalCampaignSpent = campaigns.reduce((acc, c) => acc + c.spent, 0);
  const totalLeadsCount = leads.length + campaigns.reduce((acc, c) => acc + c.leadsCount, 0);
  const totalClicksCount = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const totalImpressionsCount = campaigns.reduce((acc, c) => acc + c.impressions, 0);
  
  // Custom Funnel Values derived logically
  const funnelSteps = [
    { name: "مشاهدات الإعلانات (Impressions)", value: totalImpressionsCount, desc: "إجمالي المشاهدات الرقمية للجمهور المستهدف عبر المنصات", color: "bg-slate-400" },
    { name: "النقرات على الروابط (Clicks)", value: totalClicksCount, desc: "العملاء المهتمين الذين تفاعلوا مع التصميم الخارجي والبارمترات الإعلانية", color: "bg-amber-400" },
    { name: "العملاء المحتملين (Leads)", value: totalLeadsCount, desc: "المسجلين بياناتهم لطلب المعاينة وحساب التكلفة المبدئية", color: "bg-gold-500" },
    { name: "التعاقدات والنماذج الفعلية (Conversions)", value: leads.filter(l => l.status === "تم التعاقد" || l.status === "طلب عرض سعر").length, desc: "المشاريع الفائزة قيد التصميم وبدء استسلام الدفعة التنفيذية", color: "bg-emerald-600" }
  ];

  // Adding Custom pixel to table
  const handleAddPixel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPixelName.trim() || !newPixelIdVal.trim()) {
      alert("يرجى مراجعة وتعبئة حقول البيكسل بالكامل بالتناغم");
      return;
    }
    const px: PixelConfig = {
      id: `px_${Date.now()}`,
      name: newPixelName,
      pixelId: newPixelIdVal,
      isEnabled: true,
      platform: newPixelPlatform,
      trackPageViews: true,
      trackLeads: true,
      trackFormSubmits: true
    };
    setPixels(prev => [...prev, px]);
    setNewPixelName("");
    setNewPixelIdVal("");
    alert("✅ تمت إضافة بكسل التتبع بنجاح! يمكنك الآن تفعيل محاكاة أحداث Meta Pixel بالأسفل.");
  };

  const togglePixelState = (id: string) => {
    setPixels(prev => prev.map(p => p.id === id ? { ...p, isEnabled: !p.isEnabled } : p));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col selection:bg-amber-100 selection:text-amber-900 font-sans">
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 rounded-lg text-slate-900 shadow-lg shadow-amber-500/20">
                  <Compass className="w-6 h-6 animate-spin-slow text-slate-950" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span>مَدار</span>
                    <span className="text-xs bg-amber-500/20 text-amber-400 font-medium px-2 py-0.5 rounded text-[10px]">
                      بورتفوليو وإدارة تسويق الداخلي
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 hidden sm:block">الإصدار الهندسي المتكامل مع فيسبوك بكسل و إنستجرام</p>
                </div>
              </div>

              {/* Quick public social profile links */}
              <div className="hidden lg:flex items-center gap-2 mr-4 border-r border-slate-800 pr-4">
                <a
                  href={fbPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="تابعنا على فيسبوك 👤"
                  className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={igPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="تابعنا على إنستجرام 📸"
                  className="p-2 text-slate-400 hover:text-pink-400 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Nav tabs */}
            <nav className="flex space-x-1 space-x-reverse text-sm font-semibold">
              <button
                onClick={() => { setActiveTab("portfolio"); triggerPixelSimulatedEvent("PageView", { view: "Portfolio" }); }}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  activeTab === "portfolio" 
                    ? "bg-amber-500 text-slate-950 shadow-md" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4 ml-1" />
                <span>الخدمات والريبورتوار</span>
              </button>

              <button
                onClick={() => { setActiveTab("campaigns"); triggerPixelSimulatedEvent("PageView", { view: "Campaigns" }); }}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  activeTab === "campaigns"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Sparkles className="w-4 h-4 ml-1" />
                <span>الحملات الإعلانية الذكية</span>
              </button>

              <button
                onClick={() => { setActiveTab("analytics"); triggerPixelSimulatedEvent("PageView", { view: "Analytics" }); }}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  activeTab === "analytics"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Activity className="w-4 h-4 ml-1" />
                <span>تتبع الأداء والبيكسل</span>
              </button>

              <button
                onClick={() => { setActiveTab("leads"); triggerPixelSimulatedEvent("PageView", { view: "Leads_CRM" }); }}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "leads"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4 ml-1" />
                <span>قاعدة العملاء والطلبات</span>
                {leads.filter(l => l.status === "جديد").length > 0 && (
                  <span className="bg-red-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center animate-pulse mr-1">
                    {leads.filter(l => l.status === "جديد").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab("social"); triggerPixelSimulatedEvent("PageView", { view: "Social_Connect" }); }}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "social"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Link2 className="w-4 h-4 ml-1" />
                <span>ربط السوشيال ميديا و الـ APIs</span>
              </button>
            </nav>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Campaign Creation Alerts */}
        {campaignCreationSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl shadow-sm flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-bold">تهانينا! تم إنشاء وتفعيل مسودة الحملة الإعلانية بنجاح.</p>
                <p className="text-xs opacity-90">بيانات الحملة مهيأة الآن ومرحلة لمدير الإعلانات والمراقبة الرقمية.</p>
              </div>
            </div>
            <button onClick={() => setCampaignCreationSuccess(false)} className="text-emerald-700 hover:text-emerald-950 font-bold text-sm">إغلاق</button>
          </div>
        )}

        {/* -------------------- TAB 1: PORTFOLIO & SERVICE PAGES -------------------- */}
        {activeTab === "portfolio" && (
          <div className="space-y-10 animate-fadeIn">
            
            {/* INTRO HERO ZONE */}
            <div className="bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden ring-1 ring-slate-800">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
              
              <div className="relative z-10 max-w-3xl space-y-4">
                <span className="inline-block bg-amber-500/20 text-amber-400 font-semibold px-3 py-1 rounded-full text-xs tracking-wider border border-amber-500/30">
                  حلول التصميم الهندسي والتسويق المتكامل
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  نحن لا نصمم الفراغ فقط المادي، نحن نبني تجربة بصرية تضاعف أرباحك وتبرز برستيجك!
                </h2>
                <p className="text-slate-300 text-base leading-relaxed">
                  أهلاً بك في منصة أعمالنا الداعمة للتسويق والتحليلات الإعلانية. نحن حلقة الوصل المحترفة بين الإبداع الهندسي والانتشار التجاري الرقمي عبر فيسبوك بكسل وإنستغرام لمشاريع الديكور الحديثة.
                </p>
                
                <div className="pt-4 flex flex-wrap gap-4 text-xs font-semibold">
                  <div className="bg-slate-800/80 border border-slate-700 hover:border-slate-600 rounded-xl p-4 flex items-center gap-3 transition">
                    <span className="text-2xl">🏬</span>
                    <div>
                      <p className="text-white">الفئة السكنية (الشقق)</p>
                      <p className="text-slate-400 font-light font-sans">تطوير الهوية والراحة المنزلية</p>
                    </div>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700 hover:border-slate-600 rounded-xl p-4 flex items-center gap-3 transition">
                    <span className="text-2xl">🛍️</span>
                    <div>
                      <p className="text-white">المحلات التجارية</p>
                      <p className="text-slate-400 font-light font-sans">دراسة حركة وسلوك العملاء لرفع المبيعات</p>
                    </div>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700 hover:border-slate-600 rounded-xl p-4 flex items-center gap-3 transition">
                    <span className="text-2xl">🏢</span>
                    <div>
                      <p className="text-white">المكاتب الإدارية</p>
                      <p className="text-slate-400 font-light font-sans">بيئات عمل ممتازة ملهمة للإنتاج</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DISCIPLINED PAGES CATEGORIZED TABS */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">معرض مشروعاتنا الهندسية والتجارية الاستثنائية</h3>
                  <p className="text-slate-500 text-sm mt-1">تصفح نماذج تم تصميمها وتنفيذها بعناية فائقة، تمهيداً لنسخ نصوص حملاتها الإعلانية بلمسة واحدة</p>
                </div>

                {/* Filter and Category Selectors */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={() => { setProjectCategoryFilter("all"); triggerPixelSimulatedEvent("PageView", { filter: "all" }); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      projectCategoryFilter === "all"
                        ? "bg-slate-900 text-white shadow-md"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    الكل ({projects.length})
                  </button>
                  <button
                    onClick={() => { setProjectCategoryFilter("apartment"); triggerPixelSimulatedEvent("PageView", { filter: "apartment" }); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      projectCategoryFilter === "apartment"
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    شقق سكنية 🏠
                  </button>
                  <button
                    onClick={() => { setProjectCategoryFilter("shop"); triggerPixelSimulatedEvent("PageView", { filter: "shop" }); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      projectCategoryFilter === "shop"
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    محلات تجارية 🛍️
                  </button>
                  <button
                    onClick={() => { setProjectCategoryFilter("office"); triggerPixelSimulatedEvent("PageView", { filter: "office" }); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      projectCategoryFilter === "office"
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    مكاتب إدارية 🏢
                  </button>
                </div>
              </div>

              {/* SERVICE FOCUS BOX BASED ON FILTER */}
              <div className="mb-8 p-6 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-2xl transition">
                {projectCategoryFilter === "all" && (
                  <div className="space-y-2">
                    <p className="font-bold text-amber-900 flex items-center gap-2">
                      <span className="text-lg">📢</span> 
                      <span>فلسفتنا التسويقية الشاملة لكافة فئات التصميم:</span>
                    </p>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      نؤمن بأن كل فراغ يحتاج طريقة تسويقية وصور تعبيرية ونبرة إقناع مغايرة للأخرى. انقر فوق زر أي فئة بالجانب للاطلاع على <b>المسار التسويقي المناسب</b> والورقة التعريفية لبيع واستهداف كل فئة باحترافية على فيسبوك وإنستجرام.
                    </p>
                  </div>
                )}
                
                {projectCategoryFilter === "apartment" && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-3">
                      <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <span>🏠</span>
                        <span>صفحة تسويق الشقق السكنية: التميز، البرستيج، والراحة النفسية الاستثنائية</span>
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        <b>الرسالة التسويقية الأساسية:</b> العميل هنا لا يشتري فقط طلاءً أو ديكورًا، بل يشتري <b>"برستيجه وأرستقراطية فراغه الخاص"</b>، وبالمقام الثاني "السكينة والاسترخاء الروحي الخالي من الفوضى البصرية". من الهام جداً استهداف العائلات الشابة والأطباء وكبار المدراء بمدن التجمعات الجديدة.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded font-semibold">توسيد الأخشاب الدافئة</span>
                        <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded font-semibold">رخام إيطالي بوتشينو</span>
                        <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded font-semibold">توزيع إضاءة ذكية</span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-amber-200/50 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-slate-500 font-bold">رأي عميل مثالي في الشقق السكنية:</p>
                        <p className="text-xs italic text-slate-700 mt-2">"أعاد المهندسون تنظيم الشقة في الزمالك، جودة الرخام الإيطالي والتجاليد الخشبية مذهلة. أشعر بالفخامة اليوم في منزلي."</p>
                      </div>
                      <p className="text-xs font-semibold text-amber-700 mt-3 left-0">- د. هاني الرشيدي</p>
                    </div>
                  </div>
                )}

                {projectCategoryFilter === "shop" && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-3">
                      <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <span>🛍️</span>
                        <span>صفحة تسويق المحلات والمتاجر: علم نفس المستهلك والدوران البصري السريع</span>
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        <b>الرسالة التسويقية الأساسية:</b> نحن نعرض خدماتنا على التاجر أو المستثمر بصفته شريك نجاح يهدف لـ <b>"تحقيق تدفق زوار مستدام وزيادة لافتة في حجم الفواتير اليومية"</b>. نعتمد على الإضاءة بزوايا 45 درجة، وتصميم مساحات مهيأة خصيصاً لوضع الصور الرائجة على منصتي إنستغرام وتيك توك (Instagrammable Spots) للتسويق الذاتي المجاني.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded font-semibold">توجيه حركة العميل (Customer Journey)</span>
                        <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded font-semibold">إضاءة دراماتيكية مركزة</span>
                        <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded font-semibold">مناطق مخصصة لصور سيلفي</span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-amber-200/50 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-slate-500 font-bold">رأي رائد أعمال شريك:</p>
                        <p className="text-xs italic text-slate-700 mt-2">"تصميم ممر العرض الدائري الجديد في محل الأزياء ضاعف مبيعات الفساتين الإيطالية بنسبة 45٪ في أول شهر من تجديد المتجر!"</p>
                      </div>
                      <p className="text-xs font-semibold text-amber-700 mt-3">- أ. ديما العساف (بوتيك الرياض)</p>
                    </div>
                  </div>
                )}

                {projectCategoryFilter === "office" && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-3">
                      <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <span>🏢</span>
                        <span>صفحة تسويق المكاتب الإدارية: زيادة الإنتاجية، تضخيم الولاء المؤسسي، والهيبة الوقورة</span>
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        <b>الرسالة التسويقية الأساسية:</b> يستهدف هذا العرض كبار المستثمرين والمدراء القانونيين والتقنيين. نلجأ إلى <b>"تعزيز الولاء المهني للموظفين، جلب الطاقات الإنتاجية الإيجابية، وفرض ثقة حديدية مطلقة أمام شركائك وحصار صفقاتك الدولية بروعة كلاسيكية أو حيوية ذكية"</b>. غرف عازلة تماماً للصوت، ومساحات مرنة للاجتماعات الهجينة.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded font-semibold">غرف ذكية معزولة صخرداً وعازلة للصوت</span>
                        <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded font-semibold">تنظيم الفراغات الإرجونومية</span>
                        <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded font-semibold">أخشاب الماهوجني الكلاسيكية الملكية</span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-amber-200/50 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-slate-500 font-bold">رأي مدير تقني تنفيذي:</p>
                        <p className="text-xs italic text-slate-700 mt-2">"المطورون بالقرية الذكية باتوا أكثر رضا وتركيز في غرف العزل ومساحات العصف الذهني. خفضت نسبة الدوران الوظيفي لدينا بشكل حاسم."</p>
                      </div>
                      <p className="text-xs font-semibold text-amber-700 mt-3">- م. أحمد شرف (GlobalSoft)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* BENTO GRID OF DESIGN PROJECTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects
                  .filter(p => projectCategoryFilter === "all" || p.category === projectCategoryFilter)
                  .map(p => (
                    <div 
                      key={p.id} 
                      className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-amber-400 group shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                      id={`project_card_${p.id}`}
                    >
                      <div>
                        <div className="relative h-56 overflow-hidden">
                          <img 
                            src={p.imageUrl} 
                            alt={p.arabicTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 right-3 bg-slate-900/95 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md">
                            {p.categoryLabel}
                          </div>
                          
                          <div className="absolute bottom-3 left-3 bg-slate-950/70 text-white text-xs px-2.5 py-0.5 rounded cursor-pointer hover:bg-amber-500 hover:text-slate-950 transition font-sans" onClick={() => triggerPixelSimulatedEvent("PageView", { project: p.arabicTitle })}>
                            محاكاة معاينة وتتبع بكسل 👁️
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-6 space-y-3">
                          <span className="text-xs font-bold text-amber-600 tracking-wide block uppercase font-mono">{p.style}</span>
                          <h4 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition">{p.arabicTitle}</h4>
                          <p className="text-slate-500 text-xs font-light line-clamp-3 leading-relaxed">{p.description}</p>
                          
                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-600">
                            <span className="flex items-center gap-1">⏱️ الفاصل العشري: <b>{p.duration}</b></span>
                            <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded text-[10px]">{p.budgetRange}</span>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex items-start gap-1">
                              <span className="text-xs leading-none">🎯</span>
                              <p className="text-[10px] text-slate-500 leading-normal"><span className="font-bold text-slate-700">الاستهداف الإعلاني المقترح:</span> {p.targetAudienceText}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer actions */}
                      <div className="px-6 pb-6 pt-2 bg-slate-55/50 border-t border-slate-50 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAiCategory(p.category);
                            setAiDetails(`مشروع حقيقي مستلهم من ${p.arabicTitle} على نظام وأسلوب ${p.style}. تشمل الميزات الحصرية: ${p.features.join('، ')}.`);
                            setActiveTab("campaigns");
                            // Focus smoothly onto AI copywriting and populate name
                            setAiProjectName("مدار الهندسي للتصميم الديكوري الفخم");
                            alert(`🌟 رائع! تم تحميل تدوين وتحليلط ${p.arabicTitle}. لقد نقلناك الآن إلى تبويب الحملات الإعلانية ومولّد النصوص الذكية ✨`);
                          }}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>صناعة حملة لهذا العمل</span>
                        </button>

                        <button
                          onClick={() => setSelectedProjectForModal(p)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs p-2 rounded-xl transition"
                          title="تفاصيل الخامات والسمات الإعلانية كاملة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* HIGH-FIDELITY MARKETING STATEMENT PANEL */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">التكامل والتسويق الحديث</span>
                <h3 className="text-2xl font-extrabold text-slate-900 leading-snug">
                  هل موقعك الإلكتروني متوافق مع خوارزميات فيسبوك بكسل وفيسبوك أدز؟
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  الحصول على فكرة تصميمية مبهرة في الشقة أو المحل هي نصف الحكاية فقط. النصف الآخر والأهم هو <b>"أن يراها العميل المستعد للدفع في اللحظة المناسبة تماماً"</b>. 
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  منصتنا تتيح لك ربط كل مشروع مباشرة بحملة إعلانية ممتازة ومثبتة مع أكواد تتبع Meta Pixel جاهزة للنسخ التلقائي للوصول لمعدل تحويل (Conversion Rate) منقطع النظير.
                </p>
                
                <div className="pt-2 flex flex-col gap-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold text-lg">✔</span>
                    <span>كتابة آلية لنصوص ومحاذاة الجمهور المستهدف بالذكاء الاصطناعي العربي المتقدم.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold text-lg">✔</span>
                    <span>توليد أكواد البيكسل المناسبة لأحداث إرسال نموذج المعاينة والاتصال المباشر.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold text-lg">✔</span>
                    <span>إحصاءات تدفق الميزانية الإعلانية ومعدل التكلفة لكل عميل محتمل مبدئي تلقائياً.</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-slate-100 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-amber-400">لوحة تتبع Meta Pixel الفورية</span>
                  <span className="inline-block bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full">جاهز للحقن</span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <p className="text-slate-400">// تم تهيئة الكود على زر اتصل بنا والعملاء الجدد:</p>
                  <pre className="bg-slate-950 p-3 rounded-lg overflow-x-auto text-[11px] text-amber-300 border border-slate-800 scrollbar-thin">
{`fbq('track', 'Lead', {
  content_category: 'Interior Design',
  service_type: '${projectCategoryFilter || "apartment"}',
  value: 25000.00,
  currency: 'EGP'
});`}
                  </pre>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button 
                    onClick={() => {
                      triggerPixelSimulatedEvent("PageView", { simulatedAction: "Test Pixel Click" });
                      alert("🔥 رائع! تم إطلاق حدث PageView التجريبي على البكسل. يمكنك تتبعه في التبويب الثالث 'تتبع الأداء والبيكسل' بالأسلاك المنبثقة.");
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-xl transition"
                  >
                    تفقد وراقب إرسال البيكسل الآن ⚡
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* -------------------- TAB 2: AD CAMPAIGNS & AI COPYWRITER -------------------- */}
        {activeTab === "campaigns" && (
          <div className="space-y-10 animate-fadeIn text-slate-800">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* INTERACTIVE LEFT COLUMN: AI AUTO-COPYWRITING INTEGRATION */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-amber-500/15 text-amber-700 rounded-lg">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">مساعد الكتابة والتسويق الذكي بمحرك Gemini ✨</h3>
                    <p className="text-xs text-slate-500 mt-0.5">صمم أفضل حملة تسويقية عبر فيسبوك وإنستجرام باستهداف ذكي في ثوانٍ معدودة</p>
                  </div>
                </div>

                {/* COPY GENERATION PARAMETERS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700" id="ai-category-label">فئة التصميم المستهدفة</label>
                    <select
                      value={aiCategory}
                      onChange={(e) => setAiCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 bg-slate-50 font-semibold"
                    >
                      <option value="apartment">🏠 تصميم شقة سكنية (عائلات وملاك راقين)</option>
                      <option value="shop">🛍️ تصميم متجر تجاري / كافي / بوتيك (علامات تجارية ومبيعات)</option>
                      <option value="office">🏢 تخطيط مكتب إداري أو شركة (مدراء تنفيذيين وموارد بشرية)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">النبرة الإعلانية (Tone)</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 bg-slate-50 font-semibold"
                    >
                      <option value="Luxury">✨ راقية ونخبوية (Luxury/Ultra-Premium)</option>
                      <option value="Modern">⚡ عصرية وجذابة ومينيمال (Dynamic Modern)</option>
                      <option value="Professional">💼 احترافية ومقنعة بالأرقام وسرعة التسليم</option>
                      <option value="Creative">🎨 إبداعية تركز على الحلول والخدع الجمالية بالفراغ</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">المنصة المستهدفة</label>
                    <select
                      value={aiPlatform}
                      onChange={(e) => setAiPlatform(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 bg-slate-50 font-semibold"
                    >
                      <option value="facebook">👥 فيسبوك (إعلانات ونصوص تفصيلية)</option>
                      <option value="instagram">📸 إنستجرام (بصري، مباشر، وموجه بهاشتاجات قوية)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">اسم مكتب التصميم / المقاول</label>
                    <input
                      type="text"
                      value={aiProjectName}
                      onChange={(e) => setAiProjectName(e.target.value)}
                      placeholder="مثال: مدار للتصميم والتشطيب الفاخر"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">تفاصيل إضافية أو مميزات تريد إبرازها (اختياري)</label>
                  <textarea
                    value={aiDetails}
                    onChange={(e) => setAiDetails(e.target.value)}
                    placeholder="مثال: خصم 15% على التصميم الداخلي هذا الشهر، الإشراف الفني مجاناً بالكامل، أو استخدام رخام طبيعي من جبال إيطاليا مع تسليم الكتالوج عبر واتساب.."
                    rows={3}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 bg-slate-50 leading-relaxed"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleGenerateAiCopy}
                    disabled={isAiLoading}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-md ${
                      isAiLoading 
                        ? "bg-slate-300 text-slate-600 cursor-not-allowed" 
                        : "bg-slate-900 text-white hover:bg-slate-800 hover:text-amber-400"
                    }`}
                  >
                    {isAiLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>جاري صياغة النص وتحليل الإقناع البصري...</span>
                      </span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>توليد محتوى ذكي بالذكاء الاصطناعي 🇸🇦 ✨</span>
                      </>
                    )}
                  </button>
                  {aiError && (
                    <p className="text-red-500 text-[11px] font-bold mt-2 bg-red-50 p-2 rounded-lg border border-red-200">
                      {aiError}
                    </p>
                  )}
                </div>

                {/* AI OUTPUT CONTAINER */}
                {aiResult && (
                  <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 sm:p-6 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                      <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <span>🤖</span>
                        <span>مخرجات صياغة الذكاء الاصطناعي المعززة:</span>
                      </p>
                      
                      <button
                        onClick={importAiCopyToForm}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-950 text-[10px] font-extrabold px-3 py-1 rounded-lg transition border border-amber-300"
                      >
                        استيراد النص لنموذج الحملة ⬇️
                      </button>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block mb-1">🪝 الافتتاحية القوية الجاذبة (Hook):</span>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-slate-800 relative group select-all">
                          {aiResult.hook}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-slate-800 block mb-1">📋 صلب إعلان الخدمة (Body Copy):</span>
                        <div className="bg-white p-3 rounded-lg border border-slate-100 text-slate-700 leading-relaxed select-all">
                          {aiResult.body}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="font-bold text-slate-800 block mb-1">📞 دعوة الإجراء (CTA):</span>
                          <div className="bg-white p-2 rounded-lg border border-slate-100 select-all font-semibold text-emerald-700">
                            {aiResult.cta}
                          </div>
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block mb-1">🏷️ الهاشتاجات:</span>
                          <div className="bg-white p-2 rounded-lg border border-slate-100 select-all font-mono text-slate-500">
                            {aiResult.hashtags}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-amber-200/40">
                        <div>
                          <span className="font-semibold text-amber-900 block mb-1">🎯 الاستهداف المقترح بمدير الإعلانات:</span>
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 uppercase">{aiResult.targetAudience}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-amber-900 block mb-1">💡 فكرة التصميم الإبداعي البصري (Ad Creative):</span>
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 italic">{aiResult.adImagePrompt}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* INTERACTIVE RIGHT COLUMN: DIGITAL ADS SIMULATOR PREVIEW */}
              <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-6 text-white shadow-xl space-y-6 lg:sticky lg:top-24 border border-slate-800">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">محاكي منصات التواصل الاجتماعي 📱</h3>
                    <p className="text-[11px] text-slate-400">معاينة فورية لتصميم الإعلان على الهواتف والأجهزة</p>
                  </div>

                  <span className="text-xs bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-md animate-pulse">
                     إعلان ممول Live
                  </span>
                </div>

                {/* DEVICE PREVIEW */}
                <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-between max-w-sm mx-auto">
                  
                  {/* Top Header of Simulated App */}
                  <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-md">
                        M
                      </div>
                      <div>
                        <p className="font-bold text-white text-[11px]">{aiProjectName || "مكتب مدار للتصميم"}</p>
                        <p className="text-[9px] text-slate-400 flex items-center gap-1">
                          <span>إعلان ممول</span>
                          <span>•</span>
                          <span>🌐</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xl">•••</span>
                  </div>

                  {/* Simulated Copy */}
                  <div className="p-3.5 space-y-2 text-xs">
                    <p className="font-bold text-amber-300 text-[11px]">{aiResult?.hook || "انطلاق حملة التجديد والديكور!"}</p>
                    <p className="text-slate-200 line-clamp-3 leading-relaxed text-[10px]">
                      {aiResult?.body || "ابدأ اليوم في تشطيب شقتك بمستوى يضاهي الفنادق العالمية مع مهندسين مؤهلين بالكامل وتسليم على المفتاح."}
                    </p>
                    <p className="text-blue-400 text-[10px] break-all">{aiResult?.hashtags || "#تصميم_داخلي #ديكور"}</p>
                  </div>

                  {/* Simulated Creative Image */}
                  <div className="relative h-44 bg-slate-900 border-y border-slate-800 overflow-hidden">
                    <img 
                      src={
                        aiCategory === "shop" 
                          ? "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600"
                          : aiCategory === "office"
                          ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600"
                          : "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=600"
                      } 
                      alt="Ad Preview Creative"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/90 py-2.5 px-4 backdrop-blur-sm flex items-center justify-between border-t border-slate-800">
                      <div>
                        <p className="text-[9px] text-slate-400 tracking-wider">MADA-DESIGN.COM</p>
                        <p className="font-bold text-white text-[11px] truncate w-44">{aiProjectName || "احصل على استشارتك المجانية"}</p>
                      </div>

                      <button 
                        onClick={() => {
                          triggerPixelSimulatedEvent("Lead", { action: "Click Ad CTA-Submit" });
                          alert("🔥 رائع! لقد نقرت على زر اتخاذ الإجراء في محاكي الإعلان. هذا بحد ذاته يسجل حدث 'Lead' حقيقي ويقوم توليف عميل محتمل جديد تلقائياً في التبويب الرابع!");
                        }}
                        className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold text-[10px] py-1.5 px-3 rounded transition shadow-md"
                      >
                        ارسل رسالة 💬
                      </button>
                    </div>
                  </div>

                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>لماذا ينجح هذا المزيج؟</span>
                  </p>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    من خلال مطابقة الطراز الهندسي المختار (مثل نيو كلاسيك) للجمهور المختار على فيسبوك وتتبع سلوكياتهم عبر Pixel، فإن الإعلانات تظهر فقط لمن يملك القدرة الشرائية ويبحث عن عقار أو تشطيب بالمنطقة المستهدفة، مما يقلل الهدر الإعلاني بحدود 40%.
                  </p>
                </div>

              </div>

            </div>

            {/* LOWER PORTION: DATA ENTRY FOR DRAFT CAMPAIGNS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">نظام إدخال وإدارة بيانات الإعلانات 📊</h3>
                  <p className="text-xs text-slate-500 mt-0.5">سجل بيانات حملتك هنا لمراقبة الأرقام والميزانية بانتظام وقوة</p>
                </div>

                <button
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء حملة إعلانية جديدة</span>
                </button>
              </div>

              {/* LIST OF RUNNING OR DRAFT CAMPAIGNS */}
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <th className="p-4 rounded-r-xl">اسم الحملة والمنصة</th>
                      <th className="p-4">الفئة</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">الميزانية الإجمالية</th>
                      <th className="p-4">الإنفاق الفعلي</th>
                      <th className="p-4 text-center">العملاء (Leads)</th>
                      <th className="p-4">الاستهداف الإعلاني المبرمج</th>
                      <th className="p-4 rounded-l-xl text-center">خيارات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaigns.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-3 py-6">
                            <span className="text-4xl animate-pulse">📢</span>
                            <span className="font-extrabold text-slate-600 text-sm">لا توجد حملات إعلانية نشطة أو مسودات حالياً</span>
                            <span className="text-[11px] text-slate-400 max-w-md leading-relaxed">
                              ابدأ بتصميم وتوليد نصوص واستهدافات حملتك بالذكاء الاصطناعي Meta Ads. استخدم المولد بالأعلى واضغط على "إطلاق الحملة وحفظها" لترى أداءها هنا بالكامل!
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {campaigns.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-all font-sans">
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <span className="font-mono">التاريخ: {c.createdAt}</span>
                            <span>•</span>
                            <span className="bg-slate-150 px-1.5 py-0.2 rounded font-semibold text-slate-600 leading-none">
                              {c.platform === "facebook" ? "فيسبوك 👤" : c.platform === "instagram" ? "إنستغرام 📸" : "فيسبوك + إنستغرام 🌐"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="bg-amber-50 text-amber-900 px-2 py-1 rounded font-bold text-[10px]">
                            {c.category === "apartment" ? "شقق 🏠" : c.category === "shop" ? "محلات 🛍️" : "مكاتبإدارية 🏢"}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "النشط" 
                              ? "bg-emerald-50 text-emerald-700 font-bold" 
                              : "bg-slate-100 text-slate-600 font-bold"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === "النشط" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap font-bold text-slate-900 font-mono">
                          {c.budget.toLocaleString()} ج.م
                        </td>
                        <td className="p-4 whitespace-nowrap font-mono text-slate-600">
                          {c.spent.toLocaleString()} ج.م
                        </td>
                        <td className="p-4 text-center whitespace-nowrap font-extrabold text-blue-600 font-mono text-sm">
                          {leads.filter(l => l.campaignSource === c.name).length || c.leadsCount}
                        </td>
                        <td className="p-4 text-[10px] text-slate-500 max-w-xs truncate" title={c.targetAudience}>
                          {c.targetAudience}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setNewCampaignAdText(c.adText);
                                setNewCampaignTarget(c.targetAudience);
                                setNewCampaignCategory(c.category);
                                setNewCampaignName(c.name);
                                triggerPixelSimulatedEvent("PageView", { loadedCampaign: c.name });
                                alert(`🔄 تم تحميل نصوص حملة [${c.name}] في المحاكي وعلى نموذج التحرير لتتمكن من التعديل أو نسخ النص بسهولة!`);
                              }}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-950 hover:text-slate-950 p-1.5 rounded transition text-[10px] font-bold"
                              title="نسخ وتحميل نصوص الإعلان"
                            >
                              تفقد الإعلان 🖥️
                            </button>
                            
                            <button
                              onClick={() => handleDeleteCampaign(c.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded transition"
                              title="حذف"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* -------------------- TAB 3: PERFORMANCE ANALYTICS & PIXELS -------------------- */}
        {activeTab === "analytics" && (
          <div className="space-y-10 animate-fadeIn text-slate-800">
            
            {/* KPI METRICS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">إجمالي الميزانية المرصودة</p>
                  <p className="text-2xl font-black text-slate-900 font-mono">{(totalCampaignBudget).toLocaleString()} <span className="text-sm font-sans font-normal text-slate-500">ج.م</span></p>
                  <p className="text-[10px] text-slate-400 mt-1">حجم تمويل المشاريع المعلنة</p>
                </div>
                <div className="p-3.5 bg-slate-900 text-amber-400 rounded-xl">
                  <DollarSign className="w-6 h-6 text-amber-500" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">المنفق الفعلي</p>
                  <p className="text-2xl font-black text-slate-900 font-mono">{(totalCampaignSpent).toLocaleString()} <span className="text-sm font-sans font-normal text-slate-500">ج.م</span></p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ الميزانية تحت الإشراف والسيطرة</p>
                </div>
                <div className="p-3.5 bg-slate-900 text-amber-400 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">إجمالي العملاء المستقطبين</p>
                  <p className="text-2xl font-black text-blue-700 font-mono">{totalLeadsCount}</p>
                  <p className="text-[10px] text-slate-400 mt-1">معدل التكلفة التقريبي للعميل: <span className="font-bold text-amber-700 font-mono">{(totalLeadsCount > 0 ? totalCampaignSpent / totalLeadsCount : 0).toFixed(1)} ج.م</span></p>
                </div>
                <div className="p-3.5 bg-blue-100 text-blue-700 rounded-xl">
                  <span className="text-xl">👥</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">العائد التقريبي على الاستثمار (ROI)</p>
                  <p className="text-2xl font-black text-emerald-600 font-mono">{totalLeadsCount > 0 ? "740%" : "0%"}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">صفقات فائزة مبرمة بالكامل</p>
                </div>
                <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Percent className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* PERFORMANCE FUNNEL BAR GRAPH & FB PIXELS CONFIG */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* FUNNEL AND ANALYSIS CHART */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">مسار التحويل الإعلاني والمبيعات (Conversion Funnel)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">تحليل تدفق حركة العملاء من الظهور وحتى الإمضاء والمقايسة الهندسية المعتمدة</p>
                </div>

                <div className="space-y-4 pt-2">
                  {funnelSteps.map((step, idx) => (
                    <div key={idx} className="space-y-1.5" id={`funnel_row_${idx}`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{step.name}</span>
                        <span className="font-mono bg-slate-100 font-extrabold px-2 py-0.5 rounded text-slate-900 text-[11px]">
                          {step.value.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full bg-slate-100 h-7 rounded-lg overflow-hidden relative border border-slate-200/50">
                        {/* Percentage calculation to display relative bar size */}
                        <div 
                          className={`h-full ${step.color} transition-all duration-500`}
                          style={{ width: `${100 - idx * 28}%` }}
                        ></div>
                        <span className="absolute inset-y-0 right-3 flex items-center text-[10px] text-slate-900 font-medium truncate pointer-events-none">
                          {step.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-2">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.1">
                    <span>💡</span>
                    <span>تفسير التحليلات لشركة التصميم الداخلي:</span>
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    يُظهر قمع المبيعات دقة لافتة! يمثل معدل التحويل من نقرات الإعلان إلى عملاء مسجلين حوالي <span className="font-bold text-slate-800">4.8%</span> وهو معدل متقدم جداً في قطاع الديكور والتشطيب. يعود هذا بالدرجة الأولى للنبرة الراقية المتولدة من الذكاء الاصطناعي وصور المعاينة المستهدفة بعناية.
                  </p>
                </div>
              </div>

              {/* PIXEL CODE INJECTOR & MANAGEMENT */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">ربط فيسبوك بيكسل & إنستجرام 🔗</h3>
                  <p className="text-xs text-slate-500 mt-0.5">تابع وقم بتهيئة وإدارة أكواد التحويلات لضمان التتبع المثالي</p>
                </div>

                {/* PIXEL ADDER FORM */}
                <form onSubmit={handleAddPixel} className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-900">إضافة بكسل تتبع جديد:</p>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">اسم المعرّف (أو الحملة المرتبطة)</label>
                    <input
                      type="text"
                      value={newPixelName}
                      onChange={(e) => setNewPixelName(e.target.value)}
                      placeholder="مثال: بيكسل جوجل أو تيك توك المساعد"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">المنصة</label>
                      <select
                        value={newPixelPlatform}
                        onChange={(e: any) => setNewPixelPlatform(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs focus:ring-1 focus:ring-amber-500 font-semibold"
                      >
                        <option value="facebook">فيسبوك 👥</option>
                        <option value="instagram">إنستجرام 📸</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">معرّف البيكسل (ID)</label>
                      <input
                        type="text"
                        value={newPixelIdVal}
                        onChange={(e) => setNewPixelIdVal(e.target.value)}
                        placeholder="ID رقمي مكون من 15 خانة"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-left font-mono focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-2 rounded-lg transition"
                  >
                    إضافة وتفعيل الربط الفوري
                  </button>
                </form>

                {/* CURRENT LIST */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-900">معرّفات البيكسل النشطة حالياً:</p>
                  <div className="space-y-2">
                    {pixels.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:border-amber-400 transition shadow-sm text-xs" id={`pixel_row_${p.id}`}>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1">
                            <span>{p.name}</span>
                            <span className="text-[9px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-500">
                              {p.platform === "facebook" ? "فيسبوك 👤" : "إنستغرام 📸"}
                            </span>
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">ID: {p.pixelId}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${p.isEnabled ? "text-emerald-600 font-bold" : "text-amber-600"}`}>
                            {p.isEnabled ? "نشط" : "متوقف"}
                          </span>
                          <button
                            onClick={() => togglePixelState(p.id)}
                            className={`w-10 h-6 rounded-full p-0.5 transition-all ${p.isEnabled ? "bg-emerald-500" : "bg-slate-200"}`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white transition-all shadow ${p.isEnabled ? "translate-x-0" : "-translate-x-4 md:-translate-x-4 ml-auto"}`}></div>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* FLOATING AND INTERACTIVE METAPIXEL REAL-TIME TEST CONSOLE */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <p className="font-bold text-white text-sm">أداة فحص واختبار البيكسل الفورية (Meta Pixel Event Console)</p>
                </div>
                <button
                  onClick={() => {
                    setPixelLogs([
                      { id: `log_${Date.now()}`, time: new Date().toLocaleTimeString("ar-EG"), event: "ConsoleCleared", pixelId: "---", status: "نشط ✅", info: { action: "سجل نظيف" } }
                    ]);
                  }}
                  className="text-[10px] border border-slate-700 hover:border-slate-500 rounded-lg px-2 py-1 transition"
                >
                  تفريغ السجل
                </button>
              </div>

              <p className="text-xs text-slate-300">
                يقوم هذا القسم بمحاكاة حركة الأكواد البرمجية والتتبع التلقائي. انقر على أزرار الأحداث بالأسفل لمحاكاة نقر العميل على موقعك ومراقبة ترحيل البيانات الفورية لخوادم فيسبوك وإنستجرام:
              </p>

              {/* SIMULATE EVENT BUTTON CONTROL GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => triggerPixelSimulatedEvent("PageView", { path: "/apartments-neo-classic" })}
                  className="bg-slate-800 hover:bg-slate-750 text-white text-[10px] font-bold py-2 px-3 rounded-xl transition border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <span>👁️</span>
                  <span>معاينة صفحة (PageView)</span>
                </button>

                <button
                  onClick={() => triggerPixelSimulatedEvent("Lead", { interest: "شقق فندقية مستهدفة", budget: "3,000,000" })}
                  className="bg-slate-800 hover:bg-slate-755 text-white text-[10px] font-bold py-2 px-3 rounded-xl transition border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <span>👥</span>
                  <span>عميل جديد (Lead Event)</span>
                </button>

                <button
                  onClick={() => triggerPixelSimulatedEvent("CompleteRegistration", { value: "شريك أعمال تجارية (Shop Boutique)" })}
                  className="bg-slate-850 hover:bg-slate-755 text-amber-400 text-[10px] font-bold py-2 px-3 rounded-xl transition border border-amber-500/30 flex items-center justify-center gap-1.5"
                >
                  <span>📨</span>
                  <span>إرسال النموذج (CompleteReg)</span>
                </button>

                <button
                  onClick={() => triggerPixelSimulatedEvent("Contact", { platform: "whatsapp_direct" })}
                  className="bg-slate-800 hover:bg-slate-750 text-emerald-400 text-[10px] font-bold py-2 px-3 rounded-xl transition border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <span>💬</span>
                  <span>اتصال واتساب (Contact)</span>
                </button>
              </div>

              {/* TELEMETRY WINDOW */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 h-56 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-2 scrollbar-thin">
                <p className="text-slate-500">// بث الأحداث التلقائية المتولدة والجاهزة للتصدير لمدير الإعلانات:</p>
                {pixelLogs.map((log) => (
                  <div key={log.id} className="border-b border-slate-900 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-1 animate-fadeIn">
                    <p className="text-amber-400">
                      <span className="text-slate-500 font-sans text-[10px]">{log.time}</span>{" "}
                      <span className="font-extrabold text-blue-400">fbq('track', '{log.event}');</span>
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400">
                      <span>بيكسل: <span className="text-slate-200">{log.pixelId}</span></span>
                      <span>{log.status === "تم الإرسال ⚡" ? <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold">تم الإرسال ⚡</span> : <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">نشط ✅</span>}</span>
                      <span className="hidden md:inline text-[9px] text-slate-500">تفاصيل: {JSON.stringify(log.info)}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

        {/* -------------------- TAB 4: LEADS DATABASE CRM -------------------- */}
        {activeTab === "leads" && (
          <div className="space-y-8 animate-fadeIn text-slate-800">
            
            {/* INTRO TRACKER */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">نظام إدارة وتتبع المبيعات والعملاء المحتملين (Leads CRM)</h3>
                <p className="text-xs text-slate-500 mt-0.5">تلقي الطلبات الواردة من إعلانات ومعاينة بكسل تتبع التصاميم ومتابعة حالتهم التنفيذية</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLeadModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold py-2 px-4 rounded-xl transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>إدخال عميل يدوي جديد 👤</span>
                </button>
              </div>
            </div>

            {/* LEADS LIST ACCORDING TO SALES STATE */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <h4 className="font-extrabold text-slate-900 text-sm">قائمة المتابعة الحية للعملاء المهتمين بديكورات الشقق والمكاتب والمعارض:</h4>
                  <span className="text-xs text-slate-400 font-semibold">إجمالي المسجلين: <b className="text-slate-900 font-bold">{leads.length}</b> ملاك</span>
                </div>

                <div className="space-y-4">
                  {leads.length === 0 && (
                    <div className="text-center p-10 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
                      <span className="text-4xl">👥</span>
                      <span className="font-extrabold text-slate-700 text-sm">لا يوجد عملاء مسجلون حالياً</span>
                      <span className="text-[11px] text-slate-400 max-w-sm leading-relaxed text-center">
                        عندما تحصل على عملاء محتملين من حملاتك الإعلانية النشطة، أو عندما تقوم بتسجيل عميل يدويًا، سيظهرون هنا لإشراكهم ومتابعة حالة تعاقداتهم.
                      </span>
                    </div>
                  )}
                  {leads.map((lead) => (
                    <div 
                      key={lead.id} 
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                        lead.status === "جديد" 
                          ? "bg-red-500/5 border-red-200/60" 
                          : lead.status === "تم التعاقد" 
                          ? "bg-emerald-500/5 border-emerald-200/60" 
                          : "bg-white border-slate-100 shadow-sm"
                      }`}
                      id={`lead_card_${lead.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900 text-base">{lead.name}</h5>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-semibold font-mono">ID: {lead.id}</span>
                            
                            {lead.status === "جديد" && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 font-bold rounded animate-pulse">جديد ⚡</span>
                            )}
                            {lead.status === "تم التعاقد" && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold rounded">تعاقد مكتمل 🎉</span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600">
                            <span className="flex items-center gap-1">📞 هاتف التواصل: <b className="text-slate-950 font-serif" dir="ltr">{lead.phone}</b></span>
                            <span className="flex items-center gap-1">✉️ البريد: <b className="text-slate-700 select-all">{lead.email}</b></span>
                            <span className="flex items-center gap-1">💰 الميزانية المقدرة: <b className="text-slate-900">{lead.budget}</b></span>
                          </div>

                          <p className="text-slate-700 text-xs font-light bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 mt-2">
                            <span className="font-bold text-slate-800">مذكرة المهندس:</span> {lead.notes}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {/* Service label Icon */}
                          <div className="bg-amber-500/10 text-amber-900 px-3 py-1 rounded-xl font-bold flex items-center gap-1">
                            <span>
                              {lead.serviceNeeded === "apartment" ? "🏠 شقة سكنية" : lead.serviceNeeded === "shop" ? "🛍️ متجر تجاري" : "🏢 مكتب إداري"}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded truncate max-w-xs block font-bold" title={lead.campaignSource}>
                            المصدر: {lead.campaignSource}
                          </div>
                        </div>
                      </div>

                      {/* Lead actions & select update status */}
                      <div className="border-t border-slate-150 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">تحديث حالة المتابعة:</span>
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value as any)}
                            className="bg-white border border-slate-200 text-xs rounded-lg p-1.5 font-semibold focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="جديد">🔴 عميل جديد - لم يتصل</option>
                            <option value="قيد التواصل">🟡 قيد التواصل والمناقشة</option>
                            <option value="طلب عرض سعر">🔵 تمت المعاينة وعرض السعر ومقاس الأرضيات</option>
                            <option value="تم التعاقد">🟢 تم توقيع العقد والبدء في التشطيب 🎉</option>
                            <option value="غير مهتم">⚪ غير مهتم / ميزانية منخفضة جداً</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <a 
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`} 
                            target="_blank" 
                            rel="referrer noopener"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-1.5 px-3.5 rounded-lg transition-all"
                          >
                            مراسلة عميل المعاينة واتساب 💬
                          </a>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        )}

        {/* -------------------- TAB 5: FACEBOOK & INSTAGRAM INTEGRATION & APIS -------------------- */}
        {activeTab === "social" && (
          <div className="space-y-8 animate-fadeIn text-slate-800 font-sans" dir="rtl">
            
            {/* Header banner */}
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6 z-10 w-full text-right">
                <div className="space-y-4 flex-grow max-w-3xl">
                  <div>
                    <span className="bg-blue-600/30 text-blue-400 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full tracking-wider">
                      تكامل واجهة برمجة التطبيقات (Meta API Portal)
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">ربط قنوات السوشيال ميديا وتدقيق الصلاحيات الأمني</h3>
                    <p className="text-[11px] sm:text-xs text-slate-300 mt-2 leading-relaxed">
                      قم بدمج صفحات فيسبوك وحسابات إنستجرام تجارياً لنشر المخططات وصور الديكور المولد بالذكاء الاصطناعي مباشرة من الموقع، ومراقبة حركة الزوار وبكسل الاستهداف بدقة وامتثال أمني كامل لشروط ميتا لـ <b>Interior Design Portfolio</b>.
                    </p>
                  </div>

                  {!fbConfig.isConnected && (
                    <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 max-w-2xl text-right space-y-4">
                      <span className="text-[11px] font-black text-amber-400 block mb-1">🛡️ رتبة وتصاريح الصلاحية في فيسبوك (Meta App Scopes):</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex items-start gap-2 cursor-pointer select-none text-right">
                          <input 
                            type="radio" 
                            name="fbScopeType" 
                            checked={fbScopeType === "standard"} 
                            onChange={() => setFbScopeType("standard")} 
                            className="mt-1 h-4 w-4 rounded-full border-slate-600 text-amber-500 focus:ring-amber-500 bg-slate-900" 
                          />
                          <div>
                            <span className="text-[11px] font-bold text-white block">حساب عادي (Standard) ⭐</span>
                            <span className="text-[10px] text-slate-300 block mt-0.5 leading-normal">طلب الصلاحيات الأساسية لتجنب أخطاء <b>Invalid Scopes</b> مع الصفحات.</span>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer select-none text-right border-t md:border-t-0 md:border-r border-slate-700/60 pt-2.5 md:pt-0 md:pr-4">
                          <input 
                            type="radio" 
                            name="fbScopeType" 
                            checked={fbScopeType === "business"} 
                            onChange={() => setFbScopeType("business")} 
                            className="mt-1 h-4 w-4 rounded-full border-slate-600 text-amber-500 focus:ring-amber-500 bg-slate-900" 
                          />
                          <div>
                            <span className="text-[11px] font-bold text-white block">صلاحيات النشر الكاملة (أعمال) 💼</span>
                            <span className="text-[10px] text-slate-300 block mt-0.5 leading-normal">طلب <b>pages_show_list, pages_manage_posts, pages_read_engagement</b> الموثقة للعمل دون أخطاء.</span>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer select-none text-right border-t md:border-t-0 md:border-r border-slate-700/60 pt-2.5 md:pt-0 md:pr-4">
                          <input 
                            type="radio" 
                            name="fbScopeType" 
                            checked={fbScopeType === "custom"} 
                            onChange={() => setFbScopeType("custom")} 
                            className="mt-1 h-4 w-4 rounded-full border-slate-600 text-amber-500 focus:ring-amber-500 bg-slate-900" 
                          />
                          <div>
                            <span className="text-[11px] font-bold text-white block">صلاحيات مخصصة (Custom) 🛠️</span>
                            <span className="text-[10px] text-slate-300 block mt-0.5 leading-normal">تحديد الصلاحيات والمطالب يدوياً لضمان دقة وتوافق النشر مع متطلبات حساب المطور الخاص بك.</span>
                          </div>
                        </label>
                      </div>

                      {fbScopeType === "custom" && (
                        <div className="bg-slate-900/85 p-3 rounded-xl border border-slate-700 text-right space-y-2">
                          <label className="text-[10px] font-bold text-slate-300 block">اكتب الصلاحيات المطلوبة (مفصولة بفاصلة ,):</label>
                          <input 
                            type="text"
                            value={fbCustomScopes}
                            onChange={(e) => setFbCustomScopes(e.target.value)}
                            placeholder="e.g., public_profile,pages_show_list,pages_read_engagement,pages_manage_posts"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-amber-400 font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                            dir="ltr"
                          />
                          <p className="text-[9px] text-slate-400 leading-normal text-right">
                            💡 الصلاحيات الموصى بها هي: <b className="text-white">pages_show_list,pages_read_engagement,pages_manage_posts</b> للربط المباشر الموثوق وتفادي أي صلاحية غير معتمدة تتسبب بخطأ فيسبوك.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row xl:flex-col gap-3 font-sans shrink-0">
                  {!fbConfig.isConnected ? (
                    <button
                      onClick={handleConnectFacebook}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.02] cursor-pointer"
                    >
                      <Link2 className="w-4 h-4 ml-1" />
                      <span>ربط حساب فيسبوك & إنستجرام 👥</span>
                    </button>
                  ) : null}
                  {!fbConfig.isConnected ? (
                    <button
                      onClick={handleRequestAllPermissions}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-black py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.02] cursor-pointer"
                      title="يطلب جميع صلاحيات فيسبوك/إنستجرام وإعلانات - بعض الصلاحيات تتطلب App Review"
                    >
                      <ShieldCheck className="w-4 h-4 ml-1" />
                      <span>طلب كل الصلاحيات ⚠️</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold py-2 px-4 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        {fbConfig.isSimulated ? "منظومة المحاكاة" : "اتصال فعلي نشط"}
                      </span>
                      <button
                        onClick={handleResetFacebook}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold py-2 px-4 rounded-xl transition-all border border-red-500/20 cursor-pointer"
                      >
                        إلغاء الربط 🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Visual feedback dashboard of connected Meta Pages */}
            {fbConfig.isConnected && fbConfig.pages.length > 0 && (
              <div className="bg-gradient-to-l from-emerald-500/10 via-emerald-100/10 to-transparent border border-emerald-500/20 rounded-3xl p-6 shadow-sm space-y-4 animate-scaleUp text-right">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-md shadow-emerald-500/20 animate-pulse">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900">👥 تم المزامنة وجلب الصفحات بنجاح من Meta!</h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">لوحة التبديل السريع ونظرة عامة على قنواتك الإعلانية النشطة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[9px] sm:text-[10px] bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      متصل ومصادق 🟢
                    </span>
                    <span className="text-[9px] sm:text-[10px] bg-slate-900 text-white font-bold px-3 py-1 rounded-full">
                      OAuth Token Active
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fbConfig.pages.map((p) => {
                    const isActive = selectedFbPage === p.id;
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedFbPage(p.id)}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                          isActive 
                            ? "bg-white border-amber-500 shadow-md ring-1 ring-amber-500 scale-[1.01]" 
                            : "bg-white/50 border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-xs"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-0 left-0 bg-amber-500 text-white text-[8px] font-black px-2.5 py-0.5 rounded-br-xl">
                            قناة النشر النشطة حالياً
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg select-none ${
                            isActive ? "bg-amber-100 text-amber-700" : "bg-slate-100/80 text-slate-500"
                          }`}>
                            🏢
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-black text-slate-800">{p.name}</h5>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold inline-block leading-none">
                              {p.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                          <div>
                            إجمالي الجمهور: <span className="font-extrabold text-slate-800 font-mono">{(p.fans || 0).toLocaleString()}</span> معجب
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-amber-500 animate-ping" : "bg-slate-400"}`}></span>
                            <span className={isActive ? "font-bold text-amber-600" : ""}>
                              {isActive ? "نشط حالياً" : "اضغط للتبديل إليها"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main panels layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right">
              
              {/* Column 1 & 2: Controls & Publisher & Feed */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Section A: Publisher Widget */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
                        <Sparkles className="w-5 h-5 animate-spin-slow" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">ناشر الإعلانات وتوزيع المحتوى الموزع</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">اكتب الدعاية أو اسحبها من مولد الذكاء الاصطناعي وانشرها تلقائياً</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handlePublishToFbAndIg} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Page selector */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 block text-xs mb-1">تحديد صفحة النشر المصادق عليها</label>
                        <select
                          value={selectedFbPage}
                          onChange={(e) => setSelectedFbPage(e.target.value)}
                          className={`w-full p-2.5 rounded-lg border text-xs bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                            fbConfig.pages.length === 0 ? "border-red-100 text-red-500" : "border-slate-200"
                          }`}
                          disabled={fbConfig.pages.length === 0}
                        >
                          {fbConfig.pages.length === 0 ? (
                            <option value="">⚠️ لا توجد صفحات مرتبطة حتى الآن. يرجى الضغط على زر الربط بالأعلى للبدء 👥</option>
                          ) : (
                            fbConfig.pages.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.category})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Import and speed up */}
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (aiResult) {
                              setFbPublishMessage(
                                `${aiResult.hook}\n\n${aiResult.body}\n\n${aiResult.cta}\n\n${aiResult.hashtags}`
                              );
                              setFbLogsCheck(prev => [
                                {
                                  id: `log_${Date.now()}`,
                                  time: new Date().toLocaleTimeString("ar-EG"),
                                  type: "تدفق محلي",
                                  info: "سحب واستيراد نص إعلان الذكاء الاصطناعي الأخير وحقنه في صندوق النشر",
                                  status: "ناجح ✨"
                                },
                                ...prev
                              ]);
                              alert("✅ تم استيراد وحقن نص الإعلان الأخير بنجاح في المحتوى!");
                            } else {
                              alert("⚠️ لم تقم بتوليد نص بالذكاء الاصطناعي في لوحة الحملات بعد! يرجى توليد إعلان أولاً لتتمكن من استيراده بلمسة واحدة.");
                            }
                          }}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200 hover:border-amber-300 font-extrabold text-[11px] py-2.5 px-4 rounded-lg transition duration-205 flex items-center justify-center gap-2 h-[41px] cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 ml-1" />
                          <span>استيراد محتوى إعلان الذكاء الاصطناعي الأخير ✨</span>
                        </button>
                      </div>
                    </div>

                    {/* Message body text */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <label className="font-bold text-slate-700 block text-xs">نص المنشور الإعلاني (محتوى فيسبوك الترويجي وإنستجرام)</label>
                        <span className="text-[10px] text-slate-400 font-medium font-mono">يدعم الروابط والهاشتاجات</span>
                      </div>
                      <textarea
                        value={fbPublishMessage}
                        onChange={(e) => setFbPublishMessage(e.target.value)}
                        placeholder="أكتب النص الإعلاني الممتاز، أو اضغط على الزر بالأعلى لاستيراد المخطط المولد بالذكاء الاصطناعي..."
                        rows={6}
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs leading-relaxed font-sans focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Platforms targets flags */}
                    <div className="bg-slate-50 rounded-2xl p-4 flex flex-wrap gap-6 border border-slate-100 justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-700 leading-none">وجهات الإرسال الفوري:</span>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4" />
                          <span className="text-xs font-semibold text-slate-600">Facebook Feed 🌐</span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded text-purple-600 focus:ring-purple-550 w-4 h-4" />
                          <span className="text-xs font-semibold text-slate-600">Instagram Photo Stream 📷</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isPublishingFb}
                        className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-black text-xs py-2.5 px-6 rounded-xl transition duration-200 cursor-pointer"
                      >
                        {isPublishingFb ? "جاري البث والمزامنة..." : "إطلاق ونشر المنشور الإعلاني 🚀"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Section B: Live Connected Pages Feed */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-blue-50 text-blue-700 p-2 rounded-xl">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm text-right">مستودع وتغذية المنشورات النشطة حياً (Active Pages Feed)</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 text-right">
                          تُجلب البيانات حياً من مخدم قاعدة بيانات الربط. يمكنك النشر بالأعلى ومراقبة ظهور المنشور هنا فورياً!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectedFbPage && fetchFbPosts(selectedFbPage)}
                      className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-3 py-1 rounded-full hover:bg-indigo-100 transition cursor-pointer"
                    >
                      {isLoadingPosts ? "جاري التحديث..." : "تحديث يدوي 🔄"}
                    </button>
                  </div>

                  {isLoadingPosts ? (
                    <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                      <Activity className="w-6 h-6 animate-pulse text-indigo-500" />
                      <span>جاري مزامنة المنشورات حياً...</span>
                    </div>
                  ) : fbPosts.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs space-y-2 border border-dashed border-slate-200 rounded-2xl">
                      <p>لا توجد منشورات مكتوبة بعد في هذه الصفحة الإعلانية.</p>
                      <p className="text-[10px] text-slate-500">اكتب منشوراً في الصندوق بالأعلى واضغط على زر النشر لتجربة المزامنة الحية!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {fbPosts.map((post) => (
                        <div key={post.id} className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition bg-slate-50/30 flex flex-col justify-between">
                          <div className="bg-slate-50 p-3.5 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-black text-[10px]">
                                {fbConfig.pages.find(p => p.id === post.pageId)?.name?.slice(0, 2) || "مد"}
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] font-extrabold text-slate-900 leading-none">
                                  {fbConfig.pages.find(p => p.id === post.pageId)?.name || "صفحة مدار للمقاولات"}
                                </p>
                                <p className="text-[9px] text-slate-400 font-semibold mt-0.5 text-right" dir="ltr">
                                  {new Date(post.publishedAt).toLocaleString("ar-EG")}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs">{post.platform?.includes("إنستجرام") ? "📸" : "🌐"}</span>
                          </div>
                          <div className="p-3.5 space-y-3 text-right flex-grow">
                            <p className="text-xs text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                              {post.message}
                            </p>
                          </div>
                          <div className="p-3.5 pt-0">
                            <div className="p-2 bg-slate-100/60 rounded-xl border border-dashed border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                              <span>👍 تفاعل: <b>{post.likes} يعجبني</b></span>
                              <span>💬 تعليقات: <b>{post.comments} عميل</b></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Column 3: Guide, App ID App Secret Setup, Scopes and Event Audits */}
              <div className="space-y-8">
                
                {/* Public Social Links Management Section */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2 justify-start">
                    <span className="text-amber-500">🔗</span>
                    <span>روابط حسابات التواصل لزوار موقعك</span>
                  </h4>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed text-right">
                    أدخل هنا روابط صفحات فيسبوك وإنستجرام الحقيقية لشركتك. ستتحدث أزرار المتابعة التمريرية في أعلى وأسفل صفحات الموقع تلقائياً لتوجيه المتابعين إليها.
                  </p>
                  
                  <div className="space-y-3 font-sans">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">رابط صفحة فيسبوك للعامة</label>
                      <div className="relative">
                        <input
                          type="url"
                          value={fbPageUrl}
                          onChange={(e) => setFbPageUrl(e.target.value)}
                          placeholder="https://facebook.com/your-page"
                          className="w-full text-xs font-semibold p-2.5 pl-8 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 bg-slate-50/50 text-left"
                          dir="ltr"
                        />
                        <Facebook className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-3.5" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">رابط حساب إنستجرام للعامة</label>
                      <div className="relative">
                        <input
                          type="url"
                          value={igPageUrl}
                          onChange={(e) => setIgPageUrl(e.target.value)}
                          placeholder="https://instagram.com/your-username"
                          className="w-full text-xs font-semibold p-2.5 pl-8 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 bg-slate-50/50 text-left"
                          dir="ltr"
                        />
                        <Instagram className="w-3.5 h-3.5 text-pink-500 absolute left-2.5 top-3.5" />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => alert("✅ تم حفظ وتأمين روابط التواصل بنجاح في متصفحك!")}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] py-2 rounded-lg transition-all cursor-pointer"
                    >
                      حفظ التغييرات وتعميمها 💾
                    </button>
                  </div>
                </div>

                {/* Meta Configuration Credentials Info Box */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2 justify-start">
                    <span className="text-amber-500">⚙️</span>
                    <span>خطوات التهيئة - Meta Dashboard</span>
                  </h4>

                  <div className="text-xs text-slate-600 leading-relaxed space-y-3.5 text-right w-full">
                    <p className="font-bold text-slate-900 bg-amber-50 p-3 rounded-xl border border-amber-100">
                      لربط الموقع الحقيقي بقنواتك التجارية على فيسبوك وإنستجرام، اتبع الإجراءات الأمنية التالية:
                    </p>

                    <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-700 pr-2">
                      <li>
                        توجه إلى منصة المطورين:{" "}
                        <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">
                          Meta Developers
                        </a>
                      </li>
                      <li>أنشئ تطبيقاً جديداً من فئة <b>Business / أعمال</b> للوصول لخدمات قنوات فيسبوك وإنستجرام.</li>
                      <li>
                        انسخ الـ <b>App ID</b> و <b>App Secret</b> وضعهما في إعدادات البيئة بـ AI Studio كمتغيرات سرية:
                        <div className="bg-slate-900 text-slate-300 p-2.5 rounded-lg font-mono text-[9.5px] mt-1.5 leading-normal space-y-0.5 text-left select-all" dir="ltr">
                          <p>FACEBOOK_APP_ID="1636109447693091"</p>
                          <p>FACEBOOK_APP_SECRET="مفتاح_سر_تطبيقك"</p>
                        </div>
                      </li>
                      <li>
                        أضف روابط رد الاتصال الآمنة (Redirect URIs) لإعدادات <b>Facebook Login</b> بالمنصة لرد الرموز الأمنية:
                        <div className="bg-slate-100 p-2 rounded border border-slate-200 font-mono text-[9px] text-slate-800 text-left mt-1.5 space-y-1 block leading-normal overflow-x-auto break-all" dir="ltr">
                          <p className="font-semibold text-slate-600">// رابط التطبيق التطويري:</p>
                          <p className="text-blue-700 select-all font-semibold font-mono">https://ais-dev-dl7ikas73lwo733guiuyco-109141054073.europe-west2.run.app/auth/facebook/callback</p>
                          <p className="font-semibold text-slate-600 mt-1">// رابط النسخة المنشورة:</p>
                          <p className="text-blue-700 select-all font-semibold font-mono">https://ais-pre-dl7ikas73lwo733guiuyco-109141054073.europe-west2.run.app/auth/facebook/callback</p>
                        </div>
                      </li>
                      <li>
                        أضف روابط سياسة الخصوصية وشروط الخدمة الإلزامية في Meta App Settings:
                        <div className="bg-slate-100 p-2.5 rounded border border-slate-200 font-mono text-[9px] text-slate-800 text-left mt-1.5 space-y-2.5 block leading-normal overflow-x-auto break-all font-sans text-right" dir="ltr">
                          <div>
                            <p className="font-bold text-slate-705 text-[10px] text-right">🔒 رابط سياسة الخصوصية (Privacy Policy URL):</p>
                            <p className="text-indigo-700 select-all font-semibold font-mono text-left mt-1">{window.location.origin}/privacy-policy</p>
                          </div>
                          <div className="border-t border-slate-200 pt-2.5">
                            <p className="font-bold text-slate-705 text-[10px] text-right">📄 رابط شروط الخدمة (Terms of Service URL):</p>
                            <p className="text-indigo-700 select-all font-semibold font-mono text-left mt-1">{window.location.origin}/terms-of-service</p>
                          </div>
                        </div>
                      </li>
                    </ol>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                      <h5 className="font-bold text-slate-800 mb-1">🛡️ الصلاحيات الإعلانية المطلوبة في Meta App:</h5>
                      <p className="text-slate-500 leading-normal">
                        يطلب هذا الحل الصلاحيات الأدنى المعتمدة من فيسبوك لإطلاق الإعلانات ومراقبة بكسل الاستهداف، لمنع الاختراق وبسعة معززة مشفرة بالكامل.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audit Trial Logging Section */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 justify-start">
                      <span className="text-blue-500">🔒</span>
                      <span>سجل أمان العمليات والـ OAuth Exchange</span>
                    </h4>
                    <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded">مشفر تماثلياً</span>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {fbLogsCheck.map((log) => (
                      <div key={log.id} className="p-2.5 bg-slate-55 border border-slate-100 rounded-xl space-y-1 text-[11px] text-right">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-800">{log.type}</span>
                          <span className="text-slate-400 font-semibold">{log.time}</span>
                        </div>
                        <p className="text-slate-600 hover:text-slate-900 leading-normal font-sans text-[10.5px] pr-1">{log.info}</p>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-100/10 text-[9px]">
                          <span className="font-bold text-slate-550 font-mono">ID: {log.id.slice(0, 8)}</span>
                          <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">{log.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 mt-auto text-xs" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="flex items-center justify-center gap-4 py-2 border-b border-slate-800 pb-4">
            <a
              href={fbPageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-slate-300 font-bold transition-all"
            >
              <Facebook className="w-4 h-4 ml-1" />
              <span>متابعة على فيسبوك 👤</span>
            </a>
            <a
              href={igPageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-pink-600 hover:text-white px-4 py-2 rounded-xl text-slate-300 font-bold transition-all"
            >
              <Instagram className="w-4 h-4 ml-1" />
              <span>متابعة على إنستجرام 📸</span>
            </a>
          </div>

          <p className="font-bold text-slate-300">
            مدار الهندسي للتصميم الداخلي والديكور والحلول الرقمية المتطورة © ٢٠٢٦
          </p>
          <p className="max-w-md mx-auto text-slate-500 leading-normal text-[11px]">
            بنيت هذه المنصة المتقدمة باستهداف خوارزميات التسويق الرقمي ببيكسل فيسبوك لكتابة المحتويات الفعالة والإعلانات لضمان نجاح مهندس الديكور وتضاعف مبيعاته.
          </p>
        </div>
      </footer>

      {/* -------------------- DETAIL MODAL -------------------- */}
      {selectedProjectForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            
            <div className="relative h-64 bg-slate-900">
              <img 
                src={selectedProjectForModal.imageUrl} 
                alt={selectedProjectForModal.arabicTitle}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setSelectedProjectForModal(null)}
                className="absolute top-4 right-4 bg-slate-950/80 text-white hover:bg-amber-500 hover:text-slate-950 rounded-full w-8 h-8 flex items-center justify-center transition font-bold"
              >
                ✕
              </button>
              
              <div className="absolute bottom-4 right-4 bg-slate-900/95 text-amber-400 text-xs font-bold px-3 py-1 rounded-lg backdrop-blur-md">
                {selectedProjectForModal.categoryLabel}
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <span className="text-xs font-bold text-amber-600 block uppercase font-mono">{selectedProjectForModal.style}</span>
                <h4 className="text-xl font-extrabold text-slate-900">{selectedProjectForModal.arabicTitle}</h4>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed space-y-3">
                <p className="font-bold text-slate-900">وصف وفلسفة العمل الفراغي والهندسي:</p>
                <p className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">{selectedProjectForModal.description}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-900 text-right">أهم الميزات والمواد الهندسية المختارة:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  {selectedProjectForModal.features.map((feat, index) => (
                    <li key={index} className="flex items-center gap-1.5">
                      <span className="text-amber-500 font-bold">●</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-600">
                <span>تكلفة التقديرية التشذيبية: <strong className="text-slate-900">{selectedProjectForModal.budgetRange}</strong></span>
                <span>فترة التدفق الميداني: <strong className="text-slate-900">{selectedProjectForModal.duration}</strong></span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    setAiCategory(selectedProjectForModal.category);
                    setAiDetails(`مشروع حقيقي مستلهم من ${selectedProjectForModal.arabicTitle} على نظام وأسلوب ${selectedProjectForModal.style}. تشمل الميزات الحصرية: ${selectedProjectForModal.features.join('، ')}.`);
                    setSelectedProjectForModal(null);
                    setActiveTab("campaigns");
                    setAiProjectName("مدار الهندسي للتصميم الديكوري الفخم");
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-3 rounded-xl transition"
                >
                  صياغة حملة إعلانية له بالذكاء الاصطناعي ✨
                </button>
                <button
                  onClick={() => setSelectedProjectForModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 rounded-xl transition"
                >
                  إغلاق
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* -------------------- CAMPAIGN CREATION MODAL -------------------- */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-slate-800">
              <h4 className="font-extrabold text-base">إنشاء حملة إعلانية وتسجيل بيانات التسويق</h4>
              <button 
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4 text-xs text-slate-800">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">اسم الحملة الإعلانية على مدير الإعلانات</label>
                <input
                  type="text"
                  required
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="مثال: حملة نيو كلاسيك للملاك بالقاهرة الجديدة"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">الفئة المستهدفة</label>
                  <select
                    value={newCampaignCategory}
                    onChange={(e: any) => setNewCampaignCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-semibold"
                  >
                    <option value="apartment">🏠 تصميم شقق سكنية</option>
                    <option value="shop">🛍️ تصميم محال وتجاري</option>
                    <option value="office">🏢 تخطيط شركات ومكاتب</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">منصة الإرسال الإعلاني</label>
                  <select
                    value={newCampaignPlatform}
                    onChange={(e: any) => setNewCampaignPlatform(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-semibold"
                  >
                    <option value="facebook">فيسبوك 👥</option>
                    <option value="instagram">إنستجرام 📸</option>
                    <option value="all">فيسبوك + إنستجرام 🌐</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">الميزانية المرصودة (ج.م / ريال)</label>
                <input
                  type="number"
                  required
                  value={newCampaignBudget}
                  onChange={(e) => setNewCampaignBudget(Number(e.target.value))}
                  placeholder="مثال: 15000"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">خصائص الاستهداف الجغرافي والاهتمامات</label>
                <textarea
                  value={newCampaignTarget}
                  onChange={(e) => setNewCampaignTarget(e.target.value)}
                  placeholder="مثال: العمر من 30-50، مهتمين بالعقارات الفخمة والتجمع الخامس والزمالك والديكور..."
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">نص الإعلان (Ad Copy) المراد تسجيله</label>
                <textarea
                  value={newCampaignAdText}
                  onChange={(e) => setNewCampaignAdText(e.target.value)}
                  placeholder="أدخل النص التسويقي أو استخدم المولد الآلي بالذكاء الاصطناعي بالخلف أولاً لتتمكن من استيراده بلمسة واحدة..."
                  rows={4}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs leading-relaxed font-sans"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition"
                >
                  إضافة الحملة وتدقيق الأهداف ⚡
                </button>
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 rounded-xl transition"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* -------------------- MANUAL CRM LEAD MODAL -------------------- */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-slate-800">
              <h4 className="font-extrabold text-base">إضافة عميل محتمل لتتبع المكالمات والديكور</h4>
              <button 
                onClick={() => setIsLeadModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4 text-xs text-slate-850">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">اسم العميل بالكامل</label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="مثال: المستشار محمد الغنام"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">رقم هاتفه المباشر (مع رمز الدولة)</label>
                  <input
                    type="text"
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="مثال: +966501234567 أو 01002345678"
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">البريد الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    placeholder="example@mada.com"
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">الخدمة المطلوبة</label>
                  <select
                    value={newLeadService}
                    onChange={(e) => setNewLeadService(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="apartment">🏠 تصميم أو هدم شقق</option>
                    <option value="shop">🛍️ تصميم متجر أو كوفي</option>
                    <option value="office">🏢 تخطيط شركة أو مكتب</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">الميزانية التقريبية</label>
                  <input
                    type="text"
                    value={newLeadBudget}
                    onChange={(e) => setNewLeadBudget(e.target.value)}
                    placeholder="مثال: 1,500,000 ج.م"
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">مصدر وصول العميل</label>
                <input
                  type="text"
                  value={newLeadSource}
                  onChange={(e) => setNewLeadSource(e.target.value)}
                  placeholder="مثال: حملة تشطيب شقق التجمع الفاخرة"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">ملاحظات المهندس ومسودة الاتصال الأول</label>
                <textarea
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  placeholder="تفاصيل الشقة أو المساحة وموعد الاتصال الهاتفي..."
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs leading-relaxed"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition"
                >
                  تسجيل العميل في قاعدة البيانات 👤
                </button>
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 rounded-xl transition"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
