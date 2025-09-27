import { NextResponse } from "next/server";
export function HEAD()    { return new NextResponse(null, { status: 200 }); }
export function OPTIONS() { return new NextResponse(null, { status: 204 }); }