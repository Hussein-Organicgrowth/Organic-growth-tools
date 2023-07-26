function toggleFullText() {
  const partialText = document.getElementById("partialText");
  const showMoreButton = document.getElementById("showMoreButton");
  const fullText = document.getElementById("fullText");

  if (partialText.style.display === "none") {
    // Full text is currently visible, hide it
    partialText.style.display = "block";
    showMoreButton.textContent = "Vis prompten";
    fullText.style.display = "none";
  } else {
    // Full text is currently hidden, show it
    partialText.style.display = "none";
    showMoreButton.textContent = "Skjul prompt";
    fullText.style.display = "block";
  }
}
scrapeWebsite("https://organicgrowth.dk/");

async function scrapeWebsite(url) {
  try {
    const response = await axios.get(`/scrape?url=${encodeURIComponent(url)}`);
    const content = response.data;
    
    console.log(content);
  } catch (error) {
    console.error("Error scraping website:", error);
    // Handle the error as needed
  }
}

function toggleFullText() {
  const partialText = document.getElementById("partialText");
  const showMoreButton = document.getElementById("showMoreButton");
  const fullText = document.getElementById("fullText");

  if (partialText.style.display === "none") {
    // Full text is currently visible, hide it
    partialText.style.display = "block";
    showMoreButton.textContent = "Show More";
    fullText.style.display = "none";
  } else {
    // Full text is currently hidden, show it
    partialText.style.display = "none";
    showMoreButton.textContent = "Show Less";
    fullText.style.display = "block";
  }
}
