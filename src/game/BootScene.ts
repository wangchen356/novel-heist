import Phaser from 'phaser';
import { bus } from '../events';

const SPRITES = [
  'kanno',
  'houzi',
  'wangxin',
  'daoxiaowang',
  'youxiaotang',
  'shiyi',
] as const;

const PROPS = [
  'prop_floor',
  'prop_wall',
  'prop_desk',
  'prop_chair',
  'prop_podium',
  'prop_blackboard',
  'prop_bookshelf',
  'prop_stall',
  'prop_sink',
  'prop_office_desk',
  'prop_cabinet',
  'prop_sofa',
  'prop_plant',
  'prop_mop_bucket',
  'prop_door',
  'prop_window',
  'prop_cart',
  'prop_cooler',
  'prop_curtain',
  'prop_clock',
  'prop_noticeboard',
  'prop_wet_sign',
  'prop_objective_key',
  'prop_objective_card',
  'prop_key_red',
  'prop_key_white',
  'prop_key_yellow',
  'prop_objective_book',
  'prop_face_token',
  'prop_chalk',
  'prop_lightpool',
  'prop_vignette',
] as const;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.setPath('art/');
    SPRITES.forEach((key) => this.load.svg(key, `${key}.svg`));
    PROPS.forEach((key) => this.load.svg(key, `${key}.svg`));
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error('[BootScene] failed to load', file.key, file.src);
    });
  }

  create(): void {
    bus.emit('assets:ready');
  }
}
