## 1. Project Setup

- [ ] 1.1 Initialize Bun project with `bun init`
- [ ] 1.2 Add dependencies: `logtape`, `@logtape/file`
- [ ] 1.3 Create `.env.example` with required variables
- [ ] 1.4 Add `.env` to `.gitignore`

## 2. Core Types

- [ ] 2.1 Create `src/types.ts` with `OptInOptOutDTO`, `CSVRow`, `ApiResponse` interfaces

## 3. Configuration

- [ ] 3.1 Create `src/config.ts` to load and validate environment variables

## 4. Logging

- [ ] 4.1 Create `src/logger.ts` with LogTape file sink configuration
- [ ] 4.2 Ensure logs directory is created on startup

## 5. CSV Parsing

- [ ] 5.1 Create `src/csv-parser.ts` to parse CSV with quoted field handling
- [ ] 5.2 Handle author field containing commas

## 6. Field Mapping

- [ ] 6.1 Create `src/mapper.ts` with `mapCSVToDTO` function
- [ ] 6.2 Implement courseandsectioncode splitting
- [ ] 6.3 Implement contentType mapping (eBook -> DIGITAL, Courseware -> COURSEWARE)
- [ ] 6.4 Handle optOut boolean conversion

## 7. API Client

- [ ] 7.1 Create `src/auth.ts` with `getToken` function
- [ ] 7.2 Create `src/api.ts` with `postOptOut` function
- [ ] 7.3 Implement 401 token refresh logic

## 8. Main Script

- [ ] 8.1 Create `src/index.ts` with main orchestration logic
- [ ] 8.2 Implement sequential processing loop
- [ ] 8.3 Add summary output at completion

## 9. Validation

- [ ] 9.1 Test with small subset of data (first 5 records)
- [ ] 9.2 Verify log file output format
- [ ] 9.3 Run full upload and review logs
