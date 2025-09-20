"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  isLoading?: boolean;
  className?: string;
  // No variant prop for Card component
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  isLoading = false,
  className,
  // variant removed
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case "up":
        return <TrendingUp className="h-3 w-3" />;
      case "down":
        return <TrendingDown className="h-3 w-3" />;
      case "neutral":
        return <Minus className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      case "neutral":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 text-xs">
          {description && (
            <span className="text-muted-foreground">{description}</span>
          )}
          {trend && (
            <div className={cn("flex items-center gap-1", getTrendColor())}>
              {getTrendIcon()}
              <span>{trend.value}% {trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export interface StatsGridProps {
  children: ReactNode;
  className?: string;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function StatsGrid({
  children,
  className,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
}: StatsGridProps) {
  const gridClasses = cn(
    "grid gap-4",
    columns.sm === 1 && "grid-cols-1",
    columns.sm === 2 && "grid-cols-2",
    columns.md === 1 && "sm:grid-cols-1",
    columns.md === 2 && "sm:grid-cols-2",
    columns.md === 3 && "sm:grid-cols-3",
    columns.md === 4 && "sm:grid-cols-4",
    columns.lg === 1 && "md:grid-cols-1",
    columns.lg === 2 && "md:grid-cols-2",
    columns.lg === 3 && "md:grid-cols-3",
    columns.lg === 4 && "md:grid-cols-4",
    columns.xl === 1 && "lg:grid-cols-1",
    columns.xl === 2 && "lg:grid-cols-2",
    columns.xl === 3 && "lg:grid-cols-3",
    columns.xl === 4 && "lg:grid-cols-4",
    columns.xl === 5 && "lg:grid-cols-5",
    columns.xl === 6 && "lg:grid-cols-6",
    className
  );

  return <div className={gridClasses}>{children}</div>;
}

// Loading state for multiple stat cards
export function StatsGridSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <StatsGrid className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCard
          key={i}
          title=""
          value=""
          isLoading={true}
        />
      ))}
    </StatsGrid>
  );
}

// Quick action button component for dashboard
export interface QuickActionProps {
  title: string;
  description?: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "outline" | "secondary";
}

export function QuickAction({
  title,
  description,
  icon,
  href,
  onClick,
  className,
  variant = "outline",
}: QuickActionProps) {
  const Content = () => (
    <div className="h-20 flex flex-col items-center justify-center space-y-2 text-center">
      <div className="text-primary">{icon}</div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Card className={cn("transition-all duration-200 hover:shadow-md cursor-pointer", className)}>
        <a href={href} className="block">
          <Content />
        </a>
      </Card>
    );
  }

  return (
    <Card 
      className={cn("transition-all duration-200 hover:shadow-md cursor-pointer", className)}
      onClick={onClick}
    >
      <Content />
    </Card>
  );
}