// frontend/clickyfest-app/src/app/pages/product-detail/product-detail.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Product, ProductImage } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetailComponent implements OnInit {

  product: Product | undefined;
  selectedImageUrl: string | undefined;
  sortedImages: ProductImage[] = [];

  private touchStartX = 0;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idString = params.get('id');
      if (idString) {
        const id = parseInt(idString, 10);
        this.productService.getProductById(id).subscribe({
          next: (data) => {
            this.product = data;
            if (this.product && this.product.productImages && this.product.productImages.length > 0) {
              const featuredIndex = this.product.productImages.findIndex(img => img.isFeatured);
              if (featuredIndex > 0) {
                const featured = this.product.productImages[featuredIndex];
                const rest = this.product.productImages.filter((_, index) => index !== featuredIndex);
                this.sortedImages = [featured, ...rest];
              } else {
                this.sortedImages = [...this.product.productImages];
              }
              this.selectedImageUrl = this.sortedImages[0].imageUrl;
              this.preloadImages(); // Precargar imágenes para un carrusel más rápido
            }
          },
          error: (err) => console.error('Error al cargar el producto:', err)
        });
      }
    });
  }

  preloadImages(): void {
    this.sortedImages.forEach(image => {
      const img = new Image();
      img.src = image.imageUrl;
    });
  }

  selectImage(imageUrl: string): void {
    this.selectedImageUrl = imageUrl;
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchMove(event: TouchEvent): void {
    if (Math.abs(event.touches[0].clientX - this.touchStartX) > 10) {
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent): void {
    const touchEndX = event.changedTouches[0].clientX;
    const deltaX = touchEndX - this.touchStartX;
    const swipeThreshold = 50;

    if (!this.sortedImages || this.sortedImages.length <= 1) {
      return;
    }

    const currentIndex = this.sortedImages.findIndex(img => img.imageUrl === this.selectedImageUrl);
    if (currentIndex === -1) return;

    // Swipe hacia la izquierda (mostrar SIGUIENTE imagen)
    if (deltaX < -swipeThreshold) {
      const nextIndex = (currentIndex + 1) % this.sortedImages.length;
      this.selectImage(this.sortedImages[nextIndex].imageUrl);
    }
    
    // Swipe hacia la derecha (mostrar ANTERIOR imagen)
    if (deltaX > swipeThreshold) {
      const prevIndex = (currentIndex - 1 + this.sortedImages.length) % this.sortedImages.length;
      this.selectImage(this.sortedImages[prevIndex].imageUrl);
    }
  }

  requestOnWhatsApp(): void {
    if (!this.product) {
      console.error('El producto no está cargado, no se puede generar el enlace de WhatsApp.');
      return;
    }
    const phoneNumber = '5215512345678';
    const message = `Hola, estoy interesado(a) en la invitación digital '${this.product.name}'. ¿Podrían darme más información?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }
}