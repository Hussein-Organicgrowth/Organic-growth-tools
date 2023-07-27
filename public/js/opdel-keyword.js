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
    "After this prompt, you will be asked to provide the specific Danish keywords. With these keywords in hand, start organizing them into well-defined, relevant categories. This activity will not only enhance the SEO strategy but will also contribute to a more targeted and effective digital marketing campaign.";
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
