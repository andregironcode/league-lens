
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: string;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange, action }) => {
  const { login } = useAuth();

  const handleLogin = () => {
    login();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create an account</DialogTitle>
          <DialogDescription>
            You need an account to {action}. Sign up to track your favorite teams, leagues, and save matches.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-3 py-4">
          <Button className="w-full bg-[#FFC30B] text-black hover:bg-[#FFC30B]/90" onClick={handleLogin}>
            Sign In / Sign Up
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => onOpenChange(false)}
          >
            Not Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
