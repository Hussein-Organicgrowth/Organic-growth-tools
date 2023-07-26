const express = require("express");
require("dotenv").config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public")); // to serve static files
app.set("view engine", "ejs"); // setting up the view engine
const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = process.env.OPENAI_API_KEY;
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
    console.error("Error scraping website:", error);
    res.status(500).send("An error occurred");
  }
});

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
    link: "http://tool3.com",
  },
  {
    name: "Opdeling af søgeord",
    description: "Hjælper dig med at opdele søgeord",
    link: "http://tool3.com",
  },
  {
    name: "Forslag af indholdsemner til søgeordsgruppe.",
    description: "Hjælper dig med at opdele søgeord",
    link: "http://tool3.com",
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
    link: "http://tool3.com",
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

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
