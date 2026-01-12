import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-accent text-white hover:shadow-[0_0_10px_hsl(var(--glow-purple)/0.4)]',
        secondary: 'border-transparent bg-background-muted text-foreground hover:bg-background-muted/80',
        destructive: 'border-transparent bg-error text-white',
        outline: 'text-foreground border-border hover:border-accent/50',
        success: 'border-transparent bg-success text-white',
        warning: 'border-transparent bg-warning text-white',
        gradient: 'border-transparent bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
