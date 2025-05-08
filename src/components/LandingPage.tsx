import React from 'react';
import { HeroSection } from './ui/hero-section';
import { Icons } from './ui/icons';
import { useAuthStore } from '../store/authStore';

export function LandingPage() {
  const { enableGuestMode } = useAuthStore();

  return (
    <HeroSection
      badge={{
        text: "Organize your wishes in one place",
        action: {
          text: "Learn more",
          href: "#features",
        },
      }}
      title="Your Ultimate Wishlist Manager"
      description="Create, organize, and share your wishlists effortlessly. Track prices, get notifications, and collaborate with friends and family."
      actions={[
        {
          text: "Get Started",
          href: "/dashboard",
          variant: "default",
          onClick: () => {
            // Set a flag in session storage to indicate we're coming from landing page
            sessionStorage.setItem('from_landing', 'true');
            // Enable guest mode
            enableGuestMode();
            window.location.href = '/dashboard';
          }
        },
      ]}
      image={{
        light: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&q=80",
        dark: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&q=80",
        alt: "WishList App Preview",
      }}
    />
  );
}
