const url = "https://mbfiwcytyxxcntaempbb.supabase.co/rest/v1/profiles?select=*";
const key = "sb_publishable_fszuRiCqLPwx2l4LFL4W9A_BtSl4rt3";

console.log("Querying Supabase Profiles Table...");
fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": `Bearer ${key}`
  }
})
.then(async res => {
  console.log("HTTP Status:", res.status);
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    console.log("Response Body (JSON):", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Response Body (Raw Text):", text);
  }
})
.catch(err => {
  console.error("Error during fetch:", err);
});
