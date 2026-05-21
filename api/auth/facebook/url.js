export default function handler(req, res) {
  const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
  const appId = process.env.FACEBOOK_APP_ID || "1636109447693091";
  const origin = (searchParams.get('origin')) || process.env.APP_URL || "https://interior-lemon-six.vercel.app";
  const redirectUri = `${origin}/auth/facebook/callback`;
  const scopeType = searchParams.get('scope_type') || 'standard';

  let scopesList = ["public_profile", "email", "pages_show_list"];

  if (scopeType === 'custom' && searchParams.get('custom_scopes')) {
    scopesList = (searchParams.get('custom_scopes') || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  } else if (scopeType === 'business' || scopeType === 'standard') {
    scopesList = [
      "public_profile",
      "email",
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
      "ads_read",
      "ads_management",
      "business_management",
      "pages_manage_ads"
    ];
  }

  const scopes = scopesList.join(',');
  const isRealConfigured = !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);

  const url = isRealConfigured
    ? `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code`
    : `${origin}/auth/facebook/simulate?origin=${encodeURIComponent(origin)}&scopes=${encodeURIComponent(scopes)}`;

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify({ url, isRealConfigured }));
}
