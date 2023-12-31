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
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const openaiTokenCounter = require("openai-gpt-token-counter");
const sitemaps = require("sitemap-stream-parser");

const xml2js = require("xml2js");

puppeteer.use(StealthPlugin());

const fetch = require("node-fetch");

app.use(express.json());

async function fetchAndParseXml(url) {
  const response = await fetch(url);
  const text = await response.text();
  const parser = new xml2js.Parser();
  return parser.parseStringPromise(text);
}

async function extractSitemapUrls(sitemapUrl) {
  const parsed = await fetchAndParseXml(sitemapUrl);
  console.log("PARSED: " + parsed.sitemapindex);
  let urls = [];
  if (parsed.sitemapindex && parsed.sitemapindex.sitemap) {
    for (let sitemap of parsed.sitemapindex.sitemap) {
      if (sitemap.loc && sitemap.loc[0]) {
        urls.push(sitemap.loc[0]);
      }
    }
  }
  return urls;
}

async function extractSiteUrls(sitemapUrl) {
  const parsed = await fetchAndParseXml(sitemapUrl);
  let urls = [];
  if (parsed.urlset && parsed.urlset.url) {
    for (let url of parsed.urlset.url) {
      if (url.loc && url.loc[0]) {
        urls.push(url.loc[0]);
      }
    }
  }
  return urls;
}

async function findRankingForDomain(keyword, domain) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://www.google.com");

  const content = await page.content();
  try {
    // Waiting for the cookie banner to load
    const buttonText =
      process.env.NODE_ENV === "production"
        ? '[aria-label="Alle akzeptieren"]'
        : '[aria-label="Acceptér alle"]';
    await page.waitForSelector(".QS5gu.sy4vM"); // wait for the element to appear on the page
    const acceptButton = await page.$x(
      "//div[contains(@class, 'QS5gu') and contains(@class, 'sy4vM') and contains(text(), 'Acceptér alle')]"
    );

    if (acceptButton.length > 0) {
      await acceptButton[0].click();
    }

    await page.waitForSelector("textarea[name=q]");

    await page.type("textarea[name=q]", keyword);
    await page.keyboard.press("Enter");

    // Wait for search results to load
    await page.waitForSelector("#search");

    let found = false;
    let pageNum = 1;
    const maxPagesToSearch = 100; // set a limit to how many pages to search through
    let pageTal = 1;
    let linkArray = [];
    while (!found && pageNum <= maxPagesToSearch) {
      const links = await page.$$eval("h3", (links) =>
        links.map((link) => link.parentElement.href)
      );

      for (let i = 0; i < links.length; i++) {
        if (links[i].includes(domain)) {
          found = true;
          linkArray.push(links[i]);
          console.log("LinkArray: " + linkArray);
          const position = linkArray.indexOf(domain);
          console.log(
            `Found ${domain} at position ${position} on page ${pageNum}`
          );
          break;
        }
      }

      if (!found) {
        pageTal++;
        let pageString = "Page " + pageTal;
        const nextPageLink = await page.$(`a[aria-label="${pageString}"].fl`);
        console.log("NEXTPAGELINK: " + nextPageLink);

        if (nextPageLink) {
          await nextPageLink.click();
          await page.waitForSelector("#search"); // Ensure the results are loaded
          pageNum++;
        } else {
          let moreResultsButton;
          for (let i = 0; i < 25; i++) {
            // try scrolling 5 times or adjust as necessary
            await page.evaluate(() => {
              window.scrollBy(0, window.innerHeight / 2); // scroll half the viewport height
            });

            await page.waitForTimeout(1000); // Wait a bit for potential dynamic content to load

            moreResultsButton = await page.$("a.T7sFge.sW9g3e.VknLRd");
            if (moreResultsButton) break; // exit loop once button is found
          }

          if (moreResultsButton) {
            await moreResultsButton.click();
            await page.waitForSelector("#search"); // Ensure the results are loaded
            pageNum++;
          } else {
            break; // No more results or pages to show after trying to scroll
          }
        }
      }
    }

    if (!found) {
      console.log(
        `${domain} was not found in the top ${
          pageNum * 10
        } results for the keyword "${keyword}".`
      );
    }

    //await browser.close();
  } catch (e) {
    console.log("Cookie banner not found or already accepted.");
  }
  // Input the keyword into Google search and click the search button
}

//console.log(findRankingForDomain("cheap cars", "https://wgntv.com/"));

