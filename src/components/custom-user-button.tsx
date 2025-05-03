'use client';

import { useUser } from '@stackframe/stack';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CustomUserButtonProps {
  onSignOut: () => void;
}

export function CustomUserButton({ onSignOut }: CustomUserButtonProps) {
  const user = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  // Get the first letter of the display name or email for the avatar fallback
  const getInitials = () => {
    if (user.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    } else if (user.primaryEmail) {
      return user.primaryEmail.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none">
          <Avatar className="h-8 w-8 cursor-pointer">
            {user.profileImageUrl ? (
              <AvatarImage src={user.profileImageUrl} alt={user.displayName || 'User'} />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground text-red-500">
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium">{user.displayName || 'User'}</p>
          <p className="text-xs text-muted-foreground truncate">{user.primaryEmail}</p>
        </div>
        <DropdownMenuItem
          onClick={() => {
            setOpen(false);
            router.push('/dashboard/settings');
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>App Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
