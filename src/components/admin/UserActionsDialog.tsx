import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { toast } from 'sonner';

interface UserActionsDialogProps {
  user: any;
  actionType:
    | 'suspend'
    | 'verify'
    | 'changeRole'
    | 'activate'
    | 'deactivate';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UserActionsDialog: React.FC<UserActionsDialogProps> = ({
  user,
  actionType,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const {
    updateUserStatus,
    updateUserVerification,
    updateUserRole,
    updateUserActivation,
    isLoading,
  } = useAdmin();

  const [reason, setReason] = useState('');
  const [selectedRole, setSelectedRole] = useState(user?.role || '');
  const [verificationStatus, setVerificationStatus] = useState(
    user?.verificationStatus || 'VERIFIED',
  );
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    try {
      switch (actionType) {
        case 'suspend':
          if (!reason.trim()) {
            toast.error('Suspension reason is required');
            return;
          }
          await updateUserStatus(user.id, 'SUSPENDED', reason);
          break;

        case 'activate':
          await updateUserActivation(user.id, true);
          break;

        case 'deactivate':
          await updateUserActivation(user.id, false);
          break;

        case 'verify':
          if (verificationStatus === 'REJECTED' && !rejectionReason.trim()) {
            toast.error('Rejection reason is required');
            return;
          }
          await updateUserVerification(
            user.id,
            verificationStatus,
            rejectionReason || undefined,
          );
          break;

        case 'changeRole':
          if (!selectedRole) {
            toast.error('Please select a role');
            return;
          }
          if (selectedRole === user.role) {
            toast.error('User already has this role');
            return;
          }
          await updateUserRole(user.id, selectedRole);
          break;
      }

      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (err) {
      // Error is already shown via toast in hook
    }
  };

  const resetForm = () => {
    setReason('');
    setSelectedRole(user?.role || '');
    setVerificationStatus(user?.verificationStatus || 'VERIFIED');
    setRejectionReason('');
  };

  const getTitle = () => {
    switch (actionType) {
      case 'suspend':
        return 'Suspend User';
      case 'activate':
        return 'Activate User';
      case 'deactivate':
        return 'Deactivate User';
      case 'verify':
        return 'Update Verification Status';
      case 'changeRole':
        return 'Change User Role';
      default:
        return 'User Action';
    }
  };

  const getDescription = () => {
    switch (actionType) {
      case 'suspend':
        return `Suspend ${user?.fullName || user?.email}. They will not be able to access the system.`;
      case 'activate':
        return `Activate ${user?.fullName || user?.email}. They will regain access to the system.`;
      case 'deactivate':
        return `Deactivate ${user?.fullName || user?.email}. They will not be able to access the system.`;
      case 'verify':
        return `Update verification status for ${user?.fullName || user?.email}.`;
      case 'changeRole':
        return `Change role for ${user?.fullName || user?.email}.`;
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-lg border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(actionType === 'suspend' || actionType === 'deactivate') && (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Suspend - Reason Input */}
          {actionType === 'suspend' && (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">
                Suspension Reason *
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                className="min-h-20 text-xs"
                required
              />
            </div>
          )}

          {/* Deactivate - Reason Input */}
          {actionType === 'deactivate' && (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">
                Deactivation Reason (Optional)
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for deactivation..."
                className="min-h-20 text-xs"
              />
            </div>
          )}

          {/* Verify - Status Toggle */}
          {actionType === 'verify' && (
            <>
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Verification Status
                </Label>
                <RadioGroup
                  value={verificationStatus}
                  onValueChange={setVerificationStatus}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2 p-2 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem
                      value="VERIFIED"
                      id="verified"
                      className="w-4 h-4"
                    />
                    <Label
                      htmlFor="verified"
                      className="text-xs font-medium cursor-pointer flex-1 m-0"
                    >
                      Verify User
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem
                      value="REJECTED"
                      id="rejected"
                      className="w-4 h-4"
                    />
                    <Label
                      htmlFor="rejected"
                      className="text-xs font-medium cursor-pointer flex-1 m-0"
                    >
                      Reject User
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {verificationStatus === 'REJECTED' && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Rejection Reason *
                  </Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this user is being rejected..."
                    className="min-h-20 text-xs"
                    required
                  />
                </div>
              )}
            </>
          )}

          {/* Change Role - Dropdown */}
          {actionType === 'changeRole' && (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">
                New Role
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-9 text-xs rounded-md border-slate-200">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="INVESTOR">Investor</SelectItem>
                  <SelectItem value="CLUSTER_REP">Cluster Rep</SelectItem>
                  <SelectItem value="FARMER">Farmer</SelectItem>
                </SelectContent>
              </Select>
              {selectedRole && selectedRole !== user?.role && (
                <p className="text-xs text-slate-500">
                  Current role: <span className="font-semibold">{user?.role}</span>
                </p>
              )}
            </div>
          )}

          {/* Activation Confirmation */}
          {(actionType === 'activate' || actionType === 'deactivate') && (
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-600">
                {actionType === 'activate'
                  ? 'This user will be able to log in and access the system again.'
                  : 'This user will not be able to log in or access the system.'}
              </p>
            </div>
          )}
        </form>

        <DialogFooter className="pt-4 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-md border-slate-200"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn(
              'rounded-md font-bold',
              (actionType === 'suspend' || actionType === 'deactivate') &&
                'bg-red-600 hover:bg-red-700',
              (actionType === 'verify' || actionType === 'activate') &&
                'bg-primary hover:bg-primary/90',
              actionType === 'changeRole' && 'bg-primary hover:bg-primary/90',
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              getTitle().split(' ')[0]
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
