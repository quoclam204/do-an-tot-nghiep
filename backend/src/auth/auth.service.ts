import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { MailService } from './mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  /** Đăng ký tài khoản mới */
  async register(dto: RegisterDto) {
    const newUser = await this.usersService.create(dto);
    return {
      message: 'Đăng ký thành công',
      ...this.usersService.createSession(newUser),
    };
  }

  /** Đăng nhập */
  async login(dto: LoginDto) {
    const user = await this.usersService.verifyCredentials(dto.email, dto.password);
    return {
      message: 'Đăng nhập thành công',
      ...this.usersService.createSession(user),
    };
  }

  /** Đăng nhập hoặc Đăng ký qua Google */
  async googleLogin(credential: string) {
    if (!credential) {
      throw new BadRequestException('Google credential không hợp lệ');
    }

    let payload: any;
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      );
      if (!response.ok) {
        throw new Error('Google token validation failed');
      }
      payload = await response.json();
    } catch (err) {
      throw new UnauthorizedException('Xác thực tài khoản Google thất bại hoặc phiên đăng nhập đã hết hạn');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Không thể lấy thông tin email từ tài khoản Google');
    }

    const configuredClientId = process.env.GOOGLE_CLIENT_ID;
    if (configuredClientId && payload.aud && payload.aud !== configuredClientId) {
      throw new UnauthorizedException('Google Client ID không khớp với hệ thống');
    }

    const user = await this.usersService.findOrCreateGoogleUser({
      email: payload.email,
      name: payload.name || payload.given_name || 'Người dùng Google',
    });

    return {
      message: 'Đăng nhập Google thành công',
      ...this.usersService.createSession(user),
    };
  }

  /** Quên mật khẩu */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Để bảo mật, luôn trả về thông báo chung chung dù email không tồn tại
      return { message: 'Nếu email hợp lệ, chúng tôi đã gửi link đặt lại mật khẩu.' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15); // Hết hạn sau 15 phút

    await this.usersService.saveResetToken(user.id, resetToken, expires);
    await this.mailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'Nếu email hợp lệ, chúng tôi đã gửi link đặt lại mật khẩu.' };
  }

  /** Đặt lại mật khẩu */
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(dto.token);
    if (!user) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn.');
    }

    const newPasswordHash = await this.usersService.hashPassword(dto.newPassword);
    await this.usersService.resetPassword(user.id, newPasswordHash);

    return { message: 'Mật khẩu đã được thay đổi thành công.' };
  }
}
