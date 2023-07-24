// controllers/gptController.js
const fetch = require('node-fetch');

exports.generate = async (req, res) => {
  const prompt = req.body.prompt;
  const lang = req.body.lang;

  let titlePrompt = "As a title tag expert with comprehensive SEO knowledge, your task is to create three title tags using 2 or 3 swedish keywords provided, separated by commas. Follow this format: [Primary keyword] - [remaining title tag]. Ensure the title tags do not exceed 65 characters in length and are descriptive. Each title tag must include a call to action. The primary keyword holds the highest priority. The title tags should be in the following language {lang} provided with an english translation.";
  titlePrompt = titlePrompt.replace("{lang}", lang);
  
  const API_URL = process.env.API_URL;
  const API_KEY = process.env.API_KEY;

  try {
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
    });

    // Rest of your code here ...

  } catch (error) {
    res.status(500).send({ error: 'Error occurred while generating.' });
  }
};
