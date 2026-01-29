## Why

We need to upload opt-out data from a CSV file to the Watchman API. This is a data migration task that requires a reliable, auditable script with comprehensive logging.

## What Changes

- Add TypeScript script to read CSV and POST to `/v1/admin/opt_out/{term}` endpoint
- Add LogTape-based file logging for request/response audit trail
- Add environment-based configuration for API credentials
- Process records one at a time with full logging

## Impact

- Affected specs: New `csv-upload` capability
- Affected code: New files in `src/` directory
- External dependencies: Watchman Staging API (`stagingapi.watchmanpaymentsystems.com`)
