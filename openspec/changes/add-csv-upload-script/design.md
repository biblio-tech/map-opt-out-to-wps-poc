## Context

This is a data migration script to upload opt-out records from a CSV file (provided as a command line arguement to the script) to the Watchman API. The script needs comprehensive logging for audit purposes and must handle API failures gracefully.

**Constraints:**
- Must use Bun as runtime and package manager
- Must use LogTape for file-based logging
- Must process records one at a time (per user requirement)
- Must work with Watchman staging API

## Goals / Non-Goals

**Goals:**
- Reliable upload of all opt-out records
- Complete audit trail in log files
- Clear error reporting and summary
- Simple, maintainable code

**Non-Goals:**
- Retry logic for transient failures (beyond token refresh)
- Resume capability from partial runs
- Parallel processing
- CLI argument parsing (beyond what Bun provides natively)

## Decisions

### Decision: Process records sequentially, one at a time
**Rationale:** User explicitly requested one-at-a-time processing with full logging. This provides maximum visibility and control, even though it's slower than batching.

### Decision: Use Bun's native file reading
**Rationale:** Bun has excellent built-in file reading performance. No need for external CSV parsing library since we can split on commas with proper quote handling.

### Decision: Use LogTape with file sink
**Rationale:** User specified LogTape. It provides structured logging with file output, which is ideal for the audit trail requirement.

### Decision: Token refresh on 401 only
**Rationale:** Keep error handling simple. On 401, refresh token and retry once. On other errors, log and continue to next record.

## File Structure

```
watchman-opt-out/
├── src/
│   ├── index.ts       # Main entry point
│   ├── types.ts       # TypeScript interfaces
│   ├── config.ts      # Environment config
│   ├── logger.ts      # LogTape setup
│   ├── csv-parser.ts  # CSV parsing
│   ├── mapper.ts      # CSV to DTO mapping
│   ├── auth.ts        # Token management
│   └── api.ts         # API client
├── logs/              # Output directory (gitignored)
├── .env               # Local config (gitignored)
├── .env.example       # Template
├── package.json
├── tsconfig.json
└── opt-outs.csv       # Input data
```

## Data Flow

```
opt-outs.csv
    │
    ▼
parseCSV() → CSVRow[]
    │
    ▼
mapCSVToDTO() → OptInOptOutDTO
    │
    ▼
postOptOut() → Watchman API
    │
    ▼
LogTape → logs/opt-out-{timestamp}.log
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| API rate limiting | Process one at a time; no batch parallelism |
| Large CSV causing memory issues | Stream-like processing (one row at a time) |
| Token expiry mid-run | Refresh on 401 and retry |
| Network failures | Log error, continue to next record |

## Open Questions

None - all requirements clarified with user during planning phase.
