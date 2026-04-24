import admin from "firebase-admin";
import { readFileSync } from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: "./api-server/.env" });

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

async function checkHubSpotCall(callId: string) {
  try {
    const url = `https://api.hubapi.com/crm/v3/objects/calls/${callId}?properties=hs_call_recording_url,hs_call_body,hs_call_duration,hubspot_owner_id`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`\n--- HubSpot Call ${callId} ---`);
    console.log("Data:", JSON.stringify(response.data.properties, null, 2));
  } catch (error: any) {
    console.error(`Error fetching call ${callId}:`, error.message);
  }
}

const callIds = ['108141188139', '108144735838'];
(async () => {
  for (const id of callIds) {
    await checkHubSpotCall(id);
  }
})();
