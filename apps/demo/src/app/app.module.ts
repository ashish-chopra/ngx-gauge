import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HighlightJsModule } from 'angular2-highlight-js';
import { GettingStartedComponent } from './getting-started/getting-started.component';
import { DocumentationComponent } from './documentation/documentation.component';
import { NgxGaugeModule } from '@ngx/ngx-gauge';

@NgModule({
  declarations: [
    AppComponent,
    GettingStartedComponent,
    DocumentationComponent
  ],
  imports: [
    BrowserModule,
    HighlightJsModule,
    NgxGaugeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
