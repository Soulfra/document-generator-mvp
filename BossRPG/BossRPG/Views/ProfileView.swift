import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @StateObject private var viewModel = ProfileViewModel()
    @State private var showingSettings = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Profile Header
                    ProfileHeaderView(user: authManager.currentUser)
                    
                    // Stats Overview
                    StatsOverviewView(stats: viewModel.userStats)
                    
                    // Achievements
                    AchievementsSection(achievements: viewModel.achievements)
                    
                    // Created Bosses
                    CreatedBossesSection(bosses: viewModel.createdBosses)
                    
                    // Battle History
                    BattleHistorySection(battles: viewModel.recentBattles)
                }
                .padding(.bottom, 20)
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingSettings = true }) {
                        Image(systemName: "gearshape")
                    }
                }
            }
            .sheet(isPresented: $showingSettings) {
                SettingsView()
            }
            .onAppear {
                viewModel.loadProfile()
            }
        }
    }
}

// MARK: - Profile Header
struct ProfileHeaderView: View {
    let user: User?
    
    var body: some View {
        VStack(spacing: 16) {
            // Avatar
            ZStack {
                Circle()
                    .fill(LinearGradient(
                        colors: [.orange, .red],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 100, height: 100)
                
                Text(user?.username.prefix(2).uppercased() ?? "??")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(.white)
            }
            
            // User Info
            VStack(spacing: 8) {
                Text(user?.username ?? "Unknown")
                    .font(.title2)
                    .fontWeight(.bold)
                
                HStack(spacing: 12) {
                    Label(user?.level ?? "CITIZEN", systemImage: "shield.fill")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Text("•")
                        .foregroundColor(.secondary)
                    
                    Label("\(user?.reputation ?? 0) rep", systemImage: "star.fill")
                        .font(.subheadline)
                        .foregroundColor(.orange)
                }
            }
        }
        .padding()
    }
}

// MARK: - Stats Overview
struct StatsOverviewView: View {
    let stats: UserStats?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Statistics")
                .font(.headline)
                .padding(.horizontal)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                StatCard(
                    title: "Battles",
                    value: "\(stats?.totalBattles ?? 0)",
                    icon: "swords",
                    color: .blue
                )
                
                StatCard(
                    title: "Win Rate",
                    value: "\(Int((stats?.winRate ?? 0) * 100))%",
                    icon: "trophy.fill",
                    color: .yellow
                )
                
                StatCard(
                    title: "Bosses Created",
                    value: "\(stats?.bossesCreated ?? 0)",
                    icon: "shield.fill",
                    color: .purple
                )
                
                StatCard(
                    title: "Total Earnings",
                    value: "$\(stats?.totalEarnings ?? 0, specifier: "%.2f")",
                    icon: "dollarsign.circle.fill",
                    color: .green
                )
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.title3)
                .fontWeight(.semibold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Achievements Section
struct AchievementsSection: View {
    let achievements: [Achievement]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Achievements")
                    .font(.headline)
                
                Spacer()
                
                NavigationLink(destination: AllAchievementsView()) {
                    Text("See All")
                        .font(.subheadline)
                        .foregroundColor(.orange)
                }
            }
            .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(achievements.prefix(5)) { achievement in
                        AchievementBadge(achievement: achievement)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - Achievement Badge
struct AchievementBadge: View {
    let achievement: Achievement
    
    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(achievement.unlocked ? Color.orange : Color(.systemGray5))
                    .frame(width: 60, height: 60)
                
                Image(systemName: achievement.icon)
                    .font(.title2)
                    .foregroundColor(achievement.unlocked ? .white : .secondary)
            }
            
            Text(achievement.name)
                .font(.caption)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(width: 80)
        }
        .opacity(achievement.unlocked ? 1.0 : 0.6)
    }
}

// MARK: - Created Bosses Section
struct CreatedBossesSection: View {
    let bosses: [UserBoss]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Your Bosses")
                    .font(.headline)
                
                Spacer()
                
