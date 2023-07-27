const emne = document.getElementById("name");
const keywords = document.getElementById("keywords");
const textArea = document.getElementById("dit-output");
const submit = document.getElementById("submit-button");
const generatedTextElement = document.getElementById("generatedText");

submit.addEventListener("click", async function (event) {
  event.preventDefault();
  const emneValue = emne.value;
  const keywordValue = keywords.value;
  if (!emneValue) {
    alert("Husk at skrive et emne før du kan submit");
    return;
  }

  if (!keywordValue) {
    alert("Husk at skrive keywords før du kan submit");
    return;
  }

  generate(emneValue, keywordValue);
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

async function generate(emne, søgeord) {
  // Create a new AbortController instance
  textArea.value = "";
  controller = new AbortController();
  const signal = controller.signal;

  let prompt = "Emne: {emne} og søgeord: {søgeord}";
  prompt = prompt.replace("{emne}", emne);
  prompt = prompt.replace("{søgeord}", søgeord);

  let titlePrompt =
    "Imagine yourself as an experienced content strategist and SEO specialist. Your task is to create an in-depth blog post outline. " +
    "You will be asked to provide the specific topic and keywords for this outline after this prompt. " +
    "The outline should detail the main points and subpoints, ensuring they flow logically to guide readers through the topic smoothly. " +
    "Here are your key considerations: " +
    "Begin with a captivating introduction that explains the topic and its relevance to your audience, and why they should be interested. " +
    "Break down the main body into distinct sections, each with a clear heading. You will be asked to incorporate relevant keywords tied to the topic into these headings to optimize for search engine visibility. " +
    "Ensure the headings follow a logical sequence and highlight the progression of thoughts. Specify the subpoints or particular arguments that will be discussed within each section. " +
    "Consider including relevant case studies, anecdotes, or data points as part of your points where applicable. " +
    "Plan a summarizing conclusion that revisits the key takeaways, and consider posing a question or a call-to-action for your readers. " +
    "If necessary, provide a list of resources or references that will be mentioned in the blog post. " +
    "After this prompt, please provide the specific topic and keywords. With these, you will create an engaging, structured, and detailed blog post outline, incorporating SEO practices. Remember, a well-planned outline serves as the foundation for a successful blog post, aiding in delivering a clear, concise, and captivating narrative.";
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
