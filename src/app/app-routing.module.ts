import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HrComponent } from './hr/hr.component';
import { LvlupComponent } from './lvlup/lvlup.component';
import { MaterialComponent } from './material/material.component';
import { MainComponent } from './main/main.component';
import { CharMatComponent } from './char-mat/char-mat.component';
import { SettingsComponent } from './settings/settings.component';
import { AutoDetectHashComponent } from './auto-detect-hash/auto-detect-hash.component';
import { DetectSetttingComponent } from './detect-setting/detect-setting.component';
const routes: Routes = [
  { path: 'hr', component: HrComponent },
  { path: 'lvlup', component: LvlupComponent },
  { path: 'material', component: MaterialComponent },
  { path: 'charmat', component: CharMatComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '', component: MainComponent, pathMatch: 'full' },
  { path: 'autodetecthash', component: AutoDetectHashComponent},
  { path: 'detect-setting', component: DetectSetttingComponent},
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
