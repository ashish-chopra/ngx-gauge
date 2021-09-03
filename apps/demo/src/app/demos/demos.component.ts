import { Component, OnInit } from '@angular/core';

const intelligentDefaults1 = `<ngx-gauge value="68.2"></ngx-gauge>`;
const intelligentDefaults2 = `<ngx-gauge value="68.2" thick="15" 
label="Disk Usage" append="GB">
</ngx-gauge>`;

const gaugeType1 = `<!-- full type gauge -->
<ngx-gauge type="full" value="68" thick="5" size="120"
          label="Speed" append="mph"></ngx-gauge>

<!-- semi type gauge -->
<ngx-gauge type="semi" value="68" thick="5" size="120"
          label="Speed" append="mph"></ngx-gauge>

<!-- arch type gauge -->
<ngx-gauge type="arch" value="68" thick="5" size="120"
          label="Speed" append="mph"></ngx-gauge>`;

const gaugeStyle1 = `<ngx-gauge size="180" type="arch" thick="15" 
value="68" cap="butt" label="Speed" 
append="mph"></ngx-gauge>

<ngx-gauge size="180" type="arch" thick="15" 
value="68" cap="round" label="Speed" 
append="mph"></ngx-gauge>`;

const gaugeThickness1 = `<!-- thickness = 5 -->
<ngx-gauge type="arch" value="68" thick="5" size="150" 
label="Speed" append="mph"></ngx-gauge>

<!-- thickness = 10 -->
<ngx-gauge type="arch" value="68" thick="10" size="150" 
label="Speed" append="mph"></ngx-gauge>

<!-- thickness = 15 -->
<ngx-gauge type="arch" value="68" thick="15" size="150" 
label="Speed" append="mph"></ngx-gauge>`;

const gaugeScale1 = `
<ngx-gauge size="250" 
           type="arch" 
           thick="10" 
           min="0" 
           max="250" 
           value="105.8" 
           cap="butt" 
           label="Speed" 
           append="mph">
<ngx-gauge>`;

const themesMarkup1 = `<!--blue theme -->
<ngx-gauge size="150" type="arch" thick="7" value="68.2" 
          cap="round" label="Speed" append="mph" 
          foregroundColor="#2980b9"
          backgroundColor="#ecf0f1"></ngx-gauge>

<!-- green theme -->
<ngx-gauge size="150" type="arch" thick="7" value="68.2" 
          cap="round" label="Speed" append="mph" 
          foregroundColor="#2ecc71"
          backgroundColor="#ecf0f1"></ngx-gauge>

<!-- red theme -->
<ngx-gauge size="150" type="arch" thick="7" value="68.2" 
          cap="round" label="Speed" append="mph" 
          foregroundColor="#e74c3c"
          backgroundColor="#ecf0f1"></ngx-gauge>`;

const dynamicGaugeDemoMarkup1 = ` 
<ngx-gauge [value]="dynamicGaugeDemoValue"
           type="arch" 
           thick="13" 
           cap="round" 
           size="200" 
           label="I/O Utilization" 
           append="%">
</ngx-gauge>

<button (click)="onUpdateClick()">Update</button>`;

const dynamicGaugeDemoTS1 = `
import { Component } from '@angular/core';

@Component({
  selector: 'app-demos',
  templateUrl: './demos.component.html',
  styleUrls: ['./demos.component.css']
})
export class DemosComponent {

  constructor() { }

  dynamicGaugeDemoValue = 10.2;

  onUpdateClick() {
    this.dynamicGaugeDemoValue = 
    Math.round(Math.random() * 1000)/10;
  }

}
`

@Component({
  selector: 'app-demos',
  templateUrl: './demos.component.html',
  styleUrls: ['./demos.component.css']
})
export class DemosComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  showNewGauge = false;

  intelligentDefaults1 = intelligentDefaults1;
  intelligentDefaults2 = intelligentDefaults2;
  gaugeType1 = gaugeType1;
  gaugeStyle1 = gaugeStyle1;
  gaugeThickness1 = gaugeThickness1;
  gaugeScale1 = gaugeScale1;
  themesMarkup1 = themesMarkup1;
  dynamicGaugeDemoMarkup1 = dynamicGaugeDemoMarkup1;
  dynamicGaugeDemoTS1 = dynamicGaugeDemoTS1;

  dynamicGaugeDemoValue = 10.2;

  onUpdateClick() {
    this.dynamicGaugeDemoValue = Math.round(Math.random() * 1000)/10;
  }

}
