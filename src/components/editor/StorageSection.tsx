import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { HardDrive, Zap } from "lucide-react";
import { UpgradeStorageModal } from "./UpgradeStorageModal";

interface StorageSectionProps {
  userId: string;
}

interface StorageData {
  storage_used: number;
  storage_limit: number;
}

interface CurrentPlan {
  name: string;
  price_kes: number;
}

export const StorageSection = ({ userId }: StorageSectionProps) => {
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStorageData();
    fetchCurrentPlan();
  }, [userId]);

  const fetchStorageData = async () => {
    try {
      const { data, error } = await supabase
        .from("user_storage")
        .select("storage_used, storage_limit")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create initial storage record if it doesn't exist
        const { data: newData, error: insertError } = await supabase
          .from("user_storage")
          .insert({ user_id: userId })
          .select("storage_used, storage_limit")
          .single();

        if (insertError) throw insertError;
        setStorageData(newData);
      } else {
        setStorageData(data);
      }
    } catch (error) {
      console.error("Error fetching storage data:", error);
      toast({
        title: "Error",
        description: "Failed to load storage information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      const { data: payments, error } = await supabase
        .from("user_payments")
        .select(`
          payment_plans (
            name,
            price_kes
          )
        `)
        .eq("user_id", userId)
        .eq("payment_status", "completed")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (payments && payments.length > 0 && payments[0].payment_plans) {
        setCurrentPlan(payments[0].payment_plans as CurrentPlan);
      }
    } catch (error) {
      console.error("Error fetching current plan:", error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 GB";
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const getUsagePercentage = () => {
    if (!storageData) return 0;
    return (storageData.storage_used / storageData.storage_limit) * 100;
  };

  const isStorageFull = () => {
    if (!storageData) return false;
    return storageData.storage_used >= storageData.storage_limit;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading storage information...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used Storage</span>
              <span className="font-medium">
                {storageData && `${formatBytes(storageData.storage_used)} / ${formatBytes(storageData.storage_limit)}`}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage()} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{getUsagePercentage().toFixed(1)}% used</span>
              <span>{storageData && formatBytes(storageData.storage_limit - storageData.storage_used)} remaining</span>
            </div>
          </div>

          {isStorageFull() && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Storage full. Upgrade to continue uploading.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-semibold text-lg">
                {currentPlan ? currentPlan.name : "Free"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Storage Limit</span>
              <span className="font-medium">
                {storageData && formatBytes(storageData.storage_limit)}
              </span>
            </div>
            {currentPlan && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="font-medium">{currentPlan.price_kes} KES/month</span>
              </div>
            )}
          </div>

          <Button 
            onClick={() => setIsUpgradeModalOpen(true)}
            className="w-full"
            size="lg"
          >
            {currentPlan ? "Change Plan" : "Upgrade Storage"}
          </Button>
        </CardContent>
      </Card>

      <UpgradeStorageModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        userId={userId}
        onUpgradeComplete={fetchStorageData}
      />
    </div>
  );
};
