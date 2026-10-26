import DiscoverClient from '../../discover-client';

export default function LoadingResource() {
  return <DiscoverClient resourceState={{ status: 'loading' }} />;
}
