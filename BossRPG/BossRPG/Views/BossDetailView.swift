import SwiftUI

struct BossDetailView: View {
    let boss: BossListItem
    @StateObject private var viewModel = BossDetailViewModel()
    @State private var showingBattleOptions = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Boss Header
                BossDetailHeader(boss: boss, viewModel: viewModel)
                
                // Stats Section
                BossStatsSection(boss: boss)
                
                // Battle Performance
                BattlePerformanceSection(performance: viewModel.battlePerformance)
                
                // Revenue Analytics
                if boss.totalRevenue > 0 {
                    RevenueAnalyticsSection(revenue: viewModel.revenueData)
                }
                
                // Recent Battles
                RecentBattlesSection(battles: viewModel.recentBattles)
                
                // Top Players
                TopPlayersSection(players: viewModel.topPlayers)
            }
            .padding(.bottom, 100) // Space for floating button
        }
        .navigationTitle(boss.name)
        .navigationBarTitleDisplayMode(.inline)
        .overlay(alignment: .bottom) {
            // Floating Battle Button
            Button(action: { showingBattleOptions = true }) {
                Label("Battle This Boss", systemImage: "swords")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .cornerRadius(25)
                    .shadow(color: Color.black.opacity(0.2), radius: 8, x: 0, y: 4)
            }
            .padding()
        }
        .sheet(isPresented: $showingBattleOptions) {
            BattleOptionsView(boss: boss)
        }
        .onAppear {
            viewModel.loadBossDetails(bossId: boss.id)
        }
    }
}

// MARK: - Boss Detail Header
struct BossDetailHeader: View {
    let boss: BossListItem
    @ObservedObject var viewModel: BossDetailViewModel
    
