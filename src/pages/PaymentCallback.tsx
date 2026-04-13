import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "verifying" | "success" | "failed" | "pending";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verifying");
  const [planName, setPlanName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const orderTrackingId = searchParams.get("OrderTrackingId");
    const merchantReference = searchParams.get("OrderMerchantReference") || searchParams.get("ref");
    const planId = searchParams.get("planId");
    const userId = searchParams.get("userId");
    const amountKes = Number(searchParams.get("amount") || "0");

    if (!orderTrackingId || !merchantReference || !planId || !userId) {
      setStatus("failed");
      setErrorMsg("Missing payment information. Please try again.");
      return;
    }

    verify(orderTrackingId, merchantReference, planId, userId, amountKes);
  }, []);

  const verify = async (
    orderTrackingId: string,
    merchantReference: string,
    planId: string,
    userId: string,
    amountKes: number
  ) => {
    try {
      const res = await fetch("/api/pesapal/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderTrackingId, merchantReference, userId, planId, amountKes }),
      });
      const data = await res.json();

      if (data.status === "completed") {
        setPlanName(data.planName || "");
        setStatus("success");
        localStorage.removeItem("pending_payment_ref");
        localStorage.removeItem("pending_payment_data");
      } else if (data.status === "pending") {
        setStatus("pending");
      } else {
        setStatus("failed");
        setErrorMsg("Payment was not completed. Please try again.");
      }
    } catch (err: any) {
      setStatus("failed");
      setErrorMsg(err.message || "Verification failed. Please contact support.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {status === "verifying" && (
          <>
            <Loader2 className="w-16 h-16 text-white/60 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">Verifying Payment</h1>
            <p className="text-white/60">Please wait while we confirm your payment…</p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
            {planName && (
              <p className="text-white/80 mb-1">
                Your <strong>{planName}</strong> plan is now active.
              </p>
            )}
            <p className="text-white/60 mb-8">Your storage has been upgraded. Enjoy Kiko!</p>
            <Button
              onClick={() => navigate("/editor?section=storage")}
              className="w-full bg-white text-neutral-900 hover:bg-white/90 font-semibold py-3 rounded-xl"
            >
              View Storage Dashboard
            </Button>
          </>
        )}

        {status === "pending" && (
          <>
            <Loader2 className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">Payment Processing</h1>
            <p className="text-white/60 mb-8">
              Your payment is being processed. Your storage will be updated shortly.
            </p>
            <Button
              onClick={() => navigate("/editor?section=storage")}
              className="w-full bg-white/20 text-white hover:bg-white/30 font-semibold py-3 rounded-xl"
            >
              Go to Dashboard
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
            <p className="text-white/60 mb-8">
              {errorMsg || "Payment failed. Please try again."}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/editor?section=storage")}
                className="w-full bg-white text-neutral-900 hover:bg-white/90 font-semibold py-3 rounded-xl"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="w-full text-white/60 hover:text-white"
              >
                Back to Home
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentCallback;
