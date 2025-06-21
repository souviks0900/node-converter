# Node HTML to PDF/PPTX Converter

A Node.js web application and API that converts uploaded HTML files to either PDF or PowerPoint (PPTX) format. The app provides a simple web UI (built with EJS) for uploading HTML files and downloading the converted result, as well as a REST API for programmatic access.

## Features

- **Convert HTML to PDF:** Uses Puppeteer (with Chrome detection) to render HTML and export as PDF.
- **Convert HTML to PPTX:** Uses pptxgenjs and Cheerio to extract content from HTML and create slides.
- **Web UI:** Upload an HTML file, select output format, and download the result.
- **REST API:** POST endpoint for conversion.
- **Download Links:** Each converted file is available via a unique download URL.
- **Strict HTML Validation:** Only valid HTML files are accepted (checked by decoding base64 and verifying HTML structure).
- **Handles Large Payloads:** Supports HTML payloads up to 10MB.

## Requirements

- Node.js (v14 or higher recommended)
- npm
- Google Chrome (required for Puppeteer PDF conversion)

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/your-username/node-html-pdf-pptx-converter.git
    cd node-html-pdf-pptx-converter
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

## Usage

### Start the server

```sh
node app.js
```

The server will run on [http://localhost:3001](http://localhost:3001).

### Web UI

1. Open [http://localhost:3001](http://localhost:3001) in your browser.
2. Upload an HTML file (`.html` or `.htm`), select the output format (PDF or PPTX), and click **Convert**.
3. After conversion, a download link for the result will appear.

### API Usage

Send a POST request to `http://localhost:3001/convert-html` with the following JSON body:

```json
{
  "base64Html": "<your base64-encoded HTML string>",
  "format": "pdf" // or "pptx"
}
```

- `base64Html`: The HTML file content, encoded in base64.
- `format`: `"pdf"` or `"pptx"`.

**Response:**
```json
{
  "message": "PDF generated successfully.",
  "downloadUrl": "http://localhost:3001/downloads/converted-xxxx.pdf"
}
```

### Example Request (using curl)

```sh
curl -X POST http://localhost:3001/convert-html \
  -H "Content-Type: application/json" \
  -d '{"base64Html": "<your base64 string>", "format": "pdf"}'
```

## Project Structure

- `app.js` - Main server and conversion logic.
- `views/index.ejs` - Web UI for uploading and converting files.
- `downloads/` - Directory where generated files are stored.
- `README.md` - Project documentation.

## Notes

- Only valid HTML files are accepted. The server checks the decoded base64 content for a valid HTML structure.
- The server creates a `downloads` directory if it does not exist.
- For PPTX, only basic text extraction is performed (from `<h1>`, `<h2>`, `<h3>`, `<section>`, and `<div>` tags).
- For production use, consider adding authentication and file cleanup logic.
- Google Chrome must be installed on the server for PDF conversion.

## License

MIT License