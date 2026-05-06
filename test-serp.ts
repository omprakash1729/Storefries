const API_KEY = 'b533f725f2bcd19420d0e872e3ef639de8a792082f1ea125508b3cfa70e05a4b';

async function test() {
  const url = \https://serpapi.com/search.json?engine=google_maps&q=Tulips+Multispeciality+Hospital+Sholinganallur&api_key=\\;
  const res = await fetch(url);
  const json = await res.json();
  const dataId = json.local_results?.[0]?.data_id || json.place_results?.data_id;
  console.log('dataId:', dataId);
  
  if (dataId) {
    const postUrl = \https://serpapi.com/search.json?engine=google_maps_posts&data_id=\&api_key=\\;
    const postRes = await fetch(postUrl);
    const postJson = await postRes.json();
    console.log('posts:', JSON.stringify(postJson.posts || [], null, 2).slice(0, 500));
  }
}
test();