import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'A:D',
    });

    const rows = response.data.values || [];
    const recipes = rows.slice(1)
      .filter(row => row[0] && row[1])
      .map(row => ({
  categoria: row[0]?.trim() || '',
  nombre: row[1]?.trim() || '',
  ingredientes: row[2]?.trim() || '',
  preparacion: row[3]?.trim() || '',
  metodo: row[4]?.trim() || '',
}));

    return NextResponse.json({ recipes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}