import { UserRepository } from "@/repositories/user.repository";
import { UserService } from "./user.service";
import { CategoryRepository } from "@/repositories/category.repository";
import { CategoryService } from "./category.service";
import { ProductRepository } from "@/repositories/product.repository";
import { ProductService } from "./product.service";
import { CustomerRepository } from "@/repositories/customer.repository";
import { CustomerService } from "./customer.service";
import { SaleRepository } from "@/repositories/sale.repository";
import { SaleService } from "./sale.service";
import { QuoteRepository } from "@/repositories/quote.repository";
import { QuoteService } from "./quote.service";
import { AfipService, AfipConfig } from "./afip.service";

// Repositories
export const userRepository = new UserRepository();
export const categoryRepository = new CategoryRepository();
export const customerRepository = new CustomerRepository();
export const productRepository = new ProductRepository();
export const saleRepository = new SaleRepository();
export const quoteRepository = new QuoteRepository();

// Services
export const userService = new UserService(userRepository);
export const categoryService = new CategoryService(categoryRepository);
export const productService = new ProductService(productRepository);
export const customerService = new CustomerService(customerRepository);
export const saleService = new SaleService(saleRepository);
export const quoteService = new QuoteService(quoteRepository);

// AFIP Service - Se inicializa con configuración desde variables de entorno
export function createAfipService(): AfipService | null {
  const cuit = process.env.AFIP_CUIT;
  const puntoVenta = process.env.AFIP_PUNTO_VENTA;
  const ambiente = process.env.AFIP_AMBIENTE || "testing";
  const certPath = process.env.AFIP_CERT_PATH;
  const keyPath = process.env.AFIP_KEY_PATH;
  const certContent = process.env.AFIP_CERT_CONTENT;
  const keyContent = process.env.AFIP_KEY_CONTENT;

  if (!cuit || !puntoVenta) {
    console.warn("Configuración de AFIP incompleta. Variables requeridas: AFIP_CUIT, AFIP_PUNTO_VENTA");
    return null;
  }

  const config: AfipConfig = {
    cuit,
    puntoVenta: parseInt(puntoVenta),
    ambiente: ambiente as "testing" | "production",
    certPath,
    keyPath,
    certContent,
    keyContent,
  };

  return new AfipService(config);
}

export const afipService = createAfipService();

