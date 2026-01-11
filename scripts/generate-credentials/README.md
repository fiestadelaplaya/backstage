# Credential Generator

This script generates printable credentials with QR codes from a CSV file.

## Development Server

To preview and edit credentials in the browser with hot reload:

```bash
npm run credentials:dev
```

This will:
- Start a Vite dev server on `http://localhost:3001`
- Open your browser automatically
- Show sample credentials for editing
- Enable hot module replacement for instant updates

Edit `dev.tsx` to change the sample data, or modify the component files (`CredentialCard.tsx`, `CredentialsPage.tsx`) and see changes instantly in the browser. The dev server uses `index.html` as the entry point.

## Production Generation

To generate credentials from a CSV file:

```bash
npm run generate-credentials <csv-file> [output-file] [credentials-per-row]
```

### Arguments

- `csv-file`: Path to CSV file with columns: `name`, `idNumber`, `role`
- `output-file`: Output PDF path (default: `credentials.pdf`)
- `credentials-per-row`: Number of credentials per row for printing (default: `2`)

### Example

```bash
npm run generate-credentials participants.csv output.pdf 3
```

## CSV Format

The CSV file must have the following columns:

- `name`: Person's first name
- `lastname`: Person's last name
- `idNumber`: ID number (will be encoded in QR code)
- `role`: Role letter (A, B, C, E, P, X) - corresponds to template file names

### Example CSV

```csv
name,lastname,idNumber,role
John,Doe,12345,A
Jane,Smith,67890,B
Bob,Johnson,11111,C
```

## Templates

Template images should be placed in the `templates/` directory with names:
- `A.png`
- `B.png`
- `C.png`
- `E.png`
- `P.png`
- `X.png`

Each role in the CSV must have a corresponding template file.

## Output

The script generates:
1. An HTML file (for preview) with the same name as the PDF (e.g., `output.html`)
2. A PDF file ready for printing

Each credential card includes:
- Template background image (based on role)
- QR code (containing JSON: `{"id": "<idNumber>"}`)
- Name
- ID number

## Credential Card Layout

Each credential card is 3.5 inches × 2.25 inches (standard badge size), laid out in a grid for printing. The cards are arranged with the specified number per row.
