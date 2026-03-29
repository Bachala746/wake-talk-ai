import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  checkPermission, 
  requestPermission, 
  getRequiredPermissions, 
  permissionLabels, 
  PermissionStatus 
} from "@/lib/permissions";
import { CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";

interface PermissionCheckProps {
  challengeType: string;
  interactionMode?: string;
  compact?: boolean;
}

export const PermissionCheck = ({ challengeType, interactionMode, compact = false }: PermissionCheckProps) => {
  const [permStatuses, setPermStatuses] = useState<Record<string, PermissionStatus>>({});
  const [requesting, setRequesting] = useState<string | null>(null);

  const required = getRequiredPermissions(challengeType, interactionMode);

  useEffect(() => {
    const check = async () => {
      const statuses: Record<string, PermissionStatus> = {};
      await Promise.all(
        required.map(async (perm) => {
          statuses[perm] = await checkPermission(perm);
        })
      );
      setPermStatuses(statuses);
    };
    check();
  }, [challengeType, interactionMode]);

  const handleRequest = async (perm: 'camera' | 'microphone' | 'notifications' | 'motion' | 'storage') => {
    setRequesting(perm);
    const result = await requestPermission(perm);
    setPermStatuses(prev => ({ ...prev, [perm]: result }));
    setRequesting(null);
  };

  if (required.length === 0) return null;

  const hasDenied = required.some(p => permStatuses[p] === 'denied');
  const allGranted = required.every(p => permStatuses[p] === 'granted');

  if (compact && allGranted) return null;

  return (
    <div className={`rounded-xl border p-3 space-y-2 ${
      hasDenied 
        ? 'border-red-500/30 bg-red-500/5' 
        : allGranted 
          ? 'border-green-500/30 bg-green-500/5' 
          : 'border-amber-500/30 bg-amber-500/5'
    }`}>
      <div className="flex items-center gap-2">
        <Shield className={`h-4 w-4 shrink-0 ${
          hasDenied ? 'text-red-500' : allGranted ? 'text-green-500' : 'text-amber-500'
        }`} />
        <span className="text-xs font-semibold">
          {hasDenied ? 'Permission Required' : allGranted ? 'Permissions Ready' : 'Permissions Needed'}
        </span>
      </div>

      <div className="space-y-1.5">
        {required.map((perm) => {
          const status = permStatuses[perm];
          const info = permissionLabels[perm];
          if (!info) return null;

          return (
            <div key={perm} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-sm shrink-0">{info.icon}</span>
                <div className="min-w-0">
                  <span className="text-xs font-medium">{info.label}</span>
                  {!compact && (
                    <p className="text-[10px] text-muted-foreground truncate">{info.description}</p>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {status === 'granted' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : status === 'denied' ? (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-[10px] text-red-500">Blocked</span>
                  </div>
                ) : status === 'unsupported' ? (
                  <span className="text-[10px] text-muted-foreground">N/A</span>
                ) : (
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    className="h-6 text-[10px] px-2"
                    onClick={() => handleRequest(perm)}
                    disabled={requesting === perm}
                  >
                    {requesting === perm ? '...' : 'Allow'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasDenied && (
        <p className="text-[10px] text-red-500 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          Open your browser settings to re-enable blocked permissions
        </p>
      )}
    </div>
  );
};
