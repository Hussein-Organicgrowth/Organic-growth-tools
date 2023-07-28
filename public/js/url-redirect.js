const newUrlsDiv = document.getElementById("new");
const oldUrlsDiv = document.getElementById("old");

const submitButton = document.getElementById("submit-button");
const outputArea = document.getElementById("dit-output");

const downloadButton = document.getElementById("download");

submitButton.addEventListener("click", async function (event) {
  event.preventDefault();

  var oldUrls = oldUrlsDiv.value.split("\n");
  var newUrls = newUrlsDiv.value.split("\n");
  var output = "OLD URLS,NEW URLS,MATCHED SCORE\n";
  console.log(oldUrls);
  console.log(newUrls);

  for (var i = 0; i < oldUrls.length; i++) {
    var oldUrl = null;
    var newUrl = ""; // Initialize newUrl to an empty string
    var score = 0;
    try {
      oldUrl = new URL(oldUrls[i]);
    } catch (error) {
      $("#feedback").text("Error: Invalid old URL '" + oldUrls[i] + "'");
      continue;
    }

    var oldPath = oldUrl.pathname.toLowerCase().replace(/\/$/, "");

    // Iterate through each new URL and find the closest match to the current old URL
    for (var j = 0; j < newUrls.length; j++) {
      var newURL = null;
      var newPath = null;
      var matchedScore = 0;
      try {
        newURL = new URL(newUrls[j]);
      } catch (error) {
        $("#feedback").text("Error: Invalid new URL '" + newUrls[j] + "'");
        continue;
      }

      newPath = newURL.pathname.toLowerCase().replace(/\/$/, "");

      // Calculate the similarity between the two paths using both methods
      matchedScore = calculateSimilarity(oldPath, newPath);

      // If the current new URL is a closer match to the old URL, replace the old URL's match
      if (matchedScore > score) {
        newUrl = newUrls[j];
        score = matchedScore;
      }
    }

    // If no match was found, set newUrl to "No Match"
    if (score === 0) {
      newUrl = "No Match";
    }

    // Add the closest matching new URL to the output
    output +=
      oldUrls[i] + "," + newUrl + "," + (score * 100).toFixed(2) + "%\n";
  }

  outputArea.value += output;
});

downloadButton.addEventListener("click", function (event) {
  var output = outputArea.value;
  var csvContent = "data:text/csv;charset=utf-8," + output;
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "urls.csv");
  document.body.appendChild(link);
  link.click();
});

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateSimilarity(a, b) {
  // Extract keywords from the pathnames by splitting on non-alphanumeric characters
  const keywordsA = a.split(/[^a-z0-9]+/).filter(Boolean);
  const keywordsB = b.split(/[^a-z0-9]+/).filter(Boolean);

  // Calculate the number of common keywords
  const commonKeywords = keywordsA.filter((keyword) =>
    keywordsB.includes(keyword)
  ).length;
  const maxKeywords = Math.max(keywordsA.length, keywordsB.length);
  const keywordScore = commonKeywords / maxKeywords;

  // Longest common substring calculation
  let maxLength = Math.max(a.length, b.length);
  let matchedChars = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (a[i] === b[j]) {
        let length = 1;
        while (
          i + length < a.length &&
          j + length < b.length &&
          a[i + length] === b[j + length]
        ) {
          length++;
        }
        if (length > matchedChars) {
          matchedChars = length;
        }
      }
    }
  }
  let lcsScore = matchedChars / maxLength;

  // Levenshtein distance calculation
  let distance = levenshteinDistance(a, b);
  let levScore = 1 - distance / maxLength;

  // Return the average of the three scores
  return (keywordScore + lcsScore + levScore) / 3;
}
