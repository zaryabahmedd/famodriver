import { Jobs } from '@/components/jobs';
import { OfflineGuard } from '@/components/offline-guard';

export default function JobsScreen() {
  return (
    <OfflineGuard>
      <Jobs />
    </OfflineGuard>
  );
}
