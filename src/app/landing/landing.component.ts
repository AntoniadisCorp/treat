import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { ApiService } from '../api.service';
import {
  anonymousUserStatus,
  CurrentUserStatusService,
} from '../current-user-status.service';
import { ActionLinkComponent } from '../ui/action-link.component';
import { SectionHeaderComponent } from '../ui/section-header.component';
import { SurfaceCardComponent } from '../ui/surface-card.component';

const platformModules = [
  {
    eyebrow: 'Scrapers',
    title: 'Operational visibility for every source run',
    copy:
      'Track scraper health, queue work, and expose failure handling without collapsing backend orchestration into the UI layer.',
    bullets: ['Run queue snapshots', 'Retry and recovery paths', 'Source-level health indicators'],
  },
  {
    eyebrow: 'Schedules',
    title: 'Schedules designed for operators, not framework demos',
    copy:
      'Use structured cards and role-aware actions so owners, admins, and operators can understand timing, drift, and pending work quickly.',
    bullets: ['Cron ownership context', 'Window and cadence status', 'Explicit next-run surfaces'],
  },
  {
    eyebrow: 'Notifications',
    title: 'Alerting with traceable outcomes',
    copy:
      'Present email and workflow notifications as auditable system events tied to job records and backend authorization checks.',
    bullets: ['Resend-ready notification status', 'Audit-friendly event cards', 'Delivery and failure summaries'],
  },
];

const roleCards = [
  {
    role: 'Owner',
    copy: 'Full system control, access governance, ownership transfer, and operational oversight.',
  },
  {
    role: 'Admin',
    copy: 'Configuration, user management, and operational policy changes without ownership transfer.',
  },
  {
    role: 'Operator',
    copy: 'Execution control over scrapers, schedules, runs, and notifications without user administration.',
  },
  {
    role: 'Viewer',
    copy: 'Read-only dashboard visibility for monitoring, audit review, and operational awareness.',
  },
];

