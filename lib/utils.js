import { googleAuth } from "./googleSheetsAuth.js";
import { google } from "googleapis";

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

    // Write filtered data to rfi.json
    fs.writeFileSync(
      "rfi.json",
      JSON.stringify(filteredRows, null, 2),
      "utf-8"
    );

    const groupedData = groupByRFI(filteredRows);

    // Write grouped data to groupedRfi.json
    fs.writeFileSync(
      "groupedRfi.json",
      JSON.stringify(groupedData, null, 2),
      "utf-8"
    );
    console.log("Data successfully saved to rfi.json and groupedRfi.json");

    return groupedData;
  } catch (err) {
    console.log("processTestingSheet func() error", err);
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

export async function updateRfiSpreadsheet(
  googleSheetId,
  googleSheetPage,
  groupedData
) {
  try {
    // Google Sheets instance
    const sheetInstance = await createGoogleSheetsInstance();

    // Filter groupedData into two arrays: one where projects_affected.length >= 4, and one where projects_affected.length < 4
    const groupsWithEnoughProjects = groupedData.filter(
      (group) => group.projects_affected.length >= 4
    );
    const groupsWithFewProjects = groupedData.filter(
      (group) => group.projects_affected.length < 4
    );

    // Function to prepare data for updating Google Sheets
    const prepareDataForUpdate = (data) => {
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
    };

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

async function clearGoogleSheet() {
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

async function createGoogleSheetsInstance() {
  // Google Sheets instance
  const sheetInstance = await google.sheets({
    version: "v4",
    auth: googleAuth,
  });

  return sheetInstance;
}
