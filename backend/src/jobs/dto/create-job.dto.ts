import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty({ message: 'title must not be empty' })
  @MaxLength(255, { message: 'title must not exceed 255 characters' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'type must not be empty' })
  @MaxLength(100, { message: 'type must not exceed 100 characters' })
  type: string;
}
