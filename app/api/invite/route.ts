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
    const { email, inviteUrl, workspaceName, role } = await req.json();

    if (!email || !inviteUrl) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

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

    await transporter.sendMail({
      from: `"ClientOra" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `You've been invited to join ${workspaceName || "a Workspace"}`,
      attachments,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          ${brandHeader}

          <div style="margin-bottom: 20px;">
            <h2 style="color: #4f46e5; margin: 0 0 8px 0; font-size: 20px;">Workspace Invitation</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0;">
              You have been invited to join <strong>${workspaceName || "the workspace"}</strong> as an assigned <strong>${role || "Member"}</strong>.
            </p>
          </div>

          <div style="margin: 28px 0;">
            <a href="${inviteUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
              Accept Invitation & Join
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; line-height: 1.4; margin: 0 0 6px 0;">
            If the button above does not work, copy and paste this URL into your browser:
          </p>
          <p style="font-size: 12px; color: #6366f1; word-break: break-all; margin: 0;">
            ${inviteUrl}
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to dispatch email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}