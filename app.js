import dotenv from "dotenv";
import { readSheet } from "./lib/utils.js";

dotenv.config(); // Load environment variables

const googleSheetId = process.env.GOOGLE_SHEET_ID;
const googleSheetPage = process.env.GOOGLE_SHEET_PAGE;

readSheet(googleSheetId, googleSheetPage);
