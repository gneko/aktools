import { Component, OnInit } from '@angular/core';
import { FetchService } from '../fetch.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  cn: boolean;
  staticPath: string;

  ngOnInit() {
    this.staticPath = this.fetchService.getStaticPath();
  }
  constructor(private fetchService: FetchService) {
    this.cn = window.location.hostname.includes('cn');
  }

}
