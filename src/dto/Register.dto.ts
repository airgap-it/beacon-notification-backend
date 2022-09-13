import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { ChallengeDTO } from './Challenge.dto';

export class RegisterDTO {
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ChallengeDTO)
  readonly challenge: ChallengeDTO;

  @IsNotEmpty()
  @IsString()
  readonly accountPublicKey: string;

  @IsNotEmpty()
  @IsString()
  readonly signature: string;

  @IsNotEmpty()
  @IsString()
  readonly backendUrl: string;

  @IsNotEmpty()
  @IsString()
  readonly protocolIdentifier: string;

  @IsNotEmpty()
  @IsString()
  readonly deviceId: string;
}
