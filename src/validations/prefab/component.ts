/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-use-before-define */

import chalk from 'chalk';
import Joi from 'joi';

import {
  Prefab,
  ComponentStyleMap,
  Component,
  PrefabReference,
  PrefabComponentOptionCategory,
  GroupedStyles,
  StyleDefinitionState,
  StyleDefinitionContentKeys,
} from '../../types';
import { findDuplicates } from '../../utils/validation';
import { overwriteSchema } from '../styles';
import { optionCategorySchema, optionSchema } from './componentOption';
import { linkedOptionSchema } from './linkedOption';
import { linkedPartialSchema } from './linkedPartial';

type StyleValidator = Record<Component['styleType'], Joi.ObjectSchema>;
type PrefabTypes = 'partial' | 'page' | undefined;

const shadows = [
  'none',
  '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
  '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
  '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
  '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
  '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
  '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
  '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
  '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
  '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
  '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
  '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
  '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
  '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
  '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
  '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
  '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
  '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
  '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
  '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
  '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
  '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
  '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
  '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
  '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
];

const isString = Joi.string().max(255);
const validRem = /^\d{1,5}\.?\d{0,5}rem$/;
const optionType = ['STATIC', 'THEME_COLOR'];

const styleValidator: StyleValidator = {
  BUTTON: Joi.object({
    backgroundColor: Joi.object({
      type: optionType,
      value: isString,
    }),
    borderColor: Joi.object({
      type: optionType,
      value: isString,
    }),
    borderRadius: Joi.array()
      .max(1)
      .items(isString.required().pattern(validRem)),
    borderStyle: isString,
    borderWidth: Joi.array()
      .max(1)
      .items(isString.required().pattern(validRem)),

    boxShadow: shadows,
    color: Joi.object({
      type: optionType,
      value: isString,
    }),
    fontFamily: ['Roboto', 'serif', 'sans-serif', 'monospace'],
    fontSize: isString.pattern(validRem),
    fontStyle: ['italic', 'none'],
    fontWeight: ['300', '400', '500', '700'],
    letterSpacing: isString.pattern(validRem),
    lineHeight: Joi.string().max(255).pattern(/^\d*$/),
    padding: [
      isString,
      Joi.array().max(4).items(isString.required().pattern(validRem)),
    ],
    textDecoration: ['underline', 'none'],
    textTransform: ['uppercase', 'none'],
  }),
};

const partialSchema = (): Joi.ObjectSchema => {
  return Joi.object({
    ref: Joi.object({
      id: Joi.string().required(),
    }),
    type: Joi.string().valid('PARTIAL').required(),
    partialId: Joi.string().allow('').required(),
  });
};

const wrapperSchema = (
  styles: GroupedStyles,
  componentStyleMap?: ComponentStyleMap,
  prefabType?: PrefabTypes,
): Joi.ObjectSchema => {
  return Joi.object({
    type: Joi.string().valid('WRAPPER').required(),
    label: Joi.string(),
    optionCategories: Joi.array().items(optionCategorySchema).min(1),
    options: Joi.array()
      .items(linkedOptionSchema, linkedPartialSchema)
      .required(),
    descendants: Joi.array()
      .items(
        Joi.custom(validateComponent(styles, componentStyleMap, prefabType)),
      )
      .required(),
  });
};

const validateComponentStyle =
  (styles: GroupedStyles, deprecatedStylesFlag: boolean) =>
  (prefabObject: {
    name: string;
    style?: {
      name: string;
      overwrite: StyleDefinitionState[];
    };
  }) => {
    const { name: componentName, style } = prefabObject;

    if (deprecatedStylesFlag || typeof style === 'undefined') {
      return prefabObject;
    }

    const { name: styleName, overwrite = [] } = style;

    const stylesByType = styles[componentName];
    const styleByName = stylesByType && stylesByType[styleName];

    if (!styleByName) {
      throw new Error(
        chalk.red(
          `\nBuild error in component style reference to unkown style ${componentName}:${styleName} \n`,
        ),
      );
    }

    const validCssObjects = [
      'basis',
      ...styleByName.states.map(({ name: stateName }) => stateName),
    ];
    const validCssObjectValues: StyleDefinitionContentKeys =
      styleByName.states.reduce(
        (acc, { name, content }) => ({
          ...acc,
          [name]: Object.keys(content),
        }),
        { basis: Object.keys(styleByName.basis) },
      );

    overwrite.forEach(({ name: stateName, content }): void => {
      if (!validCssObjects.includes(stateName)) {
        throw new Error(
          chalk.red(
            `\nBuild error in component style reference invalid overwrite for ${componentName} where ${stateName} does not exist in style ${styleName} \n`,
          ),
        );
      }

      const validCssKeys = validCssObjectValues[stateName] || [];

      Object.keys(content).forEach((cssKey) => {
        if (!validCssKeys.includes(cssKey)) {
          throw new Error(
            chalk.red(
              `\nBuild error in component style reference invalid overwrite for ${componentName}:${styleName} where ${stateName} overwrites a non existing css property ${cssKey} \n`,
            ),
          );
        }
      });
    });

    return prefabObject;
  };

