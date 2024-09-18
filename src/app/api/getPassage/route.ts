import { NextRequest, NextResponse } from 'next/server';
import { getBiblePassage } from '@/lib/api';

export async function POST(request: NextRequest) {
  const { reference } = await request.json();

  try {
    const passageData = await getBiblePassage(reference);
    return NextResponse.json(passageData);
  } catch (error) {
    console.error('Error fetching passage:', error);
    return NextResponse.json({ error: 'Error fetching passage' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ error: 'Reference query parameter is required' }, { status: 400 });
  }

  try {
    const passageData = await getBiblePassage(reference);
    return NextResponse.json(passageData);
  } catch (error) {
    console.error('Error fetching passage:', error);
    return NextResponse.json({ error: 'Error fetching passage' }, { status: 500 });
  }
}