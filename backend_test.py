#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class FabrikaAPITester:
    def __init__(self, base_url="https://sar-ambalaj-takip.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_user = None
        self.viewer_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details
        }
        self.test_results.append(result)
        print(f"{status} - {name}: {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200, auth_required=True):
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                return False, {"error": f"Status {response.status_code}", "text": response.text[:200]}

        except Exception as e:
            return False, {"error": str(e)}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.make_request('GET', '', auth_required=False)
        self.log_test("Root API Endpoint", success, 
                     response.get('message', 'No message') if success else str(response))

    def test_user_registration(self):
        """Test user registration - first user should be admin"""
        timestamp = datetime.now().strftime('%H%M%S')
        
        # Register first user (should become admin)
        admin_data = {
            "email": f"admin_test_{timestamp}@test.com",
            "password": "TestPass123!",
            "full_name": "Test Admin User"
        }
        
        success, response = self.make_request('POST', 'auth/register', admin_data, 
                                            expected_status=200, auth_required=False)
        
        if success and response.get('role') == 'admin':
            self.admin_user = response
            self.log_test("First User Registration (Admin)", True, 
                         f"User created with admin role: {response.get('email')}")
        else:
            self.log_test("First User Registration (Admin)", False, 
                         f"Expected admin role, got: {response}")
            return False

        # Register second user (should be viewer)
        viewer_data = {
            "email": f"viewer_{timestamp}@test.com", 
            "password": "TestPass123!",
            "full_name": "Test Viewer User"
        }
        
        success, response = self.make_request('POST', 'auth/register', viewer_data,
                                            expected_status=200, auth_required=False)
        
        if success and response.get('role') == 'viewer':
            self.viewer_user = response
            self.log_test("Second User Registration (Viewer)", True,
                         f"User created with viewer role: {response.get('email')}")
        else:
            self.log_test("Second User Registration (Viewer)", False,
                         f"Expected viewer role, got: {response}")
        
        return True

    def test_user_login(self):
        """Test user login"""
        if not self.admin_user:
            self.log_test("Admin Login", False, "No admin user to test with")
            return False

        login_data = {
            "email": self.admin_user['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data,
                                            expected_status=200, auth_required=False)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_test("Admin Login", True, f"Token received: {self.token[:20]}...")
            return True
        else:
            self.log_test("Admin Login", False, str(response))
            return False

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.make_request('GET', 'auth/me')
        
        if success and response.get('role') == 'admin':
            self.log_test("Get Current User", True, f"Admin user: {response.get('email')}")
        else:
            self.log_test("Get Current User", False, str(response))

    def test_exchange_rates(self):
        """Test exchange rate management"""
        # Get exchange rates (should be empty initially)
        success, response = self.make_request('GET', 'exchange-rates')
        self.log_test("Get Exchange Rates", success, 
                     f"Found {len(response) if success else 0} rates")

        # Add USD rate
        usd_data = {"currency": "USD", "rate": 34.50}
        success, response = self.make_request('POST', 'exchange-rates', usd_data)
        self.log_test("Add USD Exchange Rate", success, 
                     f"USD rate: {response.get('rate') if success else 'Failed'}")

        # Add EUR rate  
        eur_data = {"currency": "EUR", "rate": 37.20}
        success, response = self.make_request('POST', 'exchange-rates', eur_data)
        self.log_test("Add EUR Exchange Rate", success,
                     f"EUR rate: {response.get('rate') if success else 'Failed'}")

        # Get rates again to verify
        success, response = self.make_request('GET', 'exchange-rates')
        if success and len(response) >= 2:
            self.log_test("Verify Exchange Rates Added", True, f"Found {len(response)} rates")
        else:
            self.log_test("Verify Exchange Rates Added", False, "Rates not found")

    def test_raw_materials(self):
        """Test raw materials management"""
        # Get raw materials (should be empty initially)
        success, response = self.make_request('GET', 'raw-materials')
        self.log_test("Get Raw Materials", success,
                     f"Found {len(response) if success else 0} materials")

        # Add raw material
        material_data = {
            "name": "PETKİM",
            "entry_date": "2024-01-15",
            "quantity": 1000.0,
            "unit": "kg", 
            "price": 25.50,
            "currency": "TL"
        }
        
        success, response = self.make_request('POST', 'raw-materials', material_data)
        material_id = response.get('id') if success else None
        self.log_test("Add Raw Material", success,
                     f"Material ID: {material_id}" if success else str(response))

        if material_id:
            # Update raw material
            updated_data = {**material_data, "quantity": 1200.0, "price": 26.00}
            success, response = self.make_request('PUT', f'raw-materials/{material_id}', updated_data)
            self.log_test("Update Raw Material", success,
                         f"Updated quantity: {response.get('quantity') if success else 'Failed'}")

            # Get materials again to verify
            success, response = self.make_request('GET', 'raw-materials')
            if success and len(response) >= 1:
                self.log_test("Verify Raw Material Added", True, f"Found {len(response)} materials")
            else:
                self.log_test("Verify Raw Material Added", False, "Materials not found")

            return material_id
        return None

    def test_production(self):
        """Test production management"""
        # Get production records (should be empty initially)
        success, response = self.make_request('GET', 'production')
        self.log_test("Get Production Records", success,
                     f"Found {len(response) if success else 0} records")

        # Add production record
        production_data = {
            "date": "2024-01-15",
            "machine": "Makine 1",
            "thickness_mm": 2.5,
            "width_cm": 150.0,
            "length_m": 100.0,
            "quantity": 10,
            "masura_model": "120"
        }
        
        success, response = self.make_request('POST', 'production', production_data)
        production_id = response.get('id') if success else None
        
        # Check if square meters calculated correctly: (150/100) * 100 = 150 m²
        expected_sqm = (production_data['width_cm'] / 100) * production_data['length_m']
        actual_sqm = response.get('square_meters', 0) if success else 0
        
        sqm_correct = abs(expected_sqm - actual_sqm) < 0.01
        self.log_test("Add Production Record", success and sqm_correct,
                     f"ID: {production_id}, Square meters: {actual_sqm} (expected: {expected_sqm})" if success else str(response))

        if production_id:
            # Update production record
            updated_data = {**production_data, "quantity": 15}
            success, response = self.make_request('PUT', f'production/{production_id}', updated_data)
            self.log_test("Update Production Record", success,
                         f"Updated quantity: {response.get('quantity') if success else 'Failed'}")

            return production_id
        return None

    def test_stock_auto_update(self):
        """Test that stock updates automatically from production"""
        # Get stock (should have entries from production)
        success, response = self.make_request('GET', 'stock')
        
        if success and len(response) > 0:
            stock_item = response[0]
            self.log_test("Stock Auto Update", True,
                         f"Stock found: {stock_item.get('model_name')} - Qty: {stock_item.get('quantity')}")
        else:
            self.log_test("Stock Auto Update", False, "No stock found after production")

    def test_user_management(self):
        """Test user management (admin only)"""
        # Get users
        success, response = self.make_request('GET', 'users')
        initial_count = len(response) if success else 0
        self.log_test("Get Users", success, f"Found {initial_count} users")

        # Create new user
        new_user_data = {
            "email": f"newuser_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "full_name": "New Test User",
            "role": "viewer"
        }
        
        success, response = self.make_request('POST', 'users', new_user_data)
        new_user_id = response.get('id') if success else None
        self.log_test("Create New User", success,
                     f"User ID: {new_user_id}" if success else str(response))

        if new_user_id:
            # Verify user was added
            success, response = self.make_request('GET', 'users')
            final_count = len(response) if success else 0
            self.log_test("Verify User Added", final_count > initial_count,
                         f"User count: {initial_count} -> {final_count}")

            # Delete user
            success, response = self.make_request('DELETE', f'users/{new_user_id}')
            self.log_test("Delete User", success, "User deleted" if success else str(response))

    def test_viewer_permissions(self):
        """Test that viewer users have read-only access"""
        if not self.viewer_user:
            self.log_test("Viewer Permissions Test", False, "No viewer user available")
            return

        # Login as viewer
        login_data = {
            "email": self.viewer_user['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data,
                                            auth_required=False)
        
        if not success:
            self.log_test("Viewer Login", False, str(response))
            return

        viewer_token = response.get('access_token')
        original_token = self.token
        self.token = viewer_token

        # Try to add exchange rate (should fail)
        rate_data = {"currency": "USD", "rate": 35.00}
        success, response = self.make_request('POST', 'exchange-rates', rate_data, expected_status=403)
        self.log_test("Viewer Cannot Add Exchange Rate", success,
                     "Access denied as expected" if success else "Viewer was allowed to add rate!")

        # Try to add raw material (should fail)
        material_data = {
            "name": "ESTOL",
            "entry_date": "2024-01-15",
            "quantity": 500.0,
            "unit": "kg",
            "price": 30.00,
            "currency": "TL"
        }
        success, response = self.make_request('POST', 'raw-materials', material_data, expected_status=403)
        self.log_test("Viewer Cannot Add Raw Material", success,
                     "Access denied as expected" if success else "Viewer was allowed to add material!")

        # Viewer should be able to read data
        success, response = self.make_request('GET', 'raw-materials')
        self.log_test("Viewer Can Read Raw Materials", success,
                     f"Found {len(response) if success else 0} materials")

        # Restore admin token
        self.token = original_token

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Fabrika Management System API Tests")
        print("=" * 60)

        # Basic connectivity
        self.test_root_endpoint()
        
        # Authentication flow
        if self.test_user_registration():
            if self.test_user_login():
                self.test_auth_me()
                
                # Core functionality tests
                self.test_exchange_rates()
                self.test_raw_materials()
                self.test_production()
                self.test_stock_auto_update()
                self.test_user_management()
                
                # Permission tests
                self.test_viewer_permissions()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = FabrikaAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())