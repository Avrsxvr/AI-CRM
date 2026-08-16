'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/Toast';

export default function RealtimeNotifications() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    async function getUserOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users').select('organization_id').eq('id', user.id).single();
        if (data) setOrgId(data.organization_id);
      }
    }
    getUserOrg();
  }, [supabase]);

  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `organization_id=eq.${orgId}`
        },
        (payload) => {
          const notif = payload.new as any;
          // Only show toast if it hasn't been read
          if (!notif.read) {
            addToast('info', `🔔 ${notif.title}: ${notif.message.substring(0, 50)}...`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, supabase, addToast]);

  return null;
}
