import { IsEnum, IsOptional, IsString, IsPhoneNumber } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Họ và tên không hợp lệ' })
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ (OWNER | ADMIN | WORKER)' })
  role: UserRole;
}
