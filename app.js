import dotenv from "dotenv";
import {
  processTestingSheet,
  updateRfiSpreadsheet,
} from "./lib/sheetProcessing.js";

dotenv.config(); // Load environment variables

const googleSheetId = process.env.GOOGLE_SHEET_ID;

// Read and process the Testing sheet
const groupedRfiData = await processTestingSheet(googleSheetId, "Testing");

// Update the RFI Spreadsheet with the groupedRFI data from the Testing sheet
updateRfiSpreadsheet(googleSheetId, "RFI Spreadsheet", groupedRfiData);
