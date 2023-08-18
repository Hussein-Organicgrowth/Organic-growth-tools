document
  .getElementById("fetchReviewsBtn")
  .addEventListener("click", async () => {
    const placeUrl = document.getElementById("placeUrl").value;

    try {
      const response = await fetch("http://localhost:3000/getReviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ placeUrl }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      populateTable(data.reviews);
      generateKeywordsFromReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  });

const textArea = document.getElementById("reviewTextArea");
async function generateKeywordsFromReviews(data) {
  //const snippets = data.reviews.map((review) => review.snippet);
  const snippets = [];

  for (let i = 0; i < data.reviews.length; i++) {
    snippets.push(data.reviews[i].snippet);
  }
  console.log("REVIEWS: " + snippets);
  const prompt =
    "You are a seasoned SEO expert with comprehensive knowledge in keyword extraction and analysis. Presented with a collection of reviews, your task is to meticulously identify and extract all the relevant keywords contained within them. Each keyword should represent the essence and sentiments found in the reviews, capturing both the positive and negative nuances. By harnessing your expertise, ensure that these extracted keywords serve as a valuable asset for SEO endeavors and further analysis. Only write the keywords and nothing else. Please don't include any names as keywords ";

  try {
    // Fetch the response from the OpenAI API with the signal from AbortController
    const response = await fetch("/process-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        titlePrompt: prompt,
        prompt: snippets.toString(),
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
}

function populateTable(reviews) {
  const tbody = document.getElementById("reviewsTable").querySelector("tbody");
  tbody.innerHTML = "";

  reviews.forEach((review) => {
    if (!review.snippet) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td>${review.user.name}</td>
    <td>${review.snippet}</td>
        `;
    tbody.appendChild(tr);
  });
}
