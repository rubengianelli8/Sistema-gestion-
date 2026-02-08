import requests
import sys
from datetime import datetime
import json

class FerreteriaAPITester:
    def __init__(self, base_url="https://team-sync-11.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for different users
        self.users = {
            'admin': {'email': 'admin@ferreteria.com', 'password': 'admin123'},
            'vendedor': {'email': 'vendedor@ferreteria.com', 'password': 'vendedor123'},
            'almacenero': {'email': 'almacenero@ferreteria.com', 'password': 'almacenero123'},
            'contador': {'email': 'contador@ferreteria.com', 'password': 'contador123'}
        }
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.current_user = None

    def log_result(self, test_name, success, details=""):
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
        
        self.test_results.append({
            "test_name": test_name,
            "success": success,
            "details": details,
            "user": self.current_user
        })

    def make_request(self, method, endpoint, data=None, expected_status=200, user_role=None):
        """Make API request with proper authentication"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add authorization if user role specified
        if user_role and user_role in self.tokens:
            headers['Authorization'] = f'Bearer {self.tokens[user_role]}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                pass
            
            return success, response.status_code, response_data
            
        except Exception as e:
            return False, 0, {"error": str(e)}

    def test_health_check(self):
        """Test API health check"""
        success, status, data = self.make_request("GET", "")
        self.log_result("Health Check", success, f"Status: {status}")
        return success

    def test_login(self, user_role):
        """Test login for specific user role"""
        user_data = self.users.get(user_role)
        if not user_data:
            self.log_result(f"Login {user_role}", False, "User not found in test data")
            return False
            
        success, status, data = self.make_request("POST", "auth/login", user_data)
        
        if success and 'access_token' in data:
            self.tokens[user_role] = data['access_token']
            self.log_result(f"Login {user_role}", True, f"Token received")
            return True
        else:
            self.log_result(f"Login {user_role}", False, f"Status: {status}, Data: {data}")
            return False

    def test_get_user_permissions(self, user_role):
        """Test getting user permissions"""
        success, status, data = self.make_request("GET", "auth/permissions", user_role=user_role)
        
        if success and 'permissions' in data:
            permissions_count = len(data['permissions'])
            self.log_result(f"Get Permissions {user_role}", True, f"{permissions_count} permissions")
            return True
        else:
            self.log_result(f"Get Permissions {user_role}", False, f"Status: {status}")
            return False

    def test_categories_crud(self, user_role):
        """Test categories CRUD operations"""
        self.current_user = user_role
        results = []
        
        # Test GET categories
        success, status, data = self.make_request("GET", "categories", user_role=user_role)
        results.append(success)
        self.log_result(f"GET Categories ({user_role})", success, f"Status: {status}")
        
        # Test POST category (only for roles with create permission)
        if user_role in ['admin', 'almacenero']:
            category_data = {
                "nombre": f"Test Category {datetime.now().strftime('%H%M%S')}",
                "descripcion": "Test category description"
            }
            success, status, data = self.make_request("POST", "categories", category_data, 201, user_role)
            results.append(success)
            self.log_result(f"CREATE Category ({user_role})", success, f"Status: {status}")
            
            if success and 'id' in data:
                category_id = data['id']
                
                # Test PUT category
                update_data = {"nombre": f"Updated Category {datetime.now().strftime('%H%M%S')}"}
                success, status, _ = self.make_request("PUT", f"categories/{category_id}", update_data, user_role=user_role)
                results.append(success)
                self.log_result(f"UPDATE Category ({user_role})", success, f"Status: {status}")
                
                # Test DELETE category
                success, status, _ = self.make_request("DELETE", f"categories/{category_id}", user_role=user_role)
                results.append(success)
                self.log_result(f"DELETE Category ({user_role})", success, f"Status: {status}")
        
        return all(results)

    def test_products_crud(self, user_role):
        """Test products CRUD operations"""
        self.current_user = user_role
        results = []
        
        # Test GET products
        success, status, data = self.make_request("GET", "products", user_role=user_role)
        results.append(success)
        self.log_result(f"GET Products ({user_role})", success, f"Status: {status}")
        
        # Test product search
        success, status, data = self.make_request("GET", "products/search?q=test", user_role=user_role)
        results.append(success)
        self.log_result(f"SEARCH Products ({user_role})", success, f"Status: {status}")
        
        # Test POST product (only for roles with create permission)
        if user_role in ['admin', 'almacenero']:
            product_data = {
                "nombre": f"Test Product {datetime.now().strftime('%H%M%S')}",
                "descripcion": "Test product description",
                "precio_minorista": 100.0,
                "precio_mayorista": 80.0,
                "stock_actual": 50,
                "stock_minimo": 10
            }
            success, status, data = self.make_request("POST", "products", product_data, 201, user_role)
            results.append(success)
            self.log_result(f"CREATE Product ({user_role})", success, f"Status: {status}")
        
        return all(results)

    def test_customers_crud(self, user_role):
        """Test customers CRUD operations"""
        self.current_user = user_role
        results = []
        
        # Test GET customers
        success, status, data = self.make_request("GET", "customers", user_role=user_role)
        results.append(success)
        self.log_result(f"GET Customers ({user_role})", success, f"Status: {status}")
        
        # Test POST customer (only for roles with create permission)
        if user_role in ['admin', 'vendedor']:
            customer_data = {
                "nombre": f"Test Customer {datetime.now().strftime('%H%M%S')}",
                "dni": "12345678",
                "email": f"testcustomer{datetime.now().strftime('%H%M%S')}@test.com",
                "telefono": "123456789",
                "limite_credito": 1000.0
            }
            success, status, data = self.make_request("POST", "customers", customer_data, 201, user_role)
            results.append(success)
            self.log_result(f"CREATE Customer ({user_role})", success, f"Status: {status}")
        
        return all(results)

    def test_sales_operations(self, user_role):
        """Test sales operations"""
        self.current_user = user_role
        results = []
        
        # Test GET sales
        success, status, data = self.make_request("GET", "sales", user_role=user_role)
        results.append(success)
        self.log_result(f"GET Sales ({user_role})", success, f"Status: {status}")
        
        # Test CREATE sale (only for roles with create permission)
        if user_role in ['admin', 'vendedor']:
            # First get a product to create sale with
            success, status, products = self.make_request("GET", "products", user_role=user_role)
            if success and products and len(products) > 0:
                product = products[0]
                sale_data = {
                    "items": [{
                        "producto_id": product['id'],
                        "producto_nombre": product['nombre'],
                        "cantidad": 1,
                        "precio_unitario": product['precio_minorista'],
                        "subtotal": product['precio_minorista']
                    }],
                    "metodo_pago": "efectivo"
                }
                success, status, data = self.make_request("POST", "sales", sale_data, 201, user_role)
                results.append(success)
                self.log_result(f"CREATE Sale ({user_role})", success, f"Status: {status}")
                
                # Test anular sale if created successfully
                if success and 'id' in data:
                    sale_id = data['id']
                    success, status, _ = self.make_request("POST", f"sales/{sale_id}/anular", user_role=user_role)
                    results.append(success)
                    self.log_result(f"ANULAR Sale ({user_role})", success, f"Status: {status}")
            else:
                self.log_result(f"CREATE Sale ({user_role})", False, "No products available for sale")
        
        return all(results)

    def test_quotes_operations(self, user_role):
        """Test quotes operations"""
        self.current_user = user_role
        results = []
        
        # Test GET quotes
        success, status, data = self.make_request("GET", "quotes", user_role=user_role)
        results.append(success)
        self.log_result(f"GET Quotes ({user_role})", success, f"Status: {status}")
        
        # Test CREATE quote (only for roles with create permission)
        if user_role in ['admin', 'vendedor']:
            # First get a product and customer
            success_p, _, products = self.make_request("GET", "products", user_role=user_role)
            success_c, _, customers = self.make_request("GET", "customers", user_role=user_role)
            
            if success_p and success_c and products and customers and len(products) > 0 and len(customers) > 0:
                product = products[0]
                customer = customers[0]
                quote_data = {
                    "cliente_id": customer['id'],
                    "items": [{
                        "producto_id": product['id'],
                        "producto_nombre": product['nombre'],
                        "cantidad": 2,
                        "precio_unitario": product['precio_minorista'],
                        "subtotal": product['precio_minorista'] * 2
                    }],
                    "validez_dias": 15
                }
                success, status, data = self.make_request("POST", "quotes", quote_data, 201, user_role)
                results.append(success)
                self.log_result(f"CREATE Quote ({user_role})", success, f"Status: {status}")
                
                # Test convert quote to sale if created successfully
                if success and 'id' in data:
                    quote_id = data['id']
                    success, status, _ = self.make_request("POST", f"quotes/{quote_id}/convertir", user_role=user_role)
                    results.append(success)
                    self.log_result(f"CONVERT Quote ({user_role})", success, f"Status: {status}")
            else:
                self.log_result(f"CREATE Quote ({user_role})", False, "No products or customers available")
        
        return all(results)

    def test_permission_restrictions(self):
        """Test that permission restrictions work correctly"""
        self.current_user = "permission_test"
        
        # Test that vendedor cannot create products
        if 'vendedor' in self.tokens:
            product_data = {
                "nombre": "Should Fail Product",
                "precio_minorista": 100.0,
                "precio_mayorista": 80.0,
                "stock_actual": 10,
                "stock_minimo": 5
            }
            success, status, data = self.make_request("POST", "products", product_data, 403, 'vendedor')
            permission_test = status == 403
            self.log_result("Vendedor Cannot Create Products", permission_test, f"Status: {status}")
        
        # Test that almacenero cannot see sales
        if 'almacenero' in self.tokens:
            success, status, data = self.make_request("GET", "sales", user_role='almacenero')
            permission_test = status == 403
            self.log_result("Almacenero Cannot View Sales", permission_test, f"Status: {status}")
        
        # Test that contador cannot create anything
        if 'contador' in self.tokens:
            category_data = {"nombre": "Should Fail Category"}
            success, status, data = self.make_request("POST", "categories", category_data, 403, 'contador')
            permission_test = status == 403
            self.log_result("Contador Cannot Create Categories", permission_test, f"Status: {status}")

    def run_full_test_suite(self):
        """Run complete test suite for the ferreteria system"""
        print("🚀 Starting Ferreteria API Test Suite")
        print("=" * 50)
        
        # Test health check
        if not self.test_health_check():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Test login for all users
        login_success = {}
        for role in self.users.keys():
            login_success[role] = self.test_login(role)
        
        if not any(login_success.values()):
            print("❌ No users could login. Stopping tests.")
            return False
        
        # Test permissions for each logged-in user
        for role in self.users.keys():
            if login_success.get(role):
                self.test_get_user_permissions(role)
        
        # Test CRUD operations for each module and user
        for role in self.users.keys():
            if login_success.get(role):
                print(f"\n--- Testing {role.upper()} role ---")
                self.test_categories_crud(role)
                self.test_products_crud(role)
                self.test_customers_crud(role)
                self.test_sales_operations(role)
                self.test_quotes_operations(role)
        
        # Test permission restrictions
        print(f"\n--- Testing Permission Restrictions ---")
        self.test_permission_restrictions()
        
        # Print final results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = FerreteriaAPITester()
    success = tester.run_full_test_suite()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())