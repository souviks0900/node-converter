// Import required modules for server, file handling, HTML parsing, and conversion
const express = require('express');           // Web framework for creating the API server
const bodyParser = require('body-parser');    // Middleware to parse incoming JSON requests
const fs = require('fs');                     // File system module for reading/writing files
const puppeteer = require('puppeteer');       // Headless browser for rendering HTML to PDF
const PPTXGenJS = require('pptxgenjs');       // Library for generating PowerPoint files
const { v4: uuidv4 } = require('uuid');       // For generating unique file names
const path = require('path');                 // Utility for handling file paths
const cheerio = require('cheerio');           // jQuery-like HTML parser for extracting content

// Initialize the Express application
const app = express();
// Configure body parser to accept large JSON payloads (up to 10MB)
app.use(bodyParser.json({ limit: '10mb' }));

// Set up the directory for storing generated files
const downloadsDir = path.join(__dirname, 'downloads');
// Create the downloads directory if it doesn't exist
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);
// Serve files from the downloads directory at the /downloads route
app.use('/downloads', express.static(downloadsDir));

/**
 * Helper function to extract slide content from HTML.
 * Uses cheerio to parse the HTML and collect text from h1, h2, h3, section, and div elements.
 * Returns an array of strings, each representing content for a slide.
 */
function extractSlideContentsFromHTML(html) {
    const $ = cheerio.load(html);
    const slides = [];

    // Select relevant elements and extract their text content
    $('h1, h2, h3, section, div').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.length > 0) {
            slides.push(text);
        }
    });

    return slides;
}

/**
 * POST /convert-html
 * Endpoint to convert base64-encoded HTML to PDF or PPTX.
 * Expects JSON body: { base64Html: string, format: 'pdf' | 'pptx' }
 * Responds with a download URL for the generated file.
 */
app.post('/convert-html', async (req, res) => {
    const { base64Html, format } = req.body;

    // Validate request body
    if (!base64Html || !format) {
        return res.status(400).json({ error: 'Missing base64Html or format' });
    }

    // Decode the base64-encoded HTML string
    const htmlContent = Buffer.from(base64Html, 'base64').toString('utf-8');

    try {
        if (format === 'pdf') {
            // --- PDF Conversion using Puppeteer ---
            // Launch a headless browser instance
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            // Set the HTML content to the page and wait for resources to load
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            // Generate a unique filename for the PDF
            const fileName = `converted-${uuidv4()}.pdf`;
            const filePath = path.join(downloadsDir, fileName);

            // Export the page as a PDF file
            await page.pdf({ path: filePath, format: 'A4' });
            await browser.close();

            // Respond with the download URL for the generated PDF
            res.json({
                message: 'PDF generated successfully.',
                downloadUrl: `http://localhost:${PORT}/downloads/${fileName}`,
            });
        } else if (format === 'pptx') {
            // --- PPTX Conversion using pptxgenjs ---
            const pptx = new PPTXGenJS();
            // Extract slide contents from the HTML
            const slideContents = extractSlideContentsFromHTML(htmlContent);

            if (slideContents.length === 0) {
                // If no content found, add a default slide
                const slide = pptx.addSlide();
                slide.addText('No content provided', { x: 1, y: 1, fontSize: 24 });
            } else {
                // Add each extracted content as a new slide
                slideContents.forEach((content) => {
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

            // Generate a unique filename for the PPTX
            const fileName = `converted-${uuidv4()}.pptx`;
            const filePath = path.join(downloadsDir, fileName);
            // Save the PPTX file
            await pptx.writeFile({ fileName: filePath });

            // Respond with the download URL for the generated PPTX
            res.json({
                message: 'PPTX generated successfully.',
                downloadUrl: `http://localhost:${PORT}/downloads/${fileName}`,
            });

        } else {
            // If the requested format is not supported, return an error
            return res.status(400).json({ error: 'Unsupported format' });
        }
    } catch (error) {
        // Handle any errors during conversion
        console.error('Error processing HTML content:', error);
        return res.status(500).json({ error: 'Error processing HTML content' });
    }
})

// Define the port for the server
const PORT = 3000;
// Start the server and log the URL
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});