import dotenv from 'dotenv';
dotenv.config();

const splitCsv = (val: string | undefined, fallback = ''): string[] =>
  String(val || fallback)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  HUBSPOT_TOKEN: process.env.HUBSPOT_TOKEN,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,

  FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,

  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  ALLOWED_EMAIL_DOMAIN: process.env.ALLOWED_EMAIL_DOMAIN || 'nibo.com',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  GEMINI_ANALYSIS_MODEL: process.env.GEMINI_ANALYSIS_MODEL || 'gemini-1.5-flash',
  GEMINI_TRANSCRIPTION_MODEL: process.env.GEMINI_TRANSCRIPTION_MODEL || 'gemini-1.5-flash',

  CALLS_COLLECTION: process.env.CALLS_COLLECTION || 'calls_analysis',
  MIN_DURATION_MS: Number(process.env.MIN_DURATION_MS || 120000),
  MIN_TEXT_LENGTH_FOR_ANALYSIS: Number(process.env.MIN_TEXT_LENGTH_FOR_ANALYSIS || 180),

  REFETCH_ATTEMPTS: Number(process.env.REFETCH_ATTEMPTS || 2),
  REFETCH_WAIT_MS: Number(process.env.REFETCH_WAIT_MS || 15000),

  TEST_CALLS_DEFAULT_LIMIT: Number(process.env.TEST_CALLS_DEFAULT_LIMIT || 10),
  TEST_CALLS_MAX_LIMIT: Number(process.env.TEST_CALLS_MAX_LIMIT || 50),

  PROPS: {
    TITLE: splitCsv(process.env.CALL_TITLE_PROPERTIES, 'hs_call_title,subject'),
    OWNER: splitCsv(process.env.CALL_OWNER_PROPERTIES, 'hubspot_owner_id,hs_call_owner_id'),
    DURATION: splitCsv(process.env.CALL_DURATION_PROPERTIES, 'hs_call_duration,duration,duracao_ms'),
    STATUS: splitCsv(process.env.CALL_STATUS_PROPERTIES, 'hs_call_status,status'),
    TIMESTAMP: splitCsv(process.env.CALL_TIMESTAMP_PROPERTIES, 'hs_timestamp,createdate'),
    RECORDING: splitCsv(
      process.env.CALL_RECORDING_URL_PROPERTIES,
      'hs_call_recording_url,url_gravacao_chamada,recording_url'
    ),
  },
};