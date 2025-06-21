const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer-core');
const chromeLauncher = require('chrome-launcher');
const PPTXGenJS = require('pptxgenjs');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001; // default port for the server
// Ensure the downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');

app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('index'));


if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);
app.use('/downloads', express.static(downloadsDir));
app.use(bodyParser.json({ limit: '10mb' }));

async function getChromePath() {
    const installations = chromeLauncher.Launcher.getInstallations();
    if (!installations.length) {
        throw new Error('Chrome not found. Please install Google Chrome.');
    }
    return installations[0];
}

async function launchBrowser() {
    const executablePath = await getChromePath();
    return await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
}

function extractSlideContentsFromHTML(html) {
    const $ = cheerio.load(html);
    const slides = [];

    $('h1, h2, h3, section, div').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.length > 0) {
            slides.push(text);
        }
    });

    return slides;
}

app.post('/convert-html', async (req, res) => {
    const { base64Html, format } = req.body;

    if (!base64Html || !format) {
        return res.status(400).json({ error: 'base64Html and format are required.' });
    }

    // Decode base64 and check if it looks like HTML
    let htmlContent;
    try {
        htmlContent = Buffer.from(base64Html, 'base64').toString('utf-8');
    } catch (e) {
        return res.status(400).json({ error: 'Invalid base64 encoding.' });
    }

    // Check for HTML doctype or <html> tag
    if (!/^(\s*<!doctype html>|.*<html[\s>])/i.test(htmlContent)) {
        return res.status(400).json({ error: 'Only HTML files are accepted.' });
    }

    try {
        if (format === 'pdf') {
            const browser = await launchBrowser();
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            const fileName = `converted-${uuidv4()}.pdf`;
            const filePath = path.join(downloadsDir, fileName);

            await page.pdf({ path: filePath, format: 'A4' });
            await browser.close();

            res.json({
                message: 'PDF generated successfully.',
                downloadUrl: `http://localhost:${PORT}/downloads/${fileName}`,
            });

        } else if (format === 'pptx') {
            const pptx = new PPTXGenJS();
            const slideContents = extractSlideContentsFromHTML(htmlContent);

            if (slideContents.length === 0) {
                const slide = pptx.addSlide();
                slide.addText('No content provided', { x: 1, y: 1, fontSize: 24 });
            } else {
                slideContents.forEach(content => {
                    const slide = pptx.addSlide();
                    slide.addText(content, {
                        x: 0.5,
                        y: 0.5,
                        w: '90%',
                        h: '90%',
                        fontSize: 20,
                        color: '000000',
                        align: 'left',
                    });
                });
            }

            const fileName = `converted-${uuidv4()}.pptx`;
            const filePath = path.join(downloadsDir, fileName);

            // Save to downloads directory manually
            const buffer = await pptx.write('nodebuffer');
            fs.writeFileSync(filePath, buffer);

            res.json({
                message: 'PPTX generated successfully.',
                downloadUrl: `http://localhost:${PORT}/downloads/${fileName}`,
            });
        } else {
            // If the requested format is not supported, return an error
            return res.status(400).json({ error: 'Unsupported format' });
        }

    } catch (err) {
        // Handle any errors during conversion
        console.error('Error processing HTML content:', err);
        return res.status(500).json({ error: 'Error processing HTML content' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
