import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController (Lớp điều hướng xác thực)', () => {
  let controller: AuthController;
  let authService: Partial<Record<keyof AuthService, jest.Mock>>;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      googleLogin: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('phải khởi tạo thành công', () => {
    expect(controller).toBeDefined();
  });

  // ================================================================
  // POST /auth/register
  // ================================================================

  describe('POST /auth/register — Đăng ký', () => {
    it('phải chuyển tiếp đúng DTO và trả về kết quả từ AuthService', async () => {
      const dto = {
        email: 'nong.dan@dalatagri.vn',
        password: 'MatKhau@456',
        fullName: 'Trần Thị Lan',
      };
      const mockResult = { message: 'Đăng ký thành công', accessToken: 'token-abc', user: { id: 'u1' } };
      authService.register!.mockResolvedValue(mockResult);

      const result = await controller.register(dto as any);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  // ================================================================
  // POST /auth/login
  // ================================================================

  describe('POST /auth/login — Đăng nhập', () => {
    it('phải chuyển tiếp đúng DTO và trả về session token', async () => {
      const dto = { email: 'farmer@dalatagri.vn', password: 'DungPass@789' };
      const mockResult = { message: 'Đăng nhập thành công', accessToken: 'jwt-xyz', user: { id: 'u2' } };
      authService.login!.mockResolvedValue(mockResult);

      const result = await controller.login(dto as any);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result.accessToken).toBe('jwt-xyz');
    });

    it('phải propagate lỗi từ AuthService khi đăng nhập thất bại', async () => {
      authService.login!.mockRejectedValue(new Error('Sai thông tin đăng nhập'));

      await expect(
        controller.login({ email: 'x', password: 'y' } as any),
      ).rejects.toThrow('Sai thông tin đăng nhập');
    });
  });

  // ================================================================
  // POST /auth/forgot-password
  // ================================================================

  describe('POST /auth/forgot-password — Quên mật khẩu', () => {
    it('phải trả về thông báo an toàn khi email hợp lệ', async () => {
      const dto = { email: 'farmer@dalatagri.vn' };
      authService.forgotPassword!.mockResolvedValue({
        message: 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu',
      });

      const result = await controller.forgotPassword(dto as any);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result.message).toContain('gửi link');
    });
  });

  // ================================================================
  // POST /auth/reset-password
  // ================================================================

  describe('POST /auth/reset-password — Đặt lại mật khẩu', () => {
    it('phải chuyển tiếp đúng DTO reset password', async () => {
      const dto = { token: 'reset-token-abc', password: 'NewPass@123' };
      authService.resetPassword!.mockResolvedValue({ message: 'Mật khẩu đã được cập nhật thành công' });

      const result = await controller.resetPassword(dto as any);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result.message).toContain('thành công');
    });
  });

  // ================================================================
  // POST /auth/google
  // ================================================================

  describe('POST /auth/google — Đăng nhập Google', () => {
    it('phải chuyển tiếp credential đúng đến AuthService.googleLogin', async () => {
      const dto = { credential: 'google-id-token-string' };
      authService.googleLogin!.mockResolvedValue({
        message: 'Đăng nhập Google thành công',
        accessToken: 'google-jwt',
      });

      const result = await controller.googleLogin(dto as any);

      expect(authService.googleLogin).toHaveBeenCalledWith(dto.credential);
      expect(result.accessToken).toBe('google-jwt');
    });
  });
});
