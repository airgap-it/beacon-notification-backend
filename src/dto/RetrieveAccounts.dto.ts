import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { ChallengeDTO } from './Challenge.dto';

export class RetrieveAccountsDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ChallengeDTO)
  readonly challenge: ChallengeDTO;

  @IsNotEmpty()
  @IsString()
  readonly accountPublicKey: string;

  @ValidateIf((o) => o.managementToken === undefined)
  @IsNotEmpty()
  @IsString()
  readonly signature: string;

  @ValidateIf((o) => o.signature === undefined)
  @IsNotEmpty()
  @IsString()
  readonly managementToken: string;

  @IsNotEmpty()
  @IsString()
  readonly protocolIdentifier: string;

  @IsNotEmpty()
  @IsString()
  readonly deviceId: string;
}
