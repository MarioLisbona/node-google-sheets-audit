import dotenv from "dotenv";
import {
  processTestingSheet,
  updateRfiSpreadsheet,
} from "./lib/sheetProcessing.js";

dotenv.config(); // Load environment variables

const googleSheetId = process.env.GOOGLE_SHEET_ID; // Retrieve Google Sheet ID from environment variables

// Read and process the Testing sheet to get all rows that contain an RFI
const groupedRfiData = await processTestingSheet(googleSheetId, "Testing");

// Update the RFI Spreadsheet with the updated RFI and the jobs affected attributes from groupedRFI data
updateRfiSpreadsheet(googleSheetId, "RFI Spreadsheet", groupedRfiData);
