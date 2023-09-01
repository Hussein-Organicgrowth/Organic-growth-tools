async function fetchUrls() {
  const sitemapUrl = document.getElementById("sitemapUrl").value;
  const response = await fetch("/scrape-meta-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sitemapURL: sitemapUrl }),
  });
  const data = await response.json();
  const urls = data.urls;

  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = ""; // Clear previous results

  for (let url of urls) {
    const metaDetails = await fetchMetaDetails(url);
    const tableRow = `
        <tr>
            <td>${url}</td>
            <td>${metaDetails.title}</td>
            <td>${metaDetails.metaDescription}</td>
        </tr>
        `;
    tableBody.innerHTML += tableRow;
  }
}

async function fetchMetaDetails(url) {
  const response = await fetch("/fetch-meta-details", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return await response.json();
}
