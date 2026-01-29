# Watchman Opt-Out Upload

A Bun script to upload opt-out records from a CSV file to the Watchman API.

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Create environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your API credentials:
   ```
   WATCHMAN_API_BASE_URL=https://stagingapi.watchmanpaymentsystems.com/wps/rest/cart
   WATCHMAN_API_KEY=your_api_key_here
   WATCHMAN_API_SECRET=your_api_secret_here
   ```

## Usage

```bash
bun run upload <csv-file-path>
```

Example:
```bash
bun run upload opt-outs.csv
```

## CSV Format

The input CSV must have the following columns:

| Column | Description |
|--------|-------------|
| Date Sent | Date the opt-out was sent |
| term | Academic term (e.g., "Spring 2026") |
| crn | Course Reference Number |
| courseandsectioncode | Course and section (e.g., "SW-685-MOL2") |
| studentid | Student identifier |
| firstname | Student first name |
| lastname | Student last name |
| email | Student email |
| ISBN | Book ISBN |
| title | Book title |
| author | Book author |
| publisher | Publisher name |
| startdate | Course start date |
| censusdate | Census date |
| enddate | Course end date |
| coursetitle | Course title |
| coursecode | Course code |
| enrollmentstatus | Enrollment status |
| optout | Opt-out status ("Opted out" or "TRUE") |
| contenttype | Content type ("eBook" or "Courseware") |

## Logging

Logs are written to the `logs/` directory with timestamps. Each run creates a new log file:
```
logs/opt-out-2026-01-29T12-30-45-123Z.log
```

## Processing

- Records are processed one at a time
- On 401 errors, the token is automatically refreshed and the request retried
- Other errors are logged and processing continues to the next record
- A summary is printed at completion showing success/failure counts
