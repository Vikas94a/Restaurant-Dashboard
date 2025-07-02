import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Check if API key exists
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not defined in environment variables');
  console.error('❌ Please set RESEND_API_KEY in your environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // Log the incoming request
    console.log('📧 Received email request');

    const body = await request.json();
    const { to, subject, html } = body;

    console.log('📧 Email request details:', { 
      to, 
      subject, 
      hasHtml: !!html,
      htmlLength: html?.length || 0 
    });

    // Validate required fields
    if (!to || !subject || !html) {
      console.error('❌ Missing required fields:', { 
        hasTo: !!to, 
        hasSubject: !!subject, 
        hasHtml: !!html 
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('❌ Invalid email format:', to);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if Resend is properly configured
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Log the email attempt
    console.log('📧 Attempting to send email to:', to);

    const { data, error } = await resend.emails.send({
      from: 'AI Eat Easy <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    // Log success
    console.log('✅ Email sent successfully:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    // Log any unexpected errors
    console.error('❌ Unexpected error in send-email route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 