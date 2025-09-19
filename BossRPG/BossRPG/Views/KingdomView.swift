import SwiftUI

struct KingdomView: View {
    @StateObject private var viewModel = KingdomViewModel()
    @State private var selectedTab = 0
    
    var body: some View {
        NavigationView {
            if let kingdom = viewModel.currentKingdom {
                // User has a kingdom
                KingdomDetailView(kingdom: kingdom, viewModel: viewModel)
            } else {
                // No kingdom yet
                NoKingdomView()
            }
        }
        .onAppear {
            viewModel.loadKingdom()
        }
    }
}

// MARK: - Kingdom Detail View
struct KingdomDetailView: View {
    let kingdom: UserKingdom
    @ObservedObject var viewModel: KingdomViewModel
    @State private var selectedSection = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Kingdom Header
            KingdomHeaderView(kingdom: kingdom)
            
            // Section Picker
            Picker("Section", selection: $selectedSection) {
                Text("Overview").tag(0)
                Text("Members").tag(1)
                Text("Quests").tag(2)
                Text("Treasury").tag(3)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()
            
            // Content
            ScrollView {
                switch selectedSection {
                case 0:
                    KingdomOverviewSection(kingdom: kingdom, viewModel: viewModel)
                case 1:
                    KingdomMembersSection(members: viewModel.members)
                case 2:
                    KingdomQuestsSection(quests: viewModel.quests, viewModel: viewModel)
                case 3:
                    KingdomTreasurySection(treasury: viewModel.treasury)
                default:
                    EmptyView()
                }
            }
        }
        .navigationTitle(kingdom.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(action: viewModel.refresh) {
                        Label("Refresh", systemImage: "arrow.clockwise")
                    }
                    
                    if kingdom.isRuler {
                        Divider()
                        
                        Button(action: {}) {
                            Label("Manage Kingdom", systemImage: "crown")
                        }
                        
                        Button(action: {}) {
                            Label("Create Quest", systemImage: "scroll")
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
    }
}

// MARK: - Kingdom Header
struct KingdomHeaderView: View {
    let kingdom: UserKingdom
    
    var body: some View {
        VStack(spacing: 12) {
            // Kingdom Badge
            ZStack {
                Circle()
                    .fill(LinearGradient(
                        colors: [Color.orange, Color.red],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 80, height: 80)
                
                Image(systemName: "crown.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.white)
            }
            
            // Kingdom Info
            VStack(spacing: 4) {
                Text(kingdom.name)
                    .font(.title2)
                    .fontWeight(.bold)
                
                if kingdom.isRuler {
                    Label("You are the Ruler", systemImage: "crown.fill")
                        .font(.caption)
                        .foregroundColor(.orange)
                } else {
                    Text("Ruled by \(kingdom.rulerName)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            
            // Kingdom Stats
            HStack(spacing: 30) {
                KingdomStat(value: "\(kingdom.memberCount)", label: "Members")
                KingdomStat(value: kingdom.userLevel, label: "Your Rank")
                KingdomStat(value: "\(kingdom.totalReputation)", label: "Reputation")
            }
        }
        .padding()
        .background(Color(.systemGray6))
    }
}

// MARK: - Kingdom Stat
struct KingdomStat: View {
    let value: String
    let label: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3)
                .fontWeight(.semibold)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Overview Section
struct KingdomOverviewSection: View {
    let kingdom: UserKingdom
    @ObservedObject var viewModel: KingdomViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Your Status Card
            VStack(alignment: .leading, spacing: 12) {
                Label("Your Status", systemImage: "person.circle")
                    .font(.headline)
                
                HStack {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Authority Level")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        HStack(spacing: 4) {
                            AuthorityBadge(level: kingdom.userLevel)
                            Text(kingdom.userLevel)
                                .fontWeight(.medium)
                        }
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 6) {
                        Text("Reputation")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text("\(kingdom.userReputation)")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(kingdom.userReputation >= 0 ? .green : .red)
                    }
                }
                
                // Reputation Progress
                ReputationProgressBar(
                    current: kingdom.userReputation,
                    nextLevel: viewModel.nextLevelRequirement
                )
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
            
            // Recent Activity
            VStack(alignment: .leading, spacing: 12) {
                Label("Recent Activity", systemImage: "clock")
                    .font(.headline)
                
                if viewModel.recentActivity.isEmpty {
                    Text("No recent activity")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .padding(.vertical, 20)
                        .frame(maxWidth: .infinity)
                } else {
                    ForEach(viewModel.recentActivity) { activity in
                        ActivityRow(activity: activity)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
        }
        .padding()
    }
}

// MARK: - Members Section
struct KingdomMembersSection: View {
    let members: [KingdomMember]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            ForEach(members.sorted(by: { $0.reputation > $1.reputation })) { member in
                MemberRow(member: member)
            }
        }
        .padding()
    }
}

// MARK: - Member Row
struct MemberRow: View {
    let member: KingdomMember
    
    var body: some View {
        HStack {
            // Rank Badge
            AuthorityBadge(level: member.level)
                .font(.title2)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(member.username)
                    .fontWeight(.medium)
                
                HStack(spacing: 8) {
                    Text(member.level)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("•")
                        .foregroundColor(.secondary)
                    
                    Text("\(member.reputation) rep")
                        .font(.caption)
                        .foregroundColor(member.reputation >= 0 ? .green : .red)
                }
            }
            
            Spacer()
            
            if member.isOnline {
                Circle()
                    .fill(Color.green)
                    .frame(width: 8, height: 8)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

// MARK: - Quests Section
struct KingdomQuestsSection: View {
    let quests: [KingdomQuest]
    @ObservedObject var viewModel: KingdomViewModel
    @State private var showingCreateQuest = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if viewModel.currentKingdom?.isRuler == true {
                Button(action: { showingCreateQuest = true }) {
                    Label("Create New Quest", systemImage: "plus.circle.fill")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            }
            
            if quests.isEmpty {
                Text("No active quests")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
            } else {
                ForEach(quests) { quest in
                    QuestCard(quest: quest)
                }
            }
        }
        .padding()
        .sheet(isPresented: $showingCreateQuest) {
            CreateQuestView()
        }
    }
}

// MARK: - Quest Card
struct QuestCard: View {
    let quest: KingdomQuest
    @State private var showingPrediction = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(quest.question)
                        .font(.headline)
                        .lineLimit(2)
                    
                    Text("by \(quest.creator)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("+\(quest.reward)")
                        .font(.headline)
                        .foregroundColor(.orange)
                    
                    Text("reward")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            // Deadline
            HStack {
                Image(systemName: "clock")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(quest.deadline, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                if quest.hasSubmitted {
                    Label("Submitted", systemImage: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(.green)
                } else {
                    Button("Make Prediction") {
                        showingPrediction = true
                    }
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.blue)
                    .cornerRadius(15)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
        .sheet(isPresented: $showingPrediction) {
            PredictionView(quest: quest)
        }
    }
}

// MARK: - Authority Badge
struct AuthorityBadge: View {
    let level: String
    
    var icon: String {
        switch level {
        case "KING": return "crown.fill"
        case "LORD": return "shield.lefthalf.filled"
        case "KNIGHT": return "shield.fill"
        case "MERCHANT": return "bag.fill"
        case "CITIZEN": return "person.fill"
        case "PEASANT": return "leaf.fill"
        case "EXILE": return "xmark.circle.fill"
        default: return "questionmark.circle"
        }
    }
    
    var color: Color {
        switch level {
        case "KING": return .purple
        case "LORD": return .orange
        case "KNIGHT": return .blue
        case "MERCHANT": return .green
        case "CITIZEN": return .gray
        case "PEASANT": return .brown
        case "EXILE": return .red
        default: return .gray
        }
    }
    
    var body: some View {
        Image(systemName: icon)
            .foregroundColor(color)
    }
}

// MARK: - No Kingdom View
struct NoKingdomView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "crown.fill")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("No Kingdom Yet")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Create a boss to establish your kingdom\nor join an existing one")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            NavigationLink(destination: CreateBossView()) {
                Text("Create Boss & Kingdom")
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.orange)
                    .cornerRadius(25)
            }
        }
        .navigationTitle("Kingdom")
        .navigationBarTitleDisplayMode(.large)
    }
}

// MARK: - View Models and Supporting Types

class KingdomViewModel: ObservableObject {
    @Published var currentKingdom: UserKingdom?
    @Published var members: [KingdomMember] = []
    @Published var quests: [KingdomQuest] = []
    @Published var treasury: KingdomTreasury?
    @Published var recentActivity: [KingdomActivity] = []
    
    var nextLevelRequirement: Int {
        switch currentKingdom?.userLevel {
        case "EXILE": return 0
        case "PEASANT": return 0
        case "CITIZEN": return 100
        case "MERCHANT": return 300
        case "KNIGHT": return 700
        case "LORD": return 1500
        default: return Int.max
        }
    }
    
    func loadKingdom() {
        // Mock data
        currentKingdom = UserKingdom(
            id: "1",
            name: "Fire Dragon Kingdom",
            rulerName: "DragonMaster",
            isRuler: true,
            memberCount: 42,
            totalReputation: 12500,
            userLevel: "LORD",
            userReputation: 850
        )
        
        loadMembers()
        loadQuests()
        loadActivity()
    }
    
    func refresh() {
        loadKingdom()
    }
    
    private func loadMembers() {
        members = [
            KingdomMember(id: "1", username: "DragonMaster", level: "KING", reputation: 2500, isOnline: true),
            KingdomMember(id: "2", username: "KnightCommander", level: "KNIGHT", reputation: 450, isOnline: true),
            KingdomMember(id: "3", username: "MerchantPrince", level: "MERCHANT", reputation: 200, isOnline: false),
            KingdomMember(id: "4", username: "NewRecruit", level: "CITIZEN", reputation: 50, isOnline: true)
        ]
    }
    
    private func loadQuests() {
        quests = [
            KingdomQuest(
                id: "1",
                question: "What will be the next boss to reach 100 battles?",
                creator: "DragonMaster",
                deadline: Date().addingTimeInterval(86400),
                reward: 50,
                hasSubmitted: false
            )
        ]
    }
    
    private func loadActivity() {
        recentActivity = [
            KingdomActivity(id: "1", type: .questCompleted, description: "Quest 'Boss Battle Prediction' resolved", timestamp: Date().addingTimeInterval(-3600)),
            KingdomActivity(id: "2", type: .memberJoined, description: "NewRecruit joined the kingdom", timestamp: Date().addingTimeInterval(-7200)),
            KingdomActivity(id: "3", type: .promotion, description: "KnightCommander promoted to KNIGHT", timestamp: Date().addingTimeInterval(-10800))
        ]
    }
}

// Supporting Types
struct UserKingdom: Identifiable {
    let id: String
    let name: String
    let rulerName: String
    let isRuler: Bool
    let memberCount: Int
    let totalReputation: Int
    let userLevel: String
    let userReputation: Int
}

struct KingdomMember: Identifiable {
    let id: String
    let username: String
    let level: String
    let reputation: Int
    let isOnline: Bool
}

struct KingdomQuest: Identifiable {
    let id: String
    let question: String
    let creator: String
    let deadline: Date
    let reward: Int
    let hasSubmitted: Bool
}

struct KingdomTreasury {
    let totalGold: Int
    let weeklyIncome: Int
    let topContributors: [(String, Int)]
}

struct KingdomActivity: Identifiable {
    let id: String
    let type: ActivityType
    let description: String
    let timestamp: Date
    
    enum ActivityType {
        case questCompleted
        case memberJoined
        case promotion
        case battle
    }
}

// Additional Views
struct ReputationProgressBar: View {
    let current: Int
    let nextLevel: Int
    
    var progress: Double {
        guard nextLevel > 0 else { return 1.0 }
        return min(1.0, Double(current) / Double(nextLevel))
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("Progress to next level")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("\(current)/\(nextLevel)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color(.systemGray5))
                        .frame(height: 8)
                    
                    Rectangle()
                        .fill(Color.orange)
                        .frame(width: geometry.size.width * progress, height: 8)
                }
                .cornerRadius(4)
            }
            .frame(height: 8)
        }
    }
}

struct ActivityRow: View {
    let activity: KingdomActivity
    
    var icon: String {
        switch activity.type {
        case .questCompleted: return "checkmark.circle.fill"
        case .memberJoined: return "person.badge.plus"
        case .promotion: return "arrow.up.circle.fill"
        case .battle: return "swords"
        }
    }
    
    var color: Color {
        switch activity.type {
        case .questCompleted: return .green
        case .memberJoined: return .blue
        case .promotion: return .orange
        case .battle: return .red
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(activity.description)
                    .font(.subheadline)
                
                Text(activity.timestamp, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

struct CreateQuestView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            Text("Create Quest UI Coming Soon")
                .navigationTitle("Create Quest")
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

struct PredictionView: View {
    let quest: KingdomQuest
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            Text("Make Prediction for: \(quest.question)")
                .navigationTitle("Make Prediction")
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

struct KingdomTreasurySection: View {
    let treasury: KingdomTreasury?
    
    var body: some View {
        VStack {
            Text("Treasury Coming Soon")
                .foregroundColor(.secondary)
                .padding()
        }
    }
}

// MARK: - Preview
struct KingdomView_Previews: PreviewProvider {
    static var previews: some View {
        KingdomView()
    }
}