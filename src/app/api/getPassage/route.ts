import { NextRequest, NextResponse } from 'next/server';
import { getBiblePassage } from '@/lib/api';

export async function POST(request: NextRequest) {
  const { reference, translation } = await request.json();

  try {
    const passageData = await getBiblePassage(reference, translation || 'niv');
    return NextResponse.json(passageData);
  } catch (error) {
    console.error('Error fetching passage:', error);
    return NextResponse.json({ error: 'Error fetching passage' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}