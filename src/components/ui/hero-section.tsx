"use client";

// import { Button } from "./button";
// import { Badge } from "./badge";
import React, { useState } from 'react';
import { ArrowRightIcon } from "lucide-react";
import { Mockup, MockupFrame } from "./mockup";
import { Glow } from "./glow";
import { useTheme } from "next-themes";
import { cn } from "../../lib/utils";
import LoginModal from '../auth/LoginModal';
import RegisterModal from '../auth/RegisterModal';

interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "default" | "glow";
  onClick?: () => void;
}

interface HeroProps {
  badge?: {
    text: string;
    action: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  actions: HeroAction[];
  image: {
    light: string;
    dark: string;
    alt: string;
  };
}

export function HeroSection({
  badge,
  title,
  description,
  actions,
  image,
}: HeroProps) {
  const { resolvedTheme } = useTheme();
  const imageSrc = resolvedTheme === "light" ? image.light : image.dark;
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleOpenRegisterModal = () => {
    setIsRegisterModalOpen(true);
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false);
  };

  const handleSwitchToRegister = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };


  return (
    <section
      className={cn(
        "bg-background text-foreground",
        "py-12 sm:py-24 md:py-32 px-4",
        "fade-bottom overflow-hidden pb-0"
      )}
    >
      <div className="mx-auto flex max-w-container flex-col gap-12 pt-16 sm:gap-24">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          {/* Badge */}

          {/* Title */}
          <h1 className="relative z-10 inline-block animate-appear bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-4xl font-semibold leading-tight text-transparent drop-shadow-2xl sm:text-6xl sm:leading-tight md:text-8xl md:leading-tight">
            {title}
          </h1>

          {/* Description */}
          <p className="text-md relative z-10 max-w-[550px] animate-appear font-medium text-muted-foreground opacity-0 delay-100 sm:text-xl">
            {description}
          </p>

          {/* Actions */}
          <div className="relative z-10 flex animate-appear justify-center opacity-0 delay-300">
            {actions.map((action, index) => (
              <a
                key={index}
                onClick={action.onClick || handleOpenLoginModal}
                href={action.href}
                className={cn(
                  "inline-flex items-center justify-center rounded-md text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                  action.variant === "default"
                    ? "bg-primary text-primary-foreground shadow hover:bg-primary/90"
                    : "bg-background text-foreground shadow hover:bg-accent hover:text-accent-foreground",
                  "h-12 px-8 py-3"
                )}
              >
                {action.icon}
                {action.text}
              </a>
            ))}
          </div>

          {/* Image with Glow */}
          <div className="relative pt-12">
            <MockupFrame
              className="animate-appear opacity-0 delay-700"
              size="small"
            >
              <Mockup type="responsive">
                <img
                  src={imageSrc}
                  alt={image.alt}
                  width={1248}
                  height={765}
                  className="w-full h-auto"
                />
              </Mockup>
            </MockupFrame>
            <Glow
              variant="top"
              className="animate-appear-zoom opacity-0 delay-1000"
            />
          </div>
        </div>
      </div>
      {isLoginModalOpen && (
        <LoginModal
          onClose={handleCloseLoginModal}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}
      {isRegisterModalOpen && (
        <RegisterModal
          onClose={handleCloseRegisterModal}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </section>
  );
}
