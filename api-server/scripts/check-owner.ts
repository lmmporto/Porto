import admin from "firebase-admin";
import { readFileSync } from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: "./api-server/.env" });

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

async function checkHubSpotOwner(ownerId: string) {
  try {
    const url = `https://api.hubapi.com/crm/v3/owners/${ownerId}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`\n--- HubSpot Owner ${ownerId} ---`);
    console.log("Data:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error(`Error fetching owner ${ownerId}:`, error.message);
  }
}

const ownerId = '87174611';
checkHubSpotOwner(ownerId);
