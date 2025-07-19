#!/usr/bin/env python3
"""
ECONOMY STRESS TEST - Actually test if our economy works under load
"""

import json
import time
import threading
import random
import urllib.request
import urllib.parse
from datetime import datetime

class EconomyTester:
    """Comprehensive economy testing"""
    
    def __init__(self, base_url="http://localhost:8800"):
        self.base_url = base_url
        self.users = []
        self.results = {
            'users_created': 0,
            'bets_placed': 0,
            'total_volume': 0,
            'errors': [],
            'response_times': [],
            'balance_changes': []
        }
        
    def create_user(self, username):
        """Create a user and return their data"""
        try:
            data = json.dumps({'username': username}).encode()
            req = urllib.request.Request(f'{self.base_url}/api/login', data=data, 
                                       headers={'Content-Type': 'application/json'})
            
            start_time = time.time()
            response = urllib.request.urlopen(req, timeout=10)
            response_time = time.time() - start_time
            
            user_data = json.loads(response.read().decode())
            user_data['response_time'] = response_time
            
            self.results['users_created'] += 1
            self.results['response_times'].append(response_time)
            
            print(f"✅ Created user: {username} (ID: {user_data['id']}, Balance: ${user_data['balance']}) [{response_time:.3f}s]")
            return user_data
            
        except Exception as e:
            error = f"Failed to create user {username}: {e}"
            self.results['errors'].append(error)
            print(f"❌ {error}")
            return None
            
    def place_bet(self, user, amount=100, choice=None):
        """Place a bet for a user"""
        try:
            if choice is None:
                choice = random.choice(['yes', 'no'])
                
            prediction_titles = [
                "Bitcoin $100k", "Rain Tomorrow", "AI Breakthrough", 
                "Stock Rally", "Sports Upset", "Tech IPO"
            ]
            prediction = random.choice(prediction_titles)
            
            data = json.dumps({
                'userId': user['id'],
                'amount': amount,
                'choice': choice,
                'prediction': prediction
            }).encode()
            
            req = urllib.request.Request(f'{self.base_url}/api/bet', data=data,
                                       headers={'Content-Type': 'application/json'})
            
            start_time = time.time()
            response = urllib.request.urlopen(req, timeout=10)
            response_time = time.time() - start_time
            
            result = json.loads(response.read().decode())
            
            if result.get('success'):
                old_balance = user['balance']
                new_balance = result['newBalance']
                user['balance'] = new_balance
                
                self.results['bets_placed'] += 1
                self.results['total_volume'] += amount
                self.results['response_times'].append(response_time)
                self.results['balance_changes'].append({
                    'user': user['username'],
                    'old_balance': old_balance,
                    'new_balance': new_balance,
                    'amount': amount,
                    'prediction': prediction,
                    'choice': choice
                })
                
                print(f"💰 {user['username']} bet ${amount} on {choice.upper()} for '{prediction}' | Balance: ${old_balance} → ${new_balance} [{response_time:.3f}s]")
                return True
            else:
                error = f"Bet failed for {user['username']}: {result}"
                self.results['errors'].append(error)
                print(f"❌ {error}")
                return False
                
        except Exception as e:
            error = f"Exception placing bet for {user['username']}: {e}"
            self.results['errors'].append(error)
            print(f"❌ {error}")
            return False
            
    def simulate_user_behavior(self, user_id, num_actions=10):
        """Simulate realistic user behavior"""
        user = self.users[user_id]
        
        for i in range(num_actions):
            if user['balance'] < 50:
                print(f"💸 {user['username']} ran out of money!")
                break
                
            # Random delay between actions
            time.sleep(random.uniform(0.5, 3.0))
            
            # Place a bet
            amount = random.choice([50, 100, 150, 200])
            amount = min(amount, user['balance'])  # Don't bet more than balance
            
            self.place_bet(user, amount)
            
    def stress_test(self, num_users=20, actions_per_user=10):
        """Run a comprehensive stress test"""
        print(f"\n🔥 ECONOMY STRESS TEST")
        print(f"=" * 50)
        print(f"Users: {num_users}")
        print(f"Actions per user: {actions_per_user}")
        print(f"Expected total bets: {num_users * actions_per_user}")
        print()
        
        start_time = time.time()
        
        # Phase 1: Create users
        print("👥 Phase 1: Creating users...")
        for i in range(num_users):
            username = f"StressUser{i+1}_{int(time.time())}"
            user = self.create_user(username)
            if user:
                self.users.append(user)
                
        print(f"✅ Created {len(self.users)} users")
        
        # Phase 2: Concurrent betting
        print("\n💰 Phase 2: Concurrent betting simulation...")
        threads = []
        
        for i, user in enumerate(self.users):
            thread = threading.Thread(
                target=self.simulate_user_behavior,
                args=(i, actions_per_user)
            )
            threads.append(thread)
            thread.start()
            
            # Stagger thread starts to avoid thundering herd
            time.sleep(0.1)
            
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
            
        total_time = time.time() - start_time
        
        # Phase 3: Results analysis
        print(f"\n📊 STRESS TEST RESULTS")
        print(f"=" * 50)
        print(f"Total test time: {total_time:.2f} seconds")
        print(f"Users created: {self.results['users_created']}")
        print(f"Bets placed: {self.results['bets_placed']}")
        print(f"Total volume: ${self.results['total_volume']}")
        print(f"Errors: {len(self.results['errors'])}")
        
        if self.results['response_times']:
            avg_response = sum(self.results['response_times']) / len(self.results['response_times'])
            max_response = max(self.results['response_times'])
            print(f"Avg response time: {avg_response:.3f}s")
            print(f"Max response time: {max_response:.3f}s")
            
        print(f"Bets per second: {self.results['bets_placed'] / total_time:.2f}")
        
        # Error analysis
        if self.results['errors']:
            print(f"\n❌ ERRORS ({len(self.results['errors'])}):")
            for error in self.results['errors'][:10]:  # Show first 10
                print(f"  • {error}")
            if len(self.results['errors']) > 10:
                print(f"  ... and {len(self.results['errors']) - 10} more")
                
        # Balance analysis
        print(f"\n💰 BALANCE ANALYSIS:")
        final_balances = {}
        for change in self.results['balance_changes']:
            final_balances[change['user']] = change['new_balance']
            
        if final_balances:
            avg_balance = sum(final_balances.values()) / len(final_balances)
            min_balance = min(final_balances.values())
            max_balance = max(final_balances.values())
            
            print(f"Average final balance: ${avg_balance:.2f}")
            print(f"Min balance: ${min_balance}")
            print(f"Max balance: ${max_balance}")
            
            # Show some balance changes
            print(f"\n📈 SAMPLE BALANCE CHANGES:")
            for change in self.results['balance_changes'][:5]:
                print(f"  • {change['user']}: ${change['old_balance']} → ${change['new_balance']} ({change['choice']} on {change['prediction']})")
                
        # Performance assessment
        success_rate = (self.results['bets_placed'] / (num_users * actions_per_user)) * 100 if num_users * actions_per_user > 0 else 0
        error_rate = (len(self.results['errors']) / (self.results['users_created'] + self.results['bets_placed'])) * 100 if (self.results['users_created'] + self.results['bets_placed']) > 0 else 0
        
        print(f"\n🎯 PERFORMANCE ASSESSMENT:")
        print(f"Success rate: {success_rate:.1f}%")
        print(f"Error rate: {error_rate:.1f}%")
        
        if success_rate > 95 and error_rate < 5 and avg_response < 1.0:
            print("🎉 EXCELLENT: Economy system is performing well under load!")
        elif success_rate > 80 and error_rate < 10:
            print("✅ GOOD: Economy system is functional but could be optimized")
        else:
            print("⚠️  NEEDS WORK: Economy system has performance issues")
            
        return self.results
        
    def test_edge_cases(self):
        """Test edge cases and error conditions"""
        print(f"\n🧪 EDGE CASE TESTING")
        print(f"=" * 30)
        
        # Test 1: Invalid user
        print("Testing invalid user bet...")
        fake_user = {'id': 99999, 'username': 'FakeUser', 'balance': 1000}
        self.place_bet(fake_user)
        
        # Test 2: Insufficient balance
        print("Testing insufficient balance...")
        if self.users:
            user = self.users[0]
            user['balance'] = 10  # Force low balance
            self.place_bet(user, amount=1000)  # Try to bet more than balance
            
        # Test 3: Rapid fire requests
        print("Testing rapid fire requests...")
        if self.users:
            user = self.users[0]
            for i in range(5):
                self.place_bet(user, amount=10)
                time.sleep(0.1)  # Very fast requests
                
