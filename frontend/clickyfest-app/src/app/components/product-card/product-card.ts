import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- 1. AÑADE ESTA IMPORTACIÓN
import { Product } from '../../models/product.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule, // <-- 2. AÑADE ESTO AL ARRAY DE IMPORTS
    RouterModule
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCardComponent {
  @Input() product!: Product;

  getFeaturedImageUrl(product: Product): string {
    if (product.productImages && product.productImages.length > 0) {
      const featuredImage = product.productImages.find(img => img.isFeatured);
      if (featuredImage) {
        return featuredImage.imageUrl;
      }
      // Fallback to the first image if no featured image is set
      return product.productImages[0].imageUrl;
    }
    // Fallback to a placeholder if there are no images
    return 'https://placehold.co/300x300';
  }
}