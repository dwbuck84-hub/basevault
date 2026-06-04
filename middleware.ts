import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    
    // The absolute override payload
    const csp = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'unsafe-inline' wss:; img-src * data: blob:; frame-src *; style-src * 'unsafe-inline';";
    
    // Forcefully inject the header onto the response
    response.headers.set('Content-Security-Policy', csp);
    
    return response;
}

// Ensure this runs on every single page of your app
export const config = {
    matcher: '/:path*',
};
