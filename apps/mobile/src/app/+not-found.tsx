import { Page } from '../components/page';
import { RouteButton } from '../components/route-button';

export default function NotFound() {
  return (
    <Page
      section="PAGE NOT FOUND"
      heading="This path has not been mapped."
      description="Return to Discover to find your way back."
    >
      <RouteButton href="/" replace>
        Back to Discover
      </RouteButton>
    </Page>
  );
}
