import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dns from 'node:dns';

// Fix lỗi Render / Docker không hỗ trợ outbound IPv6 dẫn đến ENETUNREACH
if (typeof (dns as any).setDefaultResultOrder === 'function') {
  (dns as any).setDefaultResultOrder('ipv4first');
}

@Injectable()
export class MailService {
  private async createTransporter(): Promise<nodemailer.Transporter> {
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS?.replace(/\s+/g, '');

    const rawHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    let targetHost = rawHost;

    // Render container không có IPv6, chủ động phân giải A Record (IPv4) để tránh tuyệt đối ENETUNREACH
    try {
      const ipv4Addresses = await dns.promises.resolve4(rawHost);
      if (ipv4Addresses && ipv4Addresses.length > 0) {
        targetHost = ipv4Addresses[0];
      }
    } catch (err) {
      console.warn(`[MailService] Không thể resolve IPv4 cho ${rawHost}:`, err);
    }

    return nodemailer.createTransport({
      host: targetHost,
      port: 465,
      secure: true,
      auth: {
        user,
        pass,
      },
      tls: {
        servername: rawHost, // Giữ SNI là tên miền gốc (smtp.gmail.com) để xác thực chứng chỉ SSL
        rejectUnauthorized: true,
      },
    } as any);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const subject = 'Đặt lại mật khẩu DalatAgri';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Đặt lại mật khẩu DalatAgri</h2>
        <p>Xin chào,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản DalatAgri của mình.</p>
        <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #16a34a; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Đặt Lại Mật Khẩu
          </a>
        </p>
        <p>Hoặc bạn có thể copy và dán đường dẫn sau vào trình duyệt:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p style="color: #ef4444; font-size: 0.9em;">Đường dẫn này sẽ hết hạn sau 15 phút.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, xin vui lòng bỏ qua email này.</p>
        <br>
        <p>Trân trọng,</p>
        <p>Đội ngũ DalatAgri</p>
      </div>
    `;

    // 1. Ưu tiên hàng đầu cho Render: Dùng Resend API (HTTPS Port 443 - Không bao giờ bị Render chặn)
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'DalatAgri <onboarding@resend.dev>',
            to: [to],
            subject,
            html,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || JSON.stringify(data));
        }
        return;
      } catch (err: any) {
        console.error('Lỗi khi gửi email qua Resend API:', err);
        throw new InternalServerErrorException(
          `Lỗi gửi mail Resend: ${err.message || err}. Vui lòng kiểm tra RESEND_API_KEY trên Render.`,
        );
      }
    }

    // 2. Tùy chọn 2: Dùng Brevo API (HTTPS Port 443)
    if (process.env.BREVO_API_KEY) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': process.env.BREVO_API_KEY.trim(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: 'DalatAgri Support',
              email: process.env.EMAIL_USER || 'nguyenlequoclam@gmail.com',
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData?.message || JSON.stringify(errData));
        }
        return;
      } catch (err: any) {
        console.error('Lỗi khi gửi email qua Brevo API:', err);
        throw new InternalServerErrorException(
          `Lỗi gửi mail Brevo: ${err.message || err}. Vui lòng kiểm tra BREVO_API_KEY trên Render.`,
        );
      }
    }

    // 3. Fallback qua SMTP Nodemailer (cho Localhost / VPS không bị chặn cổng)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('LỖI GỬI EMAIL: Thiếu biến môi trường gửi mail trên Render!');
      throw new InternalServerErrorException(
        'Server chưa được cấu hình RESEND_API_KEY hoặc EMAIL_USER/EMAIL_PASS trên Render.',
      );
    }

    const mailOptions = {
      from: `"DalatAgri Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    try {
      const transporter = await this.createTransporter();
      await transporter.sendMail(mailOptions);
    } catch (error: any) {
      console.error('Lỗi khi gửi email (chi tiết từ Nodemailer):', error);
      const detailMsg = error?.response || error?.message || 'Lỗi mạng / xác thực';
      throw new InternalServerErrorException(
        `Không thể gửi email: ${detailMsg}. Render Free chặn các cổng SMTP (465/587), vui lòng thêm RESEND_API_KEY trên Render.`,
      );
    }
  }
}
