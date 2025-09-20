"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Header } from "./header";
import { Footer } from "./footer";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  footerVariant?: "default" | "minimal";
  headerProps?: {
    showSearch?: boolean;
    showNotifications?: boolean;
  };
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
}

export function PageLayout({
  children,
  title,
  description,
  className,
  showHeader = true,
  showFooter = true,
  footerVariant = "minimal",
  headerProps = {},
  maxWidth = "full",
  padding = "md",
}: PageLayoutProps) {
  const containerClasses = cn(
    "min-h-screen flex flex-col",
    className
  );

  const mainClasses = cn(
    "flex-1",
    maxWidth === "sm" && "max-w-sm mx-auto",
    maxWidth === "md" && "max-w-md mx-auto",
    maxWidth === "lg" && "max-w-lg mx-auto",
    maxWidth === "xl" && "max-w-xl mx-auto",
    maxWidth === "2xl" && "max-w-2xl mx-auto",
    maxWidth === "full" && "w-full",
    padding === "none" && "p-0",
    padding === "sm" && "p-4",
    padding === "md" && "p-6",
    padding === "lg" && "p-8"
  );

  return (
    <div className={containerClasses}>
      {showHeader && (
        <Header 
          title={title} 
          {...headerProps} 
        />
      )}
      
      <main className={mainClasses}>
        {title && !showHeader && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
        )}
        
        {children}
      </main>
      
      {showFooter && <Footer variant={footerVariant} />}
    </div>
  );
}

// Specialized layout for dashboard pages
export function DashboardPageLayout({
  children,
  title,
  description,
  className,
  actions,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h1 className="text-3xl font-bold">{title}</h1>}
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// Layout for forms and data entry
export function FormLayout({
  children,
  title,
  description,
  className,
  maxWidth = "2xl",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {(title || description) && (
        <div className="text-center space-y-2">
          {title && <h1 className="text-3xl font-bold">{title}</h1>}
          {description && (
            <p className="text-muted-foreground max-w-2xl mx-auto">{description}</p>
          )}
        </div>
      )}
      
      <div className={cn(
        "mx-auto",
        maxWidth === "sm" && "max-w-sm",
        maxWidth === "md" && "max-w-md",
        maxWidth === "lg" && "max-w-lg",
        maxWidth === "xl" && "max-w-xl",
        maxWidth === "2xl" && "max-w-2xl"
      )}>
        {children}
      </div>
    </div>
  );
}