const dataId = "0x3baaf507878469e5:0x69ba0936a33f03e2";
const apiKey = "3427aff2e4b7440054cb73c1be2987baffeed47cf641505d8eabeabad373b5cb";

fetch(`https://serpapi.com/search.json?engine=google_maps_posts&data_id=${dataId}&api_key=${apiKey}`)
  .then(r => r.json())
  .then(d => {
    if (d.posts) {
      d.posts.forEach((p, i) => {
        console.log(`\n--- Post ${i} ---`);
        console.log("title:", p.title);
        console.log("thumbnail:", p.thumbnail || "NONE");
        console.log("thumbnails:", JSON.stringify(p.thumbnails || []));
        console.log("image_url:", p.image_url || "NONE");
        console.log("media:", JSON.stringify(p.media || []));
        console.log("images:", JSON.stringify(p.images || []));
        console.log("ALL KEYS:", Object.keys(p).join(", "));
      });
    } else {
      console.log("No posts or error:", JSON.stringify(d));
    }
  })
  .catch(e => console.error(e));
