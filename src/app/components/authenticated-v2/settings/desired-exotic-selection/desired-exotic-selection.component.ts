import {Component, OnInit} from '@angular/core';
import {InventoryService} from "../../../../services/inventory.service";
import {ConfigurationService} from "../../../../services/configuration.service";
import {CharacterClass} from "../../../../data/enum/character-Class";
import {animate, query, stagger, style, transition, trigger} from "@angular/animations";
import {IManifestArmor} from "../../../../data/types/IManifestArmor";
import {DID_NOT_SELECT_EXOTIC} from "../../../../data/constants";


export const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(':enter',
      [style({opacity: 0}), stagger('30ms', animate('500ms ease-out', style({opacity: 1})))],
      {optional: true}
    ),
  ])
]);

@Component({
  selector: 'app-desired-exotic-selection',
  templateUrl: './desired-exotic-selection.component.html',
  styleUrls: ['./desired-exotic-selection.component.scss'],
  animations: [listAnimation]
})
export class DesiredExoticSelectionComponent implements OnInit {

  selectedExoticHash: number = DID_NOT_SELECT_EXOTIC;
  currentClass: CharacterClass = CharacterClass.None;
  exotics: IManifestArmor[][] = [];

  constructor(public inventory: InventoryService, public config: ConfigurationService) {
  }

  ngOnInit(): void {
    this.config.configuration.subscribe(async c => {
      if (c.characterClass != this.currentClass || this.exotics.length == 0) {
        this.currentClass = c.characterClass;
        await this.updateExoticsForClass();
      }
      this.selectedExoticHash = c.selectedExoticHash;
    })

    this.inventory.manifest.subscribe(async () => {
      await this.updateExoticsForClass();
    })
  }

  private async updateExoticsForClass() {
    const armors = await this.inventory.getExoticsForClass(this.currentClass);
    this.exotics = [
      armors.filter(a => a.slot == "Helmets"),
      armors.filter(a => a.slot == "Arms"),
      armors.filter(a => a.slot == "Chest"),
      armors.filter(a => a.slot == "Legs"),
    ]
  }

  selectExotic(hash: number) {
    this.config.modifyConfiguration(c => {
      c.selectedExoticHash = c.selectedExoticHash == hash ? DID_NOT_SELECT_EXOTIC : hash;
    })
  }

}