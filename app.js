import dotenv from "dotenv";
import { processTestingSheet, updateRfiSpreadsheet } from "./lib/utils.js";

dotenv.config(); // Load environment variables

const googleSheetId = process.env.GOOGLE_SHEET_ID;

const groupedRfiData = await processTestingSheet(googleSheetId, "Testing");

updateRfiSpreadsheet(googleSheetId, "RFI Spreadsheet", groupedRfiData);
