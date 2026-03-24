import { Injectable, inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { ApiService } from './api.service';

export type AppRole = 'owner' | 'admin' | 'operator' | 'viewer';

export interface StatusEntryPoint {
  label: string;
  href: string | null;
  description: string;
  allowed: boolean;
}

export interface CurrentUserStatus {
  authenticated: boolean;
  role: AppRole | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  entryPoints: StatusEntryPoint[];
}

export const anonymousUserStatus: CurrentUserStatus = {
  authenticated: false,
  role: null,
  user: null,
  entryPoints: [
    {
      label: 'Dashboard Overview',
      href: '/dashboard',
      description: 'Requires an authenticated session.',
      allowed: false,
    },
    {
      label: 'Schedules',
      href: null,
      description: 'Available after sign-in.',
      allowed: false,
    },
    {
      label: 'Notifications',
      href: null,
      description: 'Available after sign-in.',
      allowed: false,
    },
    {
      label: 'Admin Settings',
      href: null,
      description: 'Owner or admin role required.',
      allowed: false,
    },
  ],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeEntryPoint = (value: unknown): StatusEntryPoint | null => {
  if (!isRecord(value)) {
    return null;
  }

  const label = typeof value['label'] === 'string' ? value['label'] : null;
  const description =
    typeof value['description'] === 'string' ? value['description'] : null;

  if (!label || !description) {
    return null;
  }

  return {
    label,
    href: typeof value['href'] === 'string' ? value['href'] : null,
    description,
    allowed: value['allowed'] === true,
  };
};

const normalizeCurrentUserStatus = (value: unknown): CurrentUserStatus => {
  if (!isRecord(value)) {
    return anonymousUserStatus;
  }

  const roleValue = value['role'];
  const role =
    roleValue === 'owner' ||
    roleValue === 'admin' ||
    roleValue === 'operator' ||
    roleValue === 'viewer'
      ? roleValue
      : null;

  const rawUser = isRecord(value['user']) ? value['user'] : null;
  const normalizedUser = rawUser
    ? {
        id: typeof rawUser['id'] === 'string' ? rawUser['id'] : 'unknown-user',
        name: typeof rawUser['name'] === 'string' ? rawUser['name'] : null,
        email: typeof rawUser['email'] === 'string' ? rawUser['email'] : null,
      }
    : null;

  const rawEntryPoints = Array.isArray(value['entryPoints'])
    ? value['entryPoints']
    : [];
  const entryPoints = rawEntryPoints
    .map((entry) => normalizeEntryPoint(entry))
    .filter((entry): entry is StatusEntryPoint => entry !== null);

  return {
    authenticated: value['authenticated'] === true,
    role,
    user: normalizedUser,
    entryPoints:
      entryPoints.length > 0 ? entryPoints : anonymousUserStatus.entryPoints,
  };
};

@Injectable({
  providedIn: 'root',
})
export class CurrentUserStatusService {
  private readonly apiService = inject(ApiService);

  getStatus() {
    return this.apiService.client.status.get().pipe(
      map((result) => {
        if (result.error || !result.data) {
          return anonymousUserStatus;
        }

        return normalizeCurrentUserStatus(result.data);
      }),
      catchError(() => of(anonymousUserStatus))
    );
  }
}