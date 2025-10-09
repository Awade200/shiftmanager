import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  location: string;
  duration: number;
  earnings: number;
  mobile_number: string;
}

interface NotificationPreference {
  mobile_number: string;
  email: string | null;
  phone_number: string | null;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  reminder_hours_before: number;
}

interface DayShifts {
  date: string;
  mobile_number: string;
  shifts: Shift[];
  earliest_shift: Shift;
  total_hours: number;
  total_earnings: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get reminder type from request body
    const { reminder_type = '24h' } = await req.json().catch(() => ({ reminder_type: '24h' }));
    
    console.log(`🔔 Starting shift reminder check for ${reminder_type} reminders...`);

    // Calculate target time window based on reminder type
    const now = new Date();
    const hoursBeforeShift = reminder_type === '24h' ? 24 : 2;
    const windowMinutes = reminder_type === '24h' ? 60 : 30;
    
    const targetTime = new Date(now.getTime() + hoursBeforeShift * 60 * 60 * 1000);
    const windowStart = new Date(targetTime.getTime() - windowMinutes * 60 * 1000);
    const windowEnd = new Date(targetTime.getTime() + windowMinutes * 60 * 1000);

    console.log(`Looking for shifts between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

    // Get all shifts in the target window
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*')
      .gte('date', windowStart.toISOString().split('T')[0])
      .lte('date', windowEnd.toISOString().split('T')[0]);

    if (shiftsError) {
      console.error('Error fetching shifts:', shiftsError);
      throw shiftsError;
    }

    console.log(`Found ${shifts?.length || 0} shifts to check`);

    // Group shifts by day and mobile_number
    const dayShiftsMap = new Map<string, DayShifts>();
    
    for (const shift of shifts || []) {
      const shiftDateTime = new Date(`${shift.date}T${shift.start_time}`);
      
      // Check if shift is in the time window
      if (shiftDateTime >= windowStart && shiftDateTime <= windowEnd) {
        const key = `${shift.date}_${shift.mobile_number}`;
        
        if (!dayShiftsMap.has(key)) {
          dayShiftsMap.set(key, {
            date: shift.date,
            mobile_number: shift.mobile_number,
            shifts: [],
            earliest_shift: shift,
            total_hours: 0,
            total_earnings: 0,
          });
        }
        
        const dayShifts = dayShiftsMap.get(key)!;
        dayShifts.shifts.push(shift);
        dayShifts.total_hours += shift.duration;
        dayShifts.total_earnings += shift.earnings;
        
        // Update earliest shift if this one is earlier
        if (shift.start_time < dayShifts.earliest_shift.start_time) {
          dayShifts.earliest_shift = shift;
        }
      }
    }

    console.log(`Grouped into ${dayShiftsMap.size} days with shifts`);

    const notificationsToSend: Array<{
      dayShifts: DayShifts;
      prefs: NotificationPreference;
    }> = [];

    // Check each day
    for (const dayShifts of dayShiftsMap.values()) {
      // Check if we've already sent this reminder type for this day
      const { data: existingLog } = await supabase
        .from('notification_log')
        .select('id')
        .eq('day_date', dayShifts.date)
        .eq('mobile_number', dayShifts.mobile_number)
        .eq('reminder_type', reminder_type)
        .eq('status', 'sent')
        .maybeSingle();

      if (existingLog) {
        console.log(`Already sent ${reminder_type} reminder for ${dayShifts.date}`);
        continue;
      }

      // Get notification preferences for this mobile number
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('mobile_number', dayShifts.mobile_number)
        .maybeSingle();

      if (prefs && (prefs.email_enabled || prefs.whatsapp_enabled)) {
        notificationsToSend.push({ dayShifts, prefs });
      }
    }

    console.log(`Sending ${notificationsToSend.length} day notifications`);

    // Send notifications
    for (const { dayShifts, prefs } of notificationsToSend) {
      const message = formatDayMessage(dayShifts, reminder_type);

      // Send Email
      if (prefs.email_enabled && prefs.email) {
        try {
          await sendEmail(dayShifts, prefs.email, message, reminder_type);
          await logNotification(supabase, null, dayShifts.mobile_number, 'email', 'sent', reminder_type, dayShifts.date);
          console.log(`✅ Email sent to ${prefs.email}`);
        } catch (error) {
          console.error('Email error:', error);
          await logNotification(supabase, null, dayShifts.mobile_number, 'email', 'failed', reminder_type, dayShifts.date, error.message);
        }
      }

      // Send WhatsApp
      if (prefs.whatsapp_enabled && prefs.phone_number) {
        try {
          await sendWhatsApp(dayShifts, prefs.phone_number, message);
          await logNotification(supabase, null, dayShifts.mobile_number, 'whatsapp', 'sent', reminder_type, dayShifts.date);
          console.log(`✅ WhatsApp sent to ${prefs.phone_number}`);
        } catch (error) {
          console.error('WhatsApp error:', error);
          await logNotification(supabase, null, dayShifts.mobile_number, 'whatsapp', 'failed', reminder_type, dayShifts.date, error.message);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: notificationsToSend.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-shift-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Format day message with beautiful design
function formatDayMessage(dayShifts: DayShifts, reminderType: string): string {
  const timeUntil = reminderType === '24h' ? '24 hours' : '2 hours';
  const dateObj = new Date(dayShifts.date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const dateFormatted = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  
  let shiftsText = '';
  const sortedShifts = [...dayShifts.shifts].sort((a, b) => a.start_time.localeCompare(b.start_time));
  
  sortedShifts.forEach((shift, index) => {
    const emoji = index < numberEmojis.length ? numberEmojis[index] : '▪️';
    shiftsText += `\n${emoji} ${shift.start_time} - ${shift.end_time}`;
    shiftsText += `\n   👤 Client: ${shift.client_name}`;
    shiftsText += `\n   📍 Location: ${shift.location || 'Not specified'}`;
    shiftsText += `\n   ⏱️ Duration: ${shift.duration}h`;
    shiftsText += `\n   💰 Earnings: £${shift.earnings.toFixed(2)}\n`;
  });
  
  const shiftsLabel = dayShifts.shifts.length === 1 ? 'shift' : 'shifts';
  
  return `🔔 Daily Shift Reminder for ${dayName}
📅 ${dateFormatted}

━━━━━━━━━━━━━━━━━━━━━━

You have ${dayShifts.shifts.length} ${shiftsLabel} scheduled:
${shiftsText}
━━━━━━━━━━━━━━━━━━━━━━

📊 Day Total: ${dayShifts.total_hours.toFixed(1)} hours | £${dayShifts.total_earnings.toFixed(2)}

⏰ Your first shift starts in ${timeUntil}!

Good luck with your shifts! 💪`.trim();
}

async function sendEmail(dayShifts: DayShifts, email: string, message: string, reminderType: string) {
  const timeText = reminderType === '24h' ? '24 hours' : '2 hours';
  const dateObj = new Date(dayShifts.date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const shiftsLabel = dayShifts.shifts.length === 1 ? 'Shift' : 'Shifts';
  
  // Build HTML for shifts list
  const sortedShifts = [...dayShifts.shifts].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const shiftsHTML = sortedShifts.map((shift, index) => `
    <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #2563eb;">
      <div style="font-weight: bold; color: #1e40af; margin-bottom: 8px;">Shift ${index + 1}: ${shift.start_time} - ${shift.end_time}</div>
      <div style="color: #4b5563; line-height: 1.6;">
        <div>👤 <strong>Client:</strong> ${shift.client_name}</div>
        <div>📍 <strong>Location:</strong> ${shift.location || 'Not specified'}</div>
        <div>⏱️ <strong>Duration:</strong> ${shift.duration} hours</div>
        <div>💰 <strong>Earnings:</strong> £${shift.earnings.toFixed(2)}</div>
      </div>
    </div>
  `).join('');
  
  const { error } = await resend.emails.send({
    from: 'Shift Reminders <onboarding@resend.dev>',
    to: [email],
    subject: `🔔 ${dayShifts.shifts.length} ${shiftsLabel} on ${dayName} - First starts in ${timeText}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 30px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🔔 Daily Shift Reminder</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">${dayName}, ${dateObj.toLocaleDateString('en-GB')}</p>
        </div>
        
        <div style="background: #f3f4f6; padding: 30px; border-radius: 0 0 12px 12px;">
          <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e40af; font-weight: bold;">
              You have ${dayShifts.shifts.length} ${shiftsLabel.toLowerCase()} scheduled for today
            </p>
          </div>
          
          ${shiftsHTML}
          
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 20px; border-radius: 10px; margin-top: 20px; text-align: center;">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">📊 Day Summary</div>
            <div style="font-size: 18px; opacity: 0.95;">
              <span style="margin-right: 20px;">⏱️ ${dayShifts.total_hours.toFixed(1)} hours</span>
              <span>💰 £${dayShifts.total_earnings.toFixed(2)}</span>
            </div>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin-top: 20px; text-align: center; border: 2px solid #fbbf24;">
            <p style="margin: 0; color: #d97706; font-size: 18px; font-weight: bold;">
              ⏰ Your first shift starts in ${timeText}!
            </p>
          </div>
          
          <p style="text-align: center; color: #6b7280; margin-top: 30px; font-size: 16px;">
            Good luck with your shifts! 💪
          </p>
        </div>
      </div>
    `,
  });

  if (error) throw error;
}

async function sendWhatsApp(dayShifts: DayShifts, phoneNumber: string, message: string) {
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  const accessToken = Deno.env.get('WHATSAPP_CLOUD_ACCESS_TOKEN');

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured');
  }

  const response = await fetch(
    `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber.replace(/\s+/g, ''),
        type: 'text',
        text: { body: message },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp API error: ${error}`);
  }
}

async function logNotification(
  supabase: any,
  shiftId: string | null,
  mobileNumber: string,
  channel: string,
  status: string,
  reminderType: string,
  dayDate?: string,
  errorMessage?: string
) {
  await supabase.from('notification_log').insert({
    shift_id: shiftId,
    mobile_number: mobileNumber,
    channel,
    status,
    reminder_type: reminderType,
    day_date: dayDate || null,
    error_message: errorMessage || null,
  });
}
