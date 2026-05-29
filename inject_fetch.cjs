const fs = require('fs');
let content = fs.readFileSync('src/pages/Listing.tsx', 'utf8');

const targetStr = `  useEffect(() => {

        // Parse the extensions array`;

const injection = `  useEffect(() => {
    // Dynamically fetch tags, social profiles, and posts from SerpApi if not fully populated
    const fetchLiveData = async () => {
      if (!listing?.name || hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      try {
        const apiKey = import.meta.env.VITE_SERPAPI_KEY;
        if (!apiKey) {
          console.error("VITE_SERPAPI_KEY is missing in this environment!");
          return;
        }
        console.log("Fetching live data for:", listing.name);

        let city = "";
        if (listing.raw?.addressComponents && Array.isArray(listing.raw.addressComponents)) {
          const comp = listing.raw.addressComponents.find((c: any) => 
            c.types?.includes("locality") || c.types?.includes("sublocality_level_1") || c.types?.includes("sublocality")
          );
          if (comp) city = comp.longText || comp.shortText;
        }
        
        if (!city && listing.formatted_address) {
          const parts = listing.formatted_address.split(',').map((p: any) => p.trim());
          if (parts.length >= 3) {
            city = parts[parts.length - 3];
          } else if (parts.length > 1) {
            city = parts[1];
          }
        }
        
        const finalSearchStr = city ? \`\${listing.name} \${city}\` : listing.name;
        console.log("[SERP] Optimized Search Query Created:", finalSearchStr);

        const query = encodeURIComponent(finalSearchStr);
        const mapsUrl = \`/api/serpapiProxy?engine=google_maps&q=\${query}&api_key=\${apiKey}\`;
        const googleUrl = \`/api/serpapiProxy?engine=google&q=\${query}&api_key=\${apiKey}\`;
        
        console.log("[SERP] Initiating Sequential Discovery Fetch...");
        
        let mapsJson: any = null;
        try {
          console.log("[SERP] Fetching Google Maps Data...");
          const mapsRes = await fetch(mapsUrl);
          if (mapsRes.ok) {
            mapsJson = await mapsRes.json();
            console.log("[SERP] Maps Success:", !!mapsJson);
          } else {
            console.warn("[SERP] Maps fetch non-ok:", mapsRes.status);
          }
        } catch (e) {
          console.error("[SERP] Maps fetch failed:", e);
        }

        let googleJson: any = null;
        try {
          console.log("[SERP] Fetching Organic Search Profiles...");
          const googleRes = await fetch(googleUrl);
          if (googleRes.ok) {
            googleJson = await googleRes.json();
            console.log("[SERP] Google Success:", !!googleJson);
          } else {
            console.warn("[SERP] Google fetch non-ok:", googleRes.status);
          }
        } catch (e) {
          console.error("[SERP] Google fetch failed:", e);
        }

        const placeResult = mapsJson?.local_results?.[0] || mapsJson?.place_results;
        const knowledgeGraph = googleJson?.knowledge_graph;

        if (placeResult?.about && Array.isArray(placeResult.about)) {
          setLiveAbout(placeResult.about);
        }
        
        if (placeResult?.service_options) {
          setLiveServiceOptions(placeResult.service_options);
        }

        // Parse the extensions array`;

content = content.replace(targetStr, injection);
fs.writeFileSync('src/pages/Listing.tsx', content);
console.log('Injected fetchLiveData!');
