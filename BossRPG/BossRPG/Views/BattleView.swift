import SwiftUI

struct BattleView: View {
    @EnvironmentObject var battleManager: BattleManager
    @StateObject private var viewModel = BattleViewModel()
    @State private var selectedBattle: LiveBattle?
    @State private var showingJoinOptions = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Battle Status Header
                BattleStatusHeader(
                    activeBattles: viewModel.activeBattles.count,
                    isConnected: battleManager.isConnected
                )
                
                // Content
                if viewModel.activeBattles.isEmpty && viewModel.recentBattles.isEmpty {
                    EmptyBattleView(showingJoinOptions: $showingJoinOptions)
                } else {
                    ScrollView {
                        VStack(spacing: 20) {
                            // Active Battles Section
                            if !viewModel.activeBattles.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Live Battles")
                                        .font(.headline)
                                        .padding(.horizontal)
                                    
                                    ForEach(viewModel.activeBattles) { battle in
                                        ActiveBattleCard(battle: battle) {
                                            selectedBattle = battle
                                        }
                                    }
                                }
                            }
                            
                            // Recent Battles Section
                            if !viewModel.recentBattles.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Recent Battles")
                                        .font(.headline)
                                        .padding(.horizontal)
                                    
                                    ForEach(viewModel.recentBattles) { battle in
                                        RecentBattleCard(battle: battle)
                                    }
                                }
                            }
                        }
                        .padding(.vertical)
                    }
                }
            }
            .navigationTitle("Battle Arena")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingJoinOptions = true }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.orange)
                    }
                }
            }
            .sheet(item: $selectedBattle) { battle in
                BattleDetailView(battle: battle)
            }
            .sheet(isPresented: $showingJoinOptions) {
                JoinBattleView()
            }
            .onAppear {
                viewModel.startMonitoring()
            }
            .onDisappear {
                viewModel.stopMonitoring()
            }
        }
    }
}

// MARK: - Battle Status Header
struct BattleStatusHeader: View {
    let activeBattles: Int
    let isConnected: Bool
    
    var body: some View {
        HStack {
            HStack(spacing: 6) {
                Circle()
                    .fill(isConnected ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
                Text(isConnected ? "Connected" : "Disconnected")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if activeBattles > 0 {
                Label("\(activeBattles) Active", systemImage: "flame.fill")
                    .font(.caption)
                    .foregroundColor(.orange)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
    }
}

// MARK: - Active Battle Card
struct ActiveBattleCard: View {
    let battle: LiveBattle
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 12) {
                // Battle Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(battle.boss.name)
                            .font(.headline)
                        Text("vs \(battle.players.count) players")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    // Live Indicator
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.red)
                            .frame(width: 8, height: 8)
                            .overlay(
                                Circle()
                                    .stroke(Color.red.opacity(0.3), lineWidth: 4)
                                    .scaleEffect(1.5)
                                    .opacity(0)
                                    .animation(
                                        Animation.easeOut(duration: 1)
                                            .repeatForever(autoreverses: false),
                                        value: UUID()
                                    )
                            )
                        Text("LIVE")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }
                }
                
                // Battle Grid Preview
                BattleGridPreview(battle: battle)
                    .frame(height: 150)
                    .cornerRadius(8)
                
                // Battle Stats
                HStack {
                    Label("\(battle.duration)s", systemImage: "clock")
                    Spacer()
                    Label("\(battle.boss.healthPercentage)% HP", systemImage: "heart.fill")
                        .foregroundColor(.red)
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.orange, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
        .padding(.horizontal)
    }
}

// MARK: - Battle Grid Preview
struct BattleGridPreview: View {
    let battle: LiveBattle
    @State private var animationTrigger = false
    
