import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { CommonModule } from '@angular/common';
import { Category, Product, ProductImage } from '../../../models/product.model';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css'
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);

  @Input() product: Product | null = null;
  @Output() productSaved = new EventEmitter<void>();
  @Output() cancelForm = new EventEmitter<void>();

  productForm!: FormGroup;
  isEditMode = false;
  categories: Category[] = [];
  productImages: ProductImage[] = [];
  selectedFiles: File[] = []; // Almacenar archivos seleccionados

  ngOnInit(): void {
    this.loadCategories();

    this.productForm = this.fb.group({
      productID: [0],
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPrice: [null],
      discountEndDate: [null],
      demoUrl: [''],
      categoryID: [null, Validators.required]
    });

    if (this.product) {
      this.isEditMode = true;
      this.productForm.patchValue(this.product);
      if (this.product.productImages) {
        this.productImages = [...this.product.productImages];
      }
    }
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    if (element.files) {
      this.selectedFiles = Array.from(element.files);

      // Si estamos en modo edición, subir inmediatamente
      if (this.isEditMode && this.product && this.product.productID) {
        this.uploadFiles(this.product.productID).subscribe((uploadedImages: ProductImage[]) => {
          this.productImages = [...this.productImages, ...uploadedImages];
          this.selectedFiles = []; // Limpiar después de subir
          element.value = '';
        });
      }
    }
  }

  uploadFiles(productId: number): Observable<ProductImage[]> {
    if (this.selectedFiles.length === 0) {
      return of([]);
    }
    const uploadObservables = this.selectedFiles.map(file =>
      this.productService.uploadImage(productId, file)
    );
    return forkJoin(uploadObservables);
  }

  deleteImage(imageId: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      this.productService.deleteImage(imageId).subscribe(() => {
        this.productImages = this.productImages.filter(img => img.productImageID !== imageId);
      }, error => {
        console.error('Error deleting image', error);
      });
    }
  }

  // Marca una imagen como portada (IsFeatured = true) y el resto como false
  toggleFeatured(image: ProductImage): void {
    this.productImages = this.productImages.map(img => ({
      ...img,
      isFeatured: img.productImageID === image.productImageID
    }));
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      return;
    }

    if (this.isEditMode && this.product) {
      const updatedProduct: Product = { ...this.product, ...this.productForm.value, productImages: this.productImages };
      this.productService.updateProduct(updatedProduct.productID, updatedProduct).subscribe(() => {
        this.productSaved.emit();
      });
    } else {
      const newProductData: Partial<Product> = {
        ...this.productForm.value,
        productID: 0,
        productImages: []
      };

      this.productService.createProduct(newProductData).pipe(
        switchMap(createdProduct => {
          // Una vez creado el producto, subir las imágenes seleccionadas
          return this.uploadFiles(createdProduct.productID);
        })
      ).subscribe(() => {
        this.productSaved.emit();
      });
    }
  }

  onCancel(): void {
    this.cancelForm.emit();
  }
}