const componentSchema = (
  styles: GroupedStyles,
  componentStyleMap?: ComponentStyleMap,
  styleType?: keyof StyleValidator,
  prefabType?: PrefabTypes,
): Joi.ObjectSchema => {
  const canValidateOldStyle = styleType && styleValidator[styleType];
  const deprecatedStyleSchema = Joi.object({
    name: Joi.string().max(255).alphanum(),
    overwrite: canValidateOldStyle || Joi.any(),
  });

  const styleSchema = Joi.object({
    name: Joi.string().max(255).alphanum().required(),
    overwrite: overwriteSchema,
  });

  const deprecatedStylesFlag = Object.keys(styles).length === 0;

  return Joi.object({
    name: Joi.string().required(),
    label: Joi.string(),
    style: deprecatedStylesFlag ? deprecatedStyleSchema : styleSchema,
    ref: Joi.object({
      id: Joi.string().required(),
    }),
    optionCategories: Joi.array().items(optionCategorySchema).min(1),
    options: Joi.array().items(optionSchema).required(),
    type: Joi.string().valid('COMPONENT').default('COMPONENT'),
    descendants: Joi.array()
      .items(
        Joi.custom(validateComponent(styles, componentStyleMap, prefabType)),
      )
      .required(),
    reconfigure: Joi.any(),

    // lifecycle hooks

    $afterCreate: Joi.array().items(
      Joi.object({
        query: Joi.string().valid('CreateAction').required(),
        input: Joi.object().pattern(
          /./,
          Joi.object({
            ref: Joi.array().items(Joi.string()),
          }),
        ),
        output: Joi.object().pattern(
          /./,
          Joi.object({
            ref: Joi.array().items(Joi.string()),
          }),
        ),
      }),
    ),
    $afterDelete: Joi.array().items(
      Joi.object({
        query: Joi.string()
          .valid('DeleteAction', 'DeleteActionVariable', 'UpdateActionVariable')
          .required(),
        input: Joi.object()
          .pattern(
            /./,
            Joi.object({
              ref: Joi.array().items(Joi.string()),
            }),
          )
          .required(),
      }),
    ),

    $onUpdate: Joi.array().items(
      Joi.object({
        query: Joi.string()
          .valid('DeleteAction', 'DeleteActionVariable', 'UpdateActionVariable')
          .required(),
        input: Joi.object()
          .pattern(
            /./,
            Joi.object({
              ref: Joi.array().items(Joi.string()).required(),
            }),
          )
          .required(),
      }),
    ),
  }).custom(validateComponentStyle(styles, deprecatedStylesFlag));
};

const findCategoryMemberDuplicates = (
  optionCategories: PrefabComponentOptionCategory[],
  componentType: string,
): void => {
  const memberKeys = optionCategories.reduce<string[]>((acc, { members }) => {
    return [...acc, ...members];
  }, []);

  if (memberKeys.length !== new Set(memberKeys).size) {
    throw new Error(
      chalk.red(
        `\nBuild error in component ${componentType}: optionCategory members are required to be unique \n`,
      ),
    );
  }
};

export const validateComponent =
  (
    styles: GroupedStyles,
    componentStyleMap?: ComponentStyleMap,
    prefabType?: PrefabTypes,
  ) =>
  (component: PrefabReference): Prefab | unknown => {
    if (component.type === 'PARTIAL') {
      if (prefabType === 'partial') {
        throw new Error(
          chalk.red(`\n Partials are not supported in partial Prefabs\n`),
        );
      }
      const { type } = component;
      const { error } = partialSchema().validate(component);

      if (typeof error !== 'undefined') {
        const { message } = error;

        throw new Error(
          chalk.red(`\nBuild error in component ${type}: ${message}\n`),
        );
      }
    } else if (component.type === 'WRAPPER') {
      const { error } = wrapperSchema(
        styles,
        componentStyleMap,
        prefabType,
      ).validate(component);
      const { optionCategories = [], options } = component;

      findDuplicates(options, 'option key', 'key');
      findCategoryMemberDuplicates(optionCategories, 'WRAPPER');

      if (typeof error !== 'undefined') {
        const { message } = error;

        throw new Error(
          chalk.red(`\nBuild error in component WRAPPER: ${message}\n`),
        );
      }
    } else {
      const { name, optionCategories = [], options } = component;

      const styleType: Component['styleType'] | undefined =
        componentStyleMap &&
        componentStyleMap[name] &&
        componentStyleMap[name].styleType;

      const { error } = componentSchema(
        styles,
        componentStyleMap,
        styleType as keyof StyleValidator,
        prefabType,
      ).validate(component);

      findDuplicates(options, 'option key', 'key');
      findCategoryMemberDuplicates(optionCategories, 'component');

      if (typeof error !== 'undefined') {
        const { message } = error;

        throw new Error(
          chalk.red(`\nBuild error in component ${name}: ${message}\n`),
        );
      }
    }

    return component;
  };
