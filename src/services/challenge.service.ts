import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChallengeDTO } from 'src/dto/Challenge.dto';
import Challenge from '../entities/challenge.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ChallengeService {
  constructor(
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
  ) {}

  async create(challenge: Challenge): Promise<Challenge> {
    const createdChallenge = await this.challengeRepository.create(challenge);
    const savedChallenge = await this.challengeRepository.save(
      createdChallenge,
    );
    return savedChallenge;
  }

  async validate(challengeDTO: ChallengeDTO): Promise<boolean> {
    const challenge = await this.challengeRepository.findOne(challengeDTO.id);
    if (!challenge) {
      return false;
    }

    if (
      challenge.timestamp.getTime() !==
      new Date(challengeDTO.timestamp).getTime()
    ) {
      console.log(
        `Challenge timestamp doesn't match!`,
        challenge.timestamp.getTime(),
        new Date(challengeDTO.timestamp).getTime(),
      );
      return false;
    }

    return true;
  }

  async remove(challengeDTO: ChallengeDTO): Promise<boolean> {
    await this.challengeRepository.delete(challengeDTO.id);
    return true;
  }
}
