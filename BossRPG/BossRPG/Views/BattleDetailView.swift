import SwiftUI

struct BattleDetailView: View {
    let battle: LiveBattle
    @StateObject private var viewModel = BattleDetailViewModel()
    @Environment(\.dismiss) var dismiss
    @State private var showingChatSheet = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background
                Color(.systemBackground)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Battle Header
                    BattleHeaderView(
                        boss: battle.boss,
                        duration: viewModel.battleDuration
                    )
                    
                    // Battle Grid
                    BattleGridView(
                        gridState: viewModel.gridState,
                        tileSize: 30
                    )
                    .aspectRatio(1, contentMode: .fit)
                    .padding()
                    
                    // Player List
                    PlayerListView(players: viewModel.players)
                    
                    // Combat Log
                    CombatLogView(events: viewModel.combatEvents)
                        .frame(height: 150)
                    
                    // Action Bar
                    ActionBarView(
                        canMove: viewModel.canMove,
                        canAttack: viewModel.canAttack,
                        onMove: viewModel.requestMove,
                        onAttack: viewModel.performAttack,
                        onChat: { showingChatSheet = true }
                    )
                }
            }
            .navigationBarHidden(true)
            .overlay(alignment: .topTrailing) {
                // Close Button
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(.secondary)
                        .background(Circle().fill(Color(.systemBackground)))
                }
                .padding()
            }
            .sheet(isPresented: $showingChatSheet) {
                BattleChatView()
            }
            .onAppear {
                viewModel.connectToBattle(battle.id)
            }
            .onDisappear {
                viewModel.disconnect()
            }
        }
    }
}

// MARK: - Battle Header
struct BattleHeaderView: View {
    let boss: BattleBoss
    let duration: Int
    
    var body: some View {
        VStack(spacing: 12) {
            // Boss Name and Timer
            HStack {
                Text(boss.name)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
                
                Label(formatDuration(duration), systemImage: "clock")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            // Boss Health Bar
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Boss Health")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text("\(boss.currentHealth)/\(boss.maxHealth)")
                        .font(.caption)
                        .fontWeight(.medium)
                }
                
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color(.systemGray5))
                            .frame(height: 12)
                        
                        Rectangle()
                            .fill(healthBarColor(percentage: boss.healthPercentage))
                            .frame(
                                width: geometry.size.width * (Double(boss.healthPercentage) / 100),
                                height: 12
                            )
                    }
                    .cornerRadius(6)
                }
                .frame(height: 12)
            }
        }
        .padding()
        .background(Color(.systemGray6))
    }
    
    private func formatDuration(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        return String(format: "%d:%02d", minutes, remainingSeconds)
    }
    
    private func healthBarColor(percentage: Int) -> Color {
        if percentage > 50 {
            return .green
        } else if percentage > 25 {
            return .yellow
        } else {
            return .red
        }
    }
}

// MARK: - Battle Grid View
struct BattleGridView: View {
    let gridState: [[GridTile]]
    let tileSize: CGFloat
    
