import { JSDOM } from 'jsdom';

export const setupJSDOM = () => {
  const { window } = new JSDOM(
    '<!doctype html><html lang="en"><body></body></html>',
    {
      url: 'https://lyricistant.app',
    }
  );

  global.File = window.File;
  global.Blob = window.Blob;
  global.FileReader = window.FileReader;
  global['localStorage'] = window.localStorage;
};

export const removeJSDOM = () => {
  global.File = undefined;
  global.Blob = undefined;
  global.FileReader = undefined;
  delete global['localStorage'];
};
