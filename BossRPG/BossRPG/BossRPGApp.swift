import SwiftUI

@main
struct BossRPGApp: App {
    @StateObject private var networkMonitor = NetworkMonitor()
    @StateObject private var authManager = AuthenticationManager()
    @StateObject private var battleManager = BattleManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(networkMonitor)
                .environmentObject(authManager)
                .environmentObject(battleManager)
                .onAppear {
                    setupApp()
                }
        }
    }
    
    private func setupApp() {
        // Configure API endpoints
        APIConfiguration.shared.configure(
            baseURL: "http://localhost:4200",
            websocketURL: "ws://localhost:8081"
        )
        
        // Start network monitoring
        networkMonitor.startMonitoring()
        
        // Start WebSocket connection
        battleManager.connect()
        
        // Configure appearance
        configureAppearance()
    }
    
    private func configureAppearance() {
        // Navigation bar appearance
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = UIColor(red: 0.15, green: 0.15, blue: 0.2, alpha: 1.0)
        navAppearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        navAppearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]
        
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
        UINavigationBar.appearance().compactAppearance = navAppearance
        
        // Tab bar appearance
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = UIColor(red: 0.15, green: 0.15, blue: 0.2, alpha: 1.0)
        
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
    }
}

// MARK: - Configuration
class APIConfiguration {
    static let shared = APIConfiguration()
    
    var baseURL: String = ""
    var websocketURL: String = ""
    
    private init() {}
    
    func configure(baseURL: String, websocketURL: String) {
        self.baseURL = baseURL
        self.websocketURL = websocketURL
    }
}

// MARK: - Network Monitor
class NetworkMonitor: ObservableObject {
    @Published var isConnected: Bool = true
    @Published var connectionType: String = "Unknown"
    
    func startMonitoring() {
        // Implementation would use NWPathMonitor
        // For now, just simulate
        isConnected = true
        connectionType = "WiFi"
    }
}

// MARK: - Authentication Manager
class AuthenticationManager: ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var currentUser: User?
    @Published var userKingdom: Kingdom?
    
    func login(username: String, password: String) async -> Bool {
        // Simulate login
        await MainActor.run {
            self.isAuthenticated = true
            self.currentUser = User(
                id: UUID().uuidString,
                username: username,
                email: "\(username)@bossrpg.com",
                reputation: 100,
                level: "CITIZEN"
            )
        }
        return true
    }
    
    func logout() {
        isAuthenticated = false
        currentUser = nil
        userKingdom = nil
    }
}

// MARK: - Battle Manager
class BattleManager: ObservableObject {
    @Published var activeBattles: [Battle] = []
    @Published var isConnected: Bool = false
    
    private var webSocketTask: URLSessionWebSocketTask?
    
    func connect() {
        guard let url = URL(string: APIConfiguration.shared.websocketURL) else { return }
        
        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        
        isConnected = true
        receiveMessage()
    }
    
    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        isConnected = false
    }
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self?.handleMessage(text)
                    }
                @unknown default:
                    break
                }
                
                // Continue receiving messages
                self?.receiveMessage()
                
            case .failure(let error):
                print("WebSocket error: \(error)")
                self?.isConnected = false
            }
        }
    }
    
    private func handleMessage(_ text: String) {
        // Parse WebSocket messages and update battle state
        // This would decode JSON messages from the server
        print("Received: \(text)")
    }
}

// MARK: - Models
struct User: Identifiable, Codable {
    let id: String
    let username: String
    let email: String
    let reputation: Int
    let level: String
}

struct Kingdom: Identifiable, Codable {
    let id: String
    let name: String
    let ruler: String
    let members: Int
    let totalReputation: Int
}

struct Battle: Identifiable {
    let id: String
    let boss: Boss
    let players: [String]
    let status: BattleStatus
    let startTime: Date
}

struct Boss: Identifiable, Codable {
    let id: String
    let name: String
    let health: Int
    let damage: Int
    let speed: Int
    let specialAbility: String?
    let creator: String
}

enum BattleStatus: String {
    case waiting = "waiting"
    case active = "active"
    case completed = "completed"
}