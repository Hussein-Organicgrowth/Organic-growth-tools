const keywords = document.getElementById("keywords");
const submit = document.getElementById("submit-button");
const textArea = document.getElementById("dit-output");

submit.addEventListener("click", async function (event) {
  event.preventDefault();
  const keywordsValue = keywords.value;
  if (!keywordsValue) {
    alert("Husk at skrive keywords før du kan submit");
    return;
  }

  generate(keywordsValue);
});

async function generate(keywords) {
  // Create a new AbortController instance
  textArea.value = "";
  controller = new AbortController();
  const signal = controller.signal;

  let prompt = "søgeord: {søgeord}";
  prompt = prompt.replace("{søgeord}", keywords);

  let titlePrompt =
    "Imagine yourself as an expert in keyword analysis and SEO, particularly skilled in categorizing keywords. Your task will be to arrange a set of Danish keywords into relevant categories. " +
    "You will be asked to provide these specific keywords after this prompt. " +
    "As you perform this task, it's important to demonstrate a thorough understanding of the Danish language and the nuances of keyword grouping. " +
    "The categories you create should reflect the meaning and intent behind the keywords, helping to improve the structure of a Danish language SEO campaign. " +
    "Here are some guidelines to follow: " +
    "Each keyword should be placed into the category that best matches its meaning and potential user intent. " +
    "The categories should be named in Danish, reflecting the overall theme of the keywords within. " +
    "Prioritize logical organization over the quantity of categories. It's better to have a few well-structured categories than numerous disorganized ones. " +
    "When in doubt, consider the possible search queries a user might input when looking for the kind of content or services the keywords are targeting. " +
    "After this prompt, you will be asked to provide the specific Danish keywords. With these keywords in hand, start organizing them into well-defined, relevant categories. This activity will not only enhance the SEO strategy but will also contribute to a more targeted and effective digital marketing campaign. " +
    "ALWAYS FOLLOW THIS FORMAT. Category:keywords. The keywords will be split by commas making it an array ALWAYS FOLLOW THIS and It will look like this Category:name of the category under that søgeord:. ";
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
          if (jsonLine.includes("[DONE]")) {
            alert("Du kan nu downloade din csv file");
            return;
          }
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
const testButton = document.getElementById("test");

testButton.addEventListener("click", async function (event) {
  event.preventDefault();
  test(textArea.value);
});

function test(text) {
  const map = new Map();

  const sections = text.split("\n\n");
  console.log(sections);
  sections.forEach((section) => {
    const lines = section.split("\n");
    const kategoriLine = lines[0];
    const soegordLine = lines[1];

    if (kategoriLine && soegordLine) {
      const kategori = kategoriLine.slice(10).trim();
      const soegord = soegordLine.slice(9).trim().split(", ");
      map.set(kategori, soegord);
    }
  });

  console.log(map);

  // Define the data from the Map
  const data = Array.from(map.entries());

  // Extract unique categories and keywords
  const categories = Array.from(new Set(data.map(([kategori]) => kategori)));
  const keywordsByCategory = {};

  // Group keywords by category
  for (const [kategori, soegord] of data) {
    if (!keywordsByCategory[kategori]) {
      keywordsByCategory[kategori] = [];
    }
    keywordsByCategory[kategori].push(...soegord);
  }

  // Create the CSV rows
  const csvRows = [];
  const maxKeywords = Math.max(
    ...categories.map((kategori) => keywordsByCategory[kategori].length)
  );

  // Create the header row with category names
  const headerRow = categories;
  csvRows.push(headerRow);

  // Create the keyword rows
  for (let i = 0; i < maxKeywords; i++) {
    const keywordRow = categories.map(
      (kategori) => keywordsByCategory[kategori][i] || ""
    );
    csvRows.push(keywordRow);
  }

  // Convert the data to CSV format
  const csv = csvRows.map((row) => row.join(",")).join("\n");

  // Create a Blob object with the CSV data and UTF-8 encoding
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  // Create a temporary URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a link element for the download
  const link = document.createElement("a");
  link.href = url;
  link.download = "keywords.csv";

  // Append the link to the document body and click it to start the download
  document.body.appendChild(link);
  link.click();

  // Clean up the temporary URL
  URL.revokeObjectURL(url);
}

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
