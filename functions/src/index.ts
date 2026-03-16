/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import nodemailer from 'nodemailer';

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

// Load SMTP config from environment variables. Set these in your Firebase
// functions environment (or in the console) before deploying:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL


const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'no-reply@example.com';

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
	transporter = nodemailer.createTransport({
		host: SMTP_HOST,
		port: SMTP_PORT,
		secure: SMTP_PORT === 465,
		auth: {
			user: SMTP_USER,
			pass: SMTP_PASS,
		},
	});
} else {
	console.warn('SMTP not configured - emails will not be sent.');
}

async function sendEmail(to: string, subject: string, text: string, html?: string) {
	if (!transporter) {
		console.log('Skipping email (no transporter):', to, subject);
		return;
	}

	const mail = {
		from: FROM_EMAIL,
		to,
		subject,
		text,
		html,
	};

	try {
		const info = await transporter.sendMail(mail);
		console.log('Email sent:', info && (info as any).messageId);
	} catch (err) {
		console.error('Error sending email:', err);
	}
}

// Send a confirmation email when an appointment document is created
export const sendAppointmentConfirmation = onDocumentCreated('appointments/{docId}', async (event) => {
	const snapshot = event.data;
	if (!snapshot) return;
	const data = snapshot.data();
	if (!data || !data.email) return;

	const to = data.email;
	const subject = 'Appointment Request Received';
	const text = `Hi ${data.name || ''},\n\nWe received your appointment request for ${data.service || ''} with ${data.doctor || ''} on ${data.date || ''} at ${data.time || ''}.\n\nStatus: ${data.status || 'Pending'}\n\nWe will contact you shortly to confirm the appointment.\n\n– Discovery Coast Dental & Medical Centre`;

	const html = `<p>Hi ${data.name || ''},</p>
		<p>We received your appointment request for <strong>${data.service || ''}</strong> with <strong>${data.doctor || ''}</strong> on <strong>${data.date || ''}</strong> at <strong>${data.time || ''}</strong>.</p>
		<p><strong>Status:</strong> ${data.status || 'Pending'}</p>
		<p>We will contact you shortly to confirm the appointment.</p>
		<p>– Discovery Coast Dental & Medical Centre</p>`;

	await sendEmail(to, subject, text, html);
});

// Send email when appointment status changes (e.g., Confirmed or Cancelled)

export const notifyOnStatusChange = onDocumentWritten('appointments/{docId}', async (event) => {
	// v2 Firestore onDocumentWritten exposes 'before' and 'after' snapshots on event.data
	const beforeSnap = event.data?.before;
	const afterSnap = event.data?.after;

 	const beforeData = beforeSnap ? beforeSnap.data() : null;
 	const afterData = afterSnap ? afterSnap.data() : null;

	// Only proceed for updates where both snapshots exist
	if (!afterData || !beforeData) return;

	if (beforeData.status === afterData.status) return; // no change

	const to = afterData.email;
	if (!to) return;

	if (afterData.status === 'Confirmed') {
		const subject = 'Your Appointment is Confirmed';
		const text = `Hi ${afterData.name || ''},\n\nYour appointment on ${afterData.date || ''} at ${afterData.time || ''} with ${afterData.doctor || ''} has been confirmed.\n\nSee you soon!\n\n– Discovery Coast Dental & Medical Centre`;
		const html = `<p>Hi ${afterData.name || ''},</p>
			<p>Your appointment on <strong>${afterData.date || ''}</strong> at <strong>${afterData.time || ''}</strong> with <strong>${afterData.doctor || ''}</strong> has been <strong>confirmed</strong>.</p>
			<p>See you soon!</p>
			<p>– Discovery Coast Dental & Medical Centre</p>`;

		await sendEmail(to, subject, text, html);
	}

	if (afterData.status === 'Cancelled' || afterData.status === 'Cancelled by Admin') {
		const subject = 'Your Appointment has been Cancelled';
		const text = `Hi ${afterData.name || ''},\n\nYour appointment on ${afterData.date || ''} at ${afterData.time || ''} with ${afterData.doctor || ''} has been cancelled.\n\nPlease contact us if you would like to reschedule.\n\n– Discovery Coast Dental & Medical Centre`;
		const html = `<p>Hi ${afterData.name || ''},</p>
			<p>Your appointment on <strong>${afterData.date || ''}</strong> at <strong>${afterData.time || ''}</strong> with <strong>${afterData.doctor || ''}</strong> has been cancelled.</p>
			<p>Please contact us if you would like to reschedule.</p>
			<p>– Discovery Coast Dental & Medical Centre</p>`;

		await sendEmail(to, subject, text, html);
	}
});
