import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles } from "lucide-react";
import genieLamp from "@/assets/genie-lamp.png";

const ProviderSuccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="glass-card rounded-2xl p-8 md:p-12 shadow-xl text-center">
          {/* Success Icon with Glow Animation */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative inline-flex mb-6"
          >
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
              <CheckCircle className="w-14 h-14 text-primary-foreground" />
            </div>
          </motion.div>

          {/* Celebratory Sparkles */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Welcome to Home Genie!
            </h1>
            <Sparkles className="w-6 h-6 text-primary animate-pulse delay-500" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <img 
              src={genieLamp} 
              alt="Genie Lamp" 
              className="w-12 h-12 object-contain"
            />
            <p className="text-2xl font-semibold text-primary">
              You're Now a Service Provider
            </p>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto"
          >
            🎉 Congratulations! You've successfully joined Home Genie as a trusted service provider. 
            You can now log in using your registered email and password to access your provider dashboard.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="space-y-4 max-w-md mx-auto"
          >
            <Link to="/login" className="block">
              <Button 
                size="lg" 
                className="w-full btn-glow text-lg"
              >
                Go to Login
              </Button>
            </Link>
            
            <Link to="/" className="block">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full border-2 hover:bg-accent/50"
              >
                Back to Home
              </Button>
            </Link>
          </motion.div>

          {/* Additional Info */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-8 pt-6 border-t border-border"
          >
            <p className="text-sm text-muted-foreground">
              Questions? Need help getting started?{" "}
              <Link to="/" className="text-primary font-medium hover:underline">
                Visit our Help Center
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProviderSuccess;
