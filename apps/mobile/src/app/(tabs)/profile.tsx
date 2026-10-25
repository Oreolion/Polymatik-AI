import { Page } from '../../components/page';
import { RouteButton } from '../../components/route-button';

export default function Profile() {
  return (
    <Page
      section="PROFILE"
      heading="Your learning, on your terms."
      description="Your interests, saved resources and memory belong to you. Sign-in is not available yet; no account information is collected here."
    >
      <RouteButton href="/sign-in">Sign in</RouteButton>
    </Page>
  );
}
