const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));  // to serve static files
app.set('view engine', 'ejs');  // setting up the view engine

const tools = [
    { name: 'Title tag værktøj', description: 'Hjælper dig med title tags', link: '/title-tag-tool' },
    { name: 'Meta beskrivelser', description: 'Hjælper dig med at lave meta beskrivelser', link: 'http://tool2.com' },
    { name: 'Forslag til blogindlæg', description: 'Hjælper dig med at komme med blogemner', link: 'http://tool3.com' },
    { name: 'Opdeling af søgeord', description: 'Hjælper dig med at opdele søgeord', link: 'http://tool3.com' },
    { name: 'Forslag af indholdsemner til søgeordsgruppe.', description: 'Hjælper dig med at opdele søgeord', link: 'http://tool3.com' },
    { name: 'Definer købsfase eller søgeintention', description: 'Hjælper dig med at opdele søgeord', link: 'http://tool3.com' },
    { name: 'Schema markup', description: 'Hjælper dig med at opdele søgeord', link: 'http://tool3.com' },
    { name: 'Analyser kunde anmeldelser og kom med forslag til nye søgeord', description: 'Hjælper dig med at opdele søgeord', link: 'http://tool3.com' },
    { name: 'Analyser kunde anmeldelser og kom med forslag til nye USPer', description: 'Hjælper dig med at opdele søgeord', link: 'http://tool3.com' },
    { name: 'Check om liste med links er indexeret', description: 'Hjælper dig med at opdele søgeord', link: 'http://tool3.com' },
    { name: 'URL redirect mapping', description: 'Hjælper dig med at opdele søgeord', link: 'http://tool3.com' },
    { name: 'Onpage konkurrentanalyse', description: 'Hjælper dig med at opdele søgeord', link: 'http://tool3.com' },
    { name: 'Tekst Konkurrentanalyse', description: 'Hjælper dig med at opdele søgeord', link: 'http://tool3.com' },
];

app.get('/', (req, res) => {
    res.render('index', { tools: tools });
});

const langs = require('langs');

app.get('/title-tag-tool', (req, res) => {
    res.render('title-tag-tool', { title: 'Title tag værktøj', languages: langs.all() });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
