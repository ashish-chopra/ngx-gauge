import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-documentation',
    templateUrl: './documentation.component.html',
    styleUrls: ['./documentation.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DocumentationComponent {

  thresholdColors1 = `@Component({ ... })
  export class AppComponent {
      ...

      thresholdConfig = {
          '0': {color: 'green'},
          '40': {color: 'orange'},
          '75.5': {color: 'red'}
      };

      ...
  }`;

  thresholdColors2 = `<ngx-gauge ...  [thresholds]="thresholdConfig"></ngx-gauge>`;
}
