import { Button } from "@/components/ui/button";
import { Loader2, Receipt, RefreshCw, Shield, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const { actor } = useActor();
  const [resetting, setResetting] = useState(false);

  async function handleResetAdminClaim() {
    if (!actor) {
      toast.error("Backend not ready. Please wait a moment and try again.");
      return;
    }
    setResetting(true);
    try {
      await actor.resetAdminClaim();
      toast.success(
        "Admin claim reset. Reload to see the Claim Admin Access screen.",
      );
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.error("Failed to reset admin claim.");
      console.error(e);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-md">
            <Receipt className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-foreground">
              InvoicePro
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Thermal invoice management
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          {[
            {
              icon: Zap,
              title: "Instant Thermal Print",
              desc: "Optimized for 80mm thermal paper",
            },
            {
              icon: Shield,
              title: "Secure & Private",
              desc: "Your data is isolated and protected",
            },
            {
              icon: Users,
              title: "Multi-User Support",
              desc: "Admin control over user access",
            },
          ].map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sign in */}
        <div className="space-y-3">
          <Button
            data-ocid="login.primary_button"
            onClick={login}
            disabled={isLoggingIn}
            className="w-full h-12 text-base rounded-xl"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" /> Sign in with Internet
                Identity
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center px-2">
            New users require admin approval before accessing the system.
          </p>
        </div>

        {/* Reset admin claim */}
        <div className="flex justify-center">
          <button
            type="button"
            data-ocid="login.button"
            onClick={handleResetAdminClaim}
            disabled={resetting}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors disabled:opacity-40"
          >
            {resetting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Reset Admin Claim
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline hover:text-muted-foreground"
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
