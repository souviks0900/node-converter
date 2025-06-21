# Node HTML to PDF/PPTX Converter

This project provides a simple Node.js API server that converts HTML content (provided as a base64-encoded string) into either a PDF or a PowerPoint (PPTX) file. The generated files are saved on the server and can be downloaded via a direct link.

## Features

- **Convert HTML to PDF:** Uses Puppeteer to render HTML and export it as a PDF file.
- **Convert HTML to PPTX:** Uses pptxgenjs and Cheerio to extract content from HTML and create slides in a PowerPoint file.
- **REST API:** Simple POST endpoint for conversion.
- **Download Links:** Generated files are accessible via unique download URLs.
- **Handles Large Payloads:** Supports HTML payloads up to 10MB.

## Requirements

- Node.js (v14 or higher recommended)
- npm

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

1. Start the server:
    ```sh
    node index.js
    ```

2. Send a POST request to `http://localhost:3000/convert-html` with the following JSON body:

    ```json
    {
      "base64Html": "<your base64-encoded HTML string>",
      "format": "pdf" // or "pptx"
    }
    ```

    - `base64Html`: The HTML content you want to convert, encoded in base64.
    - `format`: Either `"pdf"` or `"pptx"`.

3. The response will include a `downloadUrl` to retrieve your generated file.

## Example Request (using curl)

```sh
curl -X POST http://localhost:3000/convert-html \
  -H "Content-Type: application/json" \
  -d '{"base64Html": "<your base64 string>", "format": "pdf"}'
```

## Project Structure

- `index.js` - Main server and conversion logic.
- `downloads/` - Directory where generated files are stored.
- `README.md` - Project documentation.

## Notes

- The server creates a `downloads` directory if it does not exist.
- Only basic text extraction is performed for PPTX slides (from `<h1>`, `<h2>`, `<h3>`, `<section>`, and `<div>` tags).
- For production use, consider adding authentication and file cleanup logic.

## License

MIT License