    var body: some View {
        GeometryReader { geometry in
            let gridSize = min(geometry.size.width, geometry.size.height)
            let adjustedTileSize = gridSize / CGFloat(gridState.count)
            
            ZStack {
                // Grid Background
                ForEach(0..<gridState.count, id: \.self) { row in
                    ForEach(0..<gridState[row].count, id: \.self) { col in
                        Rectangle()
                            .stroke(Color(.systemGray4), lineWidth: 0.5)
                            .frame(width: adjustedTileSize, height: adjustedTileSize)
                            .position(
                                x: CGFloat(col) * adjustedTileSize + adjustedTileSize/2,
                                y: CGFloat(row) * adjustedTileSize + adjustedTileSize/2
                            )
                    }
                }
                
                // Entities
                ForEach(0..<gridState.count, id: \.self) { row in
                    ForEach(0..<gridState[row].count, id: \.self) { col in
                        if let entity = gridState[row][col].entity {
                            EntityView(entity: entity)
                                .frame(width: adjustedTileSize * 0.8, height: adjustedTileSize * 0.8)
                                .position(
                                    x: CGFloat(col) * adjustedTileSize + adjustedTileSize/2,
                                    y: CGFloat(row) * adjustedTileSize + adjustedTileSize/2
                                )
                        }
                    }
                }
            }
            .frame(width: gridSize, height: gridSize)
        }
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Entity View
struct EntityView: View {
    let entity: GridEntity
    
    var body: some View {
        ZStack {
            switch entity.type {
            case .boss:
                Circle()
                    .fill(Color.red)
                    .overlay(
                        Text("B")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    )
            case .player:
                Circle()
                    .fill(Color.blue)
                    .overlay(
                        Text(String(entity.name.prefix(1)))
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    )
            case .projectile:
                Circle()
                    .fill(Color.orange)
                    .scaleEffect(0.5)
            }
        }
    }
}

// MARK: - Player List View
struct PlayerListView: View {
    let players: [BattlePlayer]
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(players) { player in
                    PlayerStatusCard(player: player)
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Player Status Card
struct PlayerStatusCard: View {
    let player: BattlePlayer
    
    var body: some View {
        VStack(spacing: 6) {
            Text(player.name)
                .font(.caption)
                .fontWeight(.medium)
            
            // Health Bar
            VStack(spacing: 2) {
                Text("\(player.health)%")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color(.systemGray5))
                            .frame(height: 4)
                        
                        Rectangle()
                            .fill(player.health > 50 ? Color.green : player.health > 25 ? Color.yellow : Color.red)
                            .frame(width: geometry.size.width * (Double(player.health) / 100), height: 4)
                    }
                    .cornerRadius(2)
                }
                .frame(height: 4)
            }
            
            // Status
            if player.isAlive {
                Circle()
                    .fill(Color.green)
                    .frame(width: 6, height: 6)
            } else {
                Image(systemName: "xmark.circle.fill")
                    .font(.caption2)
                    .foregroundColor(.red)
            }
        }
        .frame(width: 80)
        .padding(8)
        .background(Color(.systemGray6))
        .cornerRadius(8)
        .opacity(player.isAlive ? 1.0 : 0.6)
    }
}

// MARK: - Combat Log View
struct CombatLogView: View {
    let events: [CombatEvent]
    
    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 4) {
                    ForEach(events) { event in
                        CombatEventRow(event: event)
                            .id(event.id)
                    }
                }
                .padding()
            }
            .background(Color(.systemGray6))
            .onChange(of: events.count) { _ in
                if let lastEvent = events.last {
                    withAnimation {
                        proxy.scrollTo(lastEvent.id, anchor: .bottom)
                    }
                }
            }
        }
    }
}

// MARK: - Combat Event Row
struct CombatEventRow: View {
    let event: CombatEvent
    
    var eventColor: Color {
        switch event.type {
        case .damage: return .red
        case .heal: return .green
        case .move: return .blue
        case .special: return .purple
        case .death: return .orange
        }
    }
    
    var body: some View {
        HStack(spacing: 6) {
            Text(event.timestamp, style: .time)
                .font(.caption2)
                .foregroundColor(.secondary)
            
            Image(systemName: event.icon)
                .font(.caption)
                .foregroundColor(eventColor)
            
            Text(event.message)
                .font(.caption)
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Action Bar View
struct ActionBarView: View {
    let canMove: Bool
    let canAttack: Bool
    let onMove: () -> Void
    let onAttack: () -> Void
    let onChat: () -> Void
    
    var body: some View {
        HStack(spacing: 16) {
            ActionButton(
                title: "Move",
                icon: "arrow.up.arrow.down.arrow.left.arrow.right",
                isEnabled: canMove,
                action: onMove
            )
            
            ActionButton(
                title: "Attack",
                icon: "bolt.fill",
                isEnabled: canAttack,
                action: onAttack
            )
            
            ActionButton(
                title: "Chat",
                icon: "bubble.left.fill",
                isEnabled: true,
                action: onChat
            )
        }
        .padding()
        .background(Color(.systemGray6))
    }
}

// MARK: - Action Button
struct ActionButton: View {
    let title: String
    let icon: String
    let isEnabled: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.title2)
                Text(title)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(isEnabled ? Color.blue : Color(.systemGray5))
            .foregroundColor(isEnabled ? .white : .secondary)
            .cornerRadius(10)
        }
        .disabled(!isEnabled)
    }
}

// MARK: - Battle Chat View
struct BattleChatView: View {
    @Environment(\.dismiss) var dismiss
    @State private var messageText = ""
    @State private var messages: [ChatMessage] = []
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Messages
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 8) {
                        ForEach(messages) { message in
                            ChatMessageRow(message: message)
                        }
                    }
                    .padding()
                }
                
                // Input
                HStack {
                    TextField("Type a message...", text: $messageText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button("Send") {
                        sendMessage()
                    }
                    .disabled(messageText.isEmpty)
                }
                .padding()
            }
            .navigationTitle("Battle Chat")
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
    
    private func sendMessage() {
        let message = ChatMessage(
            id: UUID().uuidString,
            sender: "You",
            text: messageText,
            timestamp: Date()
        )
        messages.append(message)
        messageText = ""
    }
}

