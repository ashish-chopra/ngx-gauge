import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-getting-started',
  templateUrl: './getting-started.component.html',
  styleUrls: ['./getting-started.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class GettingStartedComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  onHighlight(e) {
    console.log(e);
  }

  step1Install: string = `npm install --save ngx-gauge`;
  step2Install: string = `import { NgxGaugeModule } from 'ngx-gauge';

  @NgModule({
      ...
      imports: [NgxGaugeModule],
      ...
  })
  export class AppModule { }  
  `;

  step3Install: string = `import { Component } from '@angular/core';

  @Component({
      selector: 'app-component',
      templateUrl: 'app.html'
  })
  export class AppComponent {
      
      gaugeType = "semi";
      gaugeValue = 28.3;
      gaugeLabel = "Speed";
      gaugeAppendText = "km/hr";
  }`;

  step3Install2 = `<ngx-gauge [type]="gaugeType" 
           [value]="gaugeValue" 
           [label]="gaugeLabel"  
           [append]="gaugeAppendText">
</ngx-gauge>`;
}
