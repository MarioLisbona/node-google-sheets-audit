import dotenv from "dotenv";
import { processGoogleSheet, updateSheet } from "./lib/utils.js";

dotenv.config(); // Load environment variables

const googleSheetId = process.env.GOOGLE_SHEET_ID;
const googleSheetPage = process.env.GOOGLE_SHEET_PAGE;

processGoogleSheet(googleSheetId, googleSheetPage);
