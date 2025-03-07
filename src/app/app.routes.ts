import { Routes } from '@angular/router';
import { PrivacyComponent } from './privacy/privacy.component';
import { TermsComponent } from './terms/terms.component';

export const routes: Routes = [
  { path: 'privacy', component: PrivacyComponent },
  { path: 'terms', component: TermsComponent },
];
