import {Component, OnInit, ViewChild} from '@angular/core';
import {InventoryService} from "../../../services/inventory.service";
import {DatabaseService} from "../../../services/database.service";
import {MatTableDataSource} from "@angular/material/table";
import {BungieApiService} from "../../../services/bungie-api.service";
import {CharacterClass} from "../../../data/enum/character-Class";
import {ConfigurationService} from "../../../services/configuration.service";
import {ArmorStat, StatModifier} from "../../../data/enum/armor-stat";
import {ModOrAbility} from "../../../data/enum/modOrAbility";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {StatusProviderService} from "../../../services/status-provider.service";
import {animate, state, style, transition, trigger} from "@angular/animations";



export interface ResultDefinition {
  exotic: undefined | {
    icon: string,
    name: string
  },
  mods: number[];
  stats: number[];
  statsNoMods: number[];
  items: ResultItem[];
  tiers: number;
  waste: number;
  modCost: number;
  modCount: number;
  loaded: boolean;
}

export enum ResultItemMoveState {
  TRANSFER_NONE,
  WAITING_FOR_TRANSFER,
  TRANSFERRING,
  TRANSFERRED,
  ERROR_DURING_TRANSFER
}

export interface ResultItem {
  energy: number,
  icon: string,
  itemInstanceId: string,
  name: string,
  exotic: boolean,
  masterworked: boolean,
  mayBeBugged: boolean,
  stats: number[],
  transferState: ResultItemMoveState,
  statsNoMods: number[]
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),],
})
export class ResultsComponent implements OnInit {
  ArmorStat = ArmorStat;
  public StatModifier = StatModifier;

  private _results: ResultDefinition[] = [];
  private _config_assumeLegendariesMasterworked: Boolean = false;
  private _config_assumeExoticsMasterworked: Boolean = false;
  private _config_assumeClassItemMasterworked: Boolean = false;
  private _config_enabledMods: ModOrAbility[] = [];
  private _config_limitParsedResults: Boolean = false;

  tableDataSource = new MatTableDataSource<ResultDefinition>()
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  @ViewChild(MatSort) sort: MatSort | null = null;
  expandedElement: ResultDefinition | null = null;
  shownColumns = ["exotic", "mobility", "resilience", "recovery", "discipline", "intellect", "strength", "tiers", "mods", "dropdown",]

  // info values
  selectedClass: CharacterClass = CharacterClass.None;
  totalTime: number = 0;
  itemCount: number = 0;
  totalResults: number = 0;
  parsedResults: number = 0;

  constructor(private inventory: InventoryService, private db: DatabaseService,
              private bungieApi: BungieApiService, private config: ConfigurationService,
              private status: StatusProviderService) {

  }

  ngOnInit(): void {
    this.config.configuration.subscribe(c => {
      this.selectedClass = c.characterClass;
      this._config_assumeLegendariesMasterworked = c.assumeLegendariesMasterworked;
      this._config_assumeExoticsMasterworked = c.assumeExoticsMasterworked;
      this._config_assumeClassItemMasterworked = c.assumeClassItemMasterworked;
      this._config_enabledMods = c.enabledMods;
      this._config_limitParsedResults = c.limitParsedResults;

      if (c.showWastedStatsColumn) {
        this.shownColumns = ["exotic", "mobility", "resilience", "recovery", "discipline", "intellect", "strength", "tiers", "mods", "waste", "dropdown",]
      } else {
        this.shownColumns = ["exotic", "mobility", "resilience", "recovery", "discipline", "intellect", "strength", "tiers", "mods", "dropdown",]
      }
    })

    this.inventory.armorResults.subscribe(async value => {
      this._results = value.results;
      this.itemCount = value.itemCount;
      this.totalTime = value.totalTime;
      this.totalResults = value.totalResults;
      this.parsedResults = this._results.length;

      this.status.modifyStatus(s => s.updatingResultsTable = true)
      await this.updateData();
      this.status.modifyStatus(s => s.updatingResultsTable = false)
    })

    this.tableDataSource.paginator = this.paginator;
    this.tableDataSource.sort = this.sort;
    this.tableDataSource.sortingDataAccessor = (data, sortHeaderId) => {
      switch (sortHeaderId) {
        case 'Mobility':
          return data.stats[ArmorStat.Mobility]
        case 'Resilience':
          return data.stats[ArmorStat.Resilience]
        case 'Recovery':
          return data.stats[ArmorStat.Recovery]
        case 'Discipline':
          return data.stats[ArmorStat.Discipline]
        case 'Intellect':
          return data.stats[ArmorStat.Intellect]
        case 'Strength':
          return data.stats[ArmorStat.Strength]
        case 'Tiers':
          return data.tiers
        case 'Waste':
          return data.waste
        case 'Mods':
          return 100 * data.modCount + data.modCost
      }
      return 0;
    }

  }

  async updateData() {
    console.time("Update Table Data")
    this.tableDataSource.paginator = this.paginator;
    this.tableDataSource.sort = this.sort;
    this.tableDataSource.data = this._results;
    console.timeEnd("Update Table Data")
  }

  checkIfAnyItemsMayBeInvalid(element: ResultDefinition) {
    return (element?.items.filter(d => d.mayBeBugged).length || 0) > 0
  }
}