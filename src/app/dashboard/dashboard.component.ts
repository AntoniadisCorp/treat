import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import {
  anonymousUserStatus,
  CurrentUserStatus,
  CurrentUserStatusService,
} from '../current-user-status.service';
import { ActionLinkComponent } from '../ui/action-link.component';
import { SectionHeaderComponent } from '../ui/section-header.component';
import { SurfaceCardComponent } from '../ui/surface-card.component';

export const canActivateDashboard = () => {
  const currentUserStatusService = inject(CurrentUserStatusService);
  const router = inject(Router);

  return currentUserStatusService.getStatus().pipe(
    map((status) =>
      status.authenticated ? true : router.createUrlTree(['/'], { queryParams: { redirect: '/dashboard' } })
    ),
    catchError(() =>
      of(router.createUrlTree(['/'], { queryParams: { redirect: '/dashboard' } }))
    )
  );
};

export const resolveDashboardStatus = {
  dashboardStatus: () => inject(CurrentUserStatusService).getStatus(),
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, ActionLinkComponent, SectionHeaderComponent, SurfaceCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="relative overflow-hidden pb-16 sm:pb-24">
      <section class="ds-shell pt-10 lg:pt-16">
        <header class="ds-nav hero-reveal hero-delay-1 flex flex-col items-start gap-4 lg:flex-row lg:items-center">
          <div>
            <p class="ds-kicker">Protected Dashboard</p>
            <h1 class="mt-3 text-3xl font-bold tracking-[-0.04em] text-brand-ink sm:text-4xl">
              Operations shell for {{ roleLabel() }} access
            </h1>
          </div>

          <nav class="flex flex-wrap gap-2 lg:ml-auto" aria-label="Dashboard navigation">
            @for (entry of dashboardStatus().entryPoints; track entry.label) {
              <ui-action-link
                [label]="entry.label"
                [routerLink]="entry.href"
                variant="secondary"
                [disabled]="!entry.allowed || !entry.href"
              ></ui-action-link>
            }
          </nav>
        </header>
      </section>

      <section class="ds-shell ds-section">
        <ui-section-header
          kicker="Current Session"
          title="API-backed dashboard access"
          copy="This shell uses the same design primitives as the landing page, but the route is gated by a server-backed status check before it renders."
          class="hero-reveal hero-delay-3"
        ></ui-section-header>

        <div class="mt-8 grid gap-4 lg:grid-cols-3">
          <ui-surface-card variant="card" class="hero-reveal hero-delay-4">
            <p class="ds-card-eyebrow">Current User</p>
            <h3 class="ds-card-title">{{ currentUserName() }}</h3>
            <p class="ds-card-copy">Signed in with Better Auth session identity and API-backed authorization context.</p>
          </ui-surface-card>

          <ui-surface-card variant="card" class="hero-reveal hero-delay-4">
            <p class="ds-card-eyebrow">Role</p>
            <h3 class="ds-card-title">{{ roleLabel() }}</h3>
            <p class="ds-card-copy">Navigation and future admin affordances can be filtered from this role without trusting client-only state.</p>
          </ui-surface-card>

          <ui-surface-card variant="card" class="hero-reveal hero-delay-4">
            <p class="ds-card-eyebrow">Enabled Entry Points</p>
            <h3 class="ds-card-title">{{ enabledEntryPointCount() }}</h3>
            <p class="ds-card-copy">Visible options from the current status payload that are allowed for this session.</p>
          </ui-surface-card>
        </div>
      </section>

      <section class="ds-shell ds-section">
        <div class="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <ui-surface-card variant="panel-soft" class="hero-reveal hero-delay-4">
            <ui-section-header
              kicker="Role-Aware Navigation"
              title="The first dashboard shell shares the same system as the landing page"
              copy="These cards and actions are intentionally generic enough to be reused for schedules, run history, notifications, and admin pages."
            ></ui-section-header>

            <div class="ds-card-grid mt-6">
              @for (entry of dashboardStatus().entryPoints; track entry.label) {
                <ui-surface-card variant="card">
                  <p class="ds-card-eyebrow">{{ entry.allowed ? 'Available' : 'Locked' }}</p>
                  <h3 class="ds-card-title">{{ entry.label }}</h3>
                  <p class="ds-card-copy">{{ entry.description }}</p>
                </ui-surface-card>
              }
            </div>
          </ui-surface-card>

          <ui-surface-card variant="panel" class="hero-reveal hero-delay-5">
            <ui-section-header
              kicker="Dashboard Summary"
              title="Minimal protected slice, ready for schedules and runs"
              copy="The current slice deliberately stays small: route guard, session-backed navigation, and a status contract the landing page can preview."
            ></ui-section-header>

            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="ds-inline-note">Access model: Better Auth cookie session plus explicit backend role shaping.</div>
              <div class="ds-inline-note">Recommended next slice: add schedules overview and owner/admin settings routes.</div>
            </div>

            <div class="mt-6 flex flex-wrap gap-3">
              <ui-action-link label="Back To Landing" routerLink="/" variant="secondary"></ui-action-link>
              <ui-action-link label="Open Typed Demo" routerLink="/post/1" variant="primary"></ui-action-link>
            </div>
          </ui-surface-card>
        </div>
      </section>
    </main>
  `,
})
export default class DashboardComponent {
  readonly dashboardStatus = input<CurrentUserStatus>(anonymousUserStatus);

  readonly currentUserName = computed(
    () =>
      this.dashboardStatus().user?.name ||
      this.dashboardStatus().user?.email ||
      'Authenticated user'
  );

  readonly roleLabel = computed(() => {
    const role = this.dashboardStatus().role;

    if (!role) {
      return 'Guest';
    }

    return role.charAt(0).toUpperCase() + role.slice(1);
  });

  readonly enabledEntryPointCount = computed(
    () => this.dashboardStatus().entryPoints.filter((entry) => entry.allowed).length
  );
}