                if !bosses.isEmpty {
                    NavigationLink(destination: MyBossesView()) {
                        Text("Manage")
                            .font(.subheadline)
                            .foregroundColor(.orange)
                    }
                }
            }
            .padding(.horizontal)
            
            if bosses.isEmpty {
                EmptyBossesView()
            } else {
                VStack(spacing: 12) {
                    ForEach(bosses.prefix(3)) { boss in
                        UserBossRow(boss: boss)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - User Boss Row
struct UserBossRow: View {
    let boss: UserBoss
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(boss.name)
                    .fontWeight(.medium)
                
                HStack(spacing: 12) {
                    Label("\(boss.totalBattles)", systemImage: "swords")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Label("$\(boss.totalRevenue, specifier: "%.2f")", systemImage: "dollarsign.circle")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

// MARK: - Empty Bosses View
struct EmptyBossesView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "shield.slash")
                .font(.largeTitle)
                .foregroundColor(.secondary)
            
            Text("No bosses created yet")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            NavigationLink(destination: CreateBossView()) {
                Text("Create Your First Boss")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.orange)
                    .cornerRadius(20)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 30)
        .padding(.horizontal)
    }
}

// MARK: - Battle History Section
struct BattleHistorySection: View {
    let battles: [UserBattle]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Battles")
                    .font(.headline)
                
                Spacer()
                
                NavigationLink(destination: BattleHistoryView()) {
                    Text("View All")
                        .font(.subheadline)
                        .foregroundColor(.orange)
                }
            }
            .padding(.horizontal)
            
            if battles.isEmpty {
                Text("No battles yet")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
            } else {
                VStack(spacing: 8) {
                    ForEach(battles.prefix(5)) { battle in
                        BattleHistoryRow(battle: battle)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - Battle History Row
struct BattleHistoryRow: View {
    let battle: UserBattle
    
    var body: some View {
        HStack {
            Image(systemName: battle.result == .victory ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(battle.result == .victory ? .green : .red)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(battle.bossName)
                    .font(.subheadline)
                Text(battle.timestamp, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if battle.xpGained > 0 {
                Text("+\(battle.xpGained) XP")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.orange)
            }
        }
        .padding(.vertical, 6)
    }
}

// MARK: - Settings View
struct SettingsView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @Environment(\.dismiss) var dismiss
    @State private var showingLogoutAlert = false
    
    var body: some View {
        NavigationView {
            List {
                Section("Account") {
                    HStack {
                        Text("Username")
                        Spacer()
                        Text(authManager.currentUser?.username ?? "Unknown")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Email")
                        Spacer()
                        Text(authManager.currentUser?.email ?? "Unknown")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section("Preferences") {
                    NavigationLink(destination: NotificationSettingsView()) {
                        Label("Notifications", systemImage: "bell")
                    }
                    
                    NavigationLink(destination: PrivacySettingsView()) {
                        Label("Privacy", systemImage: "lock")
                    }
                }
                
                Section("Support") {
                    Link(destination: URL(string: "https://bossrpg.com/help")!) {
                        Label("Help Center", systemImage: "questionmark.circle")
                    }
                    
                    Link(destination: URL(string: "https://bossrpg.com/terms")!) {
                        Label("Terms of Service", systemImage: "doc.text")
                    }
                    
                    Link(destination: URL(string: "https://bossrpg.com/privacy")!) {
                        Label("Privacy Policy", systemImage: "hand.raised")
                    }
                }
                
                Section {
                    Button(action: { showingLogoutAlert = true }) {
                        Label("Log Out", systemImage: "arrow.right.square")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .alert("Log Out", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Log Out", role: .destructive) {
                    authManager.logout()
                    dismiss()
                }
            } message: {
                Text("Are you sure you want to log out?")
            }
        }
    }
}

// MARK: - View Model
class ProfileViewModel: ObservableObject {
    @Published var userStats: UserStats?
    @Published var achievements: [Achievement] = []
    @Published var createdBosses: [UserBoss] = []
    @Published var recentBattles: [UserBattle] = []
    
    func loadProfile() {
        // Mock data
        userStats = UserStats(
            totalBattles: 156,
            winRate: 0.68,
            bossesCreated: 3,
            totalEarnings: 125.50
        )
        
        achievements = [
            Achievement(id: "1", name: "First Blood", description: "Win your first battle", icon: "drop.fill", unlocked: true),
            Achievement(id: "2", name: "Creator", description: "Create your first boss", icon: "hammer.fill", unlocked: true),
            Achievement(id: "3", name: "Centurion", description: "Win 100 battles", icon: "flag.fill", unlocked: true),
            Achievement(id: "4", name: "Kingmaker", description: "Become a kingdom ruler", icon: "crown.fill", unlocked: false),
            Achievement(id: "5", name: "Legendary", description: "Create a legendary boss", icon: "star.fill", unlocked: false)
        ]
        
        createdBosses = [
            UserBoss(id: "1", name: "Fire Dragon", totalBattles: 245, totalRevenue: 89.50),
            UserBoss(id: "2", name: "Ice Giant", totalBattles: 156, totalRevenue: 36.00)
        ]
        
        recentBattles = [
            UserBattle(id: "1", bossName: "Shadow Demon", result: .victory, xpGained: 25, timestamp: Date().addingTimeInterval(-3600)),
            UserBattle(id: "2", bossName: "Thunder Lord", result: .defeat, xpGained: 5, timestamp: Date().addingTimeInterval(-7200)),
            UserBattle(id: "3", bossName: "Crystal Guardian", result: .victory, xpGained: 30, timestamp: Date().addingTimeInterval(-10800))
        ]
    }
}

// MARK: - Supporting Types
struct UserStats {
    let totalBattles: Int
    let winRate: Double
    let bossesCreated: Int
    let totalEarnings: Double
}

struct Achievement: Identifiable {
    let id: String
    let name: String
    let description: String
    let icon: String
    let unlocked: Bool
}

struct UserBoss: Identifiable {
    let id: String
    let name: String
    let totalBattles: Int
    let totalRevenue: Double
}

struct UserBattle: Identifiable {
    let id: String
    let bossName: String
    let result: BattleResult
    let xpGained: Int
    let timestamp: Date
}

// MARK: - Additional Views (Placeholders)
struct AllAchievementsView: View {
    var body: some View {
        Text("All Achievements")
            .navigationTitle("Achievements")
    }
}

struct MyBossesView: View {
    var body: some View {
        Text("My Bosses")
            .navigationTitle("My Bosses")
    }
}

struct BattleHistoryView: View {
    var body: some View {
        Text("Battle History")
            .navigationTitle("Battle History")
    }
}

struct NotificationSettingsView: View {
    var body: some View {
        Text("Notification Settings")
            .navigationTitle("Notifications")
    }
}

struct PrivacySettingsView: View {
    var body: some View {
        Text("Privacy Settings")
            .navigationTitle("Privacy")
    }
}

// MARK: - Preview
struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
            .environmentObject(AuthenticationManager())
    }
}