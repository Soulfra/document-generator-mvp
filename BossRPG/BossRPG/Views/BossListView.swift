import SwiftUI

struct BossListView: View {
    @StateObject private var viewModel = BossListViewModel()
    @State private var searchText = ""
    @State private var selectedSort = SortOption.newest
    @State private var showingFilters = false
    
    enum SortOption: String, CaseIterable {
        case newest = "Newest"
        case popular = "Most Popular"
        case difficulty = "Difficulty"
        case revenue = "Top Earning"
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search and Filter Bar
                HStack {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.secondary)
                        TextField("Search bosses...", text: $searchText)
                    }
                    .padding(8)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                    
                    Button(action: { showingFilters.toggle() }) {
                        Image(systemName: "slider.horizontal.3")
                            .foregroundColor(.orange)
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
                
                // Sort Options
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(SortOption.allCases, id: \.self) { option in
                            SortChip(
                                title: option.rawValue,
                                isSelected: selectedSort == option
                            ) {
                                selectedSort = option
                                viewModel.sort(by: option)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.bottom, 8)
                
                // Boss List
                if viewModel.isLoading {
                    Spacer()
                    ProgressView("Loading bosses...")
                    Spacer()
                } else if viewModel.bosses.isEmpty {
                    EmptyBossListView()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(filteredBosses) { boss in
                                NavigationLink(destination: BossDetailView(boss: boss)) {
                                    BossCardView(boss: boss)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Boss Arena")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: viewModel.refresh) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .sheet(isPresented: $showingFilters) {
                FilterView()
            }
            .onAppear {
                viewModel.loadBosses()
            }
        }
    }
    
    var filteredBosses: [BossListItem] {
        if searchText.isEmpty {
            return viewModel.bosses
        } else {
            return viewModel.bosses.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.creator.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
}

// MARK: - Boss Card View
struct BossCardView: View {
    let boss: BossListItem
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(boss.name)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text("by \(boss.creator)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Revenue Badge
                if boss.totalRevenue > 0 {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("$\(boss.totalRevenue, specifier: "%.2f")")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.green)
                        Text("earned")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            // Stats
            HStack(spacing: 20) {
                StatView(icon: "heart.fill", value: "\(boss.health)", color: .red)
                StatView(icon: "bolt.fill", value: "\(boss.damage)", color: .orange)
                StatView(icon: "hare.fill", value: "\(boss.speed)", color: .blue)
            }
            
            // Battle Info
            HStack {
                Label("\(boss.totalBattles) battles", systemImage: "swords")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                if boss.winRate > 0 {
                    Text("\(Int(boss.winRate * 100))% win rate")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Special Ability
            if let ability = boss.specialAbility {
                HStack {
                    Image(systemName: "sparkles")
                        .foregroundColor(.purple)
                        .font(.caption)
                    Text(ability)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

// MARK: - Stat View
struct StatView: View {
    let icon: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.caption)
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Sort Chip
struct SortChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.orange : Color(.systemGray5))
                .cornerRadius(20)
        }
    }
}

// MARK: - Empty State
struct EmptyBossListView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "shield.slash")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("No Bosses Yet")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Be the first to create a legendary boss!")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            NavigationLink(destination: CreateBossView()) {
                Text("Create Boss")
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

// MARK: - Filter View
struct FilterView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Filters coming soon!")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - View Model
class BossListViewModel: ObservableObject {
    @Published var bosses: [BossListItem] = []
    @Published var isLoading = false
    @Published var error: String?
    
    private let apiClient = BossAPIClient()
    
    func loadBosses() {
        isLoading = true
        
        Task {
            do {
                let fetchedBosses = try await apiClient.fetchBosses()
                await MainActor.run {
                    self.bosses = fetchedBosses
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.error = error.localizedDescription
                    self.isLoading = false
                }
            }
        }
    }
    
    func refresh() {
        loadBosses()
    }
    
    func sort(by option: BossListView.SortOption) {
        switch option {
        case .newest:
            bosses.sort { $0.createdAt > $1.createdAt }
        case .popular:
            bosses.sort { $0.totalBattles > $1.totalBattles }
        case .difficulty:
            bosses.sort { ($0.health + $0.damage) > ($1.health + $1.damage) }
        case .revenue:
            bosses.sort { $0.totalRevenue > $1.totalRevenue }
        }
    }
}

// MARK: - Models
struct BossListItem: Identifiable {
    let id: String
    let name: String
    let creator: String
    let health: Int
    let damage: Int
    let speed: Int
    let specialAbility: String?
    let totalBattles: Int
    let winRate: Double
    let totalRevenue: Double
    let createdAt: Date
}

// MARK: - Preview
struct BossListView_Previews: PreviewProvider {
    static var previews: some View {
        BossListView()
    }
}