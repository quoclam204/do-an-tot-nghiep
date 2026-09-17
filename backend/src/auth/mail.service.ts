import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS?.replace(/\s+/g, '');

    // Dùng service: 'gmail' mặc định để tránh lỗi timeout port 587 trên cloud server (Render)
    if (!process.env.EMAIL_HOST || process.env.EMAIL_HOST.includes('gmail')) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
    } else {
      const port = parseInt(process.env.EMAIL_PORT || '465', 10);
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    }
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"DalatAgri Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Đặt lại mật khẩu DalatAgri',
      html: `
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
      `,
    };

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('LỖI GỬI EMAIL: Thiếu biến môi trường EMAIL_USER hoặc EMAIL_PASS trên Render!');
      throw new InternalServerErrorException(
        'Server chưa được cấu hình EMAIL_USER hoặc EMAIL_PASS trong Environment Variables trên Render.',
      );
    }

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error: any) {
      console.error('Lỗi khi gửi email (chi tiết từ Nodemailer):', error);
      const detailMsg = error?.response || error?.message || 'Lỗi mạng / xác thực';
      throw new InternalServerErrorException(
        `Không thể gửi email: ${detailMsg}. Vui lòng kiểm tra lại EMAIL_USER/EMAIL_PASS trên Render.`,
      );
    }
  }
}
