import { menuController as ionicMenuController } from '@ionic/core';

export type MenuKind = 'main' | 'admin' | 'customer-menu';

export const menuController = {
  open: (menuId: MenuKind = 'main') => ionicMenuController.open(menuId),
  close: (menuId: MenuKind = 'main') => ionicMenuController.close(menuId),
  toggle: (menuId: MenuKind = 'main') => ionicMenuController.toggle(menuId),
  isOpen: (menuId: MenuKind = 'main') => ionicMenuController.isOpen(menuId),
};