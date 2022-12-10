import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { BrowserContext } from 'playwright';
import { resourcesDir } from './utilities';

export const useMockRhymes = async (browserContext: BrowserContext) =>
  browserContext.route('**/words**', async (route, request) =>
    route.fulfill({
      status: 200,
      body: await getRhymesResponse(request.url()),
    })
  );

export const useMockDefinitions = async (browserContext: BrowserContext) =>
  browserContext.route('**/api/entries/v2/en/**', async (route, request) =>
    route.fulfill({
      status: 200,
      body: await getDefinitionResponse(request.url()),
    })
  );

const getRhymesResponse = async (url: string): Promise<string> => {
  const queryParams = new URL(url).searchParams;
  const query = queryParams.get('rel_rhy');

  if (query == null) {
    return JSON.stringify([]);
  }

  const file = path.resolve(resourcesDir, 'rhymes', `${query}.json`);
  if (existsSync(file)) {
    return readFileSync(file, { encoding: 'utf8' });
  } else {
    return JSON.stringify([]);
  }
};

const getDefinitionResponse = async (url: string): Promise<string> => {
  const paths = new URL(url).pathname.split('/');
  const query = paths[paths.length - 1];

  if (query == null || query.length === 0) {
    return JSON.stringify([]);
  }

  const file = path.resolve(resourcesDir, 'definitions', `${query}.json`);
  if (existsSync(file)) {
    return readFileSync(file, { encoding: 'utf8' });
  } else {
    return JSON.stringify([]);
  }
};
