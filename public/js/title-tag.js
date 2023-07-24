const keywords = document.getElementById("title-input");
const lang = document.getElementById("language");
const textArea = document.getElementById("output-text");

let controller = null; // Store the AbortController instance

const generate = async () => {
  textArea.value = "";
  // Alert the user if no prompt value

  if (keywords.value == "") {
    alert("Du skal skrive keywords ind før du kan generere dine title tags.");
    return;
  }

  if (lang.value == "") {
    alert("Du skal vælge et sprog før du kan generere dine title tags.");
    return;
  }

  let prompt = keywords.value.trim();
  console.log("KEYWORDS: " + prompt);
  // Disable the generate button and enable the stop button
  textArea.innerText = "Generating...";

  // Create a new AbortController instance
  controller = new AbortController();
  const signal = controller.signal;

  let titlePrompt =
    "Envision yourself as a seasoned SEO specialist with a specific expertise in creating title tags. Your mission is to generate three unique title tags, each incorporating 2 or 3 keywords in the specified language {lang}. You will be asked to provide these keywords, separated by commas, after this prompt. The format to follow is: [Primary keyword] - [Secondary keyword(s) / Descriptive Phrase]. Keep in mind that the total character count of each title tag should not exceed the strict limit of 70 characters, inclusive of all letters, spaces and punctuation marks. " +
    "Here are your guidelines: " +
    "Each title tag must be concise yet descriptive, accurately signifying the content of the corresponding webpage. " +
    "Always place the primary keyword at the beginning of the title tag as it holds the highest significance for SEO purposes. " +
    "Include a persuasive call to action in each title tag to compel potential visitors to click on the website link in search engine results. " +
    "Construct all title tags in the language {lang}, but remember to provide corresponding English translations for each. " +
    "Now, please provide the {lang} keywords. Following that, you'll craft three SEO-optimized title tags that strictly adhere to the 70-character limit. Your aim is to balance keyword usage with engaging language to encourage click-through from potential visitors. Remember, an effective title tag can significantly improve a webpage's visibility and click-through rates on search engine results pages.";
  titlePrompt = titlePrompt.replace("{lang}", lang.value);
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
};

const stop = () => {
  // Abort the fetch request by calling abort() on the AbortController instance
  if (controller) {
    controller.abort();
    controller = null;
  }
};

const submitButton = document.getElementById("submit-button");

submitButton.addEventListener("click", function (event) {
  event.preventDefault();
  console.log("Clicked button");
  generate();
});
