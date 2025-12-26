import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-turquoise-100 text-turquoise-700',
        secondary:
          'bg-gray-100 text-gray-700',
        success:
          'bg-green-100 text-green-700',
        warning:
          'bg-yellow-100 text-yellow-700',
        destructive:
          'bg-red-100 text-red-700',
        outline:
          'border border-current bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-yellow-500',
            variant === 'destructive' && 'bg-red-500',
            variant === 'default' && 'bg-turquoise-500',
            variant === 'secondary' && 'bg-gray-500',
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