const proofChips = [
  'Better Auth session identity',
  'API-enforced RBAC checks',
  'SurrealDB-backed audit records',
];

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    NgOptimizedImage,
    ActionLinkComponent,
    SectionHeaderComponent,
    SurfaceCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="relative overflow-hidden pb-16 sm:pb-24">
      <div
        class="float-orb pointer-events-none absolute -top-16 -left-40 -z-10 h-96 w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(14,159,154,0.35),rgba(14,159,154,0)_65%)]"
      ></div>
      <div
        class="float-orb pointer-events-none absolute -right-28 top-24 -z-10 h-80 w-[20rem] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.3),rgba(245,158,11,0)_65%)] [animation-delay:220ms]"
      ></div>

      <section class="ds-shell flex flex-col gap-10 pt-10 lg:pt-16">
        <header class="ds-nav hero-reveal hero-delay-1">
          <p class="font-mono text-xs font-medium uppercase tracking-[0.22em] text-brand-deep">Treat Ops</p>
          <ui-action-link label="Open Post Demo" routerLink="/post/1" variant="secondary"></ui-action-link>
        </header>

        <div class="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          <section class="space-y-8">
            <p class="ds-kicker hero-reveal hero-delay-2">Angular 17 + Bun + Elysia</p>

            <h1 class="ds-heading hero-reveal hero-delay-3 max-w-4xl">
               UI for scrapers, schedules, notifications, and admin control.
            </h1>

            <p class="ds-copy hero-reveal hero-delay-4">
              This landing page now reflects the actual product direction from the repo prompts: a secure operations dashboard with typed API
              contracts, Better Auth-backed identity, backend-enforced RBAC, and a design language ready to scale into protected pages.
            </p>

            <div class="ds-actions hero-reveal hero-delay-5">
              <ui-action-link label="Open Typed Demo Route" routerLink="/post/1" variant="primary"></ui-action-link>
              <ui-action-link label="Check Auth Endpoint" href="/api/auth" variant="secondary"></ui-action-link>
              <ui-action-link
                label="Open Protected Dashboard"
                routerLink="/dashboard"
                variant="secondary"
                [disabled]="!currentUserStatus().authenticated"
              ></ui-action-link>
            </div>

            <div class="ds-chip-row hero-reveal hero-delay-5">
              @for (chip of proofChips; track chip) {
                <div class="ds-chip">
                  <span class="ds-chip-dot"></span>
                  <span>{{ chip }}</span>
                </div>
              }
            </div>
          </section>

          <aside class="hero-reveal hero-delay-4 ds-illustration-frame">
            <img
              ngSrc="assets/illustrations/ops-dashboard-hero.svg"
              width="1200"
              height="900"
              priority
              alt="Illustration of the Treat operations dashboard showing scraper runs, schedules, notifications, and audit panels."
              class="ds-image"
            />
            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div class="ds-metric">
                <span class="ds-metric-label">Render Strategy</span>
                <span class="ds-metric-value">SSR + HTML Cache</span>
              </div>
              <div class="ds-metric">
                <span class="ds-metric-label">Auth Shape</span>
                <span class="ds-metric-value">Cookie + RBAC</span>
              </div>

            </div>
          </aside>
        </div>
      </section>

      <section class="ds-shell ds-section">
        <ui-section-header
          kicker="Platform Modules"
          title="A scalable surface language for the protected dashboard"
          copy="The first consumer of the design system is the landing page, but the component patterns below are intentionally shaped to map into schedules, run history, notifications, and admin-only workflows."
          class="hero-reveal hero-delay-4"
        ></ui-section-header>

        <div class="ds-card-grid mt-8 lg:grid-cols-3">
          @for (module of platformModules; track module.title) {
            <ui-surface-card variant="card" class="hero-reveal hero-delay-5">
              <p class="ds-card-eyebrow">{{ module.eyebrow }}</p>
              <h3 class="ds-card-title">{{ module.title }}</h3>
              <p class="ds-card-copy">{{ module.copy }}</p>
              <ul class="ds-list">
                @for (bullet of module.bullets; track bullet) {
                  <li>{{ bullet }}</li>
                }
              </ul>
            </ui-surface-card>
          }
        </div>
      </section>

      <section class="ds-shell ds-section">
        <div class="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <ui-surface-card variant="panel-soft" class="hero-reveal hero-delay-4">
            <ui-section-header
              kicker="Authorization Model"
              title="Role-aware pages should look structured before they become protected"
              copy="The prompts define four default roles. These cards are intentionally reusable for future navigation guards, admin shells, and current-user summaries."
            ></ui-section-header>

            <div class="ds-role-grid mt-6">
              @for (item of roleCards; track item.role) {
                <div class="ds-role-card">
                  <h3 class="ds-role-name">{{ item.role }}</h3>
                  <p class="ds-role-copy">{{ item.copy }}</p>
                </div>
              }
            </div>
          </ui-surface-card>

          <ui-surface-card variant="panel" class="hero-reveal hero-delay-5">
            <ui-section-header
              kicker="Typed API Contract"
              title="Proof that the backend contract is a first-class UI primitive"
              copy="The landing page is reading live endpoints while preserving server-derived typing through the Eden client. The same contract now also exposes current-user status for protected route decisions."
            ></ui-section-header>

            <div class="mt-6 grid gap-4 lg:grid-cols-2">
              <div class="ds-code-block">
                <div class="ds-code-label">server.ts</div>
                <div class="mt-2">export type App = typeof app</div>
                <div class="mt-4 ds-code-label">api.service.ts</div>
                <div class="mt-2">client = edenClient&lt;App&gt;('http://localhost:4201').api</div>
              </div>

              <div class="flex flex-col gap-4">
                <div class="ds-inline-note">Status preview: {{ statusPreviewHeadline() }}</div>

                <div class="grid gap-3">
                  @for (entry of currentUserStatus().entryPoints; track entry.label) {
                    <div class="grid gap-2 rounded-2xl border border-brand-ink/8 bg-white/85 p-3">
                      <ui-action-link
                        [label]="entry.label"
                        [routerLink]="entry.href"
                        variant="secondary"
                        [block]="true"
                        [disabled]="!entry.allowed || !entry.href"
                      />
                      <p class="text-sm leading-6 text-brand-ink/70">{{ entry.description }}</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          </ui-surface-card>
        </div>
      </section>
    </main>
  `,
})
export default class LandingComponent {
  private readonly apiService = inject(ApiService);
  private readonly currentUserStatusService = inject(CurrentUserStatusService);

  readonly platformModules = platformModules;
  readonly roleCards = roleCards;
  readonly proofChips = proofChips;

  readonly currentUserStatus = toSignal(
    this.currentUserStatusService.getStatus(),
    { initialValue: anonymousUserStatus }
  );



  readonly statusPreviewHeadline = computed(() => {
    const status = this.currentUserStatus();

    if (!status.authenticated) {
      return 'Guest preview. Sign in to unlock the protected dashboard shell.';
    }

    const role = status.role || 'viewer';
    const name = status.user?.name || status.user?.email || 'Authenticated user';

    return `${name} is currently resolved as ${role}.`;
  });
}
