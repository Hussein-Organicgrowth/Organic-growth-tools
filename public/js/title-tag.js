const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = "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";

const keywords = document.getElementById("title-input");
const lang = document.getElementById("language");
const textArea = document.getElementById("output-text");

let controller = null; // Store the AbortController instance

const generate = async () => {
  // Alert the user if no prompt value
  
  let prompt = keywords.value.trim();
    console.log("KEYWORDS: " + prompt);
  // Disable the generate button and enable the stop button
  textArea.innerText = "Generating...";

  // Create a new AbortController instance
  controller = new AbortController();
  const signal = controller.signal;

  let titlePrompt = "As a title tag expert with comprehensive SEO knowledge, your task is to create three title tags using 2 or 3 swedish keywords provided, separated by commas. Follow this format: [Primary keyword] - [remaining title tag]. Ensure the title tags do not exceed 65 characters in length and are descriptive. Each title tag must include a call to action. The primary keyword holds the highest priority. The title tags should be in the following language {lang} provided with an english translation.";
  titlePrompt = titlePrompt.replace("{lang}", lang.value);
  try {
    // Fetch the response from the OpenAI API with the signal from AbortController
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{role: "system", content: titlePrompt},{ role: "user", content: prompt }],
        max_tokens: 5000,
        stream: true, // For streaming responses
      }),
      signal, // Pass the signal to the fetch request
    });

    // Read the response as a stream of data
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    textArea.innerText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      // Massage and parse the chunk of data
      const chunk = decoder.decode(value);
      const lines = chunk.split("\\n");
      
      const parsedLines = lines
      .map((line) => {
        try {
          return JSON.parse(line.replace(/^data: /, "").trim()); // Parse the JSON string
        } catch(e) {
          return null; // return null if parsing fails
        }
      })
      .filter((line) => line !== null) // Remove the "data: " prefix
        .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
        .map((line) => {
            console.log(line);  // add this line
            return line;
          }); // Parse the JSON string
      console.log("PARSEDLINE: " + parsedLines);
      if(parsedLines == ""){
        textArea.value += '\n';
      }
      
      for (const parsedLine of parsedLines) {
        const { choices } = parsedLine;
        const { delta } = choices[0];
        const { content } = delta;
      
        // Check if parsedLine is empty and if so, append a newline
        if (!content.trim()) {
          textArea.value += '\n';
        } else {
          // Update the UI with the new content
          console.log(content);
          textArea.value += content;
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

submitButton.addEventListener('click', function(event) {
    event.preventDefault();
    console.log("Clicked button");
    generate();
});
