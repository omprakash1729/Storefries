const url = "https://wayxpmccacphrhxfuxly.supabase.co/rest/v1/listings?slug=eq.happy-ending-ice-creams-desserts-tirunelveli-tirunelveli";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheXhwbWNjYWNwaHJoeGZ1eGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDIzMDMsImV4cCI6MjA5NDY3ODMwM30.bVSoqvG8gRLAhHCwELaznMYH5QTZJM13EZ-R4FKlNJ4";

fetch(url, {
  method: "GET",
  headers: {
    "apikey": anonKey,
    "Authorization": `Bearer ${anonKey}`,
    "Content-Type": "application/json"
  }
})
.then(res => res.json())
.then(data => {
  console.log("FETCHED DATA:", JSON.stringify(data, null, 2));
})
.catch(err => {
  console.error("ERROR:", err);
});
