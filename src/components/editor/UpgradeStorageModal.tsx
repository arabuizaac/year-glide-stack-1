import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, ArrowLeft, CreditCard, HardDrive, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UpgradeStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onUpgradeComplete?: () => void;
}

interface PaymentPlan {
  id: string;
  name: string;
  storage_limit: number;
  price_kes: number;
  display_order: number;
}

type Step = "plans" | "checkout";

export const UpgradeStorageModal = ({
  isOpen,
  onClose,
  userId,
  onUpgradeComplete,
}: UpgradeStorageModalProps) => {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [step, setStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      setStep("plans");
      setSelectedPlan(null);
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load payment plans.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatStorage = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb} GB`;
  };

  const handleChoosePlan = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
    setStep("checkout");
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not logged in", description: "Please log in to upgrade your storage.", variant: "destructive" });
        return;
      }

      const res = await fetch("/api/pesapal/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          amountKes: selectedPlan.price_kes,
          userId: user.id,
          userEmail: user.email || "",
          userName:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "Kiko User",
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Payment initiation failed");
      }

      if (!data.redirectUrl) {
        throw new Error("No redirect URL received from payment gateway");
      }

      localStorage.setItem("pending_payment_ref", data.merchantReference);
      localStorage.setItem(
        "pending_payment_data",
        JSON.stringify({
          orderTrackingId: data.orderTrackingId,
          merchantReference: data.merchantReference,
          planId: selectedPlan.id,
          userId: user.id,
          amountKes: selectedPlan.price_kes,
        })
      );

      window.location.href = data.redirectUrl;
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to start payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "checkout" && (
              <button
                onClick={() => setStep("plans")}
                className="mr-1 p-1 rounded hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <HardDrive className="w-5 h-5" />
            {step === "plans" ? "Upgrade Storage" : "Checkout"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "plans" && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-6">
                    Choose a plan to expand your Kiko storage capacity.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {plans.map((plan, i) => (
                      <Card
                        key={plan.id}
                        className={`relative transition-all duration-200 hover:shadow-md cursor-pointer border-2 ${
                          i === 1
                            ? "border-primary shadow-sm"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => handleChoosePlan(plan)}
                      >
                        {i === 1 && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-0.5 rounded-full">
                            Popular
                          </div>
                        )}
                        <CardHeader className="pb-2 pt-5">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-bold">
                              KES {plan.price_kes.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">/month</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <span className="text-sm font-medium">
                              {formatStorage(plan.storage_limit)} storage
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <span className="text-sm">Unlimited uploads</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <span className="text-sm">All media types</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <span className="text-sm">Priority support</span>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChoosePlan(plan);
                            }}
                            className="w-full mt-2"
                            variant={i === 1 ? "default" : "outline"}
                          >
                            Choose Plan
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-6 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      All payments are processed securely through Pesapal. You will be
                      redirected to complete payment.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {step === "checkout" && selectedPlan && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <p className="text-sm text-muted-foreground">
                Review your selected plan before proceeding to secure payment.
              </p>

              {/* Order Summary */}
              <div className="rounded-xl border bg-muted/30 divide-y">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="text-sm font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <span className="text-sm font-semibold">
                    {formatStorage(selectedPlan.storage_limit)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Billing period</span>
                  <span className="text-sm font-semibold">Monthly</span>
                </div>
                <div className="flex items-center justify-between px-4 py-4">
                  <span className="text-base font-semibold">Total due today</span>
                  <span className="text-lg font-bold text-primary">
                    KES {selectedPlan.price_kes.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment options */}
              <div className="rounded-xl border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="w-4 h-4" />
                  Payment Options
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You'll be redirected to Pesapal's secure checkout where you can pay with:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-1">
                  <li>• Credit or Debit Card (Visa, Mastercard)</li>
                  <li>• M-Pesa mobile money</li>
                  <li>• Airtel Money</li>
                  <li>• Other available methods</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleProceedToPayment}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting to payment…
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Proceed to Payment — KES {selectedPlan.price_kes.toLocaleString()}
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStep("plans")}
                  disabled={isProcessing}
                  className="w-full text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>

              <div className="flex items-center gap-2 justify-center">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Secured by Pesapal — your payment info is never stored here.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
