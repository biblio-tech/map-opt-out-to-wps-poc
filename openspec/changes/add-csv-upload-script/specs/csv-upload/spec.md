## ADDED Requirements

### Requirement: CSV Parsing

The script SHALL read opt-out data from a CSV file with the following columns: Date Sent, term, crn, courseandsectioncode, studentid, firstname, lastname, email, ISBN, title, author, publisher, startdate, censusdate, enddate, coursetitle, coursecode, enrollmentstatus, optout, contenttype.

#### Scenario: Parse CSV file successfully
- **WHEN** the script reads `opt-outs.csv`
- **THEN** it SHALL parse all 2,261 records with proper handling of quoted fields containing commas

#### Scenario: Handle missing file
- **WHEN** the CSV file does not exist
- **THEN** the script SHALL exit with an error message indicating the file path

### Requirement: Field Mapping

The script SHALL map CSV columns to the Watchman API `OptInOptOutDTO` schema as follows:

| CSV Column | DTO Field | Transformation |
|------------|-----------|----------------|
| term | termCode | Lookup in `term-code-mapping.json` |
| crn | crn | Direct copy |
| courseandsectioncode | departmentCode | Split by `-`, take index 0 |
| courseandsectioncode | courseCode | Split by `-`, take index 1 |
| courseandsectioncode | sectionCode | Split by `-`, take index 2 |
| studentid | studentId | Direct copy |
| firstname | firsName | Direct copy (API has typo) |
| lastname | lastName | Direct copy |
| email | email | Direct copy |
| ISBN | itemScanCode | Direct copy |
| title | title | Direct copy |
| author | author | Direct copy |
| publisher | publisher | Direct copy |
| optout | optOut | "Opted out" maps to true |
| contenttype | contentType | "eBook" maps to "DIGITAL"; contains "Courseware" (case-insensitive) maps to "COURSEWARE" |
| (hardcoded) | type | Always "IA" |

#### Scenario: Map eBook content type
- **WHEN** CSV contenttype is "eBook"
- **THEN** the DTO contentType SHALL be "DIGITAL"

#### Scenario: Map Courseware content type
- **WHEN** CSV contenttype contains "Courseware" (case-insensitive, e.g., "Courseware - LTI")
- **THEN** the DTO contentType SHALL be "COURSEWARE"

#### Scenario: Parse course section code
- **WHEN** CSV courseandsectioncode is "SW-685-MOL2"
- **THEN** departmentCode SHALL be "SW", courseCode SHALL be "685", sectionCode SHALL be "MOL2"

#### Scenario: Map term code via lookup
- **WHEN** CSV term is "Spring 2026"
- **THEN** the DTO termCode SHALL be looked up from `term-code-mapping.json` and resolve to "2026SP"

#### Scenario: Unknown term code fails
- **WHEN** CSV term value is not found in `term-code-mapping.json`
- **THEN** the script SHALL log an error and skip the record

### Requirement: API Authentication

The script SHALL authenticate with the Watchman API using the token endpoint before making opt-out requests.

#### Scenario: Obtain auth token
- **WHEN** the script starts
- **THEN** it SHALL call `GET /v1/admin/{apiKey}/token?secret={secret}` to obtain a bearer token

#### Scenario: Refresh token on 401
- **WHEN** an API request returns 401 Unauthorized
- **THEN** the script SHALL refresh the token and retry the request once

### Requirement: API Upload

The script SHALL POST each record individually to the `/v1/admin/opt_out/{term}` endpoint.

#### Scenario: POST single record
- **WHEN** processing a CSV row
- **THEN** the script SHALL send a POST request with headers `authorization: Token {token}` and `api-key: {apiKey}`, body containing an array with single `OptInOptOutDTO`

#### Scenario: Continue on failure
- **WHEN** a single record fails to upload
- **THEN** the script SHALL log the error and continue processing remaining records

### Requirement: Logging

The script SHALL log all requests and responses to a timestamped file using LogTape.

#### Scenario: Log file creation
- **WHEN** the script starts
- **THEN** it SHALL create a log file at `./logs/opt-out-{timestamp}.log`

#### Scenario: Log request details
- **WHEN** making an API request
- **THEN** the script SHALL log: timestamp, row number, student ID, request payload, response status code, response body (on error), processing time

#### Scenario: Final summary
- **WHEN** processing completes
- **THEN** the script SHALL output a summary: total records, successful uploads, failed uploads

### Requirement: Term Code Mapping

The script SHALL use a JSON mapping file to translate CSV term codes to API-compatible term codes.

#### Scenario: Load term code mapping
- **WHEN** the script starts
- **THEN** it SHALL load `term-code-mapping.json` from the project root directory

#### Scenario: Mapping file structure
- **WHEN** the mapping file is loaded
- **THEN** it SHALL contain a `mappings` object where keys are CSV term values and values are API term codes

#### Scenario: Missing mapping file
- **WHEN** `term-code-mapping.json` does not exist
- **THEN** the script SHALL exit with an error message indicating the file path

### Requirement: Configuration

The script SHALL read configuration from environment variables with sensible defaults.

#### Scenario: Environment variables
- **WHEN** the script starts
- **THEN** it SHALL read `API_BASE_URL` (default: `https://stagingapi.watchmanpaymentsystems.com`), `API_KEY` (required), `API_SECRET` (required)

#### Scenario: Missing required config
- **WHEN** `API_KEY` or `API_SECRET` is not set
- **THEN** the script SHALL exit with an error message listing missing variables
