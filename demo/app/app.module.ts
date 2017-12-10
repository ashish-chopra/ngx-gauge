import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HighlightJsModule } from 'angular2-highlight-js';
import { GettingStartedComponent } from './getting-started/getting-started.component';
import { DocumentationComponent } from './documentation/documentation.component';

@NgModule({
  declarations: [
    AppComponent,
    GettingStartedComponent,
    DocumentationComponent
  ],
  imports: [
    BrowserModule,
    HighlightJsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