    var body: some View {
        ZStack {
            // Grid Background
            GridPattern()
                .fill(Color(.systemGray6))
            
            // Boss Position
            Circle()
                .fill(Color.red)
                .frame(width: 30, height: 30)
                .position(x: 75, y: 75)
                .overlay(
                    Text("B")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .position(x: 75, y: 75)
                )
            
            // Player Positions
            ForEach(0..<min(battle.players.count, 4), id: \.self) { index in
                Circle()
                    .fill(Color.blue)
                    .frame(width: 20, height: 20)
                    .position(
                        x: CGFloat.random(in: 20...130),
                        y: CGFloat.random(in: 20...130)
                    )
            }
        }
        .background(Color(.systemGray5))
        .onAppear {
            animationTrigger.toggle()
        }
    }
}

// MARK: - Recent Battle Card
struct RecentBattleCard: View {
    let battle: CompletedBattle
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 6) {
                Text(battle.boss.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                HStack(spacing: 12) {
                    Label(battle.result == .victory ? "Victory" : "Defeat", 
                          systemImage: battle.result == .victory ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(battle.result == .victory ? .green : .red)
                    
                    Text("\(battle.duration)s")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("+\(battle.rewardXP) XP")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.orange)
                
                if battle.rewardGold > 0 {
                    Text("+\(battle.rewardGold) gold")
                        .font(.caption2)
                        .foregroundColor(.yellow)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
        .padding(.horizontal)
    }
}

// MARK: - Empty State
struct EmptyBattleView: View {
    @Binding var showingJoinOptions: Bool
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "swords")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("No Active Battles")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Join a battle or wait for one to start")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Button(action: { showingJoinOptions = true }) {
                Text("Find Battle")
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.orange)
                    .cornerRadius(25)
            }
        }
        .padding()
    }
}

// MARK: - Grid Pattern Shape
struct GridPattern: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let gridSize: CGFloat = 20
        
        // Vertical lines
        for x in stride(from: 0, through: rect.width, by: gridSize) {
            path.move(to: CGPoint(x: x, y: 0))
            path.addLine(to: CGPoint(x: x, y: rect.height))
        }
        
        // Horizontal lines
        for y in stride(from: 0, through: rect.height, by: gridSize) {
            path.move(to: CGPoint(x: 0, y: y))
            path.addLine(to: CGPoint(x: rect.width, y: y))
        }
        
        return path
    }
}

// MARK: - View Model
class BattleViewModel: ObservableObject {
    @Published var activeBattles: [LiveBattle] = []
    @Published var recentBattles: [CompletedBattle] = []
    
    private var updateTimer: Timer?
    
    func startMonitoring() {
        // Initial load
        loadBattles()
        
        // Set up periodic updates
        updateTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { _ in
            self.updateBattles()
        }
    }
    
    func stopMonitoring() {
        updateTimer?.invalidate()
        updateTimer = nil
    }
    
    private func loadBattles() {
        // Mock data for now
        activeBattles = [
            LiveBattle(
                id: "1",
                boss: BattleBoss(
                    id: "b1",
                    name: "Fire Dragon",
                    maxHealth: 1000,
                    currentHealth: 750,
                    damage: 50
                ),
                players: ["Player1", "Player2", "Player3"],
                startTime: Date(),
                gridState: []
            )
        ]
        
        recentBattles = [
            CompletedBattle(
                id: "2",
                boss: BattleBoss(
                    id: "b2",
                    name: "Ice Giant",
                    maxHealth: 800,
                    currentHealth: 0,
                    damage: 40
                ),
                result: .victory,
                duration: 45,
                rewardXP: 100,
                rewardGold: 50
            )
        ]
    }
    
    private func updateBattles() {
        // Update battle states
        for i in 0..<activeBattles.count {
            activeBattles[i].boss.currentHealth = max(0, activeBattles[i].boss.currentHealth - 10)
        }
    }
}

// MARK: - Models
struct LiveBattle: Identifiable {
    let id: String
    var boss: BattleBoss
    let players: [String]
    let startTime: Date
    var gridState: [GridEntity]
    
    var duration: Int {
        Int(Date().timeIntervalSince(startTime))
    }
}

struct BattleBoss {
    let id: String
    let name: String
    let maxHealth: Int
    var currentHealth: Int
    let damage: Int
    
    var healthPercentage: Int {
        Int((Double(currentHealth) / Double(maxHealth)) * 100)
    }
}

struct CompletedBattle: Identifiable {
    let id: String
    let boss: BattleBoss
    let result: BattleResult
    let duration: Int
    let rewardXP: Int
    let rewardGold: Int
}

enum BattleResult {
    case victory
    case defeat
}

struct GridEntity {
    let type: EntityType
    let x: Int
    let y: Int
}

enum EntityType {
    case boss
    case player
    case projectile
}

// MARK: - Preview
struct BattleView_Previews: PreviewProvider {
    static var previews: some View {
        BattleView()
            .environmentObject(BattleManager())
    }
}