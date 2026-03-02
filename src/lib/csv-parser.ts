import type { CSVRow } from "../types";

const CSV_HEADERS = [
  "dateSent",
  "term",
  "crn",
  "courseandsectioncode",
  "studentid",
  "firstname",
  "lastname",
  "email",
  "ISBN",
  "title",
  "author",
  "publisher",
  "startdate",
  "censusdate",
  "enddate",
  "coursetitle",
  "coursecode",
  "enrollmentstatus",
  "optout",
  "contenttype",
] as const;

export function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

export async function parseCSV(filePath: string): Promise<CSVRow[]> {
  const file = Bun.file(filePath);
  const content = await file.text();
  const lines = content.split("\n").filter((line) => line.trim() !== "");

  // Skip header row
  const dataLines = lines.slice(1);

  const rows: CSVRow[] = [];

  for (const line of dataLines) {
    const fields = parseCSVLine(line);

    if (fields.length !== CSV_HEADERS.length) {
      console.warn(
        `Skipping malformed row (expected ${CSV_HEADERS.length} fields, got ${fields.length})`
      );
      continue;
    }

    const row: CSVRow = {
      dateSent: fields[0],
      term: fields[1],
      crn: fields[2],
      courseandsectioncode: fields[3],
      studentid: fields[4],
      firstname: fields[5],
      lastname: fields[6],
      email: fields[7],
      ISBN: fields[8],
      title: fields[9],
      author: fields[10],
      publisher: fields[11],
      startdate: fields[12],
      censusdate: fields[13],
      enddate: fields[14],
      coursetitle: fields[15],
      coursecode: fields[16],
      enrollmentstatus: fields[17],
      optout: fields[18],
      contenttype: fields[19],
    };

    rows.push(row);
  }

  return rows;
}

/**
 * Join raw lines that are split inside quoted fields back into logical CSV rows.
 * A line that has an odd number of unescaped quotes is "open", so the next raw
 * line(s) belong to the same logical row.
 */
function joinMultilineFields(rawLines: string[]): string[] {
  const logical: string[] = [];
  let buffer = "";

  for (const raw of rawLines) {
    if (buffer) {
      buffer += "\n" + raw;
    } else {
      buffer = raw;
    }

    // Count unescaped quotes – an odd total means the field is still open
    const quoteCount = (buffer.match(/"/g) || []).length;
    if (quoteCount % 2 === 0) {
      logical.push(buffer);
      buffer = "";
    }
  }

  // Flush any remaining buffer (malformed trailing row)
  if (buffer) {
    logical.push(buffer);
  }

  return logical;
}

export async function parseCSVRecords(
  filePath: string
): Promise<Record<string, string>[]> {
  const file = Bun.file(filePath);
  const content = await file.text();
  const rawLines = content.split("\n").filter((line) => line.trim() !== "");

  if (rawLines.length === 0) {
    return [];
  }

  const lines = joinMultilineFields(rawLines);

  const headers = parseCSVLine(lines[0]);
  const dataLines = lines.slice(1);
  const records: Record<string, string>[] = [];

  for (const line of dataLines) {
    const fields = parseCSVLine(line);

    if (fields.length !== headers.length) {
      console.warn(
        `Skipping malformed row (expected ${headers.length} fields, got ${fields.length})`
      );
      continue;
    }

    const record: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i]] = fields[i];
    }

    records.push(record);
  }

  return records;
}
