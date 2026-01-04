import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './leftbar.component.html',
  styleUrls: ['./leftbar.component.scss'],
})
export class Leftbar {}
