async function fetchBusinessDescription(query) {
    try {
        const mapsResponse = await fetch("https://serpapi.com/search.json?engine=google_maps&q=" + encodeURIComponent(query) + "&api_key=b533f725f2bcd19420d0e872e3ef639de8a792082f1ea125508b3cfa70e05a4b");
        const mapsData = await mapsResponse.json();
        
        const googleResponse = await fetch("https://serpapi.com/search.json?engine=google&q=" + encodeURIComponent(query) + "&api_key=b533f725f2bcd19420d0e872e3ef639de8a792082f1ea125508b3cfa70e05a4b");
        const googleData = await googleResponse.json();

        // Recursively search for the string
        function findString(obj, targetStr, path = "") {
            if (typeof obj === 'string' && obj.includes(targetStr)) {
                console.log(`FOUND AT PATH: ${path}`);
                console.log(`CONTENT: ${obj.substring(0, 50)}...`);
            } else if (typeof obj === 'object' && obj !== null) {
                for (let key in obj) {
                    findString(obj[key], targetStr, path + "." + key);
                }
            }
        }
        console.log("Searching Google Organic...");
        findString(googleData, "reliable waterproofing company");
        console.log("Searching Google Maps...");
        findString(mapsData, "reliable waterproofing company");

    } catch (e) {
        console.error(e.message);
    }
}

fetchBusinessDescription("Building Doctor Trichy");
