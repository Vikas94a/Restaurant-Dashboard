// EU-only Cloud Functions (europe-west1)
import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Resend } from 'resend';

admin.initializeApp();

// Trigger: enqueue feedback email one minute after pickup time on acceptance
export const onOrderAccepted = onDocumentUpdated(
  {
    document: 'orders/{orderId}',
    region: 'europe-west1',
  },
  async (event) => {
    const change = event.data;
    if (!change) return;
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    const orderId = event.params.orderId as string;

    if (!before || !after) return;

    // Only when status changes to accepted
    if (before.status === 'accepted' || after.status !== 'accepted') return;

    const customerEmail: string | undefined = after?.customerDetails?.email;
    if (!customerEmail) return;

    const now = Date.now();
    let runAtMs = now + 60_000; // default: 1 minute from now
    const pickupTime: string | undefined = after?.pickupTime;
    if (pickupTime && pickupTime.toLowerCase() !== 'asap') {
      try {
        const [hh, mm] = pickupTime.split(':').map(Number);
        const d = new Date();
        d.setSeconds(0, 0);
        d.setHours(hh, mm, 0, 0);
        let pickupMs = d.getTime();
        if (pickupMs < now) pickupMs += 24 * 60 * 60 * 1000; // tomorrow
        runAtMs = pickupMs + 60_000;
      } catch {}
    }

    await admin.firestore().collection('feedbackQueue').add({
      orderId,
      to: customerEmail,
      runAt: admin.firestore.Timestamp.fromMillis(runAtMs),
      status: 'queued',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

// Scheduler: every minute send due feedback emails (EU region)
export const processScheduledTasks = onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: 'Europe/Oslo',
    region: 'europe-west1',
  },
  async () => {
    const db = admin.firestore();
    const now = Date.now();
    const due = await db
      .collection('feedbackQueue')
      .where('status', '==', 'queued')
      .where('runAt', '<=', admin.firestore.Timestamp.fromMillis(now))
      .limit(25)
      .get();

    if (due.empty) return;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const resend = new Resend(apiKey);
    const batch = db.batch();

    for (const doc of due.docs) {
      const data = doc.data() as any;
      const to: string | undefined = data?.to;
      const orderId: string = data?.orderId;
      if (!to) {
        batch.update(doc.ref, { status: 'skipped', reason: 'missing_to', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        continue;
      }
      try {
        await resend.emails.send({
          from: 'AI Eat Easy <noreply@aieateasy.no>',
          to,
          subject: 'We value your feedback',
          html: `<p>Thank you for your order ${orderId}!</p><p>Please share feedback on your pickup experience.</p>`,
        });
        batch.update(doc.ref, { status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      } catch (e) {
        batch.update(doc.ref, { status: 'error', error: String(e), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
    }

    await batch.commit();
  });


