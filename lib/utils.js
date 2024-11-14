import { googleAuth } from "./googleSheetsAuth.js";
import { google } from "googleapis";

export function groupByRFI(filteredRows) {
  const groupedData = {};

  filteredRows.forEach((row) => {
    row.forEach(({ rfi, cellReference, iid }) => {
      if (!groupedData[rfi]) {
        groupedData[rfi] = {
          rfi,
          projects_affected: [],
        };
      }

      // Add the cellReference and iid to the projects_affected array for this rfi
      groupedData[rfi].projects_affected.push({ cellReference, iid });
    });
  });

  // Convert the grouped data to an array of objects if needed
  return Object.values(groupedData);
}

// Function to prepare data for updating Google Sheets
export function prepareDataForUpdate(data) {
  return data.map((group) => {
    const row = [];

    // Place 'rfi' value in column A
    row.push(group.rfi);

    // Ensure 'projects_affected' is an array of the correct values (e.g., iid)
    const projectsAffected = group.projects_affected
      .map((project) => project.iid)
      .join(", "); // Extract iid and join into a string
    row.push(projectsAffected);

    return row;
  });
}

export async function clearGoogleSheet() {
  try {
    // Google Sheets instance
    const sheetInstance = await createGoogleSheetsInstance();

    // clear data in the range
    await sheetInstance.spreadsheets.values.clear({
      auth: googleAuth,
      spreadsheetId: googleSheetId,
      // range: `${googleSheetPage}!A2:D6`,
      range: googleSheetPage,
    });
  } catch (err) {
    console.log("clearSheet func() error", err);
  }
}

export async function createGoogleSheetsInstance() {
  // Google Sheets instance
  const sheetInstance = await google.sheets({
    version: "v4",
    auth: googleAuth,
  });

  return sheetInstance;
}

// Helper function to convert a column index to a letter (e.g., 0 -> A, 4 -> E, 26 -> AA)
export function getColumnLetter(colIndex) {
  let letter = "";
  while (colIndex >= 0) {
    letter = String.fromCharCode((colIndex % 26) + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
}
