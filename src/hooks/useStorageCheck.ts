import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StorageCheckResult {
  canUpload: boolean;
  storageUsed: number;
  storageLimit: number;
  isLoading: boolean;
  checkStorage: () => Promise<boolean>;
}

export const useStorageCheck = (userId: string | undefined): StorageCheckResult => {
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchStorageData();
    }
  }, [userId]);

  const fetchStorageData = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_storage')
        .select('storage_used, storage_limit')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStorageUsed(data.storage_used);
        setStorageLimit(data.storage_limit);
      } else {
        // Initialize storage record if it doesn't exist
        const { data: newData, error: insertError } = await supabase
          .from('user_storage')
          .insert({ user_id: userId })
          .select('storage_used, storage_limit')
          .single();

        if (insertError) throw insertError;
        
        setStorageUsed(newData.storage_used);
        setStorageLimit(newData.storage_limit);
      }
    } catch (error) {
      console.error('Error fetching storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkStorage = async (): Promise<boolean> => {
    if (!userId) return false;

    await fetchStorageData();

    if (storageUsed >= storageLimit) {
      toast({
        title: "Storage Full",
        description: "⚠️ Your storage is full. Please upgrade to continue uploading.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return {
    canUpload: storageUsed < storageLimit,
    storageUsed,
    storageLimit,
    isLoading,
    checkStorage,
  };
};
