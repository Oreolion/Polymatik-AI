import {
  fireEvent,
  renderRouter,
  screen,
  within,
  waitFor,
  testRouter,
} from 'expo-router/testing-library';
import { Linking } from 'react-native';

async function view(mode: 'discover' | 'search' | 'library') {
  return within(await screen.findByTestId(`discovery-${mode}`));
}

describe('native discovery preview', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renders source attribution and explicitly session-only saving', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });
    const tab = await view('discover');
    expect(await tab.findByText('Let curiosity take the lead.')).toBeVisible();
    expect(tab.getByText('The Feynman Lectures on Physics')).toBeVisible();
    expect(tab.getByText('Archived resource')).toBeVisible();
    expect(tab.getByText(/Saves last for this app session/)).toBeVisible();
    expect(
      tab.getByRole('link', {
        name: 'Open Atoms in Motion at the original source',
      }),
    ).toBeVisible();
  }, 90_000);

  it('intersects subject and text filters and recovers from empty results', async () => {
    const rendered = await renderRouter('./src/app', { initialUrl: '/search' });
    expect(rendered.getPathname()).toBe('/search');
    const tab = await view('search');
    const search = await tab.findByLabelText('Search the preview collection');
    await fireEvent.press(tab.getByRole('button', { name: 'Computing' }));
    await fireEvent.changeText(search, 'browser');
    expect(
      tab.getByText('Populating the page: how browsers work'),
    ).toBeVisible();
    expect(tab.queryByText('Atoms in Motion')).toBeNull();
    await fireEvent.changeText(search, 'no-such-resource');
    expect(tab.getByText('A different path, perhaps?')).toBeVisible();
    await fireEvent.press(tab.getByRole('button', { name: 'Reset filters' }));
    expect(tab.getByText('Atoms in Motion')).toBeVisible();
  });

  it('shares reversible saves between Discover and Library without creating an account', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });
    const tab = await view('discover');
    await fireEvent.press(
      await tab.findByRole('button', {
        name: 'Save Atoms in Motion for this session',
      }),
    );
    await testRouter.push('/library');
    const library = within(await screen.findByTestId('discovery-library'));
    expect(library.getByText('Atoms in Motion')).toBeVisible();
    expect(library.queryByText('Seeing Theory')).toBeNull();
    await fireEvent.press(
      library.getByRole('button', {
        name: 'Remove Atoms in Motion from session Library',
      }),
    );
    expect(library.getByText('Make room for a good idea.')).toBeVisible();
    expect(tab.queryByText('Sign out')).toBeNull();
  });

  it('dismisses without deleting a save and restores the item with Undo', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });
    const tab = await view('discover');
    await fireEvent.press(
      await tab.findByRole('button', {
        name: 'Save Atoms in Motion for this session',
      }),
    );
    await fireEvent.press(
      tab.getByRole('button', { name: 'Dismiss Atoms in Motion' }),
    );
    expect(tab.queryByText('Atoms in Motion')).toBeNull();
    await fireEvent.press(tab.getByRole('button', { name: 'Undo dismissal' }));
    expect(
      tab.getByRole('button', {
        name: 'Remove Atoms in Motion from session Library',
      }).props.accessibilityState.selected,
    ).toBe(true);
  });

  it('offers Undo rather than an ineffective filter reset after setting every item aside', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });
    const tab = await view('discover');
    await tab.findByText('Let curiosity take the lead.');
    for (const title of [
      'Atoms in Motion',
      'Seeing Theory',
      'Populating the page: how browsers work',
      'The Missing Semester of Your CS Education',
    ]) {
      await fireEvent.press(
        tab.getByRole('button', { name: `Dismiss ${title}` }),
      );
    }
    expect(tab.getByText('A little room to reflect.')).toBeVisible();
    expect(tab.queryByRole('button', { name: 'Reset filters' })).toBeNull();
    await fireEvent.press(tab.getByRole('button', { name: 'Undo dismissal' }));
    expect(
      tab.getByText('The Missing Semester of Your CS Education'),
    ).toBeVisible();
  });

  it('keeps a failed original link retryable and uses only its attributed HTTPS URL', async () => {
    const open = jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValueOnce(new Error('not available'))
      .mockResolvedValueOnce(undefined);
    await renderRouter('./src/app', { initialUrl: '/' });
    const tab = await view('discover');
    await fireEvent.press(
      await tab.findByRole('link', {
        name: 'Open Atoms in Motion at the original source',
      }),
    );
    expect(
      await tab.findByText(
        'The original source could not be opened. You can retry.',
      ),
    ).toBeVisible();
    await fireEvent.press(
      tab.getByRole('button', { name: 'Retry opening Atoms in Motion' }),
    );
    await waitFor(() => expect(open).toHaveBeenCalledTimes(2));
    expect(open).toHaveBeenLastCalledWith(
      'https://www.feynmanlectures.caltech.edu/I_01.html',
    );
  });

  it('switches the shared appearance with an accessible sun/moon button', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });
    const tab = await view('discover');
    await fireEvent.press(
      await tab.findByRole('button', { name: 'Switch to dark appearance' }),
    );
    expect(
      tab.getByRole('button', { name: 'Switch to light appearance' }),
    ).toBeVisible();
    await testRouter.push('/library');
    expect(
      within(await screen.findByTestId('discovery-library')).getByRole(
        'button',
        { name: 'Switch to light appearance' },
      ),
    ).toBeVisible();
  });

  it('does not retain saves when a new app session mounts', async () => {
    const first = await renderRouter('./src/app', { initialUrl: '/' });
    const tab = await view('discover');
    await fireEvent.press(
      await tab.findByRole('button', {
        name: 'Save Atoms in Motion for this session',
      }),
    );
    await first.unmount();
    await renderRouter('./src/app', { initialUrl: '/library' });
    expect(
      (await view('library')).getByText('Make room for a good idea.'),
    ).toBeVisible();
  });
});
