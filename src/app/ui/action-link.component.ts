import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ui-action-link',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (disabled) {
      <span
        class="opacity-55 cursor-not-allowed"
        [class.ds-button-primary]="variant === 'primary'"
        [class.ds-button-secondary]="variant === 'secondary'"
        [class.w-full]="block"
        aria-disabled="true"
      >
        {{ label }}
      </span>
    } @else if (routerLink) {
      <a
        [routerLink]="routerLink"
        [attr.aria-label]="ariaLabel || label"
        [class.ds-button-primary]="variant === 'primary'"
        [class.ds-button-secondary]="variant === 'secondary'"
        [class.w-full]="block"
      >
        {{ label }}
      </a>
    } @else {
      <a
        [href]="href || '#'"
        [attr.aria-label]="ariaLabel || label"
        [class.ds-button-primary]="variant === 'primary'"
        [class.ds-button-secondary]="variant === 'secondary'"
        [class.w-full]="block"
      >
        {{ label }}
      </a>
    }
  `,
})
export class ActionLinkComponent {
  @Input() label = '';
  @Input() routerLink: string | null = null;
  @Input() href: string | null = null;
  @Input() ariaLabel: string | null = null;
  @Input() variant: 'primary' | 'secondary' = 'secondary';
  @Input() block = false;
  @Input() disabled = false;
}