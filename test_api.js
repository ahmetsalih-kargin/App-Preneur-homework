fetch("http://localhost:3000/api/targets", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ target_value: "testnode5.com", is_monitored: false }),
  redirect: "manual"
}).then(res => {
  console.log("Status:", res.status);
  console.log("Headers:", res.headers);
  return res.text();
}).then(text => {
  console.log("Body:", text);
}).catch(err => {
  console.log("Error:", err);
});
