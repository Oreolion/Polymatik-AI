import {
  fireEvent,
  renderRouter,
  screen,
  within,
  waitFor,
} from 'expo-router/testing-library';

describe('mobile route boundaries', () => {
  // The first render compiles lazy native SDK modules in a cold Jest cache.
  // Query deadlines remain unchanged; this bounds the full startup/navigation check.
  it('opens Profile, follows sign-in, and returns to Discover without creating a session', async () => {
    const rendered = await renderRouter('./src/app', {
      initialUrl: '/profile',
    });
    expect(
      await screen.findByText('Your learning, on your terms.'),
    ).toBeVisible();
    await fireEvent.press(
      within(screen.getByTestId('page-profile')).getByRole('link', {
        name: 'Sign in',
      }),
    );
    expect(
      await screen.findByText('Sign-in is not available yet.'),
    ).toBeVisible();
    expect(rendered.getPathname()).toBe('/sign-in');
    expect(screen.queryByRole('textbox')).toBeNull();
    await fireEvent.press(
      screen.getByRole('link', { name: 'Back to Discover' }),
    );
    expect(
      await screen.findByText('Let curiosity take the lead.'),
    ).toBeVisible();
    expect(rendered.getPathname()).toBe('/');
  }, 90_000);

  it.each([
    ['/search', 'What are you curious about?'],
    ['/library', 'Keep a thought for later.'],
    ['/learn', 'Make room for understanding.'],
    ['/profile', 'Your learning, on your terms.'],
  ])('opens the %s tab by deep link', async (path, heading) => {
    const rendered = await renderRouter('./src/app', { initialUrl: path });
    expect(await screen.findByText(heading)).toBeVisible();
    expect(rendered.getPathname()).toBe(path);
  });

  it('rejects a fabricated sign-in parameter as a session', async () => {
    await renderRouter('./src/app', {
      initialUrl: '/sign-in?authenticated=true&user_id=forged',
    });
    expect(
      await screen.findByText('Sign-in is not available yet.'),
    ).toBeVisible();
    expect(screen.queryByText('Sign out')).toBeNull();
  });

  it('offers a recovery link for an unknown route', async () => {
    const rendered = await renderRouter('./src/app', {
      initialUrl: '/missing-route',
    });
    expect(
      await screen.findByText('This path has not been mapped.'),
    ).toBeVisible();
    await fireEvent.press(
      screen.getByRole('link', { name: 'Back to Discover' }),
    );
    await waitFor(() => expect(rendered.getPathname()).toBe('/'));
    expect(
      await screen.findByText('Let curiosity take the lead.'),
    ).toBeVisible();
  });
});
