import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  buildMessage,
} from 'class-validator';
import { CURRENCY_HELPERS } from '../utils/crypto';

export function IsCryptoAddress(
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'isCryptoAddress',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          let val = false;
          CURRENCY_HELPERS.forEach((currencyHelper) => {
            if (currencyHelper.isAddress(value)) {
              val = true;
            }
          });

          return val;
        },
        defaultMessage: buildMessage(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (eachPrefix, _x) =>
            eachPrefix + '$property must be a valid crypto address',
          validationOptions,
        ),
      },
    });
  };
}
