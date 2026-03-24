import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ui-section-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <p class="ds-kicker">{{ kicker }}</p>
      <h2 class="ds-section-heading mt-4">{{ title }}</h2>
      @if (copy) {
        <p class="ds-section-copy">{{ copy }}</p>
      }
    </div>
  `,
})
export class SectionHeaderComponent {
  @Input() kicker = '';
  @Input() title = '';
  @Input() copy: string | null = null;
}