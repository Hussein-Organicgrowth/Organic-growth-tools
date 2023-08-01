const express = require("express");
require("dotenv").config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public")); // to serve static files
app.set("view engine", "ejs"); // setting up the view engine
const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CX_KEY = process.env.CX_KEY;

const axios = require("axios");
const cheerio = require("cheerio");

// Server-side code

const fetch = require("node-fetch");

app.use(express.json());

app.post("/process-text", async (req, res) => {
  try {
    const { titlePrompt, prompt } = req.body;

    // Fetch the response from the OpenAI API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: titlePrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 5000,
        stream: true, // Enable streaming response
      }),
    });

    // Set response headers for streaming
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    // Stream the response from the OpenAI API to the client
    response.body.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/scrape", async (req, res) => {
  const url = req.query.url;

  try {
    const response = await axios.get(url);
    const html = response.data;

    //Clean all tags from the text
    const cleanedHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");

    // Parse the cleaned HTML using Cheerio
    const $ = cheerio.load(cleanedHtml);

    // Remove script and style tags from the HTML
    $("script, style").remove();

    // Extract the desired text content using selectors
    let content = $("body").text();

    // Remove leading and trailing whitespace from the content
    content = content.replace(/\s+/g, " ").trim();

    // Extract the desired content using selectors
    res.send(content);
  } catch (error) {
    alert("Der var en fejl med at finde teksten for din url");
    console.error("Error scraping website:", error);
    res.status(500).send("An error occurred");
  }
});

async function search(keyword) {
  try {
    // Search Google to get the competition URLs
    const competitorUrls = await searchGoogle(keyword);

    const competitionData = [];

    for (const url of competitorUrls) {
      // Scrape the competition URL to extract the values
      const data = await scrapeCompetition(url);

      // Push the competition data to the array
      competitionData.push(data);
    }

    // ... do something with the competition data (e.g., display it to the user)
    console.log(competitionData);
  } catch (error) {
    // Handle any errors that occur during the search and scraping process
    console.error("Error:", error);
    // ... handle the error appropriately
  }
}

// Usage
const keyword = "your_keyword";
search(keyword);

async function scrapeCompetition(url) {
  try {
    // Make a request to the competition URL
    const response = await axios.get(url);

    // Load the HTML content into cheerio
    const $ = cheerio.load(response.data);

    // Extract the values you need using CSS selectors
    const statusCode = response.status;
    const title = $("title").text();
    const description = $('meta[name="description"]').attr("content");
    const h1 = $("h1").text();
    const h2Count = $("h2").length;
    const h3Count = $("h3").length;
    const robots = $('meta[name="robots"]').attr("content");
    const canonical = $('link[rel="canonical"]').attr("href");
    const wordCount = $("body").text().split(/\s+/).length;
    // ... and so on for the other values you need

    // Return the extracted values
    return {
      statusCode,
      title,
      description,
      h1,
      h2Count,
      h3Count,
      robots,
      canonical,
      wordCount,
      // ... and so on for the other values
    };
  } catch (error) {
    // Handle any errors that occur during the scraping process
    console.error("Error:", error);
    throw new Error("Failed to scrape competition");
  }
}

const tools = [
  {
    name: "Title tag værktøj",
    description: "Hjælper dig med title tags",
    link: "/title-tag-tool",
  },
  {
    name: "Meta beskrivelser",
    description: "Hjælper dig med at lave meta beskrivelser",
    link: "/meta-beskrivelse-tool",
  },
  {
    name: "Forslag til blogindlæg",
    description: "Hjælper dig med at komme med blogemner",
    link: "/blog-forslag",
  },
  {
    name: "Opdeling af søgeord",
    description: "Hjælper dig med at opdele søgeord",
    link: "/opdel-keyword",
  },
  {
    name: "Definer købsfase eller søgeintention",
    description: "Hjælper dig med at opdele søgeord",
    link: "http://tool3.com",
  },
  {
    name: "Schema markup",
    description: "Hjælper dig med at opdele søgeord",
    link: "http://tool3.com",
  },
  {
    name: "Analyser kunde anmeldelser og kom med forslag til nye søgeord",
    description: "Hjælper dig med at opdele søgeord",
    link: "http://tool3.com",
  },
  {
    name: "Analyser kunde anmeldelser og kom med forslag til nye USPer",
    description: "Hjælper dig med at opdele søgeord",
    link: "http://tool3.com",
  },
  {
    name: "Check om liste med links er indexeret",
    description: "Hjælper dig med at opdele søgeord",
    link: "http://tool3.com",
  },
  {
    name: "URL redirect mapping",
    description: "Hjælper dig med at opdele søgeord",
    link: "/url-redirect",
  },
  {
    name: "Onpage konkurrentanalyse",
    description: "Hjælper dig med at opdele søgeord",
    link: "http://tool3.com",
  },
  {
    name: "Tekst Konkurrentanalyse",
    description: "Hjælper dig med at opdele søgeord",
    link: "http://tool3.com",
  },
];

app.get("/", (req, res) => {
  res.render("index", { tools: tools });
});

const langs = require("langs");

app.get("/title-tag-tool", (req, res) => {
  res.render("title-tag-tool", {
    title: "Title tag værktøj",
    languages: langs.all(),
  });
});

app.get("/meta-beskrivelse-tool", (req, res) => {
  res.render("meta-beskrivelse-tool", {
    title: "Meta beskrivelse værktøj",
    languages: langs.all(),
  });
});

app.get("/blog-forslag", (req, res) => {
  res.render("blog-forslag", {
    title: "Blog forslag værktøj",
    languages: langs.all(),
  });
});

app.get("/opdel-keyword", (req, res) => {
  res.render("opdel-keyword", {
    title: "Opdeling af søgeord værktøj",
    languages: langs.all(),
  });
});

app.get("/url-redirect", (req, res) => {
  res.render("url-redirect", {
    title: "url-redirect værktøj",
    languages: langs.all(),
  });
});

app.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    const url = `https://www.googleapis.com/customsearch/v1`;
    const params = {
      key: GOOGLE_API_KEY,
      cx: CX_KEY,
      q: query,
    };

    const response = await axios.get(url, { params });

    // Extract the top 4 competitor URLs from the search results
    const competitorUrls = response.data.items
      .slice(0, 4)
      .map((item) => item.link);

    // Call the scrapeCompetition function for each competitor URL
    const competitorData = await Promise.all(
      competitorUrls.map((url) => scrapeCompetition(url))
    );

    res.json(competitorData);
  } catch (error) {
    res.json({ error: error.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
