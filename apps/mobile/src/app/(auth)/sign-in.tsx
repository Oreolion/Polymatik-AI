import { Page } from '../../components/page';
import { RouteButton } from '../../components/route-button';

export default function SignIn() {
  return (
    <Page
      section="ACCOUNT"
      heading="Sign-in is not available yet."
      description="You can explore the app without sharing any account details. We will ask for those only when secure sign-in is ready."
    >
      <RouteButton href="/" replace>
        Back to Discover
      </RouteButton>
    </Page>
  );
}
