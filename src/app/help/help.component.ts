import { Component, OnInit } from '@angular/core';
import { FetchService } from '../fetch.service';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
  staticPath: string;

  constructor(private fetchService: FetchService) { }

  ngOnInit() {
    this.staticPath = this.fetchService.getStaticPath();
  }

  scrollToAnchor($element: any) {
    $element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  }

}
