import { existsSync } from 'fs';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import handler from 'serve-handler';

const NODE_MODULES = (process.mainModule as { paths: string[] }).paths[1];
const relativePath = (path: string): string => join(NODE_MODULES, path);
const BUILD_PATH_NPM = relativePath('./@betty-blocks/preview/build');
const BUILD_PATH_YARN = relativePath('../../preview/build');

const startServer = (path: string, port: number): void => {
  const server = createServer(
    (response: IncomingMessage, request: ServerResponse): Promise<void> =>
      handler(response, request, { public: path }),
  );

  server.listen(port, (): void => {
    console.info(`Serving the preview at http://localhost:${port}`);
  });
};

export default async (port: number): Promise<void> => {
  if (existsSync(BUILD_PATH_NPM)) {
    startServer(BUILD_PATH_NPM, port);
  } else if (existsSync(BUILD_PATH_YARN)) {
    startServer(BUILD_PATH_YARN, port);
  } else {
    console.error(
      'Cannot find the preview directory, please try again after upgrading the CLI to the latest version.',
    );
  }
};