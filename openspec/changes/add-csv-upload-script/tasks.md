## 1. Project Setup

- [x] 1.1 Initialize Bun project with `bun init`
- [x] 1.2 Add dependencies: `logtape`, `@logtape/file`
- [x] 1.3 Create `.env.example` with required variables
- [x] 1.4 Add `.env` to `.gitignore`

## 2. Core Types

- [x] 2.1 Create `src/types.ts` with `OptInOptOutDTO`, `CSVRow`, `ApiResponse` interfaces

## 3. Configuration

- [x] 3.1 Create `src/config.ts` to load and validate environment variables

## 4. Logging

- [x] 4.1 Create `src/logger.ts` with LogTape file sink configuration
- [x] 4.2 Ensure logs directory is created on startup

## 5. CSV Parsing

- [x] 5.1 Create `src/csv-parser.ts` to parse CSV with quoted field handling
- [x] 5.2 Handle author field containing commas

## 6. Field Mapping

- [x] 6.1 Create `src/mapper.ts` with `mapCSVToDTO` function
- [x] 6.2 Implement courseandsectioncode splitting
- [x] 6.3 Implement contentType mapping (eBook -> DIGITAL, Courseware -> COURSEWARE)
- [x] 6.4 Handle optOut boolean conversion
- [x] 6.5 Create `src/lib/term-mapping.ts` to load and validate `term-code-mapping.json`
- [x] 6.6 Integrate term code lookup into `mapCSVToDTO` function
- [x] 6.7 Add error handling for unmapped term codes
- [x] 6.8 Add unit tests for src/lib/term-mapping.ts

## 7. API Client

- [x] 7.1 Create `src/auth.ts` with `getToken` function
- [x] 7.2 Create `src/api.ts` with `postOptOut` function
- [x] 7.3 Implement 401 token refresh logic

## 8. Main Script

- [x] 8.1 Create `src/index.ts` with main orchestration logic
- [x] 8.2 Implement sequential processing loop
- [x] 8.3 Add summary output at completion

## 9. Validation

- [ ] 9.1 Test with small subset of data (first 5 records)
- [ ] 9.2 Verify log file output format
- [ ] 9.3 Run full upload and review logs
