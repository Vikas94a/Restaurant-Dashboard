import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Check if API key exists
if (!process.env.RESEND_API_KEY) {
  }

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // Log the incoming request
    const body = await request.json();
    const { to, subject, html } = body;

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

    // Check if Resend is properly configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Log the email attempt
    const { data, error } = await resend.emails.send({
      from: 'AI Eat Easy <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    // Log success
    return NextResponse.json({ success: true, data });
  } catch (error) {
    // Log any unexpected errors
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 