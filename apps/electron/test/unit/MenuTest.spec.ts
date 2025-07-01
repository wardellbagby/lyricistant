import expect from 'expect';
import { createAppMenu, MenuItemHandlers } from '@electron-app/app-menu';
import { MenuItemConstructorOptions } from 'electron';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('Create Electron App Menu', () => {
  let handlers: DeepMockProxy<MenuItemHandlers>;

  beforeEach(() => {
    jest.resetAllMocks();
    handlers = mockDeep<MenuItemHandlers>();

    Object.keys(handlers)
      .filter((name) => name.startsWith('on'))
      .forEach((funcName: keyof MenuItemHandlers) => {
        handlers[funcName].mockReturnValueOnce().mockImplementation(() => {
          new Error(`${funcName} was registered multiple times!`);
        });
      });
  });

  it('actually creates a menu', () => {
    const actual = createAppMenu('MyApp', 'linux', handlers);

    expect(actual).not.toBeNull();
    expect(Object.keys(actual)).not.toHaveLength(0);
  });

  it('includes the Mac menu when on Mac', () => {
    const actual = createAppMenu('MyApp', 'darwin', handlers);

    expect(actual[0].label).toBe('MyApp');
  });

  it("doesn't show prefs in File when on Mac", () => {
    const actual = createAppMenu('MyApp', 'darwin', handlers);

    expect(actual[1].submenu).not.toContainEqual([{ label: 'Preferences' }]);
  });

  it("doesn't show quit in File when on Mac", () => {
    const actual = createAppMenu('MyApp', 'darwin', handlers);

    expect(actual[1].submenu).not.toContainEqual([{ label: 'Quit' }]);
  });

  it("doesn't show about in File when on Mac", () => {
    const actual = createAppMenu('MyApp', 'darwin', handlers);

    expect(actual[1].submenu).not.toContainEqual([
      { label: 'About Lyricistant...' },
    ]);
  });

  it('does show about in Mac menu when on Mac', () => {
    const actual = createAppMenu('MyApp', 'darwin', handlers);

    expect(actual[0].submenu).toContainEqual(
      expect.objectContaining({ label: 'About Lyricistant...' }),
    );
  });

  it('does show prefs in File when on Windows', () => {
    const actual = createAppMenu('MyApp', 'win32', handlers);

    expect(actual[0].submenu).toContainEqual(
      expect.objectContaining({ label: 'Preferences' }),
    );
  });

  it('does show quit in File when on Windows', () => {
    const actual = createAppMenu('MyApp', 'win32', handlers);

    expect(actual[0].submenu).toContainEqual(
      expect.objectContaining({ label: 'Quit' }),
    );
  });

  it('does show about in File when on Windows', () => {
    const actual = createAppMenu('MyApp', 'win32', handlers);

    expect(actual[0].submenu).toContainEqual(
      expect.objectContaining({ label: 'About Lyricistant...' }),
    );
  });

  it('does show prefs in File when on Linux', () => {
    const actual = createAppMenu('MyApp', 'linux', handlers);

    expect(actual[0].submenu).toContainEqual(
      expect.objectContaining({ label: 'Preferences' }),
    );
  });

  it('does show quit in File when on Linux', () => {
    const actual = createAppMenu('MyApp', 'linux', handlers);

    expect(actual[0].submenu).toContainEqual(
      expect.objectContaining({ label: 'Quit' }),
    );
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
      expect(menu).toMatchObject(expected[index]);
    });
  });

  it('includes all of the major sections on Linux', () => {
    const expected = [{ label: 'File' }, { label: 'Edit' }, { role: 'window' }];
    const actual = createAppMenu('MyApp', 'linux', handlers);

    actual.forEach((menu, index) => {
      expect(menu).toMatchObject(expected[index]);
    });
  });

  it('includes all of the major sections on Windows', () => {
    const expected = [{ label: 'File' }, { label: 'Edit' }, { role: 'window' }];
    const actual = createAppMenu('MyApp', 'win32', handlers);

    actual.forEach((menu, index) => {
      expect(menu).toMatchObject(expected[index]);
    });
  });

  it("doesn't show recent files when there aren't any", () => {
    const fileMenu = createAppMenu('MyApp', 'linux', handlers)[0];
    const recents = (fileMenu.submenu as MenuItemConstructorOptions[]).find(
      ({ label }) => label === 'Open recent',
    );

    expect(recents).toBeDefined();
    expect(recents.submenu).toEqual([
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
      ({ label }) => label === 'Open recent',
    );

    expect(recents).toBeDefined();
    (recents.submenu as MenuItemConstructorOptions[]).forEach((menu, index) => {
      expect(menu).toMatchObject({ label: recentFiles[index] });
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
