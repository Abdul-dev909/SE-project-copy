import { ReactNode } from "react";
import genieLamp from "@/assets/genie-lamp.png";

interface AuthLayoutProps {
  children: ReactNode;
  backgroundImage?: string;
}

const AuthLayout = ({ children, backgroundImage }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Image with Overlay and Gentle Motion */}
      {backgroundImage && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-pan"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/92 via-background/88 to-background/92" />
        </>
      )}
      
      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img 
              src={genieLamp} 
              alt="Genie Lamp" 
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-3xl font-semibold text-primary">
              Home Genie
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Local Odd Jobs & Service Finder
          </p>
        </div>

        {/* Content Card */}
        <div className="glass-card rounded-2xl p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
