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
import { SupplierRepository } from "@/repositories/supplier.repository";
import { SupplierService } from "./supplier.service";

// Repositories
export const userRepository = new UserRepository();
export const categoryRepository = new CategoryRepository();
export const customerRepository = new CustomerRepository();
export const productRepository = new ProductRepository();
export const saleRepository = new SaleRepository();
export const quoteRepository = new QuoteRepository();
export const supplierRepository = new SupplierRepository();

// Services
export const userService = new UserService(userRepository);
export const categoryService = new CategoryService(categoryRepository);
export const productService = new ProductService(productRepository);
export const customerService = new CustomerService(customerRepository);
export const saleService = new SaleService(saleRepository);
export const quoteService = new QuoteService(quoteRepository);
export const supplierService = new SupplierService(supplierRepository);

