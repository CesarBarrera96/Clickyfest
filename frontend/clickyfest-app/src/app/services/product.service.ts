// frontend/clickyfest-app/src/app/services/product.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, Category, PagedResult, ProductImage } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://clickyfest-api.azurewebsites.net/api';

  constructor(private http: HttpClient) { }

  getProducts(categoryId?: number, page: number = 1, pageSize: number = 10): Observable<PagedResult<Product>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }

    return this.http.get<PagedResult<Product>>(`${this.apiUrl}/products`, { params });
  }

  getProductById(id: number): Observable<Product> {
    const url = `${this.apiUrl}/products/${id}`;
    return this.http.get<Product>(url);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: number, product: Product): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  uploadImage(productId: number, file: File): Observable<ProductImage> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ProductImage>(`${this.apiUrl}/images/upload/${productId}`, formData);
  }

  deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/images/${imageId}`);
  }

  // Reordenamiento global: lista de { productId, order }
  reorderGlobal(items: { productId: number; order: number }[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/products/reorder/global`, items);
  }

  // Reordenamiento por categoría específica
  reorderCategory(categoryId: number, items: { productId: number; order: number }[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/products/reorder/category/${categoryId}`, items);
  }
}