// MARK: - Chat Message Row
struct ChatMessageRow: View {
    let message: ChatMessage
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(message.sender)
                    .font(.caption)
                    .fontWeight(.medium)
                
                Text(message.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Text(message.text)
                .font(.subheadline)
        }
    }
}

// MARK: - View Model
class BattleDetailViewModel: ObservableObject {
    @Published var gridState: [[GridTile]] = []
    @Published var players: [BattlePlayer] = []
    @Published var combatEvents: [CombatEvent] = []
    @Published var battleDuration: Int = 0
    @Published var canMove: Bool = true
    @Published var canAttack: Bool = false
    
    private var timer: Timer?
    private var battleId: String?
    
    func connectToBattle(_ id: String) {
        battleId = id
        setupInitialState()
        startBattleUpdates()
    }
    
    func disconnect() {
        timer?.invalidate()
        timer = nil
    }
    
    private func setupInitialState() {
        // Initialize 10x10 grid
        gridState = Array(repeating: Array(repeating: GridTile(), count: 10), count: 10)
        
        // Place boss
        gridState[5][5].entity = GridEntity(type: .boss, name: "Boss", position: (5, 5))
        
        // Place players
        let playerPositions = [(2, 2), (2, 7), (7, 2), (7, 7)]
        for (index, pos) in playerPositions.enumerated() {
            gridState[pos.0][pos.1].entity = GridEntity(
                type: .player,
                name: "Player\(index + 1)",
                position: pos
            )
            
            players.append(BattlePlayer(
                id: "\(index)",
                name: "Player\(index + 1)",
                health: 100,
                isAlive: true
            ))
        }
        
        // Add initial combat event
        combatEvents.append(CombatEvent(
            id: UUID().uuidString,
            type: .move,
            message: "Battle started!",
            icon: "flag.fill",
            timestamp: Date()
        ))
    }
    
    private func startBattleUpdates() {
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            self.battleDuration += 1
            
            // Simulate combat events
            if Int.random(in: 0...3) == 0 {
                self.simulateCombatEvent()
            }
        }
    }
    
    private func simulateCombatEvent() {
        let eventTypes: [(CombatEvent.EventType, String, String)] = [
            (.damage, "Boss attacks Player1 for 25 damage", "bolt.fill"),
            (.move, "Player2 moves north", "arrow.up"),
            (.special, "Boss uses Fire Breath!", "flame.fill"),
            (.heal, "Player3 heals for 20 HP", "heart.fill")
        ]
        
        let randomEvent = eventTypes.randomElement()!
        
        combatEvents.append(CombatEvent(
            id: UUID().uuidString,
            type: randomEvent.0,
            message: randomEvent.1,
            icon: randomEvent.2,
            timestamp: Date()
        ))
        
        // Update player health randomly
        if let randomPlayer = players.randomElement() {
            let index = players.firstIndex(where: { $0.id == randomPlayer.id })!
            players[index].health = max(0, players[index].health - Int.random(in: 5...15))
            
            if players[index].health == 0 {
                players[index].isAlive = false
                combatEvents.append(CombatEvent(
                    id: UUID().uuidString,
                    type: .death,
                    message: "\(players[index].name) has been defeated!",
                    icon: "xmark.circle.fill",
                    timestamp: Date()
                ))
            }
        }
    }
    
    func requestMove() {
        canMove = false
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            self.canMove = true
            self.canAttack = true
        }
    }
    
    func performAttack() {
        canAttack = false
        combatEvents.append(CombatEvent(
            id: UUID().uuidString,
            type: .damage,
            message: "You attack the boss for 30 damage!",
            icon: "bolt.fill",
            timestamp: Date()
        ))
    }
}

// MARK: - Supporting Types
struct GridTile {
    var entity: GridEntity?
}

struct GridEntity {
    let type: EntityType
    let name: String
    let position: (Int, Int)
}

struct BattlePlayer: Identifiable {
    let id: String
    let name: String
    var health: Int
    var isAlive: Bool
}

struct CombatEvent: Identifiable {
    let id: String
    let type: EventType
    let message: String
    let icon: String
    let timestamp: Date
    
    enum EventType {
        case damage
        case heal
        case move
        case special
        case death
    }
}

struct ChatMessage: Identifiable {
    let id: String
    let sender: String
    let text: String
    let timestamp: Date
}

// MARK: - Preview
struct BattleDetailView_Previews: PreviewProvider {
    static var previews: some View {
        BattleDetailView(battle: LiveBattle(
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
        ))
    }
}