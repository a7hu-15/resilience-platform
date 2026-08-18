import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch all available dashboards from local Grafana instance
    // Note: Anonymous access must be enabled in Grafana config for this to work without auth
    const res = await fetch('http://localhost:3000/api/search?type=dash-db', {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error(`Grafana API responded with ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch Grafana dashboards:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
