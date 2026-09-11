import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFarmDto {
  @IsString({ message: 'Tên nông trại không được để trống' })
  @IsNotEmpty({ message: 'Tên nông trại không được để trống' })
  name: string;

  @IsString({ message: 'Địa điểm không được để trống' })
  @IsNotEmpty({ message: 'Địa điểm không được để trống' })
  location: string;

  @IsNumber({}, { message: 'Diện tích phải là số' })
  @Min(0, { message: 'Diện tích phải lớn hơn 0' })
  totalArea: number;

  @IsOptional()
  @IsString()
  unit?: string; // 'ha' | 'm2' | 'm²'
}

export class UpdateFarmDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalArea?: number;

  @IsOptional()
  @IsString()
  unit?: string; // 'ha' | 'm2' | 'm²'
}
