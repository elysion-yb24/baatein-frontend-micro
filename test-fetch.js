// test-fetch.js
fetch('https://battein-onboard-brown.vercel.app/api/partners')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));