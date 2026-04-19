import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { messages, system } = await request.json();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system,
      messages,
    });
    const text = response.content?.[0]?.text || '';
    return NextResponse.json({ content: [{ text }] });
  } catch (error) {
    console.error('AI error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}