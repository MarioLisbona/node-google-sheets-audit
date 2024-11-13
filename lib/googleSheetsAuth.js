import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const clientEmail = process.env.CLIENT_EMAIL; // Use environment variable
const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, "\n"); // Use environment variable

// authenticate the service account
export const googleAuth = new google.auth.JWT(
  clientEmail,
  null,
  privateKey,
  "https://www.googleapis.com/auth/spreadsheets"
);
