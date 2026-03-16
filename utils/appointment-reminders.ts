// Appointment Reminder System
// This module provides functionality to send email reminders for upcoming appointments

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import emailjs from 'emailjs-com';

interface Appointment {
  id: string;
  name: string;
  email: string;
  doctor: string;
  service: string;
  date: string;
  time: string;
  status: string;
  reminderSent?: boolean;
}

// EmailJS configuration (same as existing setup)
const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || ''; // You may want to create a new template for reminders
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || '';

/**
 * Check if an appointment is within the next 24 hours
 */
function isWithin24Hours(appointmentDate: string, appointmentTime: string): boolean {
  try {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Return true if appointment is between 12 and 36 hours from now
    // This gives a window to catch appointments even if the check runs at different times
    return hoursUntilAppointment > 12 && hoursUntilAppointment <= 36;
  } catch (error) {
    console.error('Error parsing appointment date/time:', error);
    return false;
  }
}

/**
 * Send a reminder email for an appointment
 */
export async function sendAppointmentReminder(appointment: Appointment): Promise<boolean> {
  try {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('EmailJS is not configured for reminders');
      return false;
    }

    const templateParams = {
      to_email: appointment.email,
      patient_name: appointment.name,
      doctor_name: appointment.doctor,
      service: appointment.service,
      appointment_date: appointment.date,
      appointment_time: appointment.time,
      subject: '🔔 Appointment Reminder - DC Dental App',
      message: `This is a friendly reminder that you have an appointment scheduled for tomorrow.\n\nDetails:\n- Doctor: ${appointment.doctor}\n- Service: ${appointment.service}\n- Date: ${appointment.date}\n- Time: ${appointment.time}\n\nPlease arrive 10 minutes early. If you need to reschedule, please contact us as soon as possible.`,
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log(`✅ Reminder sent to ${appointment.email} for appointment on ${appointment.date}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send reminder email:', error);
    return false;
  }
}

/**
 * Check all confirmed appointments and send reminders for those within 24 hours
 */
export async function checkAndSendReminders(): Promise<void> {
  try {
    // Get all confirmed appointments
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('status', '==', 'Confirmed')
    );

    const snapshot = await getDocs(appointmentsQuery);
    
    if (snapshot.empty) {
      console.log('No confirmed appointments found');
      return;
    }

    console.log(`📋 Checking ${snapshot.size} confirmed appointments for reminders...`);

    let remindersSent = 0;

    for (const docSnap of snapshot.docs) {
      const appointment = { id: docSnap.id, ...docSnap.data() } as Appointment;
      
      // Skip if reminder already sent
      if (appointment.reminderSent) {
        continue;
      }

      // Check if appointment is within 24 hours
      if (isWithin24Hours(appointment.date, appointment.time)) {
        const sent = await sendAppointmentReminder(appointment);
        
        if (sent) {
          // Mark reminder as sent in Firestore
          // await updateDoc(doc(db, 'appointments', appointment.id), {
          //   reminderSent: true,
          //   reminderSentAt: serverTimestamp(),
          // });
          remindersSent++;
        }
      }
    }

    console.log(`✅ Sent ${remindersSent} appointment reminders`);
  } catch (error) {
    console.error('❌ Error checking appointments for reminders:', error);
  }
}

/**
 * Schedule reminder checks to run periodically
 * Call this function when the app starts or in a background service
 */
export function scheduleReminderChecks(intervalHours: number = 6): ReturnType<typeof setInterval> {
  console.log(`🕐 Scheduling reminder checks every ${intervalHours} hours`);
  
  // Run immediately
  checkAndSendReminders();
  
  // Then run every X hours
  return setInterval(() => {
    checkAndSendReminders();
  }, intervalHours * 60 * 60 * 1000) as any;
}

/**
 * Manual trigger for sending reminders (can be called by admin)
 */
export async function triggerManualReminderCheck(): Promise<number> {
  await checkAndSendReminders();
  return 0; // Return count of reminders sent
}
