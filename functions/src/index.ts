// EU-only Cloud Functions (europe-west1)
import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { Resend } from 'resend';

// Define the secret
const resendApiKey = defineSecret('RESEND_API_KEY');

admin.initializeApp();

// Trigger: enqueue feedback email one minute after pickup time on acceptance
export const onOrderAccepted = onDocumentUpdated(
  {
    document: 'restaurants/{restaurantId}/orders/{orderId}',
    region: 'europe-west1',
  },
  async (event) => {
    const change = event.data;
    if (!change) return;
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    const orderId = event.params.orderId as string;
    const restaurantId = event.params.restaurantId as string;

    if (!before || !after) return;

    // Only when status changes to accepted
    if (before.status === 'accepted' || after.status !== 'accepted') return;

    const customerEmail: string | undefined = after?.customerDetails?.email;
    if (!customerEmail) return;

    const now = Date.now();
    const minDelayMs = 90 * 60 * 1000;
    let runAtMs = now + 5_400_000; // default: 1.5 hours from now
    let scheduleSource: 'default' | 'pickup_time' = 'default';
    const pickupTime: string | undefined = after?.pickupTime;
    if (pickupTime && pickupTime.toLowerCase() !== 'asap') {
      try {
        const normalized = pickupTime.trim();
        const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
        if (match) {
          const hh = Number(match[1]);
          const mm = Number(match[2]);
          const d = new Date();
          d.setSeconds(0, 0);
          d.setHours(hh, mm, 0, 0);
          let pickupMs = d.getTime();
          if (pickupMs < now) pickupMs += 24 * 60 * 60 * 1000; // tomorrow
          runAtMs = pickupMs + 5_400_000;
          scheduleSource = 'pickup_time';
        } else {
          console.warn('onOrderAccepted: unexpected pickupTime format', { orderId, pickupTime });
        }
      } catch (err) {
        console.error('onOrderAccepted: failed to parse pickupTime', { orderId, pickupTime, err });
      }
    }

    runAtMs = Math.max(runAtMs, now + minDelayMs);
    const intendedDelayMinutes = Math.round((runAtMs - now) / 60000);

    // Pre-generate feedback email HTML and link, and store with queue entry for visibility/debugging
    const feedbackUrl = `https://aieateasy.no/feedback/${orderId}`;
    const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <!-- Header -->
            <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🍽️ Thank You!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Dear Customer,</p>
              <p style="font-size: 15px; color: #555; line-height: 1.6;">
                Thank you for your order! We hope you enjoyed your meal. 
              </p>
              
              <!-- Feedback Request -->
              <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
                <h3 style="color: #333; margin-top: 0; font-size: 18px; margin-bottom: 15px;">⭐ We'd Love Your Feedback!</h3>
                <p style="margin: 10px 0; color: #555; font-size: 14px;">
                  Your opinion matters to us! Please take a moment to rate your experience and let us know how we did.
                </p>
                <p style="margin: 15px 0; color: #555; font-size: 14px;">
                  Your feedback helps us improve and serve you better.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${feedbackUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                  Share Your Feedback
                </a>
              </div>

              <!-- Alternative Link -->
              <div style="text-align: center; margin: 20px 0;">
                <p style="font-size: 12px; color: #999; margin-bottom: 5px;">Or copy this link:</p>
                <p style="font-size: 12px; color: #667eea; word-break: break-all;">${feedbackUrl}</p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">
                  We look forward to serving you again soon!
                </p>
                <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">
                  - AI Eat Easy Team 🙏
                </p>
              </div>
            </div>
          </div>
        `;

    await admin.firestore().collection('feedbackQueue').add({
      orderId,
      restaurantId,
      to: customerEmail,
      runAt: admin.firestore.Timestamp.fromMillis(runAtMs),
      scheduledDelayMinutes: intendedDelayMinutes,
      scheduleSource,
      pickupTimeRaw: pickupTime ?? null,
      htmlLength: emailHtml.length,
      status: 'queued',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      feedbackUrl,
      html: emailHtml,
    });
  });

// Scheduler: every minute send due feedback emails (EU region)
export const processScheduledTasks = onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: 'Europe/Oslo',
    region: 'europe-west1',
    secrets: [resendApiKey],  // Declare that this function uses the secret
  },
  async () => {
    const db = admin.firestore();
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    console.log('processScheduledTasks tick', { nowIso });
    const due = await db
      .collection('feedbackQueue')
      .where('status', '==', 'queued')
      .where('runAt', '<=', admin.firestore.Timestamp.fromMillis(now))
      .limit(25)
      .get();

    if (due.empty) return;

    const apiKey = resendApiKey.value();  // Use the secret
    if (!apiKey) return;

    const resend = new Resend(apiKey);
    const batch = db.batch();

    for (const doc of due.docs) {
      const data = doc.data() as any;
      const to: string | undefined = data?.to;
      const orderId: string = data?.orderId;
      const runAtTs = data?.runAt as admin.firestore.Timestamp | undefined;
      const runAtIso = runAtTs ? new Date(runAtTs.toMillis()).toISOString() : null;
      const acceptedAtTs = (data as any)?.acceptedAt as admin.firestore.Timestamp | undefined;
      const createdAtTs = (data as any)?.createdAt as admin.firestore.Timestamp | undefined;
      const acceptedAtIso = acceptedAtTs ? new Date(acceptedAtTs.toMillis()).toISOString() : null;
      const createdAtIso = createdAtTs ? new Date(createdAtTs.toMillis()).toISOString() : null;
      const scheduledDelayMinutes: number | undefined = data?.scheduledDelayMinutes;
      const scheduleSource: string | undefined = data?.scheduleSource;
      const htmlLength: number | undefined = data?.htmlLength;
      const toDomain = to?.split('@')[1] ?? null;

      console.log('processScheduledTasks inspecting doc', {
        docId: doc.id,
        orderId,
        toDomain,
        status: data?.status,
        reason: data?.reason ?? null,
        runAt: runAtIso,
        scheduledDelayMinutes,
        scheduleSource,
        acceptedAt: acceptedAtIso,
        createdAt: createdAtIso,
        htmlLength,
      });

      if (!to) {
        console.warn('processScheduledTasks skipping doc without recipient', { docId: doc.id, orderId });
        batch.update(doc.ref, { status: 'skipped', reason: 'missing_to', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        continue;
      }
      try {
        // Enforce minimum 90 minutes since acceptance (fallback to creation)
        const baseTs = acceptedAtTs || createdAtTs;
        if (baseTs) {
          const minSendMs = baseTs.toMillis() + 90 * 60 * 1000;
          if (Date.now() < minSendMs) {
            console.log('processScheduledTasks deferring doc to enforce min delay', {
              docId: doc.id,
              orderId,
              now: nowIso,
              minSendAt: new Date(minSendMs).toISOString(),
            });
            batch.update(doc.ref, { runAt: admin.firestore.Timestamp.fromMillis(minSendMs), status: 'queued', updatedAt: admin.firestore.FieldValue.serverTimestamp(), reason: 'min_delay_enforced' });
            continue;
          }
        }

        const feedbackUrl = data?.feedbackUrl || `https://aieateasy.no/feedback/${orderId}`;
        const emailHtml = data?.html || `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <!-- Header -->
            <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🍽️ Thank You!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Dear Customer,</p>
              <p style="font-size: 15px; color: #555; line-height: 1.6;">
                Thank you for your order! We hope you enjoyed your meal. 
              </p>
              
              <!-- Feedback Request -->
              <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
                <h3 style="color: #333; margin-top: 0; font-size: 18px; margin-bottom: 15px;">⭐ We'd Love Your Feedback!</h3>
                <p style="margin: 10px 0; color: #555; font-size: 14px;">
                  Your opinion matters to us! Please take a moment to rate your experience and let us know how we did.
                </p>
                <p style="margin: 15px 0; color: #555; font-size: 14px;">
                  Your feedback helps us improve and serve you better.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${feedbackUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                  Share Your Feedback
                </a>
              </div>

              <!-- Alternative Link -->
              <div style="text-align: center; margin: 20px 0;">
                <p style="font-size: 12px; color: #999; margin-bottom: 5px;">Or copy this link:</p>
                <p style="font-size: 12px; color: #667eea; word-break: break-all;">${feedbackUrl}</p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">
                  We look forward to serving you again soon!
                </p>
                <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">
                  - AI Eat Easy Team 🙏
                </p>
              </div>
            </div>
          </div>
        `;

        console.log('processScheduledTasks sending feedback email', {
          docId: doc.id,
          orderId,
          toDomain,
          runAt: runAtIso,
          now: nowIso,
          htmlLength: emailHtml?.length ?? 0,
        });
        await resend.emails.send({
          from: 'AI Eat Easy <noreply@aieateasy.no>',
          to,
          subject: 'Thank you for choosing AI Eat Easy! We\'d love your feedback 🍽️',
          html: emailHtml,
          text: `Thank you for your order! Please share your feedback here: ${feedbackUrl}`,
        });
        batch.update(doc.ref, { status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp(), feedbackUrl, updatedAt: admin.firestore.FieldValue.serverTimestamp(), htmlSent: emailHtml });
      } catch (e) {
        console.error('processScheduledTasks failed to send feedback email', { docId: doc.id, orderId, error: e instanceof Error ? e.message : String(e) });
        batch.update(doc.ref, { status: 'error', error: String(e), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
    }

    await batch.commit();
  });


