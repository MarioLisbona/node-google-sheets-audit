import dotenv from "dotenv";
import { processGoogleSheet, updateGoogleSheet } from "./lib/utils.js";

dotenv.config(); // Load environment variables

const googleSheetId = process.env.GOOGLE_SHEET_ID;

const groupedRfiData = await processGoogleSheet(googleSheetId, "Testing");
updateGoogleSheet(googleSheetId, "RFI Spreadsheet", groupedRfiData);
