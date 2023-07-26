const lang = document.getElementById("language");
const text = document.getElementById("name");
const button = document.getElementById("submit-button");
const textArea = document.getElementById("dit-output");

button.addEventListener("click", async function (event) {
  event.preventDefault();

  const textValue = text.value;
  let promptText = "";
  if (textValue.includes("https")) {
    promptText = await scrapeWebsite(textValue);
  }

  if (!promptText) {
    promptText = textValue;
  }

  if (!lang.value) {
    alert("Vælg et sprog før du kan submit");
    return;
  }

  generateMetabeskrivelse(promptText, lang.value);
});

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

async function scrapeWebsite(url) {
  try {
    const response = await axios.get(`/scrape?url=${encodeURIComponent(url)}`);
    const content = response.data;

    return content;
  } catch (error) {
    console.error("Error scraping website:", error);
    // Handle the error as needed
  }
}

async function generateMetabeskrivelse(text, lang) {
  // Create a new AbortController instance
  textArea.value = "";
  controller = new AbortController();
  const signal = controller.signal;

  let prompt = "The text is {text} and the target language {lang}";
  prompt = prompt.replace("{text}", text);
  prompt = prompt.replace("{lang}", lang);

  let titlePrompt =
    "Step into the shoes of a bilingual digital marketing expert who specializes in SEO, fluent in both English and your target language. " +
    "Your task is to create a compelling meta description for a website in the target language. " +
    "You will be asked to provide the language and the text to be used in the meta description after this prompt. " +
    "This meta description plays a vital role in attracting potential visitors from search engine results and providing a brief but informative overview of the website's content. " +
    "Here are your guidelines: " +
    "Keep the length between 150-160 characters as this is the optimal length that search engines display. " +
    "Make sure it accurately summarizes the content found on the page, which you will provide. " +
    "Incorporate relevant keywords from the provided text without overstuffing. " +
    "Craft it in a way that is enticing to encourage users to click on the website link in the search results. " +
    "You will be asked to provide the text after this prompt. This text is taken directly from the website and will be placed on that same site. " +
    "As such, it's essential that your meta description aligns well with the overall content and purpose of the website. " +
    "Remember, an effective meta description can significantly enhance the visibility and click-through rates of a website on search engine results pages, " +
    "so take your time to craft it carefully and thoughtfully. " +
    "Now, please provide the target language and the text from which you'll craft a compelling, concise, and SEO-friendly meta description for the website.";
  try {
    // Fetch the response from the OpenAI API with the signal from AbortController
    const response = await fetch("/process-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        titlePrompt: titlePrompt,
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error("An error occurred");
    }

    // Read the response as a stream of data
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    textArea.innerText = "";

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value);

      while (buffer.includes("\n")) {
        const newlineIndex = buffer.indexOf("\n");
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.trim()) {
          const jsonLine = line.replace(/^data: /, "").trim();
          console.log("JSONLINE: " + jsonLine);
          try {
            const parsedData = JSON.parse(jsonLine);
            const content = parsedData.choices[0].delta.content;

            if (typeof content !== "undefined") {
              textArea.value += content;
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }
      }
    }
  } catch (error) {
    // Handle fetch request errors
    if (signal.aborted) {
      textArea.innerText = "Request aborted.";
    } else {
      console.error("Error:", error);
      textArea.innerText = "Error occurred while generating.";
    }
  } finally {
    // Enable the generate button and disable the stop button
    controller = null; // Reset the AbortController instance
  }
}
