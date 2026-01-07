// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://mimastery.com', // Custom domain
  'https://www.mimastery.com', // Custom domain with www
  'https://mi-practice-coach.vercel.app', // Legacy Vercel URL
  'https://main2-mi.vercel.app', // Current Vercel deployment
  'http://localhost:5173', // Local dev
  'http://localhost:3000', // Alternative local dev
];

// Get allowed origin for request
function getAllowedOrigin(origin: string | null): string | null {
  if (!origin) {
    return null;
  }
  
  // Check if origin is in allowed list
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  
  // Allow localhost with any port for development
  if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
    return origin;
  }
  
  return null;
}

// Get CORS headers for a specific request
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin || 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Legacy export for backward compatibility (safer default - no wildcard)
// Note: Functions should use getCorsHeaders(req) for proper origin checking
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'null', // Safer default - no wildcard
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Handle CORS preflight requests
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }
  return null;
}

// Create JSON response with CORS headers
export function jsonResponse(data: unknown, status = 200, req?: Request): Response {
  const headers = req ? getCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

// Create error response with CORS headers
export function errorResponse(message: string, status = 400, req?: Request): Response {
  return jsonResponse({ error: message }, status, req);
}

