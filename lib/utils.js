import { googleAuth } from "./googleSheetsAuth.js";
import { google } from "googleapis";

import fs from "fs";

export async function readSheet(googleSheetId, googleSheetPage) {
  try {
    // Google Sheets instance
    const sheetInstance = await google.sheets({
      version: "v4",
      auth: googleAuth,
    });

    // Read data from the entire sheet
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
      .map((row, rowIndex) => {
        const iid = row[2] || null; // Get iid from column C (index 2)
        return row
          .map((cell, colIndex) => {
            if (cell.includes("RFI")) {
              // Determine the cell reference, e.g., E5
              const cellReference = `${getColumnLetter(colIndex)}${
                rowIndex + 3
              }`;
              return { rfi: cell, cellReference, iid };
            }
            return null;
          })
          .filter((cell) => cell !== null); // Keep only cells that contain "RFI"
      })
      .filter((row) => row.length > 0); // Remove empty rows after filtering

    console.log(`Number of non-empty rows found: ${filteredRows.length}`);
    console.log(filteredRows);

    // Write filtered data to rif.json
    fs.writeFileSync(
      "rfi.json",
      JSON.stringify(filteredRows, null, 2),
      "utf-8"
    );

    const groupedData = groupByRFI(filteredRows);

    // Write filtered data to rif.json
    fs.writeFileSync(
      "groupedRfi.json",
      JSON.stringify(groupedData, null, 2),
      "utf-8"
    );
    console.log("Data successfully saved to rfi.json");
  } catch (err) {
    console.log("readSheet func() error", err);
  }
}

function groupByRFI(filteredRows) {
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
