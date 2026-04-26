import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const revalidate = 0;

function parseCSV(text) {
  const lines = text.split('\n');
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') { inQuotes = !inQuotes; }
      else if (line[c] === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
      else { current += line[c]; }
    }
    fields.push(current.trim());
    const cat = fields[0]?.trim();
    const nombre = fields[1]?.trim();
    if (cat && nombre && cat !== 'Categoría') {
      results.push({
        categoria: cat,
        nombre: nombre,
        ingredientes: fields[2]?.trim() || '',
        preparacion: fields[3]?.trim() || '',
        metodo: fields[4]?.trim() || '',
        tiempo: fields[5]?.trim() || '',
        dificultad: fields[6]?.trim() || '',
        tip: fields[7]?.trim() || '',
      });
    }
  }
  return results;
}

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'recetas.csv');
    const text = fs.readFileSync(csvPath, 'utf-8');
    const recipes = parseCSV(text);
    console.log('Total recetas:', recipes.length);
    return NextResponse.json({ recipes });
  } catch (error) {
    console.error('Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}