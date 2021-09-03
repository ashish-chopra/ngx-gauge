import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';
import { GettingStartedComponent } from './getting-started/getting-started.component';
import { DocumentationComponent } from './documentation/documentation.component';
import { NgxGaugeModule } from 'ngx-gauge';
import { PlaygroundComponent } from './playground/playground.component';
import { DemosComponent } from './demos/demos.component';

import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatTabsModule } from '@angular/material/tabs';


@NgModule({
  declarations: [
    AppComponent,
    GettingStartedComponent,
    DocumentationComponent,
    PlaygroundComponent,
    DemosComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule, 
    NgxGaugeModule,
    HighlightModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule, 
    MatToolbarModule,
    MatSelectModule, 
    MatSliderModule,
    MatSlideToggleModule, 
    MatCardModule,
    MatTabsModule
  ],
  providers: [
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        lineNumbersLoader: () => import('highlightjs-line-numbers.js'),
        languages: {
          typescript: () => import('highlight.js/lib/languages/typescript'),
          css: () => import('highlight.js/lib/languages/css'),
          xml: () => import('highlight.js/lib/languages/xml'),
          bash: () => import('highlight.js/lib/languages/bash')
        }
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
