import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      meetingId,
      sequence = 0,
      isCancellation = false,
      to,
      clientName,
      title,
      meetingType,
      meetingDate,
      startTime,
      durationMinutes,
      meetingLink,
      location,
      notes,
    } = body;

    if (!to) {
      return NextResponse.json(
        { error: "Recipient email is missing" },
        { status: 400 }
      );
    }

    const locationText =
      meetingType === "Online"
        ? meetingLink || "Online Video Call"
        : location || "Face-to-Face Meeting";

    const [year, month, day] = (meetingDate || "").split("-").map(Number);
    const [hours, minutes] = (startTime || "00:00").split(":").map(Number);

    const startPhtMs = Date.UTC(
      year || 2026,
      (month || 1) - 1,
      day || 1,
      (hours || 0) - 8,
      minutes || 0
    );
    const endPhtMs = startPhtMs + (Number(durationMinutes) || 30) * 60 * 1000;

    const startDatePht = new Date(startPhtMs);
    const endDatePht = new Date(endPhtMs);

    const formatUtcForIcs = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const dtStartUtc = formatUtcForIcs(startDatePht);
    const dtEndUtc = formatUtcForIcs(endDatePht);
    const nowUtc = formatUtcForIcs(new Date());

    const senderName = clientName || "ClientOra";
    const eventUid = meetingId
      ? `meeting-${meetingId}@clientora.com`
      : `${nowUtc}-random@clientora.com`;

    const method = isCancellation ? "CANCEL" : "REQUEST";
    const status = isCancellation ? "CANCELLED" : "CONFIRMED";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ClientOra//Meetings PHT//EN",
      `METHOD:${method}`,
      "BEGIN:VTIMEZONE",
      "TZID:Asia/Manila",
      "BEGIN:STANDARD",
      "TZOFFSETFROM:+0800",
      "TZOFFSETTO:+0800",
      "TZNAME:PHT",
      "DTSTART:19700101T000000",
      "END:STANDARD",
      "END:VTIMEZONE",
      "BEGIN:VEVENT",
      `UID:${eventUid}`,
      `SEQUENCE:${sequence}`,
      `DTSTAMP:${nowUtc}`,
      `DTSTART:${dtStartUtc}`,
      `DTEND:${dtEndUtc}`,
      `SUMMARY:${isCancellation ? `Cancelled: ${title}` : title}`,
      `ORGANIZER;CN="${senderName}":mailto:${process.env.GMAIL_USER}`,
      notes ? `DESCRIPTION:${notes.replace(/\n/g, "\\n")}` : "",
      `LOCATION:${locationText}`,
      meetingLink ? `URL:${meetingLink}` : "",
      `STATUS:${status}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");

    const subjectLine = isCancellation
      ? `Meeting Cancelled: ${title}`
      : sequence > 0
      ? `Updated Meeting Details: ${title}`
      : `Meeting Scheduled: ${title}`;

    const logoPath = path.join(process.cwd(), "public", "clientoralogo.png");
    const logoExists = fs.existsSync(logoPath);

    const attachments: nodemailer.SendMailOptions["attachments"] = [];
    if (logoExists) {
      attachments.push({
        filename: "clientoralogo.png",
        path: logoPath,
        cid: "clientora_logo",
      });
    }

    const brandHeader = logoExists
      ? `<div style="margin-bottom: 20px; text-align: center;">
           <img src="cid:clientora_logo" alt="ClientOra" width="48" height="48" style="display: inline-block; object-fit: contain; border-radius: 10px;" />
         </div>`
      : `<div style="margin-bottom: 20px; text-align: center;">
           <div style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: bold; font-size: 16px; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; text-align: center;">CO</div>
         </div>`;

    const emailHtml = isCancellation
      ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          ${brandHeader}
          <h2 style="color: #ef4444; margin-top: 0;">Meeting Cancelled</h2>
          <p style="color: #334155; font-size: 14px;">Hello <strong>${clientName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">The following meeting has been cancelled:</p>
          
          <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2;">
            <p style="margin: 4px 0; font-size: 14px; color: #991b1b;"><strong>Topic:</strong> ${title}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #991b1b;"><strong>Date:</strong> ${meetingDate}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #991b1b;"><strong>Time:</strong> ${startTime} PHT</p>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">An updated calendar cancellation invite (<code>invite.ics</code>) is attached. Opening it will automatically remove this event from your calendar.</p>
        </div>
      `
      : `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          ${brandHeader}
          <h2 style="color: #4f46e5; margin-top: 0;">${sequence > 0 ? "Updated Meeting Confirmation" : "Meeting Confirmation"}</h2>
          <p style="color: #334155; font-size: 14px;">Hello <strong>${clientName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">${sequence > 0 ? "The details for your scheduled meeting have been updated:" : "A meeting has been scheduled with you. Below are the details:"}</p>
          
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
            <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Topic:</strong> ${title}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Type:</strong> ${meetingType}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Date:</strong> ${meetingDate}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Time:</strong> ${startTime} PHT (${durationMinutes} mins)</p>
            ${
              meetingType === "Online" && meetingLink
                ? `<p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Video Link:</strong> <a href="${meetingLink}" style="color: #4f46e5;">${meetingLink}</a></p>`
                : ""
            }
            ${
              meetingType === "In-Person" && location
                ? `<p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Location:</strong> ${location}</p>`
                : ""
            }
          </div>

          ${
            notes
              ? `<p style="font-size: 13px; color: #64748b;"><strong>Agenda / Notes:</strong><br/>${notes}</p>`
              : ""
          }

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">An event invite (<code>invite.ics</code>) is attached. Open it to add this meeting directly to your calendar.</p>
        </div>
      `;

    await transporter.sendMail({
      from: `"ClientOra" <${process.env.GMAIL_USER}>`,
      to,
      subject: subjectLine,
      html: emailHtml,
      attachments,
      icalEvent: {
        filename: "invite.ics",
        method,
        content: icsContent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send meeting email:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}