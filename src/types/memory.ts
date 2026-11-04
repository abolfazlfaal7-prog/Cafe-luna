export type MemoryStatus = 'pending' | 'approved' | 'rejected';

export type Memory = {
  id: string;
  customer_name: string;
  caption: string;
  image_url: string;
  status: MemoryStatus;
  created_at: string;
  reviewed_at: string | null;
};

export type PublicMemory = Pick<Memory, 'id' | 'customer_name' | 'caption' | 'image_url' | 'created_at'>;
