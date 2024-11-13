import { googleAuth } from "./googleSheetsAuth.js";
import { google } from "googleapis";

export async function readSheet(googleSheetId, googleSheetPage) {
  try {
    // google sheet instance
    const sheetInstance = await google.sheets({
      version: "v4",
      auth: googleAuth,
    });
    // read data from the entire sheet
    const infoObjectFromSheet = await sheetInstance.spreadsheets.values.get({
      auth: googleAuth,
      spreadsheetId: googleSheetId,
      range: `${googleSheetPage}`,
    });

    const valuesFromSheet = infoObjectFromSheet.data.values || [];

    // Helper function to convert a column index to a letter (e.g., 0 -> A, 4 -> E, 26 -> AA)
    const getColumnLetter = (colIndex) => {
      let letter = "";
      while (colIndex >= 0) {
        letter = String.fromCharCode((colIndex % 26) + 65) + letter;
        colIndex = Math.floor(colIndex / 26) - 1;
      }
      return letter;
    };

    // Filter cells to include those that contain the substring "RFI" from rows 3 onwards
    const filteredRows = valuesFromSheet
      .slice(2) // Start from row 3 (index 2)
      .map(
        (row, rowIndex) =>
          row
            .map((cell, colIndex) => {
              if (cell.includes("RFI")) {
                // Determine the cell reference, e.g., E5
                const cellReference = `${getColumnLetter(colIndex)}${
                  rowIndex + 3
                }`;
                return { cell, cellReference };
              }
              return null;
            })
            .filter((cell) => cell !== null) // Keep only cells that contain "RFI"
      )
      .filter((row) => row.length > 0); // Remove empty rows after filtering

    console.log(`Number of non-empty rows found: ${filteredRows.length}`);
    console.log(filteredRows[0]);
    console.log(filteredRows[1]);
    console.log(filteredRows[2]);
  } catch (err) {
    console.log("readSheet func() error", err);
  }
}