async function fetchAllUrlsFromSitemapIndex(sitemapIndexUrl) {
  const sitemapUrls = await extractSitemapUrls(sitemapIndexUrl);
  let allUrls = [];
  console.log("SITEMAP URLS: " + sitemapUrls);
  for (let sitemapUrl of sitemapUrls) {
    const siteUrls = await extractSiteUrls(sitemapUrl);
    allUrls = allUrls.concat(siteUrls);
    console.log("SITE URLS: " + siteUrls);
  }

  return allUrls;
}

function collectUrlsFromSitemaps(sitemapIndexUrl) {
  return new Promise((resolve, reject) => {
    let allUrls = [];

    sitemaps.parseSitemaps(
      sitemapIndexUrl,
      function (url) {
        allUrls.push(url);
      },
      function (err, sitemaps) {
        if (err) {
          reject(err);
        } else {
          resolve(allUrls);
        }
      }
    );
  });
}
function collectUrlsFromSitemaps(urls) {
  return new Promise((resolve, reject) => {
    let allUrls = [];

    sitemaps.parseSitemaps(
      urls,
      function (url) {
        allUrls.push(url);
      },
      function (err, sitemaps) {
        if (err) {
          reject(err);
        } else {
          resolve(allUrls);
        }
      }
    );
  });
}

app.post("/scrape-meta-data", async (req, res) => {
  const sitemapIndexUrl = req.body.sitemapURL;

  try {
    const urls = await collectUrlsFromSitemaps(sitemapIndexUrl);

    res.json({ urls });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch URLs" });
  }
});

app.post("/fetch-meta-details", async (req, res) => {
  const { url } = req.body;

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const title =
      $("title").text() === "undefined" ? "Ingen title" : $("title").text();
    const metaDescription =
      $('meta[name="description"]').attr("content") === "undefined"
        ? "Ingen meta description"
        : $('meta[name="description"]').attr("content");
    res.json({ title, metaDescription });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch meta details" });
  }
});

async function getEmbedding(text) {
  const endpoint = "https://api.openai.com/v1/embeddings";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  };
  const data = {
    input: text,
    model: "text-embedding-ada-002",
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  });

  const responseBody = await response.json();
  return responseBody.data[0].embedding;
}

function getAmountOfTokens(text) {
  const tokenCount = openaiTokenCounter.text(text, "gpt-4");
  return tokenCount;
}

async function summarizeText(text) {
  // Use the appropriate endpoint // Replace with your API key

  const prompt = `Opsummer følgende tekst:\n\n${text}`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }], // Enable streaming response
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

function splitTextIntoChunks(text, chunkSize) {
  const words = text.split(" ");
  const chunks = [];

  while (words.length) {
    let chunk = "";
    while (chunk.split(" ").length < chunkSize && words.length) {
      chunk += " " + words.shift();
    }
    chunks.push(chunk.trim());
  }

  return chunks;
}

