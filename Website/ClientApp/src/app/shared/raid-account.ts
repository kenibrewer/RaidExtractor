import { AccountDump } from './clients';
import { Artifact } from './clients';
import { Hero } from './clients';
import { Raid } from './raid';
import { ArtifactBonus } from './clients';

export class RaidAccount {
  artifacts: Artifact[];
  heroes: Hero[];
  artifactsByKind: { [kind: string]: Artifact[] } = {};
  artifactsById: { [id: number]: Artifact } = {};

  constructor(dump: AccountDump) {
    this.artifacts = dump.artifacts;
    this.heroes = dump.heroes;

    for (let artifact of this.artifacts) {
      let arr = this.artifactsByKind[artifact.kind];
      if (!arr) arr = [];
      arr.push(artifact);
      this.artifactsByKind[artifact.kind] = arr;
      this.artifactsById[artifact.id] = artifact;
    }
  }

  getHeroStat(hero: Hero, stat: string): number {
    const sets = {};
    
    const baseValue = stat.startsWith('Crit') ? 100 : hero[Raid.statProperty[stat]];
    let value = hero[Raid.statProperty[stat]];
    if (!hero.artifacts) {
      return value;
    }

    for (let artifactId of hero.artifacts) {
      const artifact = this.artifactsById[artifactId];
      if (!artifact) {
        continue;
      }

      value += this.getBonusValue(artifact, baseValue, stat);
      if (artifact.setKind in sets) {
        sets[artifact.setKind] ++;
      } else {
        sets[artifact.setKind] = 1;
      }
    }

    for (const set in sets) {
      if (Object.prototype.hasOwnProperty.call(sets, set)) {
        let count = sets[set];
        while (Raid.sets[set].set <= count) {
          count -= Raid.sets[set].set;
          for (const bonus of Raid.sets[set].bonuses) {
            value += this.calcBonusValue(bonus, baseValue, stat);
          }
        }
      }
    }

    return Math.round(value);
  }

  getHeroType(hero: Hero): string {
    return `${Raid.fraction[hero.fraction]}-${Raid.rarity[hero.rarity]}${Raid.role[hero.role]}${Raid.element[hero.element]}`;
  }

  getArtifactType(artifact: Artifact): string {
    return `${Raid.kind[artifact.kind]}-${Raid.rank[artifact.rank]}${Raid.rarity[artifact.rarity]}`;
  }

  getArtifactSet(artifact: Artifact): string {
    return Raid.sets[artifact.setKind].name;
  }

  getBonusValue(artifact: Artifact, baseValue: number, stat: string): number {
    let bonus = 0;
    bonus += this.calcBonusValue(artifact.primaryBonus, baseValue, stat);

    if (artifact.secondaryBonuses) {
      for (let secondaryBonus of artifact.secondaryBonuses) {
        bonus += this.calcBonusValue(secondaryBonus, baseValue, stat);
      }
    }

    return bonus;
  }

  calcBonusValue(bonus: ArtifactBonus, baseValue: number, stat: string): number {
    if (stat !== bonus.kind) {
      return 0;
    }
    if (bonus.isAbsolute) {
      return bonus.value;
    } else {
      return baseValue * bonus.value;
    }
  }

  getArtifactStat(artifact: Artifact, stat: string, isAbsolute: boolean): string {
    if (artifact.primaryBonus.kind === stat && artifact.primaryBonus.isAbsolute === isAbsolute) {
      return this.statToString(artifact.primaryBonus.value, artifact.primaryBonus.isAbsolute);
    }
    if (!artifact.secondaryBonuses) {
      return '';
    }
    for (var bonus of artifact.secondaryBonuses) {
      if (bonus.kind === stat && bonus.isAbsolute === isAbsolute) {
        return this.statToString(bonus.value, bonus.isAbsolute);
      }
    }
    return '';
  }

  statToString(value: number, isAbsolute: boolean) {
    if (isAbsolute) return value.toString();
    value *= 100;
    return `${Math.round(value)}%`;
  }


}