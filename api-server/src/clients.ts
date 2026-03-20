import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { CONFIG } from './config.js';

export const hubspot = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${CONFIG.HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const gemini = CONFIG.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY })
  : null;
