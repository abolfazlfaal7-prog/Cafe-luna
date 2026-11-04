import { useCallback, useEffect, useState } from 'react';
import { adminApi, type AdminMenu } from '@/lib/adminApi';

export type AdminMenuState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: AdminMenu };

export default function useAdminMenu(password: string) {
  const [state, setState] = useState<AdminMenuState>({ status: 'loading' });

  const refresh = useCallback(async () => {
    try {
      const data = await adminApi.listMenu(password);
      setState({ status: 'ready', data });
    } catch (error) {
      console.error('admin menu load failed', error);
      setState((previous) => (previous.status === 'ready' ? previous : { status: 'error' }));
    }
  }, [password]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, refresh };
}
