import { Component, HostListener } from '@angular/core';
import { MdcSnackbarService } from '@blox/material';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import {SwitchThemeService} from './switch-theme.service';
import { Observable } from 'rxjs';
import { FetchService } from './fetch.service';

declare var ga: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '明日方舟工具箱 by 一只灰猫';
  drawerOpen = false;
  deferredPrompt: any;
  baseUrl: string;
  nav: any;
  temporary = 'temporary';
  showNavbar = true;
  theme: string;

  toggleDrawer(): void {
    this.drawerOpen = !this.drawerOpen;
  }

  showSnackBar(msg: string, action: string) {
    this.snackBar.show({
      message: msg,
      actionText: action,
      multiline: false,
      actionOnBottom: false
    });
  }

  constructor(private snackBar: MdcSnackbarService,
              private router: Router,
              private activatedRoute: ActivatedRoute,
              private switchTheme: SwitchThemeService,
              private fetchService: FetchService) {
    this.baseUrl = window.location.origin;
    this.nav = window.navigator;
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        ga('set', 'page', event.urlAfterRedirects);
        ga('send', 'pageview');
      }
    });
    this.activatedRoute.queryParams.subscribe(params => {
      this.showNavbar = !('hidenav' in params);
    });

    this.theme = this.fetchService.getLocalStorage("theme", "dark");
    this.switchTheme.setTheme(this.theme);
  }
  toggleTheme() {
    if(this.theme==="light"){
      this.theme="dark";
      this.switchTheme.setTheme(this.theme);
      this.fetchService.setLocalStorage("theme", this.theme);
    }else {
      this.theme="light";
      this.switchTheme.setTheme(this.theme);
      this.fetchService.setLocalStorage("theme", this.theme);
    }
  }
  doShare() {
    if (this.nav && this.nav.share) {
      this.nav.share({
        title: this.title,
        text: this.title,
        url: window.location.origin
      });
    }
  }


  @HostListener('window:beforeinstallprompt', ['$event'])
  onbeforeinstallprompt(e) {
    e.preventDefault();
    this.deferredPrompt = e;
  }
}
