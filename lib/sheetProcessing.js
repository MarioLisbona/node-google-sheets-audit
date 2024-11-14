import { googleAuth } from "./googleSheetsAuth.js";
import {
  createGoogleSheetsInstance,
  getColumnLetter,
  groupByRFI,
  prepareDataForUpdate,
} from "../lib/utils.js";

import fs from "fs";

export async function processTestingSheet(googleSheetId, googleSheetPage) {
  try {
    const sheetInstance = await createGoogleSheetsInstance();

    // Read data from the entire sheet
    const infoObjectFromSheet = await sheetInstance.spreadsheets.values.get({
      auth: googleAuth,
      spreadsheetId: googleSheetId,
      range: `${googleSheetPage}`,
    });

    const valuesFromSheet = infoObjectFromSheet.data.values || [];

    // Filter cells to include those that contain the substring "RFI" from rows 3 onwards
    const filteredRows = valuesFromSheet
      .slice(2) // Start from row 3 (index 2)
      .map((row, rowIndex) => {
        const iid = row[2] || null; // Get iid from column C (index 2)

        return row
          .map((cell, colIndex) => {
            // Skip column AJ (index 35) for the "RFI" check
            if (colIndex === 35) return null;

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

    const groupedData = groupByRFI(filteredRows);

    // Write grouped data to groupedRfi.json
    fs.writeFileSync(
      "groupedRfi.json",
      JSON.stringify(groupedData, null, 2),
      "utf-8"
    );
    console.log("Data successfully saved to groupedRfi.json");

    return groupedData;
  } catch (err) {
    console.log("processTestingSheet func() error", err);
  }
}

export async function updateRfiSpreadsheet(
  googleSheetId,
  googleSheetPage,
  groupedData
) {
  try {
    // Google Sheets instance
    const sheetInstance = await createGoogleSheetsInstance();

    // Filter groupedData into two arrays: one where projectsAffected.length >= 4, and one where projectsAffected.length < 4
    const groupsWithEnoughProjects = groupedData.filter(
      (group) => group.projectsAffected.length >= 4
    );
    const groupsWithFewProjects = groupedData.filter(
      (group) => group.projectsAffected.length < 4
    );

    // Prepare data for both sets of groups
    const updateToGsheetWithEnoughProjects = prepareDataForUpdate(
      groupsWithEnoughProjects
    );
    const updateToGsheetWithFewProjects = prepareDataForUpdate(
      groupsWithFewProjects
    );

    // Define starting row for both cases
    const startRowWithEnoughProjects = 7; // Start from row 7 for groups with enough projects
    const startRowWithFewProjects = 18; // Start from row 18 for groups with fewer projects

    // Update data for groups with enough projects (>= 4)
    const rangeForEnoughProjects = `${googleSheetPage}!A${startRowWithEnoughProjects}:B${
      startRowWithEnoughProjects + updateToGsheetWithEnoughProjects.length - 1
    }`;

    await sheetInstance.spreadsheets.values.update({
      auth: googleAuth,
      spreadsheetId: googleSheetId,
      range: rangeForEnoughProjects,
      valueInputOption: "RAW",
      requestBody: {
        values: updateToGsheetWithEnoughProjects,
      },
    });

    // Update data for groups with fewer projects (< 4)
    const rangeForFewProjects = `${googleSheetPage}!A${startRowWithFewProjects}:B${
      startRowWithFewProjects + updateToGsheetWithFewProjects.length - 1
    }`;

    await sheetInstance.spreadsheets.values.update({
      auth: googleAuth,
      spreadsheetId: googleSheetId,
      range: rangeForFewProjects,
      valueInputOption: "RAW",
      requestBody: {
        values: updateToGsheetWithFewProjects,
      },
    });

    console.log("Data successfully updated in Google Sheets");
  } catch (err) {
    console.log("updateRfiSpreadsheet func() error", err);
  }
}