app.post("/process-text", async (req, res) => {
  try {
    const { titlePrompt, prompt } = req.body;

    const tokenCount = getAmountOfTokens(prompt);
    let summarizedText = "";
    if (tokenCount > 3400) {
      const chunks = splitTextIntoChunks(prompt, 400);
      // console.log("CHUNKS " + summarizeText(chunks));
      const summarizedChunks = await Promise.all(
        chunks.map((chunk) => summarizeText(chunk))
      );
      summarizedText = summarizedChunks.join(" ");
    }

    const sidstePrompt = tokenCount > 4000 ? summarizedText : prompt;

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
          { role: "user", content: sidstePrompt },
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
    return competitionData;
  } catch (error) {
    // Handle any errors that occur during the search and scraping process
    console.error("Error:", error);
    // ... handle the error appropriately
  }
}

async function scrapeCompetition(url, index) {
  try {
    // Make a request to the competition URL
    const response = await axios.get(url);

    // Load the HTML content into cheerio
    const $ = cheerio.load(response.data);
    let internalLinks = 0;
    $("script, style").remove();
    $("*")
      .contents()
      .each((index, node) => {
        if (node.type === "comment") {
          $(node).remove();
        }
      });

    $("a").each((index, element) => {
      const href = $(element).attr("href");

      // Check if the link is internal:
      // This can be more complex depending on what you define as an internal link.
      if (href && (href.startsWith("/") || href.startsWith(url))) {
        internalLinks++;
      }
    });

    // Extract the values you need using CSS selectors
    let textContent = $("body").text();

    // Normalize whitespace, remove non-breaking spaces and other entities
    textContent = textContent.replace(/&nbsp;/g, " "); // Convert non-breaking spaces to regular spaces
    textContent = textContent.replace(/\s+/g, " "); // Convert multiple spaces/newlines/tabs into one space
    textContent = textContent.replace(/&[a-z]+;/g, ""); // Remove other entities
    textContent = textContent.trim();
    const wordCount = textContent
      .split(" ")
      .filter((word) => word.length > 0).length;

    const statusCode = response.status;
    const title = $("title").text();
    const description = $('meta[name="description"]').attr("content");
    const h1 = $("h1").text();
    const h2Count = $("h2").length;
    const h3Count = $("h3").length;
    const robots = $('meta[name="robots"]').attr("content");
    const canonical = $('link[rel="canonical"]').attr("href");
    const urlText = url;
    const placering = index;
    // ... and so on for the other values you need

    // Return the extracted values
    return {
      statusCode,
      urlText,
      internalLinks,
      placering,
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

app.get("/scrape-konkurrent", async (req, res) => {
  const url = req.query.url;
  const placering = req.query.placering;

  try {
    const data = await scrapeCompetition(url, placering);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
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
    link: "/blog-forslag",
  },
  {
    name: "Opdeling af søgeord",
    description: "Hjælper dig med at opdele søgeord",
    link: "/opdel-keyword",
  },
  {
    name: "Analyser kunde anmeldelser og kom med forslag til nye søgeord",
    description: "Anlyser kunde anmelder og kommer med forslag til søgeord",
    link: "/google-review-keywords",
  },
  {
    name: "Check om liste med urls er indexeret",
    description: "Hjælper dig med at checke om liste med urls er indexeret",
    link: "/url-indexed-tool",
  },
  {
    name: "URL redirect mapping",
    description: "Hjælper dig med at lave url rediret mapping",
    link: "/url-redirect",
  },
  {
    name: "OnPage konkurrentanalyse",
    description: "Hjælper dig med at opdele søgeord",
    link: "/konkurrent-analyse",
  },
  {
    name: "Tekst Konkurrentanalyse",
    description:
      "Hjælper dig med at komme med en gennemsnitlige antal ord som andre konkurrenter har",
    link: "/konkurrent-ord",
  },
  {
    name: "Scrape meta data fra sitemap",
    description: "scraper alle page titles og meta beskrivelser",
    link: "/scrape-meta-data",
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

app.get("/konkurrent-ord", (req, res) => {
  res.render("konkurrent-ord", {
    title: "Konkurrent ord værktøj",
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

app.get("/url-indexed-tool", (req, res) => {
  res.render("url-indexed-tool", {
    title: "url-indexed værktøj",
    languages: langs.all(),
  });
});

app.get("/google-review-keywords", (req, res) => {
  res.render("google-review-keywords", {
    title: "Google Review Keywords",
    languages: langs.all(),
  });
});
app.get("/konkurrent-analyse", (req, res) => {
  res.render("konkurrent-analyse", {
    title: "Konkurrent Analyse værktøj",
    languages: langs.all(),
  });
});
app.get("/scrape-meta-data", (req, res) => {
  res.render("scrape-metadata", {
    title: "Scrape meta data fra sitemap",
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
      .map((item, index) => ({ url: item.link, index }));

    // Call the scrapeCompetition function for each competitor URL
    const competitorData = await Promise.all(
      competitorUrls.map(({ url, index }) => scrapeCompetition(url, index))
    );

    res.json(competitorData);
  } catch (error) {
    res.json({ error: error.toString() });
  }
});
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post("/url-index", async (req, res) => {
  const apiKey = GOOGLE_API_KEY;
  const cx = CX_KEY;

  // Check if the request has a 'urls' property which should be an array
  if (!req.body.urls || !Array.isArray(req.body.urls)) {
    return res
      .status(400)
      .json({ error: "Expected a 'urls' array in the request body." });
  }

  let urls = req.body.urls;
  let results = [];

  for (let url of urls) {
    try {
      const query = "site:" + url;
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}`;

      const response = await axios.get(searchUrl);
      const searchResults = response.data.items || []; // Using '|| []' to ensure it defaults to an empty array if undefined

      const isIndexed = searchResults.length > 0;

      results.push({ url, isIndexed });
      await sleep(1000);
    } catch (error) {
      // If you want to skip failed URLs, just continue to the next one
      // Otherwise, you could push an error result or just return an error response
      console.error(
        `Failed to check indexed status for ${url}:`,
        error.toString()
      );
      results.push({ url, isIndexed: false, error: error.toString() }); // Storing the error, but you can handle it as needed
    }
  }

  res.json(results);
});
//const placeUrl =
//  "https://www.google.com/maps/place/home+%C3%98sterbro+-+Ndr.+Frihavnsgade/@55.7033839,12.5832663,17z/data=!3m1!4b1!4m14!1m7!3m6!1s0x465252ef788d699f:0xc1043a1d567dedab!2sRealM%C3%A6glerne+%C3%98sterbro+ApS!8m2!3d55.7034093!4d12.5867607!16s%2Fg%2F11_tznt8d!3m5!1s0x465252ef86adb289:0x90bf1b890a697782!8m2!3d55.7033809!4d12.5858412!16s%2Fg%2F1tmg54hd?authuser=0&hl=dk&entry=ttu";

async function scrollPage(page, scrollContainer) {
  let lastHeight = await page.evaluate(
    `document.querySelector("${scrollContainer}").scrollHeight`
  );
  while (true) {
    await page.evaluate(
      `document.querySelector("${scrollContainer}").scrollTo(0, document.querySelector("${scrollContainer}").scrollHeight)`
    );
    page.evaluate(() => {
      var moreButtons = document.getElementsByClassName("w8nwRe kyuRq");

      for (var i = 0; i < moreButtons.length; i++) {
        moreButtons[i].click();
      }
    });
    await page.waitForTimeout(2000);
    let newHeight = await page.evaluate(
      `document.querySelector("${scrollContainer}").scrollHeight`
    );

    if (newHeight === lastHeight) {
      break;
    }
    lastHeight = newHeight;
  }
}

async function getReviewsFromPage(page) {
  const reviews = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".jftiEf")).map((el) => {
      return {
        user: {
          name: el.querySelector(".d4r55")?.textContent.trim(),
          link: el.querySelector(".WNxzHc a")?.getAttribute("href"),
          thumbnail: el.querySelector(".NBa7we")?.getAttribute("src"),
          localGuide:
            el.querySelector(".RfnDt span:first-child")?.style.display ===
            "none"
              ? undefined
              : true,
          reviews: parseInt(
            el
              .querySelector(".RfnDt span:last-child")
              ?.textContent.replace("·", "")
          ),
        },
        rating: parseFloat(
          el.querySelector(".kvMYJc")?.getAttribute("aria-label")
        ),
        date: el.querySelector(".rsqaWe")?.textContent.trim(),
        snippet: el.querySelector(".MyEned")?.textContent.trim(),
        likes: parseFloat(
          el.querySelector(".GBkF3d:nth-child(2)")?.getAttribute("aria-label")
        ),
        images: Array.from(el.querySelectorAll(".KtCyie button")).length
          ? Array.from(el.querySelectorAll(".KtCyie button")).map((el) => {
              return {
                thumbnail: getComputedStyle(el).backgroundImage.slice(5, -2),
              };
            })
          : undefined,
        date: el.querySelector(".rsqaWe")?.textContent.trim(),
      };
    });
  });
  return reviews;
}

async function fillPlaceInfo(page) {
  const placeInfo = await page.evaluate(() => {
    return {
      title: document.querySelector(".DUwDvf").textContent.trim(),
      address: document
        .querySelector("button[data-item-id='address']")
        ?.textContent.trim(), // data-item-id attribute may be different if the language is not English
      rating: document
        .querySelector("div.F7nice > span:first-child")
        .textContent.trim(),
      reviews: document
        .querySelector(".HHrUdb")
        .textContent.trim()
        .split(" ")[0],
    };
  });
  return placeInfo;
}

async function getLocalPlaceReviews(placeUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  const page = await browser.newPage();
  page.setViewport({ width: 1200, height: 700 });
  await page.setDefaultNavigationTimeout(60000);
  await page.goto(placeUrl + "&hl=da");
  const content = await page.content();
  try {
    // Waiting for the cookie banner to load
    const buttonText =
      process.env.NODE_ENV === "production"
        ? '[aria-label="Alle akzeptieren"]'
        : '[aria-label="Acceptér alle"]';
    const acceptButton = await page.waitForSelector(
      '[aria-label="Acceptér alle"]',
      {
        timeout: 50000,
      }
    );

    if (acceptButton) {
      await acceptButton.click();
      console.log("CLICKED BUTTON");
    }
  } catch (e) {
    console.log("Cookie banner not found or already accepted.");
  }

  await page.waitForSelector(".DUwDvf");

  const placeInfo = await fillPlaceInfo(page);

  await page.click(".HHrUdb");
  await page.waitForTimeout(5000);
  await page.waitForSelector(".jftiEf");

  await scrollPage(page, ".DxyBCb");

  const reviews = await getReviewsFromPage(page);

  await browser.close();

  return { placeInfo, reviews };
}

app.post("/getReviews", async (req, res) => {
  try {
    const placeUrl = req.body.placeUrl;
    if (!placeUrl) {
      return res.status(400).json({ error: "Place URL not provided." });
    }

    const data = await getLocalPlaceReviews(placeUrl);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//getLocalPlaceReviews().then((result) => console.dir(result, { depth: null }));
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
