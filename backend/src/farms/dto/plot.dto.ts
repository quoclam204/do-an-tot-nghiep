import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlotDto {
  @IsString({ message: 'Tên lô không được để trống' })
  @IsNotEmpty({ message: 'Tên lô không được để trống' })
  name: string;

  @IsNumber({}, { message: 'Diện tích phải là số' })
  @Min(0, { message: 'Diện tích phải lớn hơn hoặc bằng 0' })
  area: number;

  @IsOptional()
  @IsString()
  unit?: string; // 'ha' | 'm2' | 'm²'
}

export class UpdatePlotDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @IsOptional()
  @IsString()
  unit?: string; // 'ha' | 'm2' | 'm²'
}
