/*
 * Copyright (c) 2023 D2ArmorPicker by Mijago.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject, of } from "rxjs";

import type { CharacterStats } from "./data/character_stats/schema";

const BASE_URL = "https://raw.githubusercontent.com/Database-Clarity/Character-Stats/wip";
export const SUPPORTED_SCHEMA_VERSION = "1.8";
export const CHARACTER_STATS_URL = `${BASE_URL}/versions/${SUPPORTED_SCHEMA_VERSION}/CharacterStatInfo-NI.json`;
export const UPDATES_URL = `${BASE_URL}/update.json`;

const LOCAL_STORAGE_STATS_VERSION_KEY = "clarity-character-stats-version";
const LOCAL_STORAGE_STATS_KEY = "clarity-character-stats";

export type UpdateData = {
  lastUpdate: number;
  schemaVersion: string;
};

/**
 * TODO:
 * Currently this fetches and cached a single hardcoded data URL.
 * After the current clarity PR is merged this must implement periodic version fetching and updating.
 */
@Injectable({
  providedIn: "root",
})
export class ClarityService {
  private _characterStats: BehaviorSubject<CharacterStats | null> =
    new BehaviorSubject<CharacterStats | null>(null);
  public readonly characterStats: Observable<CharacterStats | null> =
    this._characterStats.asObservable();

  constructor(private http: HttpClient) {}

  async load() {
    await this.loadCharacterStats();
  }

  private async fetchUpdateData() {
    return this.http.get<UpdateData>(UPDATES_URL).toPromise();
  }

  // Load data from cache or fetch live data if necessary
  private async loadCharacterStats() {
    // If we have any stored data, we can just make it available right away
    const storedData = localStorage.getItem(LOCAL_STORAGE_STATS_KEY);
    if (storedData) {
      this._characterStats.next(JSON.parse(storedData));
    }

    const liveVersion = await this.fetchUpdateData();
    const storedVersion = parseInt(localStorage.getItem(LOCAL_STORAGE_STATS_VERSION_KEY) || "0");

    // There’s new data available
    if (liveVersion.lastUpdate > storedVersion) {
      if (liveVersion.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
        console.warn("Unsupported live character stats schema version", liveVersion.schemaVersion);
      } else {
        await this.fetchLiveCharacterStats()
          .then((data) => {
            localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(data));
            localStorage.setItem(LOCAL_STORAGE_STATS_VERSION_KEY, liveVersion.toString());

            this._characterStats.next(data);
          })
          .catch((err) => {
            console.log("Clarity fetch err", err);
          });
      }
    }
  }

  private async fetchLiveCharacterStats() {
    return this.http.get<CharacterStats>(CHARACTER_STATS_URL).toPromise();
  }
}
