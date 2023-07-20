
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

  let titlePrompt = "As a title tag expert with comprehensive SEO knowledge, your task is to create three title tags using 2 or 3 " + lang.value + " keywords provided, separated by commas. Follow this format: [Primary keyword] - [remaining title tag]. Ensure the title tags do not exceed 65 characters in length and are descriptive. Each title tag must include a call to action. The primary keyword holds the highest priority. The title tags should be in the following language {lang} provided with an english translation.";
  titlePrompt = titlePrompt.replace("{lang}", lang.value);
  try {
    // Fetch the response from the OpenAI API with the signal from AbortController
    const response = await fetch('/process-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        titlePrompt: titlePrompt,
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error('An error occurred');
    }

    // Read the response as a stream of data
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    textArea.innerText = "";

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value);

      while (buffer.includes('\n')) {
        const newlineIndex = buffer.indexOf('\n');
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.trim()) {
          const jsonLine = line.replace(/^data: /, '').trim();

          try {
            const parsedData = JSON.parse(jsonLine);
            const content = parsedData.choices[0].delta.content;
            textArea.value += content;
          } catch (error) {
            console.error('Error parsing JSON:', error);
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

// Client-side code
document.getElementById('show-prompt').addEventListener('click', function() {
  const card = document.querySelector('.prompt-card');
  if (card.style.display === 'none') {
      card.style.display = 'block';
  } else {
      card.style.display = 'none';
  }
});




const submitButton = document.getElementById("submit-button");

submitButton.addEventListener('click', function(event) {
    event.preventDefault();
    console.log("Clicked button");
    generate();
});
