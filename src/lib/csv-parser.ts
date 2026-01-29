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
