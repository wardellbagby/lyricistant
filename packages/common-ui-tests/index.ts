import { Page } from 'playwright';
import { getQueriesForElement, waitFor } from 'playwright-testing-library';
import {
  BURY_ME_LOOSE_LYRICS,
  BURY_ME_LOOSE_PRE_LYRICS,
  BURY_ME_LOOSE_V1_FILE_HISTORY,
  BURY_ME_LOOSE_V2_FILE_HISTORY,
  dropFile,
  getEditor,
  HELLO_WORLD_LYRICS_V1_FILE,
  HELLO_WORLD_PLAIN_TEXT_FILE,
  findMenuButton,
} from './utilities';

export type PlaywrightScreen = ReturnType<typeof getQueriesForElement>;
export * from './utilities';

export default (
  getDependencies: () => Promise<{
    screen: PlaywrightScreen;
    page: Page;
    isSmallLayout: boolean;
  }>
) => {
  it('shows a prompt when creating a new file with changes', async () => {
    const { screen } = await getDependencies();

    const editor = await getEditor(screen);
    await editor.type("It's snot yours like nose running.");

    expect(
      await screen.getByText("It's snot yours like nose running.")
    ).toBeTruthy();

    const newFileButton = await screen.findByRole('button', {
      name: 'New File',
    });
    await newFileButton.click();

    await expect(
      screen.findByText('Discard unsaved changes?')
    ).resolves.toBeTruthy();
  });

  it('does not show a prompt when creating a new file after loading a plain text file', async () => {
    const { screen, page } = await getDependencies();

    await dropFile(page, screen, HELLO_WORLD_PLAIN_TEXT_FILE);

    await expect(screen.findByText('Hello World!')).resolves.toBeTruthy();

    const newFileButton = await screen.findByRole('button', {
      name: 'New File',
    });
    await newFileButton.click();

    await expect(
      screen.findByText('Discard unsaved changes?')
    ).rejects.toBeTruthy();
  });

  it('does not show a prompt when creating a new file after loading a lyrics file', async () => {
    const { screen, page } = await getDependencies();

    await dropFile(page, screen, HELLO_WORLD_LYRICS_V1_FILE);

    await expect(screen.findByText('Hello World!')).resolves.toBeTruthy();

    const newFileButton = await screen.findByRole('button', {
      name: 'New File',
    });
    await newFileButton.click();

    await expect(
      screen.findByText('Discard unsaved changes?')
    ).rejects.toBeTruthy();
  });

  it('shows preferences', async () => {
    const { screen, isSmallLayout } = await getDependencies();

    const settings = await findMenuButton(
      screen,
      'Open Preferences',
      isSmallLayout
    );
    await settings.click();

    await expect(screen.findByText('Preferences')).resolves.toBeTruthy();
    await expect(screen.findByText('About Lyricistant')).resolves.toBeTruthy();

    const save = await screen.findByRole('button', { name: 'Save' });
    await save.click();

    await waitFor(async () => {
      await expect(screen.findByText('Preferences')).rejects.toBeDefined();
      await expect(
        screen.findByText('About Lyricistant')
      ).rejects.toBeDefined();
    });
  });

  it('loads v1 file history', async () => {
    const { screen, page, isSmallLayout } = await getDependencies();
    const firstLineChangeLabel = 'Jul 20, 2022, 5:28:49 PM';

    await dropFile(page, screen, BURY_ME_LOOSE_V1_FILE_HISTORY);

    await expect(screen.findByText(BURY_ME_LOOSE_LYRICS)).resolves.toBeTruthy();

    const fileHistory = await findMenuButton(
      screen,
      'View file history',
      isSmallLayout
    );
    await fileHistory.click();

    await expect(screen.findByText('File History')).resolves.toBeTruthy();
    await expect(
      screen.findByText('Jul 20, 2022, 5:29:12 PM')
    ).resolves.toBeTruthy();
    await expect(
      screen.findByText('Jul 20, 2022, 5:28:46 PM')
    ).resolves.toBeTruthy();
    await expect(
      screen.findByText('Jul 20, 2022, 5:28:08 PM')
    ).resolves.toBeTruthy();

    const firstLineChangeFileHistory = await screen.findByText(
      firstLineChangeLabel
    );

    await firstLineChangeFileHistory.click();
    await (await screen.findByText('Apply')).click();

    await expect(
      screen.findByText(BURY_ME_LOOSE_PRE_LYRICS)
    ).resolves.toBeTruthy();
  });

  it('loads v2 file history', async () => {
    const { screen, page, isSmallLayout } = await getDependencies();
    const firstLineChangeLabel = 'Jul 23, 2022, 11:02:41 AM';

    await dropFile(page, screen, BURY_ME_LOOSE_V2_FILE_HISTORY);

    await expect(screen.findByText(BURY_ME_LOOSE_LYRICS)).resolves.toBeTruthy();

    const fileHistory = await findMenuButton(
      screen,
      'View file history',
      isSmallLayout
    );
    await fileHistory.click();

    await expect(screen.findByText('File History')).resolves.toBeTruthy();
    await expect(
      screen.findByText('Jul 23, 2022, 11:02:27 AM')
    ).resolves.toBeTruthy();
    await expect(
      screen.findByText('Jul 23, 2022, 11:03:28 AM')
    ).resolves.toBeTruthy();

    const firstLineChangeFileHistory = await screen.findByText(
      firstLineChangeLabel
    );

    await firstLineChangeFileHistory.click();
    await (await screen.findByText('Apply')).click();

    await expect(
      screen.findByText(BURY_ME_LOOSE_PRE_LYRICS)
    ).resolves.toBeTruthy();
  });
};
