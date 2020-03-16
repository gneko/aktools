import { Component, HostListener } from '@angular/core';
import { MdcSnackbarService } from '@blox/material';
import { ActivatedRoute } from '@angular/router';
import { SwitchThemeService } from './switch-theme.service';
import { FetchService } from './fetch.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '明日方舟工具箱';
  drawerOpen = false;
  deferredPrompt: any;
  baseUrl: string;
  nav: any;
  temporary = 'temporary';
  showNavbar = true;
  theme: string;
  staticPath: string;
  appLink: string;

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
    private activatedRoute: ActivatedRoute,
    private switchTheme: SwitchThemeService,
    private fetchService: FetchService) {
    this.baseUrl = window.location.origin;
    this.nav = window.navigator;
    this.activatedRoute.queryParams.subscribe(params => {
      this.showNavbar = !('hidenav' in params);
    });

    this.theme = this.fetchService.getLocalStorage("theme", "dark");
    this.switchTheme.setTheme(this.theme);
    this.staticPath = this.fetchService.getStaticPath();
    if (this.checkOS() === 'I') {
      this.appLink = 'https://at.umtrack.com/GHvWji';
    } else {
      this.appLink = 'https://at.umtrack.com/STTjqe';
    }
  }
  toggleTheme() {
    if (this.theme === "light") {
      this.theme = "dark";
      this.switchTheme.setTheme(this.theme);
      this.fetchService.setLocalStorage("theme", this.theme);
    } else {
      this.theme = "light";
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

  checkOS() {
    // See: https://stackoverflow.com/questions/21741841/detecting-ios-android-operating-system
    const userAgent = navigator.userAgent || navigator.vendor || window['opera'];
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return 'I';
    }
    return 'A';
  }


  @HostListener('window:beforeinstallprompt', ['$event'])
  onbeforeinstallprompt(e) {
    e.preventDefault();
    this.deferredPrompt = e;
  }
}
