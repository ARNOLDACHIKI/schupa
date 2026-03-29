import "dotenv/config";
import nodemailer from "nodemailer";

const output = [];

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number.parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.verify();
  output.push("SMTP verify: ok");

  const to = "keniaschupa@gmail.com";
  const sent = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: "SCHUPA SMTP Live Test",
    text: "This is a live SMTP test from SCHUPA.",
    html: "<p>This is a live SMTP test from SCHUPA.</p>",
  });

  output.push(`Email send: ok (${sent.messageId})`);
  console.log(output.join("\n"));
}

main().catch((error) => {
  console.error(`SMTP test failed: ${error.message}`);
  process.exit(1);
});
