import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class ChallengeDTO {
  @IsNotEmpty()
  @IsString()
  public id: string;

  @IsNotEmpty()
  @IsDateString()
  public timestamp: string;
}
