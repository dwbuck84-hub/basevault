import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

export const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof window !== 'undefined' && url && key && url.startsWith('http')) {
    supabaseInstance = createClient(url, key);
    return supabaseInstance;
  }

  // A typed fake client structure to make the TypeScript compiler perfectly happy during build
  const mockClient = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
    channel: () => ({
      on: () => ({
        subscribe: () => ({}),
      }),
    }),
    removeChannel: () => ({}),
  } as unknown as SupabaseClient;

  return mockClient;
};

// Export an explicit SupabaseClient proxy instance
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabase() as any;
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
