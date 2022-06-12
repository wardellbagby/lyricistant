import { Page } from 'playwright';
import { getQueriesForElement, waitFor } from 'playwright-testing-library';
import {
  dropFile,
  getEditor,
  HELLO_WORLD_LYRICS_V1_FILE,
  HELLO_WORLD_PLAIN_TEXT_FILE,
  queryMenuButton,
} from './utilities';

export type PlaywrightScreen = ReturnType<typeof getQueriesForElement>;
export * from './utilities';

export default (
  getDependencies: () => Promise<{
    screen: PlaywrightScreen;
    page: Page;
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
      screen.queryByText('Discard unsaved changes?')
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
      screen.queryByText('Discard unsaved changes?')
    ).resolves.toBeNull();
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
      screen.queryByText('Discard unsaved changes?')
    ).resolves.toBeNull();
  });

  it('shows preferences', async () => {
    const { screen } = await getDependencies();

    const settings = await queryMenuButton(screen, 'Open Preferences');
    await settings.click();

    await expect(screen.queryByText('Preferences')).resolves.toBeTruthy();
    await expect(screen.queryByText('About Lyricistant')).resolves.toBeTruthy();

    const save = await screen.findByRole('button', { name: 'Save' });
    await save.click();

    await waitFor(async () => {
      await expect(screen.queryByText('Preferences')).resolves.toBeNull();
      await expect(screen.queryByText('About Lyricistant')).resolves.toBeNull();
    });
  });
};
