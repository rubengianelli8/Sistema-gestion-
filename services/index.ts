import { UserRepository } from "@/repositories/user.repository";
import { UserService } from "./user.service";
import { CategoryRepository } from "@/repositories/category.repository";
import { CategoryService } from "./category.service";
import { ProductRepository } from "@/repositories/product.repository";
import { ProductService } from "./product.service";

// Repositories
export const userRepository = new UserRepository();
export const categoryRepository = new CategoryRepository();
export const productRepository = new ProductRepository();

// Services
export const userService = new UserService(userRepository);
export const categoryService = new CategoryService(categoryRepository);
export const productService = new ProductService(productRepository);

