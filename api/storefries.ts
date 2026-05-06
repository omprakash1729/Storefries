import type { VercelRequest, VercelResponse } from '@vercel/node';

const COGNITO_CLIENT_ID = '4df78mh89q0uljaug0g5cl3i1l';
const COGNITO_REGION = 'us-east-1';
const STOREFRIES_BASE = 'https://services.storefries.com/v1/10002';
const WORKSPACE_ID = process.env.STOREFRIES_WORKSPACE_ID || '69930961365bba0002ed50d2';
const USER_ID = process.env.STOREFRIES_USER_ID || '106656652161661410038';
const STOREFRIES_EMAIL = process.env.STOREFRIES_EMAIL || 'nkcdigitalteam@gmail.com';
const STOREFRIES_PASSWORD = process.env.STOREFRIES_PASSWORD || 'password';
const USER_AUTH_DATA = process.env.STOREFRIES_USER_AUTH || 'bmtjZGlnaXRhbHRlYW1AZ21haWwuY29tOnBhc3N3b3Jk';

// Token cache (lives for warm serverless instances)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getCognitoToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 300) {
    return cachedToken.token;
  }
  const res = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: { USERNAME: STOREFRIES_EMAIL, PASSWORD: STOREFRIES_PASSWORD },
    }),
  });
  if (!res.ok) throw new Error(`Cognito auth failed: ${await res.text()}`);
  const data = await res.json();
  const accessToken = data.AuthenticationResult?.AccessToken;
  const expiresIn = data.AuthenticationResult?.ExpiresIn || 3600;
  if (!accessToken) throw new Error('No access token from Cognito');
  cachedToken = { token: accessToken, expiresAt: now + expiresIn };
  return accessToken;
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'userauthdata': USER_AUTH_DATA,
  };
}

// Human-readable labels for moreinfo fields
const MOREINFO_LABELS: Record<string, Record<string, string>> = {
  fromTheBusiness: { isOwnedByWomen: 'Women-owned' },
  serviceOptions: {
    onsiteServicesAvailable: 'Onsite services',
    offersOnlineClasses: 'Online estimates / classes',
  },
  accessibility: {
    hasAssistiveHearingLoop: 'Assisted listening devices',
    hasWheelchairAccessibleRestroom: 'Wheelchair accessible restroom',
    hasWheelchairAccessibleSeating: 'Wheelchair accessible seating',
    hasWheelchairAccessibleEntrance: 'Wheelchair accessible entrance',
    hasWheelchairAccessibleParking: 'Wheelchair accessible parking',
  },
  amenities: {
    hasGenderNeutralRestroom: 'Gender-neutral toilets',
    hasRestroom: 'Restroom',
    hasWifi: 'Wi-Fi',
  },
  crowd: { lgbtqFriendly: 'LGBTQ+ friendly' },
  planning: {
    appointmentRequired: 'Appointments required',
    acceptsWalkIns: 'Accepts walk-ins',
  },
  parking: {
    freeParkingGarage: 'Free parking garage',
    freeParkingLot: 'Free parking lot',
    freeStreetParking: 'Free street parking',
    onSiteParking: 'On-site parking',
    paidParkingGarage: 'Paid parking garage',
    paidParkingLot: 'Paid parking lot',
    paidStreetParking: 'Paid street parking',
  },
  payments: {
    acceptsCreditCards: 'Credit cards',
    acceptsDebitCards: 'Debit cards',
    acceptsCashOnly: 'Cash only',
    acceptsNfc: 'NFC mobile payments',
  },
  children: {
    goodForKids: 'Good for kids',
    hasChangingTable: 'Changing table',
    hasNursingRoom: 'Nursing room',
  },
};

function normalizeMoreinfo(moreinfo: Record<string, any>) {
  const sections: { id: string; options: { name: string; enabled: boolean }[] }[] = [];
  for (const [sectionId, fieldLabels] of Object.entries(MOREINFO_LABELS)) {
    const sectionData = moreinfo?.[sectionId];
    if (!sectionData) continue;
    const options = Object.entries(fieldLabels)
      .filter(([field]) => field in sectionData && sectionData[field] === true)
      .map(([, label]) => ({ name: label, enabled: true }));
    if (options.length > 0) {
      sections.push({ id: sectionId, options });
    }
  }
  return sections;
}

function cleanName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.query.action as string) || 'fetchByName';

  try {
    const token = await getCognitoToken();
    const baseBody = { workspaceId: WORKSPACE_ID, userId: USER_ID };

    // ── LIST all GMB locations ──────────────────────────────────────────
    if (action === 'list') {
      const r = await fetch(`${STOREFRIES_BASE}/gmb/list`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(baseBody),
      });
      return res.status(200).json(await r.json());
    }

    // ── INFO for a specific locationId ─────────────────────────────────
    if (action === 'info') {
      const { locationId } = req.query;
      if (!locationId) return res.status(400).json({ error: 'locationId required' });
      const r = await fetch(`${STOREFRIES_BASE}/gmb/info`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ ...baseBody, locationId, tab: 'business-info' }),
      });
      const d = await r.json();
      const data = d?.data || {};
      return res.status(200).json({
        aboutBusiness: data.aboutBusiness || null,
        features: normalizeMoreinfo(data.moreinfo || {}),
      });
    }

    // ── MATCH by business name then fetch info (default) ───────────────
    const businessName = (req.query.name as string) || '';
    if (!businessName) return res.status(400).json({ error: 'name required' });

    // 1. Get all locations
    const listRes = await fetch(`${STOREFRIES_BASE}/gmb/list`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(baseBody),
    });
    const listData = await listRes.json();
    const locations: any[] = listData?.data || listData?.locations || [];

    // 2. Find the best match by name
    const nameCleaned = cleanName(businessName);
    const match = locations.find((loc: any) => {
      const locName = cleanName(loc.title || loc.name || loc.locationName || '');
      // Check if either name contains a significant chunk of the other
      const shorter = nameCleaned.length < locName.length ? nameCleaned : locName;
      const longer = nameCleaned.length < locName.length ? locName : nameCleaned;
      return longer.includes(shorter.slice(0, Math.min(8, shorter.length)));
    });

    if (!match) {
      return res.status(404).json({ error: 'No matching location found', locations: locations.map((l: any) => l.title || l.name) });
    }

    // 3. Get locationId (try multiple field names)
    const locationId = match.locationId || match.id || match._id
      || match.name?.split('/').pop(); // fallback: extract from "accounts/.../locations/ID" pattern

    if (!locationId) {
      return res.status(404).json({ error: 'Could not extract locationId', match });
    }

    // 4. Fetch full GMB info
    const infoRes = await fetch(`${STOREFRIES_BASE}/gmb/info`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ ...baseBody, locationId, tab: 'business-info' }),
    });
    const infoData = await infoRes.json();
    const data = infoData?.data || {};

    return res.status(200).json({
      locationId,
      matchedTitle: match.title || match.name,
      aboutBusiness: data.aboutBusiness || null,
      features: normalizeMoreinfo(data.moreinfo || {}),
    });

  } catch (err: any) {
    console.error('Storefries proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
