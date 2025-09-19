import SwiftUI

struct JoinBattleView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var viewModel = JoinBattleViewModel()
    @State private var selectedBoss: AvailableBoss?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    TextField("Search bosses...", text: $viewModel.searchText)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding()
                
                // Content
                if viewModel.isLoading {
                    Spacer()
                    ProgressView("Finding battles...")
                    Spacer()
                } else if viewModel.availableBosses.isEmpty {
                    NoBattlesAvailableView()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(viewModel.filteredBosses) { boss in
                                AvailableBossCard(boss: boss) {
                                    selectedBoss = boss
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Join Battle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: viewModel.refresh) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .sheet(item: $selectedBoss) { boss in
                BattlePreparationView(boss: boss)
            }
            .onAppear {
                viewModel.loadAvailableBattles()
            }
        }
    }
}

// MARK: - Available Boss Card
struct AvailableBossCard: View {
    let boss: AvailableBoss
    let onSelect: () -> Void
    
    var difficultyColor: Color {
        switch boss.difficulty {
        case "Easy": return .green
        case "Medium": return .yellow
        case "Hard": return .orange
        case "Expert": return .red
        default: return .purple
        }
    }
    
    var body: some View {
        Button(action: onSelect) {
            VStack(spacing: 12) {
                // Boss Info
                HStack {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(boss.name)
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        HStack(spacing: 12) {
                            Label(boss.difficulty, systemImage: "gauge")
                                .font(.caption)
                                .foregroundColor(difficultyColor)
                            
                            if boss.hasActiveBattle {
                                Label("Battle Active", systemImage: "flame.fill")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                            }
                        }
                    }
                    
                    Spacer()
                    
                    // Player Count
                    VStack(alignment: .trailing, spacing: 4) {
                        HStack(spacing: 4) {
                            Image(systemName: "person.3.fill")
                                .font(.caption)
                            Text("\(boss.currentPlayers)/\(boss.maxPlayers)")
                                .font(.subheadline)
                                .fontWeight(.medium)
                        }
                        .foregroundColor(boss.currentPlayers < boss.maxPlayers ? .green : .red)
                        
                        if boss.hasActiveBattle {
                            Text("In Progress")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                // Boss Stats Preview
                HStack(spacing: 20) {
                    BossStatPreview(icon: "heart.fill", value: boss.health, color: .red)
                    BossStatPreview(icon: "bolt.fill", value: boss.damage, color: .orange)
                    BossStatPreview(icon: "hare.fill", value: boss.speed, color: .blue)
                }
                
                // Rewards
                HStack {
                    Label("+\(boss.xpReward) XP", systemImage: "star.fill")
                        .font(.caption)
                        .foregroundColor(.orange)
                    
                    if boss.goldReward > 0 {
                        Label("+\(boss.goldReward) Gold", systemImage: "bitcoinsign.circle")
                            .font(.caption)
                            .foregroundColor(.yellow)
                    }
                    
                    Spacer()
                    
                    if boss.hasActiveBattle {
                        Text("Join")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.blue)
                            .cornerRadius(15)
                    } else {
                        Text("Start Battle")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.green)
                            .cornerRadius(15)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Boss Stat Preview
struct BossStatPreview: View {
    let icon: String
    let value: Int
    let color: Color
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(color)
            Text("\(value)")
                .font(.caption)
                .fontWeight(.medium)
        }
    }
}

// MARK: - No Battles Available
struct NoBattlesAvailableView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("No Battles Available")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Check back soon or create a boss to start a new battle")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
    }
}

// MARK: - Battle Preparation View
struct BattlePreparationView: View {
    let boss: AvailableBoss
    @Environment(\.dismiss) var dismiss
    @State private var selectedLoadout = 0
    @State private var isJoining = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Boss Preview
                VStack(spacing: 16) {
                    Image(systemName: "shield.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.orange)
                    
                    Text(boss.name)
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Difficulty: \(boss.difficulty)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                // Battle Info
                VStack(alignment: .leading, spacing: 16) {
                    InfoRow(label: "Players", value: "\(boss.currentPlayers)/\(boss.maxPlayers)")
                    InfoRow(label: "Boss Health", value: "\(boss.health) HP")
                    InfoRow(label: "Boss Damage", value: "\(boss.damage) per hit")
                    InfoRow(label: "Rewards", value: "+\(boss.xpReward) XP, +\(boss.goldReward) Gold")
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                
                // Loadout Selection
                VStack(alignment: .leading, spacing: 12) {
                    Text("Select Loadout")
                        .font(.headline)
                    
                    Picker("Loadout", selection: $selectedLoadout) {
                        Text("Warrior").tag(0)
                        Text("Ranger").tag(1)
                        Text("Mage").tag(2)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
                
                Spacer()
                
                // Join Button
                Button(action: joinBattle) {
                    if isJoining {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Join Battle")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.orange)
                .foregroundColor(.white)
                .cornerRadius(25)
                .disabled(isJoining)
            }
            .padding()
            .navigationTitle("Prepare for Battle")
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
    
    private func joinBattle() {
        isJoining = true
        
        Task {
            // Simulate joining
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            
            await MainActor.run {
                dismiss()
                // Navigate to battle view
            }
        }
    }
}

// MARK: - Info Row
struct InfoRow: View {
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

// MARK: - View Model
class JoinBattleViewModel: ObservableObject {
    @Published var availableBosses: [AvailableBoss] = []
    @Published var searchText = ""
    @Published var isLoading = false
    
    var filteredBosses: [AvailableBoss] {
        if searchText.isEmpty {
            return availableBosses
        } else {
            return availableBosses.filter {
                $0.name.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    func loadAvailableBattles() {
        isLoading = true
        
        // Simulate loading
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.availableBosses = [
                AvailableBoss(
                    id: "1",
                    name: "Fire Dragon",
                    difficulty: "Hard",
                    health: 1000,
                    damage: 100,
                    speed: 5,
                    currentPlayers: 2,
                    maxPlayers: 4,
                    hasActiveBattle: true,
                    xpReward: 50,
                    goldReward: 25
                ),
                AvailableBoss(
                    id: "2",
                    name: "Ice Giant",
                    difficulty: "Medium",
                    health: 800,
                    damage: 80,
                    speed: 3,
                    currentPlayers: 0,
                    maxPlayers: 3,
                    hasActiveBattle: false,
                    xpReward: 35,
                    goldReward: 15
                ),
                AvailableBoss(
                    id: "3",
                    name: "Shadow Demon",
                    difficulty: "Expert",
                    health: 1500,
                    damage: 150,
                    speed: 8,
                    currentPlayers: 3,
                    maxPlayers: 5,
                    hasActiveBattle: true,
                    xpReward: 100,
                    goldReward: 50
                )
            ]
            self.isLoading = false
        }
    }
    
    func refresh() {
        loadAvailableBattles()
    }
}

// MARK: - Models
struct AvailableBoss: Identifiable {
    let id: String
    let name: String
    let difficulty: String
    let health: Int
    let damage: Int
    let speed: Int
    let currentPlayers: Int
    let maxPlayers: Int
    let hasActiveBattle: Bool
    let xpReward: Int
    let goldReward: Int
}

// MARK: - Preview
struct JoinBattleView_Previews: PreviewProvider {
    static var previews: some View {
        JoinBattleView()
    }
}