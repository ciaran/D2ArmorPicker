import {Component, Input, OnInit, Output} from '@angular/core';
import { EventEmitter } from '@angular/core';
@Component({
  selector: 'app-stat-minimum-selection',
  templateUrl: './stat-minimum-selection.component.html',
  styleUrls: ['./stat-minimum-selection.component.css']
})
export class StatMinimumSelectionComponent implements OnInit {

  @Input() values: number[] = [0,10,20,30,40,50,60,70,80,90,100];
  @Input() value: number = 10;
  @Output() onChange = new EventEmitter<number>();


  constructor() {
  }

  ngOnInit(): void {
  }

  setValue(n: number) {
    this.value = n;
    this.onChange.emit(n);
  }

}
