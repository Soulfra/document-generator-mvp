import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @EnvironmentObject var networkMonitor: NetworkMonitor
    @State private var selectedTab = 0
    
    var body: some View {
        Group {
            if authManager.isAuthenticated {
                MainTabView(selectedTab: $selectedTab)
            } else {
                LoginView()
            }
        }
        .overlay(alignment: .top) {
            if !networkMonitor.isConnected {
                NetworkBanner()
            }
        }
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
    @Binding var selectedTab: Int
    
    var body: some View {
        TabView(selection: $selectedTab) {
            BossListView()
                .tabItem {
                    Label("Bosses", systemImage: "shield.fill")
                }
                .tag(0)
            
            BattleView()
                .tabItem {
                    Label("Battles", systemImage: "swords")
                }
                .tag(1)
            
            CreateBossView()
                .tabItem {
                    Label("Create", systemImage: "plus.circle.fill")
                }
                .tag(2)
            
            KingdomView()
                .tabItem {
                    Label("Kingdom", systemImage: "crown.fill")
                }
                .tag(3)
            
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(4)
        }
        .tint(.orange)
    }
}

// MARK: - Network Banner
struct NetworkBanner: View {
    var body: some View {
        HStack {
            Image(systemName: "wifi.slash")
                .foregroundColor(.white)
            Text("No Internet Connection")
                .foregroundColor(.white)
                .font(.system(size: 14, weight: .medium))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color.red)
        .cornerRadius(8)
        .padding(.top, 50)
        .shadow(radius: 4)
    }
}

// MARK: - Login View
struct LoginView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var username = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Logo/Title
                VStack(spacing: 10) {
                    Image(systemName: "shield.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.orange)
                    
                    Text("Boss RPG")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Create • Battle • Conquer")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 60)
                
                Spacer()
                
                // Login Form
                VStack(spacing: 16) {
                    TextField("Username", text: $username)
                        .textFieldStyle(RoundedTextFieldStyle())
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(RoundedTextFieldStyle())
                    
                    Button(action: login) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Login")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .disabled(isLoading || username.isEmpty || password.isEmpty)
                }
                .padding(.horizontal, 30)
                
                // Additional Options
                VStack(spacing: 10) {
                    Button("Create Account") {
                        // Navigate to registration
                    }
                    .foregroundColor(.orange)
                    
                    Button("Play as Guest") {
                        Task {
                            await loginAsGuest()
                        }
                    }
                    .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            .navigationBarHidden(true)
            .alert("Login Error", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    private func login() {
        isLoading = true
        
        Task {
            let success = await authManager.login(username: username, password: password)
            
            await MainActor.run {
                isLoading = false
                
                if !success {
                    errorMessage = "Invalid username or password"
                    showError = true
                }
            }
        }
    }
    
    private func loginAsGuest() async {
        let guestUsername = "Guest_\(Int.random(in: 1000...9999))"
        _ = await authManager.login(username: guestUsername, password: "guest")
    }
}

// MARK: - Text Field Style
struct RoundedTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)
    }
}

// MARK: - Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(AuthenticationManager())
            .environmentObject(NetworkMonitor())
            .environmentObject(BattleManager())
    }
}