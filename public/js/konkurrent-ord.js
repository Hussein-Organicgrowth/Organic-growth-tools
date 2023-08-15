async function searchAndScrape(query) {
  try {
    const apiUrl = "/search?q=" + encodeURIComponent(query);

    const response = await fetch(apiUrl);
    const data = await response.json();

    return data;
  } catch (error) {
    return { error: error.toString() };
  }
}
const table = document.getElementById("myTable");
const tbody = table.querySelector("tbody");

const gennemsnit = document.getElementById("gennemsnit");
async function showTable(keyword) {
  tbody.innerHTML = "";
  const data = await searchAndScrape(keyword);
  let gennemsnitAntal = 0;
  data.forEach((element) => {
    const row = document.createElement("tr");

    // Create cells for Position, URL, and Word Count

    const urlCell = document.createElement("td");
    urlCell.textContent = element.urlText;
    const positionCell = document.createElement("td");
    positionCell.textContent = element.placering + 1;
    const wordCountCell = document.createElement("td");
    wordCountCell.textContent = element.wordCount;
    gennemsnitAntal += element.wordCount;

    // Append cells to the row
    row.appendChild(positionCell);
    row.appendChild(urlCell);
    row.appendChild(wordCountCell);

    // Append row to the table body
    tbody.appendChild(row);
  });
  const row = document.createElement("tr");
  // Leave it empty for the average row
  const urlCell = document.createElement("td");
  urlCell.textContent = "Gennemsnit";
  const positionCell = document.createElement("td");
  positionCell.textContent = "";
  const wordCountCell = document.createElement("td");
  wordCountCell.textContent = gennemsnitAntal / 4;
  row.appendChild(positionCell);
  row.appendChild(urlCell);
  row.appendChild(wordCountCell);

  // Append row to the table body
  tbody.appendChild(row);
  gennemsnit.textContent = "Gennemsnitlige ord: " + gennemsnitAntal / 4;
}

const submitButton = document.getElementById("submit-button");

const input = document.getElementById("keyword-input");
submitButton.addEventListener("click", function (event) {
  event.preventDefault();
  console.log("Clicked button");
  showTable(input.value);
});
