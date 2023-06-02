import fs from 'fs-extra';
import path from 'path';
import { FunctionDefinition } from 'src/functions/functionDefinitions';
import {
  FunctionValidator,
  logValidationResult,
} from '../../functions/validations';
import Config from '../../functions/config';

const workingDir = process.cwd();

export const validateBlockDependencies = (
  dependencies: string[],
): { valid: boolean; invalidDependencies: string[] } => {
  const packageJson = fs.readJsonSync(
    path.join(workingDir, 'package.json'),
  ) as { dependencies: { [key: string]: string } };
  const packageJsonDependencies = Object.keys(packageJson.dependencies);
  const invalidDependencies = dependencies.filter(
    (dependency) => !packageJsonDependencies.includes(dependency),
  );
  if (invalidDependencies.length) {
    return { valid: false, invalidDependencies };
  }
  return { valid: true, invalidDependencies: [] };
};

export const validateFunctions = async (
  blockFunctions: FunctionDefinition[],
): Promise<{ valid: boolean }> => {
  const baseFunctionsPath = path.join(workingDir, 'functions');
  console.log(`Validating functions in ${baseFunctionsPath}`);
  const config = new Config();
  const validator = new FunctionValidator(config, baseFunctionsPath);
  await validator.initSchema();
  const results = await validator.validateFunctions('', blockFunctions);
  let valid = true;
  results.forEach((result) => {
    if (result.status === 'error') {
      valid = false;
    }
    logValidationResult(result);
  });

  return { valid };
};

export const getErrorMessage = ({
  validFunctions,
  validBlockDependencies,
  invalidDependencies,
}: {
  validFunctions: boolean;
  validBlockDependencies: boolean;
  invalidDependencies: string[];
}) => {
  if (!validFunctions) {
    return 'One or more functions are not valid';
  }

  if (!validBlockDependencies && invalidDependencies.length) {
    return `The following dependencies are not valid: ${invalidDependencies.join(
      ', ',
    )}`;
  }

  return 'Something went wrong';
};
