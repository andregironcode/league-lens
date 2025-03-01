
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { PencilIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    showEditButton?: boolean;
    onEditClick?: () => void;
  }
>(({ className, showEditButton, onEditClick, ...props }, ref) => (
  <div className="relative">
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
    {showEditButton && (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onEditClick?.();
        }}
        className="absolute bottom-0 right-0 rounded-full bg-[#FFC30B] p-1 shadow-md hover:bg-[#FFC30B]/90 transition-colors"
        aria-label="Edit profile picture"
      >
        <PencilIcon className="h-3 w-3 text-black" />
      </button>
    )}
  </div>
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    outlineStyle?: boolean;
  }
>(({ className, outlineStyle, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full",
      outlineStyle ? "bg-transparent border-2 border-white/70" : "bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Default exported profile image
export const DefaultProfileImage = "/lovable-uploads/ac6298d0-43ac-4a0f-81dd-365461281e5b.png"

export { Avatar, AvatarImage, AvatarFallback }
