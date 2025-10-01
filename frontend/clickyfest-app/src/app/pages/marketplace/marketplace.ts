// frontend/clickyfest-app/src/app/pages/marketplace/marketplace.ts

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Product, Category, PagedResult } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { PaginationComponent } from '../../components/pagination/pagination';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProductCardComponent,
    PaginationComponent
  ],
  templateUrl: './marketplace.html',
  styleUrl: './marketplace.css'
})
export class MarketplaceComponent implements OnInit, OnDestroy {
  @ViewChild('categorySelect') categorySelect!: ElementRef<HTMLSelectElement>;

  products: Product[] = [];
  categories: Category[] = [];
  selectedCategoryId: string | null = null;

  // Pagination
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.categories = data,
        error: (err) => console.error('Error al cargar las categorías:', err)
      });

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        window.scrollTo(0, 0);
        const categoryId = params.get('categoria');
        this.selectedCategoryId = categoryId;
        
        const page = params.get('page');
        this.currentPage = page ? parseInt(page, 10) : 1;

        const numericId = categoryId ? parseInt(categoryId, 10) : undefined;
        this.filterProducts(numericId, this.currentPage);
      });
  }

  onCategoryChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.router.navigate(['/'], { 
      queryParams: { 
        categoria: selectedValue || null,
        page: 1
      },
      queryParamsHandling: 'merge'
    });
  }

  onPageChange(page: number): void {
    this.router.navigate(['/'], {
      queryParams: { page: page },
      queryParamsHandling: 'merge'
    });
  }

  private filterProducts(categoryId: number | undefined, page: number): void {
    this.productService.getProducts(categoryId, page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: PagedResult<Product>) => {
          this.products = data.items;
          this.totalItems = data.totalCount;
          this.currentPage = data.pageNumber;
          if (this.categorySelect) {
            this.categorySelect.nativeElement.value = this.selectedCategoryId || '';
          }
        },
        error: (err) => console.error('Error al filtrar productos:', err)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
