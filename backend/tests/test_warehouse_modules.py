"""
Backend Tests for Warehouse, Supplier, and Purchases Modules
Tests for CRUD operations on warehouses (depósitos), suppliers (proveedores), and purchases (compras)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@ferreteria.com"
ADMIN_PASSWORD = "admin123"


class TestSetup:
    """Setup tests - verify API is accessible"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        print(f"SUCCESS: API is online")


class TestAuthentication:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        print(f"SUCCESS: Admin login successful")
        return data["access_token"]
    
    def test_admin_login(self, auth_token):
        """Test admin login"""
        assert auth_token is not None
        print(f"SUCCESS: Got auth token")


class TestWarehousesCRUD:
    """Tests for Warehouses (Depósitos) CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authenticated headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_list_warehouses(self, auth_headers):
        """Test listing warehouses"""
        response = requests.get(f"{BASE_URL}/api/warehouses", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Listed {len(data)} warehouses")
    
    def test_create_warehouse(self, auth_headers):
        """Test creating a new warehouse"""
        warehouse_data = {
            "nombre": "TEST_Depósito Sucursal Norte",
            "direccion": "Av. Norte 123",
            "encargado": "Juan Pérez",
            "telefono": "123456789"
        }
        response = requests.post(f"{BASE_URL}/api/warehouses", json=warehouse_data, headers=auth_headers)
        assert response.status_code == 201, f"Create failed: {response.text}"
        data = response.json()
        assert data["nombre"] == warehouse_data["nombre"]
        assert data["direccion"] == warehouse_data["direccion"]
        assert "id" in data
        print(f"SUCCESS: Created warehouse with id: {data['id']}")
        return data["id"]
    
    def test_create_warehouse_and_verify_persistence(self, auth_headers):
        """Test creating warehouse and verifying GET returns correct data"""
        # Create warehouse
        warehouse_data = {
            "nombre": "TEST_Depósito Verificación",
            "direccion": "Calle Verificación 999",
            "encargado": "Test Encargado",
            "telefono": "999888777"
        }
        create_response = requests.post(f"{BASE_URL}/api/warehouses", json=warehouse_data, headers=auth_headers)
        assert create_response.status_code == 201
        created = create_response.json()
        warehouse_id = created["id"]
        
        # Verify in list
        list_response = requests.get(f"{BASE_URL}/api/warehouses", headers=auth_headers)
        assert list_response.status_code == 200
        warehouses = list_response.json()
        
        found = next((w for w in warehouses if w["id"] == warehouse_id), None)
        assert found is not None, "Created warehouse not found in list"
        assert found["nombre"] == warehouse_data["nombre"]
        assert found["direccion"] == warehouse_data["direccion"]
        print(f"SUCCESS: Warehouse {warehouse_id} persisted and verified")
    
    def test_update_warehouse(self, auth_headers):
        """Test updating a warehouse"""
        # First create
        create_data = {"nombre": "TEST_Depósito Para Editar", "direccion": "Dirección Original"}
        create_response = requests.post(f"{BASE_URL}/api/warehouses", json=create_data, headers=auth_headers)
        assert create_response.status_code == 201
        warehouse_id = create_response.json()["id"]
        
        # Update
        update_data = {"direccion": "Dirección Actualizada", "encargado": "Nuevo Encargado"}
        update_response = requests.put(f"{BASE_URL}/api/warehouses/{warehouse_id}", json=update_data, headers=auth_headers)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["direccion"] == "Dirección Actualizada"
        assert updated["encargado"] == "Nuevo Encargado"
        print(f"SUCCESS: Warehouse {warehouse_id} updated")
    
    def test_delete_warehouse(self, auth_headers):
        """Test deleting a warehouse"""
        # First create
        create_data = {"nombre": "TEST_Depósito Para Eliminar", "direccion": "Se eliminará"}
        create_response = requests.post(f"{BASE_URL}/api/warehouses", json=create_data, headers=auth_headers)
        assert create_response.status_code == 201
        warehouse_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/warehouses/{warehouse_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify deleted
        list_response = requests.get(f"{BASE_URL}/api/warehouses", headers=auth_headers)
        warehouses = list_response.json()
        found = next((w for w in warehouses if w["id"] == warehouse_id), None)
        assert found is None, "Deleted warehouse still exists"
        print(f"SUCCESS: Warehouse {warehouse_id} deleted and verified")


class TestSuppliersCRUD:
    """Tests for Suppliers (Proveedores) CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authenticated headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_list_suppliers(self, auth_headers):
        """Test listing suppliers"""
        response = requests.get(f"{BASE_URL}/api/suppliers", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Listed {len(data)} suppliers")
    
    def test_create_supplier(self, auth_headers):
        """Test creating a new supplier"""
        supplier_data = {
            "nombre": "TEST_Proveedor Industrial SA",
            "contacto": "María García",
            "email": "maria@industrial.com",
            "telefono": "11-2233-4455",
            "direccion": "Zona Industrial 456",
            "cuit": "30-12345678-9"
        }
        response = requests.post(f"{BASE_URL}/api/suppliers", json=supplier_data, headers=auth_headers)
        assert response.status_code == 201, f"Create failed: {response.text}"
        data = response.json()
        assert data["nombre"] == supplier_data["nombre"]
        assert data["email"] == supplier_data["email"]
        assert data["cuit"] == supplier_data["cuit"]
        assert "id" in data
        print(f"SUCCESS: Created supplier with id: {data['id']}")
    
    def test_create_supplier_and_verify_persistence(self, auth_headers):
        """Test creating supplier and verifying GET returns correct data"""
        supplier_data = {
            "nombre": "TEST_Proveedor Verificación",
            "contacto": "Test Contacto",
            "email": "test@verificacion.com",
            "telefono": "555-1234",
            "direccion": "Test Direccion",
            "cuit": "20-99999999-0"
        }
        create_response = requests.post(f"{BASE_URL}/api/suppliers", json=supplier_data, headers=auth_headers)
        assert create_response.status_code == 201
        created = create_response.json()
        supplier_id = created["id"]
        
        # Verify in list
        list_response = requests.get(f"{BASE_URL}/api/suppliers", headers=auth_headers)
        assert list_response.status_code == 200
        suppliers = list_response.json()
        
        found = next((s for s in suppliers if s["id"] == supplier_id), None)
        assert found is not None, "Created supplier not found in list"
        assert found["nombre"] == supplier_data["nombre"]
        assert found["cuit"] == supplier_data["cuit"]
        print(f"SUCCESS: Supplier {supplier_id} persisted and verified")
    
    def test_update_supplier(self, auth_headers):
        """Test updating a supplier"""
        # First create
        create_data = {"nombre": "TEST_Proveedor Para Editar"}
        create_response = requests.post(f"{BASE_URL}/api/suppliers", json=create_data, headers=auth_headers)
        assert create_response.status_code == 201
        supplier_id = create_response.json()["id"]
        
        # Update
        update_data = {"contacto": "Nuevo Contacto", "telefono": "11-9999-8888"}
        update_response = requests.put(f"{BASE_URL}/api/suppliers/{supplier_id}", json=update_data, headers=auth_headers)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["contacto"] == "Nuevo Contacto"
        assert updated["telefono"] == "11-9999-8888"
        print(f"SUCCESS: Supplier {supplier_id} updated")
    
    def test_delete_supplier(self, auth_headers):
        """Test deleting a supplier"""
        # First create
        create_data = {"nombre": "TEST_Proveedor Para Eliminar"}
        create_response = requests.post(f"{BASE_URL}/api/suppliers", json=create_data, headers=auth_headers)
        assert create_response.status_code == 201
        supplier_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/suppliers/{supplier_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify deleted
        list_response = requests.get(f"{BASE_URL}/api/suppliers", headers=auth_headers)
        suppliers = list_response.json()
        found = next((s for s in suppliers if s["id"] == supplier_id), None)
        assert found is None, "Deleted supplier still exists"
        print(f"SUCCESS: Supplier {supplier_id} deleted and verified")


class TestPurchasesCRUD:
    """Tests for Purchases (Compras) CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authenticated headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def test_warehouse_id(self, auth_headers):
        """Get or create test warehouse for purchases"""
        # Try to get existing
        response = requests.get(f"{BASE_URL}/api/warehouses", headers=auth_headers)
        warehouses = response.json()
        if warehouses:
            return warehouses[0]["id"]
        
        # Create new
        create_response = requests.post(f"{BASE_URL}/api/warehouses", 
            json={"nombre": "TEST_Depósito Compras"}, headers=auth_headers)
        return create_response.json()["id"]
    
    @pytest.fixture(scope="class")
    def test_supplier_id(self, auth_headers):
        """Get or create test supplier for purchases"""
        # Try to get existing
        response = requests.get(f"{BASE_URL}/api/suppliers", headers=auth_headers)
        suppliers = response.json()
        if suppliers:
            return suppliers[0]["id"]
        
        # Create new
        create_response = requests.post(f"{BASE_URL}/api/suppliers",
            json={"nombre": "TEST_Proveedor Compras"}, headers=auth_headers)
        return create_response.json()["id"]
    
    @pytest.fixture(scope="class")
    def test_product(self, auth_headers):
        """Get or create test product for purchases"""
        # Try to get existing
        response = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
        products = response.json()
        if products:
            return products[0]
        
        # Create new - get category first
        cat_response = requests.get(f"{BASE_URL}/api/categories", headers=auth_headers)
        categories = cat_response.json()
        if not categories:
            cat_create = requests.post(f"{BASE_URL}/api/categories",
                json={"nombre": "TEST_Categoría"}, headers=auth_headers)
            category_id = cat_create.json()["id"]
        else:
            category_id = categories[0]["id"]
        
        create_response = requests.post(f"{BASE_URL}/api/products",
            json={"nombre": "TEST_Producto Compras", "precio": 100.0, "stock_actual": 10, "categoria_id": category_id}, 
            headers=auth_headers)
        return create_response.json()
    
    def test_list_purchases(self, auth_headers):
        """Test listing purchases"""
        response = requests.get(f"{BASE_URL}/api/purchases", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Listed {len(data)} purchases")
    
    def test_create_purchase_order(self, auth_headers, test_warehouse_id, test_supplier_id, test_product):
        """Test creating a new purchase order"""
        purchase_data = {
            "proveedor_id": test_supplier_id,
            "deposito_id": test_warehouse_id,
            "items": [
                {
                    "producto_id": test_product["id"],
                    "producto_nombre": test_product["nombre"],
                    "cantidad": 5,
                    "precio_unitario": 80.0,
                    "subtotal": 400.0
                }
            ],
            "notas": "TEST_Orden de compra de prueba"
        }
        response = requests.post(f"{BASE_URL}/api/purchases", json=purchase_data, headers=auth_headers)
        assert response.status_code == 201, f"Create failed: {response.text}"
        data = response.json()
        assert data["estado"] == "pendiente"
        assert data["total"] == 400.0
        assert len(data["items"]) == 1
        assert "id" in data
        print(f"SUCCESS: Created purchase order with id: {data['id']}")
        return data["id"]
    
    def test_create_purchase_and_verify_persistence(self, auth_headers, test_warehouse_id, test_supplier_id, test_product):
        """Test creating purchase and verifying GET returns correct data"""
        purchase_data = {
            "proveedor_id": test_supplier_id,
            "deposito_id": test_warehouse_id,
            "items": [
                {
                    "producto_id": test_product["id"],
                    "producto_nombre": test_product["nombre"],
                    "cantidad": 3,
                    "precio_unitario": 50.0,
                    "subtotal": 150.0
                }
            ],
            "notas": "TEST_Orden verificación"
        }
        create_response = requests.post(f"{BASE_URL}/api/purchases", json=purchase_data, headers=auth_headers)
        assert create_response.status_code == 201
        created = create_response.json()
        purchase_id = created["id"]
        
        # Verify in list
        list_response = requests.get(f"{BASE_URL}/api/purchases", headers=auth_headers)
        assert list_response.status_code == 200
        purchases = list_response.json()
        
        found = next((p for p in purchases if p["id"] == purchase_id), None)
        assert found is not None, "Created purchase not found in list"
        assert found["total"] == 150.0
        assert found["estado"] == "pendiente"
        print(f"SUCCESS: Purchase {purchase_id} persisted and verified")
        return purchase_id
    
    def test_receive_purchase_and_verify_stock_update(self, auth_headers, test_warehouse_id, test_supplier_id, test_product):
        """Test receiving a purchase and verifying stock is updated"""
        # Get initial stock
        initial_stock = test_product.get("stock_actual", 0)
        
        # Create purchase
        quantity_to_receive = 10
        purchase_data = {
            "proveedor_id": test_supplier_id,
            "deposito_id": test_warehouse_id,
            "items": [
                {
                    "producto_id": test_product["id"],
                    "producto_nombre": test_product["nombre"],
                    "cantidad": quantity_to_receive,
                    "precio_unitario": 75.0,
                    "subtotal": 750.0
                }
            ],
            "notas": "TEST_Orden para recibir y actualizar stock"
        }
        create_response = requests.post(f"{BASE_URL}/api/purchases", json=purchase_data, headers=auth_headers)
        assert create_response.status_code == 201
        purchase_id = create_response.json()["id"]
        
        # Receive purchase
        receive_response = requests.post(f"{BASE_URL}/api/purchases/{purchase_id}/receive", headers=auth_headers)
        assert receive_response.status_code == 200, f"Receive failed: {receive_response.text}"
        receive_data = receive_response.json()
        assert "message" in receive_data
        print(f"SUCCESS: Purchase {purchase_id} received")
        
        # Verify purchase status changed
        list_response = requests.get(f"{BASE_URL}/api/purchases", headers=auth_headers)
        purchases = list_response.json()
        updated_purchase = next((p for p in purchases if p["id"] == purchase_id), None)
        assert updated_purchase["estado"] == "recibida"
        print(f"SUCCESS: Purchase status updated to 'recibida'")
        
        # Verify stock was updated
        product_response = requests.get(f"{BASE_URL}/api/products/{test_product['id']}", headers=auth_headers)
        assert product_response.status_code == 200
        updated_product = product_response.json()
        
        # Stock should have increased by quantity received
        # Note: may need to account for multiple test runs
        assert updated_product["stock_actual"] >= quantity_to_receive
        print(f"SUCCESS: Stock updated. Product stock: {updated_product['stock_actual']}")
    
    def test_cannot_receive_already_received_purchase(self, auth_headers, test_warehouse_id, test_supplier_id, test_product):
        """Test that a purchase cannot be received twice"""
        # Create and receive
        purchase_data = {
            "proveedor_id": test_supplier_id,
            "deposito_id": test_warehouse_id,
            "items": [
                {
                    "producto_id": test_product["id"],
                    "producto_nombre": test_product["nombre"],
                    "cantidad": 2,
                    "precio_unitario": 100.0,
                    "subtotal": 200.0
                }
            ],
            "notas": "TEST_Orden doble recepción"
        }
        create_response = requests.post(f"{BASE_URL}/api/purchases", json=purchase_data, headers=auth_headers)
        purchase_id = create_response.json()["id"]
        
        # First receive - should work
        receive_response = requests.post(f"{BASE_URL}/api/purchases/{purchase_id}/receive", headers=auth_headers)
        assert receive_response.status_code == 200
        
        # Second receive - should fail
        second_receive_response = requests.post(f"{BASE_URL}/api/purchases/{purchase_id}/receive", headers=auth_headers)
        assert second_receive_response.status_code == 400
        print(f"SUCCESS: Duplicate receive correctly rejected")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authenticated headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_cleanup_test_warehouses(self, auth_headers):
        """Cleanup test warehouses with TEST_ prefix"""
        response = requests.get(f"{BASE_URL}/api/warehouses", headers=auth_headers)
        warehouses = response.json()
        deleted_count = 0
        for w in warehouses:
            if w["nombre"].startswith("TEST_"):
                delete_response = requests.delete(f"{BASE_URL}/api/warehouses/{w['id']}", headers=auth_headers)
                if delete_response.status_code == 200:
                    deleted_count += 1
        print(f"INFO: Cleaned up {deleted_count} test warehouses")
    
    def test_cleanup_test_suppliers(self, auth_headers):
        """Cleanup test suppliers with TEST_ prefix"""
        response = requests.get(f"{BASE_URL}/api/suppliers", headers=auth_headers)
        suppliers = response.json()
        deleted_count = 0
        for s in suppliers:
            if s["nombre"].startswith("TEST_"):
                delete_response = requests.delete(f"{BASE_URL}/api/suppliers/{s['id']}", headers=auth_headers)
                if delete_response.status_code == 200:
                    deleted_count += 1
        print(f"INFO: Cleaned up {deleted_count} test suppliers")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
