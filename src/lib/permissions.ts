// Permission utilities for challenge features

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface PermissionResult {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  notifications: PermissionStatus;
  motion: PermissionStatus;
}

// Check a single permission without triggering a prompt
export const checkPermission = async (name: 'camera' | 'microphone' | 'notifications' | 'motion'): Promise<PermissionStatus> => {
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
        // iOS - can't check without prompting, assume prompt
        return 'prompt';
      }
      // Android/desktop - generally available without permission
      return 'granted';
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
        // Permissions API may not support camera/microphone on all browsers
        return 'prompt';
      }
    }
    return 'prompt';
  } catch {
    return 'prompt';
  }
};

// Request a specific permission (triggers browser prompt)
export const requestPermission = async (name: 'camera' | 'microphone' | 'notifications' | 'motion'): Promise<PermissionStatus> => {
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

    return 'prompt';
  } catch {
    return 'denied';
  }
};

// Get required permissions for a given challenge type
export const getRequiredPermissions = (challengeType: string, interactionMode?: string): ('camera' | 'microphone' | 'notifications' | 'motion')[] => {
  const perms: ('camera' | 'microphone' | 'notifications' | 'motion')[] = [];

  // Camera-based challenges
  if (['qrcode', 'barcode'].includes(challengeType)) {
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

  // Motion-based challenges
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

// Permission display labels
export const permissionLabels: Record<string, { label: string; icon: string; description: string }> = {
  camera: {
    label: 'Camera',
    icon: '📷',
    description: 'Required for scanning QR codes and barcodes',
  },
  microphone: {
    label: 'Microphone',
    icon: '🎙️',
    description: 'Required for voice challenges and AI conversation',
  },
  notifications: {
    label: 'Notifications',
    icon: '🔔',
    description: 'Recommended for alarm alerts when app is in background',
  },
  motion: {
    label: 'Motion Sensors',
    icon: '📱',
    description: 'Required for shake and step counting challenges',
  },
};
