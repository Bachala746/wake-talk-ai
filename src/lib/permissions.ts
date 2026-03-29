// Permission utilities for challenge features

export type PermissionType = 'camera' | 'microphone' | 'notifications' | 'motion' | 'storage';
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface PermissionResult {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  notifications: PermissionStatus;
  motion: PermissionStatus;
  storage: PermissionStatus;
}

// Check a single permission without triggering a prompt
export const checkPermission = async (name: PermissionType): Promise<PermissionStatus> => {
  try {
    if (name === 'notifications') {
      if (!('Notification' in window)) return 'unsupported';
      const perm = Notification.permission;
      if (perm === 'granted') return 'granted';
      if (perm === 'denied') return 'denied';
      return 'prompt';
    }

    if (name === 'motion') {
      if (typeof DeviceMotionEvent === 'undefined') return 'unsupported';
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        return 'prompt';
      }
      return 'granted';
    }

    if (name === 'storage') {
      if (navigator.storage && navigator.storage.persist) {
        const persisted = await navigator.storage.persisted();
        return persisted ? 'granted' : 'prompt';
      }
      return 'unsupported';
    }

    // Camera and microphone - use Permissions API if available
    if ('permissions' in navigator) {
      try {
        const permName = name === 'camera' ? 'camera' : 'microphone';
        const result = await navigator.permissions.query({ name: permName as PermissionName });
        if (result.state === 'granted') return 'granted';
        if (result.state === 'denied') return 'denied';
        return 'prompt';
      } catch {
        return 'prompt';
      }
    }
    return 'prompt';
  } catch {
    return 'prompt';
  }
};

// Request a specific permission (triggers browser prompt)
export const requestPermission = async (name: PermissionType): Promise<PermissionStatus> => {
  try {
    if (name === 'camera') {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      return 'granted';
    }

    if (name === 'microphone') {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return 'granted';
    }

    if (name === 'notifications') {
      if (!('Notification' in window)) return 'unsupported';
      const result = await Notification.requestPermission();
      return result === 'granted' ? 'granted' : 'denied';
    }

    if (name === 'motion') {
      if (typeof DeviceMotionEvent === 'undefined') return 'unsupported';
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const result = await (DeviceMotionEvent as any).requestPermission();
        return result === 'granted' ? 'granted' : 'denied';
      }
      return 'granted';
    }

    if (name === 'storage') {
      if (navigator.storage && navigator.storage.persist) {
        const granted = await navigator.storage.persist();
        return granted ? 'granted' : 'denied';
      }
      return 'unsupported';
    }

    return 'prompt';
  } catch {
    return 'denied';
  }
};

// Get required permissions for a given challenge type
export const getRequiredPermissions = (challengeType: string, interactionMode?: string): PermissionType[] => {
  const perms: PermissionType[] = [];

  // Always require notifications for alarm functionality
  perms.push('notifications');

  // Persistent storage for alarm data
  perms.push('storage');

  // Camera-based challenges (mandatory)
  if (['qrcode', 'barcode', 'objectVerify'].includes(challengeType)) {
    perms.push('camera');
  }

  // Microphone-based challenges
  if (challengeType === 'speakMatch') {
    perms.push('microphone');
  }

  // Voice interaction modes need microphone
  if (interactionMode === 'two-way' || interactionMode === 'realtime') {
    perms.push('microphone');
  }

  // Motion-based challenges (optional accelerometer)
  if (['shake', 'steps'].includes(challengeType)) {
    perms.push('motion');
  }

  return [...new Set(perms)]; // deduplicate
};

// Check all required permissions for a challenge
export const checkRequiredPermissions = async (
  challengeType: string,
  interactionMode?: string
): Promise<{ allGranted: boolean; results: Record<string, PermissionStatus>; missing: string[] }> => {
  const required = getRequiredPermissions(challengeType, interactionMode);
  const results: Record<string, PermissionStatus> = {};
  const missing: string[] = [];

  await Promise.all(
    required.map(async (perm) => {
      const status = await checkPermission(perm);
      results[perm] = status;
      if (status === 'denied') {
        missing.push(perm);
      }
    })
  );

  return {
    allGranted: missing.length === 0,
    results,
    missing,
  };
};

// Check if camera is mandatory for a challenge type
export const isCameraMandatory = (challengeType: string): boolean => {
  return ['qrcode', 'barcode', 'objectVerify'].includes(challengeType);
};

// Permission display labels
export const permissionLabels: Record<string, { label: string; icon: string; description: string }> = {
  camera: {
    label: 'Camera',
    icon: '📷',
    description: 'Mandatory for scanning QR codes, barcodes, and verifying objects',
  },
  microphone: {
    label: 'Microphone',
    icon: '🎙️',
    description: 'Required for voice challenges and AI conversation',
  },
  notifications: {
    label: 'Notifications',
    icon: '🔔',
    description: 'Required for alarm alerts when app is in background',
  },
  motion: {
    label: 'Motion Sensors',
    icon: '📱',
    description: 'Optional for shake and step counting challenges',
  },
  storage: {
    label: 'Persistent Storage',
    icon: '💾',
    description: 'Required to keep alarm data saved across sessions',
  },
};
