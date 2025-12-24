import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turquoise-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-turquoise-500 text-white shadow-md hover:bg-turquoise-600 hover:shadow-lg hover:shadow-turquoise-500/25 active:bg-turquoise-700',
        destructive:
          'bg-red-500 text-white shadow-md hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25',
        outline:
          'border border-turquoise-200 dark:border-turquoise-800 bg-white dark:bg-gray-900 text-turquoise-600 dark:text-turquoise-400 hover:bg-turquoise-50 dark:hover:bg-turquoise-900/20',
        secondary:
          'bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700',
        ghost:
          'text-foreground hover:bg-gray-100 dark:hover:bg-gray-800',
        link: 'text-turquoise-600 dark:text-turquoise-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
