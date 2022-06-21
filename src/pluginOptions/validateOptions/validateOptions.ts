import chalk from 'chalk';
import stringify from 'fast-json-stable-stringify';
import Joi from 'joi';
import isFunction from 'lodash.isfunction';

import { pluginPrefix } from '../../error-utils';
import { defaultOptions } from '../';
import { ValidateOptionsProps } from './validateOptions.types';

const optionsSchema = Joi.object().keys({
  // default plugins passed by utils
  plugins: Joi.array(),

  // required params
  node: Joi.alternatives(
    Joi.string(),
    Joi.array().items(Joi.string()).min(1),
    Joi.object(), // NodeOptions
    Joi.array().items(Joi.object()).min(1) // NodeOptions[]
  ).required(),
  queries: Joi.array().required(),

  // optional params
  auth: Joi.object()
    .keys({
      // required auth params
      username: Joi.string().required(),
      password: Joi.string().required(),
    })
    .optional(),
  apiKey: Joi.string().optional(),
  chunkSize: Joi.number().integer().min(1).optional(),
});

const maskedFields = [`apiKey`];

/**
 * Mask majority of input to not leak any secrets
 * @param {string} input
 * @returns {string} masked text
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const maskText = (input: string) => {
  // show just 25% of string up to 4 characters
  const hiddenCharactersLength =
    input.length - Math.min(4, Math.floor(input.length * 0.25));

  return `${`*`.repeat(hiddenCharactersLength)}${input.substring(
    hiddenCharactersLength
  )}`;
};

/**
 *
 * @param pluginOptions
 * @param errors
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const formatPluginOptionsForCLI = (pluginOptions: any, errors = {}) => {
  const optionKeys = new Set(
    Object.keys(pluginOptions)
      .concat(Object.keys(defaultOptions))
      .concat(Object.keys(errors))
  );

  const getDisplayValue = (key: string) => {
    const formatValue = (value: string | any) => {
      if (isFunction(value)) {
        return `[Function]`;
      } else if (maskedFields.includes(key) && typeof value === `string`) {
        return stringify(maskText(value));
      }
      return stringify(value);
    };

    if (typeof pluginOptions[key] !== `undefined`) {
      return chalk.green(formatValue(pluginOptions[key]));
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
    } else if (typeof defaultOptions[key] !== `undefined`) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return chalk.dim(formatValue(defaultOptions[key]));
    }

    return chalk.dim(`undefined`);
  };

  const lines: string[] = [];
  optionKeys.forEach(key => {
    if (key === `plugins`) {
      // skip plugins field automatically added by utils
      return;
    }

    lines.push(
      `${key}${
        typeof pluginOptions[key] === `undefined` &&
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        typeof defaultOptions[key] !== `undefined`
          ? chalk.dim(` (default value)`)
          : ``
      }: ${getDisplayValue(key)}${
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        typeof errors[key] !== `undefined` ? ` - ${chalk.red(errors[key])}` : ``
      }`
    );
  });
  return lines.join(`\n`);
};

/**
 * Validates the plugin options
 *
 * @param reporter
 * @param options
 */
export const validateOptions = (
  { reporter }: ValidateOptionsProps,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  options: any
): void => {
  const result = optionsSchema.validate(options, { abortEarly: false });
  if (result.error) {
    const errors = {};
    result.error.details.forEach(detail => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      errors[detail.path[0]] = detail.message;
    });
    reporter.panic(`[${pluginPrefix}] Problems with plugin options:
${formatPluginOptionsForCLI(options, errors)}`);
  }
};
