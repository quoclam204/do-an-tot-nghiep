import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @IsString({ message: 'Google credential phải là chuỗi' })
  @IsNotEmpty({ message: 'Google credential không được để trống' })
  credential: string;
}
