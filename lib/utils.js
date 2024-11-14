import { googleAuth } from "./googleSheetsAuth.js";
import { google } from "googleapis";
import { updateRfiDataWithOpenAI } from "./openAI.js";

// Function to group data by RFI
export function groupByRFI(filteredRows) {
  const groupedData = {}; // Initialize an empty object to store grouped data

  filteredRows.forEach((row) => {
    row.forEach(({ rfi, cellReference, iid }) => {
      if (!groupedData[rfi]) {
        groupedData[rfi] = {
          rfi,
          projectsAffected: [], // Initialize an array to store projects affected by this RFI
        };
      }

      // Add the cellReference and iid to the projectsAffected array for this rfi
      groupedData[rfi].projectsAffected.push({ cellReference, iid });
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
    row.push(group.updatedRfi);

    // Ensure 'projectsAffected' is an array of the correct values (e.g., iid)
    const projectsAffected = group.projectsAffected
      .map((project) => project.iid)
      .join(", "); // Extract iid and join into a string
    row.push(projectsAffected);

    return row;
  });
}

// Function to clear data from a Google Sheet
export async function clearGoogleSheet() {
  try {
    // Google Sheets instance
    const sheetInstance = await createGoogleSheetsInstance();

    // Clear data in the specified range
    await sheetInstance.spreadsheets.values.clear({
      auth: googleAuth,
      spreadsheetId: googleSheetId,
      range: googleSheetPage, // Specify the range to clear
    });
  } catch (err) {
    console.log("clearSheet func() error", err);
  }
}

// Function to create a Google Sheets instance
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

// Function to update RFI rows
export async function updateRfiRows(filteredRows) {
  const groupedData = groupByRFI(filteredRows);

  // Extract all RFI attributes into an array
  const allRfiAttributes = groupedData.map((group) => group.rfi);

  // Amend RFI data using OpenAI
  const updatedRfiAttributes = await updateRfiDataWithOpenAI(allRfiAttributes);

  // Parse the updated RFI attributes
  const parsedUpdatedRfiAttributes = JSON.parse(updatedRfiAttributes);

  // Add the updatedRfi attribute to each object in the groupedData array
  groupedData.forEach((group, index) => {
    group.updatedRfi = parsedUpdatedRfiAttributes[index];
  });

  return groupedData;
}