    var body: some View {
        VStack(spacing: 16) {
            // Boss Icon
            ZStack {
                Circle()
                    .fill(LinearGradient(
                        colors: [Color.red, Color.orange],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 100, height: 100)
                
                Image(systemName: "shield.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.white)
            }
            
            // Boss Info
            VStack(spacing: 8) {
                Text(boss.name)
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Created by \(boss.creator)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if let kingdom = viewModel.kingdom {
                    NavigationLink(destination: KingdomView()) {
                        Label(kingdom.name, systemImage: "crown.fill")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
            }
            
            // Quick Stats
            HStack(spacing: 30) {
                VStack(spacing: 4) {
                    Text("\(boss.totalBattles)")
                        .font(.title2)
                        .fontWeight(.semibold)
                    Text("Battles")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                VStack(spacing: 4) {
                    Text("\(Int(boss.winRate * 100))%")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(boss.winRate > 0.5 ? .green : .red)
                    Text("Win Rate")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                VStack(spacing: 4) {
                    Text("$\(boss.totalRevenue, specifier: "%.0f")")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.green)
                    Text("Earned")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
    }
}

// MARK: - Boss Stats Section
struct BossStatsSection: View {
    let boss: BossListItem
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Combat Stats")
                .font(.headline)
                .padding(.horizontal)
            
            VStack(spacing: 12) {
                StatBar(
                    label: "Health",
                    value: boss.health,
                    maxValue: 2000,
                    color: .red,
                    icon: "heart.fill"
                )
                
                StatBar(
                    label: "Damage",
                    value: boss.damage,
                    maxValue: 200,
                    color: .orange,
                    icon: "bolt.fill"
                )
                
                StatBar(
                    label: "Speed",
                    value: boss.speed,
                    maxValue: 10,
                    color: .blue,
                    icon: "hare.fill"
                )
            }
            .padding(.horizontal)
            
            if let ability = boss.specialAbility {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Special Ability", systemImage: "sparkles")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.purple)
                    
                    Text(ability)
                        .font(.body)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.purple.opacity(0.1))
                        .cornerRadius(10)
                }
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - Stat Bar
struct StatBar: View {
    let label: String
    let value: Int
    let maxValue: Int
    let color: Color
    let icon: String
    
    var percentage: Double {
        Double(value) / Double(maxValue)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label(label, systemImage: icon)
                    .font(.subheadline)
                    .foregroundColor(color)
                
                Spacer()
                
                Text("\(value)")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(color)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color(.systemGray5))
                        .frame(height: 8)
                    
                    Rectangle()
                        .fill(color)
                        .frame(width: geometry.size.width * percentage, height: 8)
                }
                .cornerRadius(4)
            }
            .frame(height: 8)
        }
    }
}

// MARK: - Battle Performance Section
struct BattlePerformanceSection: View {
    let performance: BattlePerformance?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Battle Performance")
                .font(.headline)
                .padding(.horizontal)
            
            if let performance = performance {
                VStack(spacing: 12) {
                    PerformanceRow(
                        label: "Average Battle Duration",
                        value: "\(performance.avgDuration)s"
                    )
                    
                    PerformanceRow(
                        label: "Most Damage Dealt",
                        value: "\(performance.maxDamage)"
                    )
                    
                    PerformanceRow(
                        label: "Longest Survival",
                        value: "\(performance.longestSurvival)s"
                    )
                    
                    PerformanceRow(
                        label: "Players Defeated",
                        value: "\(performance.playersDefeated)"
                    )
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - Performance Row
struct PerformanceRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Revenue Analytics Section
struct RevenueAnalyticsSection: View {
    let revenue: RevenueData?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Revenue Analytics")
                .font(.headline)
                .padding(.horizontal)
            
            if let revenue = revenue {
                VStack(spacing: 16) {
                    // Revenue Chart (Placeholder)
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.systemGray6))
                        .frame(height: 150)
                        .overlay(
                            VStack {
                                Image(systemName: "chart.line.uptrend.xyaxis")
                                    .font(.largeTitle)
                                    .foregroundColor(.green)
                                Text("Revenue Trend")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        )
                    
                    // Revenue Breakdown
                    HStack(spacing: 20) {
                        RevenueBreakdownItem(
                            label: "Today",
                            amount: revenue.today,
                            color: .green
                        )
                        
                        RevenueBreakdownItem(
                            label: "This Week",
                            amount: revenue.thisWeek,
                            color: .blue
                        )
                        
                        RevenueBreakdownItem(
                            label: "All Time",
                            amount: revenue.allTime,
                            color: .orange
                        )
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - Revenue Breakdown Item
struct RevenueBreakdownItem: View {
    let label: String
    let amount: Double
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text("$\(amount, specifier: "%.2f")")
                .font(.headline)
                .foregroundColor(color)
            
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

// MARK: - Recent Battles Section
struct RecentBattlesSection: View {
    let battles: [RecentBattle]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Recent Battles")
                    .font(.headline)
                
                Spacer()
                
                NavigationLink(destination: BossBattleHistoryView()) {
                    Text("View All")
                        .font(.subheadline)
                        .foregroundColor(.orange)
                }
            }
            .padding(.horizontal)
            
            if battles.isEmpty {
                Text("No recent battles")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
            } else {
                VStack(spacing: 8) {
                    ForEach(battles.prefix(5)) { battle in
                        RecentBattleRow(battle: battle)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - Recent Battle Row
struct RecentBattleRow: View {
    let battle: RecentBattle
    
    var body: some View {
        HStack {
            Image(systemName: battle.bossWon ? "crown.fill" : "xmark.shield.fill")
                .foregroundColor(battle.bossWon ? .yellow : .red)
            
            VStack(alignment: .leading, spacing: 2) {
                Text("\(battle.playerCount) players")
                    .font(.subheadline)
                Text(battle.timestamp, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text("\(battle.duration)s")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 6)
    }
}

// MARK: - Top Players Section
struct TopPlayersSection: View {
    let players: [TopPlayer]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Top Challengers")
                .font(.headline)
                .padding(.horizontal)
            
            if players.isEmpty {
                Text("No challengers yet")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
            } else {
                VStack(spacing: 8) {
                    ForEach(Array(players.enumerated()), id: \.1.id) { index, player in
                        TopPlayerRow(rank: index + 1, player: player)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - Top Player Row
struct TopPlayerRow: View {
    let rank: Int
    let player: TopPlayer
    
    var rankColor: Color {
        switch rank {
        case 1: return .yellow
        case 2: return .gray
        case 3: return .orange
        default: return .primary
        }
    }
    
    var body: some View {
        HStack {
            Text("\(rank)")
                .font(.headline)
                .foregroundColor(rankColor)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(player.username)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text("\(player.victories) victories")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text("\(Int(player.winRate * 100))%")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(player.winRate > 0.5 ? .green : .red)
        }
        .padding(.vertical, 6)
    }
}

// MARK: - Battle Options View
struct BattleOptionsView: View {
    let boss: BossListItem
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Boss Preview
                VStack(spacing: 12) {
                    Image(systemName: "shield.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.orange)
                    
                    Text(boss.name)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    HStack(spacing: 20) {
                        Label("\(boss.health) HP", systemImage: "heart.fill")
                            .foregroundColor(.red)
                        Label("\(boss.damage) DMG", systemImage: "bolt.fill")
                            .foregroundColor(.orange)
                    }
                    .font(.subheadline)
                }
                .padding()
                
                // Battle Options
                VStack(spacing: 16) {
                    BattleOptionButton(
                        title: "Quick Battle",
                        subtitle: "Join next available battle",
                        icon: "bolt.fill",
                        color: .orange
                    ) {
                        // Join quick battle
                        dismiss()
                    }
                    
                    BattleOptionButton(
                        title: "Private Battle",
                        subtitle: "Create a battle with friends",
                        icon: "person.3.fill",
                        color: .blue
                    ) {
                        // Create private battle
                        dismiss()
                    }
                    
                    BattleOptionButton(
                        title: "Spectate",
                        subtitle: "Watch ongoing battles",
                        icon: "eye.fill",
                        color: .purple
                    ) {
                        // Spectate battles
                        dismiss()
                    }
                }
                .padding()
                
                Spacer()
            }
            .navigationTitle("Battle Options")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Battle Option Button
struct BattleOptionButton: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 50)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - View Model
class BossDetailViewModel: ObservableObject {
    @Published var kingdom: KingdomInfo?
    @Published var battlePerformance: BattlePerformance?
    @Published var revenueData: RevenueData?
    @Published var recentBattles: [RecentBattle] = []
    @Published var topPlayers: [TopPlayer] = []
    
    func loadBossDetails(bossId: String) {
        // Mock data
        kingdom = KingdomInfo(id: "1", name: "Fire Dragon Kingdom")
        
        battlePerformance = BattlePerformance(
            avgDuration: 45,
            maxDamage: 250,
            longestSurvival: 120,
            playersDefeated: 523
        )
        
        revenueData = RevenueData(
            today: 12.50,
            thisWeek: 45.75,
            allTime: 125.50
        )
        
        recentBattles = [
            RecentBattle(id: "1", playerCount: 3, bossWon: true, duration: 42, timestamp: Date().addingTimeInterval(-1800)),
            RecentBattle(id: "2", playerCount: 4, bossWon: false, duration: 67, timestamp: Date().addingTimeInterval(-3600)),
            RecentBattle(id: "3", playerCount: 2, bossWon: true, duration: 38, timestamp: Date().addingTimeInterval(-7200))
        ]
        
        topPlayers = [
            TopPlayer(id: "1", username: "DragonSlayer", victories: 15, winRate: 0.75),
            TopPlayer(id: "2", username: "BossHunter", victories: 12, winRate: 0.60),
            TopPlayer(id: "3", username: "WarriorKing", victories: 10, winRate: 0.55)
        ]
    }
}

// MARK: - Supporting Types
struct KingdomInfo {
    let id: String
    let name: String
}

struct BattlePerformance {
    let avgDuration: Int
    let maxDamage: Int
    let longestSurvival: Int
    let playersDefeated: Int
}

struct RevenueData {
    let today: Double
    let thisWeek: Double
    let allTime: Double
}

struct RecentBattle: Identifiable {
    let id: String
    let playerCount: Int
    let bossWon: Bool
    let duration: Int
    let timestamp: Date
}

struct TopPlayer: Identifiable {
    let id: String
    let username: String
    let victories: Int
    let winRate: Double
}

// MARK: - Additional Views
struct BossBattleHistoryView: View {
    var body: some View {
        Text("Boss Battle History")
            .navigationTitle("Battle History")
    }
}

// MARK: - Preview
struct BossDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            BossDetailView(boss: BossListItem(
                id: "1",
                name: "Fire Dragon",
                creator: "DragonMaster",
                health: 1000,
                damage: 100,
                speed: 5,
                specialAbility: "Breathes fire in a 3x3 area",
                totalBattles: 245,
                winRate: 0.68,
                totalRevenue: 125.50,
                createdAt: Date()
            ))
        }
    }
}