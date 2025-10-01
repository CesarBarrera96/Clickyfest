import { Routes } from '@angular/router';
import { MarketplaceComponent } from './pages/marketplace/marketplace';
import { ProductDetailComponent } from './pages/product-detail/product-detail';

export const routes: Routes = [
  { path: '', component: MarketplaceComponent },
  { path: 'producto/:id', component: ProductDetailComponent },
  { 
    path: 'admin', 
    loadChildren: () => import('./admin/admin-module').then(m => m.AdminModule) 
  }
];