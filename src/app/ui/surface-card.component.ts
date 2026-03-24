import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-surface-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      [class.ds-card]="variant() === 'card'"
      [class.ds-panel]="variant() === 'panel' || variant() === 'panel-soft'"
      [class.ds-panel-soft]="variant() === 'panel-soft'"
      [class.p-6]="variant() === 'panel' || variant() === 'panel-soft'"
      [class.sm:p-8]="variant() === 'panel' || variant() === 'panel-soft'"
    >
      <ng-content />
    </article>
  `,
})
export class SurfaceCardComponent {
  readonly variant = input<'card' | 'panel' | 'panel-soft'>('card');
}