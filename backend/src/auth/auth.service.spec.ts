import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from './mail.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService (Xác thực & Bảo mật)', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let mailService: Partial<Record<keyof MailService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      verifyCredentials: jest.fn(),
      createSession: jest.fn(),
      findByEmail: jest.fn(),
      setResetPasswordToken: jest.fn(),
      resetPasswordByToken: jest.fn(),
    };

    mailService = {
      sendResetPasswordEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('Đăng ký tài khoản (Register)', () => {
    it('phải tạo tài khoản thành công và cấp Access Token phiên làm việc', async () => {
      const registerDto = {
        email: 'farmer@dalatagri.vn',
        password: 'Password@123',
        fullName: 'Nguyễn Văn Nông',
        phone: '0901234567',
      };

      const mockUser = {
        id: 'user-uuid-1',
        email: registerDto.email,
        fullName: registerDto.fullName,
        role: 'OWNER',
      };

      usersService.create!.mockResolvedValue(mockUser);
      usersService.createSession!.mockReturnValue({
        accessToken: 'mocked-jwt-access-token',
        user: mockUser,
      });

      const result = await authService.register(registerDto as any);

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(usersService.createSession).toHaveBeenCalledWith(mockUser);
      expect(result).toHaveProperty('accessToken', 'mocked-jwt-access-token');
      expect(result.message).toBe('Đăng ký thành công');
    });
  });

  describe('Đăng nhập (Login) & Kiểm tra thông tin', () => {
    it('phải đăng nhập thành công khi mật khẩu chính xác', async () => {
      const loginDto = {
        email: 'farmer@dalatagri.vn',
        password: 'Password@123',
      };

      const mockUser = {
        id: 'user-uuid-1',
        email: loginDto.email,
        fullName: 'Nguyễn Văn Nông',
        role: 'OWNER',
        isActive: true,
      };

      usersService.verifyCredentials!.mockResolvedValue(mockUser);
      usersService.createSession!.mockReturnValue({
        accessToken: 'valid-jwt-token',
        user: mockUser,
      });

      const result = await authService.login(loginDto as any);

      expect(usersService.verifyCredentials).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(result).toHaveProperty('accessToken', 'valid-jwt-token');
      expect(result.message).toBe('Đăng nhập thành công');
    });

    it('phải ném ngoại lệ UnauthorizedException khi nhập sai thông tin hoặc bị khóa', async () => {
      const loginDto = {
        email: 'farmer@dalatagri.vn',
        password: 'WrongPassword',
      };

      usersService.verifyCredentials!.mockRejectedValue(
        new UnauthorizedException('Email hoặc mật khẩu không đúng'),
      );

      await expect(authService.login(loginDto as any)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Quên mật khẩu (Forgot Password)', () => {
    it('phải tạo mã reset token và gửi email nếu email tồn tại', async () => {
      const mockUser = { id: 'user-1', email: 'farmer@dalatagri.vn', fullName: 'Bác Nông Dân' };
      usersService.findByEmail!.mockResolvedValue(mockUser);
      usersService.setResetPasswordToken!.mockResolvedValue(true);
      mailService.sendResetPasswordEmail!.mockResolvedValue(true);

      const result = await authService.forgotPassword({ email: 'farmer@dalatagri.vn' });

      expect(usersService.findByEmail).toHaveBeenCalledWith('farmer@dalatagri.vn');
      expect(usersService.setResetPasswordToken).toHaveBeenCalled();
      expect(mailService.sendResetPasswordEmail).toHaveBeenCalled();
      expect(result.message).toContain('chúng tôi đã gửi link đặt lại mật khẩu');
    });

    it('phải trả về thông báo an toàn ngay cả khi email không tồn tại trong hệ thống', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      const result = await authService.forgotPassword({ email: 'nonexistent@dalatagri.vn' });

      expect(usersService.findByEmail).toHaveBeenCalledWith('nonexistent@dalatagri.vn');
      expect(mailService.sendResetPasswordEmail).not.toHaveBeenCalled();
      expect(result.message).toContain('chúng tôi đã gửi link đặt lại mật khẩu');
    });
  });
});
