import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-documentation',
    templateUrl: './documentation.component.html',
    styleUrls: ['./documentation.component.css'],
    standalone: false
})
export class DocumentationComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

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
