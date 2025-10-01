import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product, Category } from '../../../models/product.model';
import { ProductService } from '../../../services/product.service';
import { ProductForm } from '../product-form/product-form';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DragDropModule,
    ProductForm // Añadir ProductForm a los imports
  ],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css']
})
export class AdminLayout implements OnInit, OnDestroy {
  products: Product[] = [];
  showProductForm: boolean = false;
  selectedProduct: Product | null = null;
 
  // Catálogo de categorías para asegurar mostrar el nombre incluso si el backend no incluye la relación
  categories: Category[] = [];
  categoryMap: Record<number, string> = {};
  // Estado de reordenamiento
  pendingOrder: boolean = false;
  savingOrder: boolean = false;

  // Filtros/ordenamientos UI
  searchTerm: string = '';
  selectedCategoryId: number | null = null;
  categoryCycleIndex: number = -1; // índice para ir "ciclando" categorías con la flechita
  priceSort: 'asc' | null = null;  // flechita en precio: ascendente o sin orden

  // Solo se permite reordenar cuando no hay búsqueda ni orden por precio
  get canReorder(): boolean {
    return !this.searchTerm && this.priceSort === null;
  }

  // UI: botón flotante "volver arriba"
  showScrollTop: boolean = false;

  constructor(private productService: ProductService) { }

  private addBodyModalClass(): void {
    document.body.classList.add('modal-open');
  }

  private removeBodyModalClass(): void {
    document.body.classList.remove('modal-open');
  }

  ngOnDestroy(): void {
    this.removeBodyModalClass();
  }

  ngOnInit(): void {
    console.log('AdminLayout: ngOnInit');
    this.loadCategories();
    this.loadProducts();
  }

  loadProducts(): void {
    console.log('AdminLayout: Loading products...');
    const catId = this.selectedCategoryId ?? undefined;
    this.productService.getProducts(catId ?? undefined, 1, 200).subscribe(data => {
      this.products = data.items;
      this.pendingOrder = false;
      this.savingOrder = false;
      console.log('AdminLayout: Products loaded', this.products);
    });
  }

  // Productos mostrados aplicando filtros y ordenamientos
  get displayedProducts(): Product[] {
    let items = [...this.products];

    // Filtro por nombre
    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      items = items.filter(p => (p.name || '').toLowerCase().includes(term));
    }

    // Filtro por categoría (incluye cuando viene relacionada y/o por ID)
    if (this.selectedCategoryId) {
      items = items.filter(p => p.categoryID === this.selectedCategoryId);
    }

    // Orden por precio (ascendente)
    if (this.priceSort === 'asc') {
      items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    }

    return items;
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe(cats => {
      this.categories = cats;
      this.categoryMap = cats.reduce((acc, c) => {
        acc[c.categoryID] = c.categoryName;
        return acc;
      }, {} as Record<number, string>);
    });
  }

  // UI handlers: búsqueda por nombre
  onSearchTermChange(value: string): void {
    this.searchTerm = value;
  }

  // UI handlers: Categoría
  resetCategoryFilter(): void {
    this.selectedCategoryId = null;
    this.categoryCycleIndex = -1;
    this.loadProducts();
  }

  cycleCategory(): void {
    if (!this.categories || this.categories.length === 0) return;
    this.categoryCycleIndex = (this.categoryCycleIndex + 1) % this.categories.length;
    const cat = this.categories[this.categoryCycleIndex];
    this.selectedCategoryId = cat.categoryID;
    this.loadProducts();
  }

  // UI handlers: Precio
  resetPriceSort(): void {
    this.priceSort = null;
  }

  togglePriceSort(): void {
    // Solo ascendente: alterna entre 'asc' y null
    this.priceSort = this.priceSort === 'asc' ? null : 'asc';
  }
 
  // Drag and Drop de filas (solo cuando canReorder es true)
  onDrop(event: CdkDragDrop<Product[]>): void {
    if (!this.canReorder) return;
 
    if (this.selectedCategoryId != null) {
      // Reordenar solo el subconjunto de la categoría seleccionada
      const subset = this.products.filter(p => p.categoryID === this.selectedCategoryId);
      moveItemInArray(subset, event.previousIndex, event.currentIndex);
      let i = 0;
      this.products = this.products.map(p => {
        if (p.categoryID === this.selectedCategoryId) {
          return subset[i++];
        }
        return p;
      });
    } else {
      // Reordenamiento global (sin filtro de categoría)
      moveItemInArray(this.products, event.previousIndex, event.currentIndex);
    }
    this.pendingOrder = true;
  }
 
  saveOrder(): void {
    if (!this.pendingOrder || this.savingOrder) return;
 
    const isCategory = this.selectedCategoryId != null;
    const source = isCategory
      ? this.products.filter(p => p.categoryID === this.selectedCategoryId)
      : this.products;
 
    const payload = source.map((p, idx) => ({
      productId: p.productID,
      order: idx + 1
    }));
 
    this.savingOrder = true;
    const request$ = isCategory
      ? this.productService.reorderCategory(this.selectedCategoryId!, payload)
      : this.productService.reorderGlobal(payload);
 
    request$.subscribe({
      next: () => {
        this.savingOrder = false;
        this.pendingOrder = false;
        this.loadProducts();
      },
      error: (err) => {
        this.savingOrder = false;
        console.error('AdminLayout: Error saving order', err);
      }
    });
  }
 
  // Scroll top
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.showScrollTop = (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop) > 400;
  }

  scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
    return 'https://placehold.co/60'; // Using a reliable placeholder
  }

  openCreateProductForm(): void {
    this.selectedProduct = null;
    this.showProductForm = true;
    this.addBodyModalClass();
  }

  openEditProductForm(product: Product): void {
    this.selectedProduct = product;
    this.showProductForm = true;
    this.addBodyModalClass();
  }

  closeProductForm(): void {
    this.showProductForm = false;
    this.selectedProduct = null;
    this.removeBodyModalClass();
  }

  onProductSaved(): void {
    this.closeProductForm(); 
    this.loadProducts(); // Recargar la lista de productos después de guardar
  }

  deleteProduct(id: number): void {
    console.log('AdminLayout: Deleting product with ID', id);
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe(() => {
        console.log('AdminLayout: Product deleted successfully');
        this.loadProducts(); // Recargar la lista de productos después de eliminar
      }, error => {
        console.error('AdminLayout: Error deleting product', error);
      });
    }
  }
}
