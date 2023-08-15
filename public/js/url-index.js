const antalP = document.getElementById("antal-index");
const antalNP = document.getElementById("antal-no-index");
const antalUrls = document.getElementById("antal-urls");
document
  .getElementById("submit-button")
  .addEventListener("click", async function (event) {
    var antalIndex = 0;
    var antalNoIndex = 0;

    event.preventDefault(); // Prevent the default form submission
    NProgress.start();
    // Extract URLs from the textarea
    let rawUrls = document.getElementById("urls").value;
    let urlsArray = rawUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url); // Split by line, trim, and filter out empty lines
    console.log(urlsArray);
    try {
      // Send the URLs to the server for processing
      let response = await fetch("/url-index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: urlsArray }), // Assuming your server accepts a JSON payload with a 'urls' array property
      });

      let urlResultsArray = await response.json();

      // Populate the table
      let tableBody = document.querySelector("#url-results-table tbody");
      tableBody.innerHTML = ""; // Clear previous results

      for (let urlData of urlResultsArray) {
        let row = tableBody.insertRow();
        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        cell1.textContent = urlData.url;
        if (urlData.isIndexed) {
          cell2.textContent = "Yes";
          cell2.style.backgroundColor = "green";
          antalIndex++;
        } else {
          cell2.textContent = "No";
          cell2.style.backgroundColor = "red";
          antalNoIndex++;
        }
      }
      NProgress.done();
      NProgress.remove();
      antalUrls.textContent = "Antal URL'er: " + urlsArray.length;
      antalP.textContent = "Antal indexet: " + antalIndex;
      antalNP.textContent = "Antal ikke indexet: " + antalNoIndex;
    } catch (error) {
      console.error("Failed to fetch URL indexed status:", error);
      NProgress.done();
      NProgress.remove();
    }
  });


