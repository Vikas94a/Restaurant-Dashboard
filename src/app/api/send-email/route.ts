import { NextResponse } from 'next/server';
import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

export async function POST(request: Request) {
  try {
    // Basic same-origin protection
    const allowedOrigins = new Set([
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://localhost:3000',
    ]);
    const originHeader = request.headers.get('origin');
    const refererHeader = request.headers.get('referer');
    let originFromReferer: string | null = null;
    try {
      originFromReferer = refererHeader ? new URL(refererHeader).origin : null;
    } catch {}
    const effectiveOrigin = originHeader || originFromReferer;
    if (effectiveOrigin && !allowedOrigins.has(effectiveOrigin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Simple rate limiting per IP (best-effort in-memory)
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    type RateEntry = { count: number; ts: number };
    const g = globalThis as unknown as { __emailRateLimit?: Map<string, RateEntry> };
    if (!g.__emailRateLimit) {
      g.__emailRateLimit = new Map<string, RateEntry>();
    }
    const rateMap = g.__emailRateLimit as Map<string, RateEntry>;
    const now = Date.now();
    const windowMs = 60_000; // 1 minute
    const limit = 10; // 10 requests per minute per IP
    const entry = rateMap.get(ip);
    if (!entry || now - entry.ts > windowMs) {
      rateMap.set(ip, { count: 1, ts: now });
    } else {
      if (entry.count >= limit) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
      entry.count += 1;
    }

    // Parse JSON body safely
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    const { to, subject, html } = body || {};

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Sanitize HTML (basic best-effort)
    let safeHtml = String(html);
    // remove script tags
    safeHtml = safeHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    // remove on* event handlers
    safeHtml = safeHtml.replace(/ on[a-zA-Z]+\s*=\s*"[^"]*"/g, '');
    safeHtml = safeHtml.replace(/ on[a-zA-Z]+\s*=\s*'[^']*'/g, '');
    safeHtml = safeHtml.replace(/ on[a-zA-Z]+\s*=\s*[^\s>]+/g, '');

    // Initialize Resend client
    let resend: Resend;
    try {
      resend = getResendClient();
    } catch (e) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Log the email attempt
    const { data, error } = await resend.emails.send({
      from: 'AI Eat Easy <noreply@aieateasy.no>',
      to,
      subject,
      html: safeHtml,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Log success
    return NextResponse.json({ success: true, data });
  } catch (error) {
    // Log any unexpected errors
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 