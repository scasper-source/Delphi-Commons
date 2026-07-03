/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "node:crypto";
import { getServerConfig } from "./config.js";

export type EmailSendInput = {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  metadata: Record<string, string | number | boolean | null>;
};

export type EmailSendResult = {
  providerMessageId: string;
  status: "sent" | "queued";
};

export type EmailProvider = {
  name: "mock" | "smtp";
  sendEmail(input: EmailSendInput): Promise<EmailSendResult>;
};

export type MockEmailOutboxEntry = EmailSendInput & EmailSendResult & { sentAt: string };

export const mockEmailOutbox: MockEmailOutboxEntry[] = [];

function mockProvider(): EmailProvider {
  return {
    name: "mock",
    async sendEmail(input) {
      const result: EmailSendResult = {
        providerMessageId: `mock-email-${crypto.randomUUID()}`,
        status: "sent",
      };
      mockEmailOutbox.push({ ...input, ...result, sentAt: new Date().toISOString() });
      return result;
    },
  };
}

function assertSmtpConfig() {
  const config = getServerConfig();
  if (!config.smtpHost) throw new Error("smtp_host_required");
  if (!config.smtpPort) throw new Error("smtp_port_required");
  if (!config.smtpFromAddress) throw new Error("smtp_from_address_required");
  return {
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    user: config.smtpUser,
    pass: config.smtpPass,
    fromAddress: config.smtpFromAddress,
    fromName: config.smtpFromName ?? "eDelphi",
  };
}

function smtpProvider(): EmailProvider {
  return {
    name: "smtp",
    async sendEmail(input) {
      const smtp = assertSmtpConfig();
      const boundary = `----=_Part_${crypto.randomUUID().replace(/-/g, "")}`;
      const isMultipart = Boolean(input.htmlBody);

      let body: string;
      if (isMultipart) {
        body = [
          `--${boundary}`,
          "Content-Type: text/plain; charset=utf-8",
          "Content-Transfer-Encoding: quoted-printable",
          "",
          input.textBody,
          "",
          `--${boundary}`,
          "Content-Type: text/html; charset=utf-8",
          "Content-Transfer-Encoding: quoted-printable",
          "",
          input.htmlBody!,
          "",
          `--${boundary}--`,
        ].join("\r\n");
      } else {
        body = input.textBody;
      }

      const messageId = `<${crypto.randomUUID()}@${smtp.host}>`;
      const headers = [
        `From: ${smtp.fromName} <${smtp.fromAddress}>`,
        `To: ${input.to}`,
        `Subject: ${input.subject}`,
        `Message-ID: ${messageId}`,
        `Date: ${new Date().toUTCString()}`,
        `MIME-Version: 1.0`,
        isMultipart
          ? `Content-Type: multipart/alternative; boundary="${boundary}"`
          : "Content-Type: text/plain; charset=utf-8",
      ];

      const rawMessage = headers.join("\r\n") + "\r\n\r\n" + body;
      const authString = smtp.user && smtp.pass
        ? Buffer.from(`\x00${smtp.user}\x00${smtp.pass}`).toString("base64")
        : null;

      const net = await import("node:net");
      const tls = await import("node:tls");

      const providerMessageId = await new Promise<string>((resolve, reject) => {
        const port = smtp.port;
        const host = smtp.host;

        function createConnection() {
          if (smtp.secure) {
            return tls.connect({ host, port, rejectUnauthorized: true });
          }
          return net.createConnection({ host, port });
        }

        const socket = createConnection();
        let buffer = "";
        let step = 0;
        const commands: string[] = [];

        function buildCommands() {
          commands.push(`EHLO ${smtp.host}`);
          if (authString) commands.push(`AUTH PLAIN ${authString}`);
          commands.push(`MAIL FROM:<${smtp.fromAddress}>`);
          commands.push(`RCPT TO:<${input.to}>`);
          commands.push("DATA");
        }
        buildCommands();

        function processLine(line: string) {
          const code = parseInt(line.substring(0, 3), 10);
          if (line.charAt(3) === "-") return;

          if (step < commands.length) {
            if (code >= 400) {
              socket.end("QUIT\r\n");
              reject(new Error(`smtp_error_${code}_step_${step}`));
              return;
            }
            socket.write(commands[step] + "\r\n");
            step++;
          } else if (code === 354) {
            socket.write(rawMessage + "\r\n.\r\n");
          } else if (code === 250 && step === commands.length) {
            socket.write("QUIT\r\n");
            resolve(messageId);
          } else if (code >= 400) {
            socket.end("QUIT\r\n");
            reject(new Error(`smtp_send_failed_${code}`));
          }
        }

        socket.setEncoding("utf8");
        socket.on("data", (data: string) => {
          buffer += data;
          const lines = buffer.split("\r\n");
          buffer = lines.pop()!;
          for (const line of lines) {
            if (line) processLine(line);
          }
        });
        socket.on("error", (err) => reject(new Error(`smtp_connection_error: ${err.message}`)));
        socket.setTimeout(30000, () => {
          socket.destroy();
          reject(new Error("smtp_timeout"));
        });
      });

      return { providerMessageId, status: "sent" };
    },
  };
}

export function getEmailProvider(): EmailProvider {
  return getServerConfig().emailProvider === "smtp" ? smtpProvider() : mockProvider();
}

export function clearMockEmailOutbox() {
  mockEmailOutbox.length = 0;
}