def main():
    print("🚀 SOULFRA ECONOMY TESTER")
    print("=" * 40)
    
    tester = EconomyTester()
    
    try:
        # Quick connectivity test
        print("🔌 Testing connectivity...")
        test_user = tester.create_user("ConnectivityTest")
        if test_user:
            print("✅ Server is reachable")
            
            # Menu
            while True:
                print("\n📋 TEST MENU:")
                print("1. Light test (5 users, 5 actions each)")
                print("2. Medium test (10 users, 10 actions each)")
                print("3. Heavy test (20 users, 15 actions each)")
                print("4. Edge case testing")
                print("5. Custom test")
                print("6. Exit")
                
                choice = input("\nSelect test: ").strip()
                
                if choice == '1':
                    tester.stress_test(5, 5)
                elif choice == '2':
                    tester.stress_test(10, 10)
                elif choice == '3':
                    tester.stress_test(20, 15)
                elif choice == '4':
                    tester.test_edge_cases()
                elif choice == '5':
                    try:
                        users = int(input("Number of users: "))
                        actions = int(input("Actions per user: "))
                        tester.stress_test(users, actions)
                    except ValueError:
                        print("Invalid input")
                elif choice == '6':
                    break
                else:
                    print("Invalid choice")
        else:
            print("❌ Cannot connect to server. Is it running on localhost:8800?")
            
    except KeyboardInterrupt:
        print("\n\n👋 Test interrupted by user")

if __name__ == '__main__':
    main()