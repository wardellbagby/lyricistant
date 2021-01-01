import { createAppMenu, MenuItemHandlers } from '@electron-app/app-menu';
import { expect, use } from 'chai';
import chaiSubset from 'chai-subset';
import { MenuItemConstructorOptions } from 'electron';
import sinonChai from 'sinon-chai';
import { StubbedInstance, stubObject } from 'ts-sinon';

use(sinonChai);
use(chaiSubset);

describe('Create Electron App Menu', () => {
  const handlerObj: MenuItemHandlers = {
    onFindClicked: () => undefined,
    onNewClicked: () => undefined,
    onOpenClicked: () => undefined,
    onOpenRecentClicked: () => undefined,
    onPreferencesClicked: () => undefined,
    onAboutClicked: () => undefined,
    onQuitClicked: () => undefined,
    onRedoClicked: () => undefined,
    onReplaceClicked: () => undefined,
    onSaveAsClicked: () => undefined,
    onSaveClicked: () => undefined,
    onUndoClicked: () => undefined,
  };
  let handlers: StubbedInstance<MenuItemHandlers>;

  beforeEach(() => {
    handlers = stubObject<MenuItemHandlers>(handlerObj);

    Object.keys(handlerObj)
      .filter((name) => name.startsWith('on'))
      .forEach((funcName) => {
        // @ts-ignore
        handlers[funcName]
          .onSecondCall()
          .throws(new Error(`${funcName} was registered multiple times!`));
      });
  });

  it('actually creates a menu', () => {
    const actual = createAppMenu('MyApp', 'linux', handlers);

    expect(actual).to.not.be.null;
    expect(actual).to.not.be.empty;
  });

  it('includes the Mac menu when on Mac', () => {
    const actual = createAppMenu('MyApp', 'darwin', handlers);

    expect(actual[0].label).to.be.equal('MyApp');
  });

  it("doesn't show prefs in File when on Mac", () => {
    const actual = createAppMenu('MyApp', 'darwin', handlers);

    expect(actual[1].submenu).to.not.containSubset([{ label: 'Preferences' }]);
  });

  it("doesn't show quit in File when on Mac", () => {
    const actual = createAppMenu('MyApp', 'darwin', handlers);

    expect(actual[1].submenu).to.not.containSubset([{ label: 'Quit' }]);
  });

  it("doesn't show about in File when on Mac", () => {
    const actual = createAppMenu('MyApp', 'darwin', handlers);

    expect(actual[1].submenu).to.not.containSubset([
      { label: 'About Lyricistant...' },
    ]);
  });

  it('does show about in Mac menu when on Mac', () => {
    const actual = createAppMenu('MyApp', 'darwin', handlers);

    expect(actual[0].submenu).to.containSubset([
      { label: 'About Lyricistant...' },
    ]);
  });

  it('does show prefs in File when on Windows', () => {
    const actual = createAppMenu('MyApp', 'win32', handlers);

    expect(actual[0].submenu).to.containSubset([{ label: 'Preferences' }]);
  });

  it('does show quit in File when on Windows', () => {
    const actual = createAppMenu('MyApp', 'win32', handlers);

    expect(actual[0].submenu).to.containSubset([{ label: 'Quit' }]);
  });

  it('does show about in File when on Windows', () => {
    const actual = createAppMenu('MyApp', 'win32', handlers);

    expect(actual[0].submenu).to.containSubset([
      { label: 'About Lyricistant...' },
    ]);
  });

  it('does show prefs in File when on Linux', () => {
    const actual = createAppMenu('MyApp', 'linux', handlers);

    expect(actual[0].submenu).to.containSubset([{ label: 'Preferences' }]);
  });

  it('does show quit in File when on Linux', () => {
    const actual = createAppMenu('MyApp', 'linux', handlers);

    expect(actual[0].submenu).to.containSubset([{ label: 'Quit' }]);
  });

  it('does show about in File when on Windows', () => {
    const actual = createAppMenu('MyApp', 'linux', handlers);

    expect(actual[0].submenu).to.containSubset([
      { label: 'About Lyricistant...' },
    ]);
  });

  it('includes all of the major sections on Mac', () => {
    const expected = [
      { label: 'MyApp' },
      { label: 'File' },
      { label: 'Edit' },
      { role: 'window' },
    ];
    const actual = createAppMenu('MyApp', 'darwin', handlers);

    actual.forEach((menu, index) => {
      expect(menu).to.include(expected[index]);
    });
  });

  it('includes all of the major sections on Linux', () => {
    const expected = [{ label: 'File' }, { label: 'Edit' }, { role: 'window' }];
    const actual = createAppMenu('MyApp', 'linux', handlers);

    actual.forEach((menu, index) => {
      expect(menu).to.include(expected[index]);
    });
  });

  it('includes all of the major sections on Windows', () => {
    const expected = [{ label: 'File' }, { label: 'Edit' }, { role: 'window' }];
    const actual = createAppMenu('MyApp', 'win32', handlers);

    actual.forEach((menu, index) => {
      expect(menu).to.include(expected[index]);
    });
  });

  it("doesn't show recent files when there aren't any", () => {
    const fileMenu = createAppMenu('MyApp', 'linux', handlers)[0];
    const recents = (fileMenu.submenu as MenuItemConstructorOptions[]).find(
      ({ label }) => label === 'Open Recent'
    );

    expect(recents).to.exist;
    expect(recents.submenu).to.eql([
      {
        label: '<No recent files>',
        enabled: false,
      },
    ]);
  });

  it('shows recent files when there are some', () => {
    const recentFiles = ['myfile', 'myfile2'];
    const fileMenu = createAppMenu('MyApp', 'linux', handlers, recentFiles)[0];
    const recents = (fileMenu.submenu as MenuItemConstructorOptions[]).find(
      ({ label }) => label === 'Open Recent'
    );

    expect(recents).to.exist;
    (recents.submenu as MenuItemConstructorOptions[]).forEach((menu, index) => {
      expect(menu).to.include({ label: recentFiles[index] });
    });
  });

  it("doesn't duplicate handlers on Mac", () => {
    const menu = createAppMenu('MyApp', 'darwin', handlers);

    recurseMenu(menu);
  });

  it("doesn't duplicate handlers on Windows", () => {
    const menu = createAppMenu('MyApp', 'win32', handlers);

    recurseMenu(menu);
  });

  it("doesn't duplicate handlers on Linux", () => {
    const menu = createAppMenu('MyApp', 'linux', handlers);

    recurseMenu(menu);
  });

  const recurseMenu = (menu: MenuItemConstructorOptions[]) => {
    menu.forEach((item) => {
      if (item.click) {
        item.click(undefined, undefined, undefined);
      }
      if (item.submenu) {
        recurseMenu(item.submenu as MenuItemConstructorOptions[]);
      }
    });
  };
});
