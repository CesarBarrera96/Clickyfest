// product.model.ts - VERSIÓN CORREGIDA Y MEJORADA

// La interfaz para las categorías, que ya está correcta.
export interface Category {
  categoryID: number;
  categoryName: string;
}

// 1. Interfaz para una sola imagen de producto.
// Ahora coincide con las columnas de tu tabla SQL y usa camelCase.
export interface ProductImage {
  productImageID: number;
  imageUrl: string;
  isFeatured: boolean;
  productID: number; // Añadimos esta propiedad
}

// 2. La interfaz principal para un producto.
export interface Product {
  productID: number;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  discountEndDate?: string; // Las fechas suelen llegar como strings
  demoUrl?: string;
  categoryID: number;

  // Orden personalizado
  globalDisplayOrder?: number | null;
  categoryDisplayOrder?: number | null;

  // Relación cargada desde el backend (EF Include)
  category?: Category;

  // 3. La propiedad 'images' ahora está "tipada" correctamente.
  // Le decimos que es un array de objetos que cumplen con el contrato de ProductImage.
  productImages: ProductImage[]; // De 'images' a 'productImages'
}

// En product.model.ts

// ... tus interfaces de Product, Category, ProductImage ...

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}


