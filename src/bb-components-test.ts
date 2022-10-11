/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions */
/* npm dependencies */

import { spawn } from 'child_process';
import program from 'commander';

/* process arguments */

program
  .name('bb components test')
  .option('--path [path]', 'Path to testfile.', '/__test__')
  .parse(process.argv);

const options = {
  path: program.path as string,
};
/* execute command */

new Promise((resolve): void => {
  let build = spawn(`npm run test`, {
    shell: true,
  });

  if (options.path) {
    build = spawn(`npm run test ${options.path}`, {
      shell: true,
    });
  }

  build.stdout.pipe(process.stdout);
  build.stderr.pipe(process.stderr);
  build.on('close', resolve);
})
  .then(() => {
    console.log('Done.');
  })
  .catch((err: NodeJS.ErrnoException) => {
    console.log(`${err}\nAbort.`);
    process.exit();
  });
