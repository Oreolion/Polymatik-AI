import DiscoverClient from '../../discover-client';

export default function ResourceNotFound() {
  return <DiscoverClient resourceState={{ status: 'not-found' }} />;
}
