import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Base styles */
const ACTION_BTN = "rounded-full h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted";
const ACTION_BTN_DESTRUCTIVE = "rounded-full h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10";
const ACTION_ICON = "h-4 w-4";

export { ACTION_BTN, ACTION_BTN_DESTRUCTIVE, ACTION_ICON };

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Lucide icon component */
  icon: React.ElementType;
  /** Tooltip label — also used as aria-label */
  label?: string;
  /** Use destructive (red) hover style */
  destructive?: boolean;
  /** Extra className merged onto the button */
  className?: string;
}

/**
 * Standardized icon-only action button used across all tables and lists.
 * Wraps shadcn Button with consistent sizing, hover states, and optional tooltip.
 */
const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ icon: Icon, label, destructive = false, className, ...props }, ref) => {
    const btn = (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn(destructive ? ACTION_BTN_DESTRUCTIVE : ACTION_BTN, className)}
        aria-label={label}
        {...props}
      >
        <Icon className={ACTION_ICON} />
      </Button>
    );

    if (label) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="top" className="text-xs">{label}</TooltipContent>
        </Tooltip>
      );
    }

    return btn;
  }
);

ActionButton.displayName = "ActionButton";

export { ActionButton };
export default ActionButton;
