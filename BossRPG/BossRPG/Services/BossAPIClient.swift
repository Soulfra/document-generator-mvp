import Foundation

class BossAPIClient {
    private let baseURL = APIConfiguration.shared.baseURL
    private let session = URLSession.shared
    
    enum APIError: Error {
        case invalidURL
        case noData
        case decodingError
        case serverError(String)
    }
    
    // MARK: - Boss Management
    
    func fetchBosses() async throws -> [BossListItem] {
        guard let url = URL(string: "\(baseURL)/api/bosses") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError("Failed to fetch bosses")
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        let bossResponse = try decoder.decode(BossListResponse.self, from: data)
        return bossResponse.bosses.map { boss in
            BossListItem(
                id: boss.id,
                name: boss.name,
                creator: boss.creator,
                health: boss.health,
                damage: boss.damage,
                speed: boss.speed,
                specialAbility: boss.specialAbility,
                totalBattles: boss.stats.totalBattles,
                winRate: boss.stats.winRate,
                totalRevenue: boss.revenue.total,
                createdAt: boss.createdAt
            )
        }
    }
    
    func createBoss(_ bossData: BossCreationData) async throws -> BossResponse {
        guard let url = URL(string: "\(baseURL)/api/bosses") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(bossData)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 201 else {
            throw APIError.serverError("Failed to create boss")
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode(BossResponse.self, from: data)
    }
    
    func fetchBossDetails(id: String) async throws -> BossDetailResponse {
        guard let url = URL(string: "\(baseURL)/api/bosses/\(id)") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError("Failed to fetch boss details")
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode(BossDetailResponse.self, from: data)
    }
    
    // MARK: - Battle Management
    
    func fetchActiveBattles() async throws -> [ActiveBattleResponse] {
        guard let url = URL(string: "\(baseURL)/api/battles/active") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError("Failed to fetch active battles")
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode([ActiveBattleResponse].self, from: data)
    }
    
    func joinBattle(battleId: String, playerId: String) async throws -> JoinBattleResponse {
        guard let url = URL(string: "\(baseURL)/api/battles/\(battleId)/join") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let joinData = ["playerId": playerId]
        request.httpBody = try JSONSerialization.data(withJSONObject: joinData)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError("Failed to join battle")
        }
        
        return try JSONDecoder().decode(JoinBattleResponse.self, from: data)
    }
    
    // MARK: - Kingdom Management
    
    func fetchKingdoms() async throws -> [KingdomResponse] {
        guard let url = URL(string: "\(baseURL)/api/kingdoms") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError("Failed to fetch kingdoms")
        }
        
        return try JSONDecoder().decode([KingdomResponse].self, from: data)
    }
    
    func fetchKingdomDetails(id: String) async throws -> KingdomDetailResponse {
        guard let url = URL(string: "\(baseURL)/api/kingdoms/\(id)") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError("Failed to fetch kingdom details")
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode(KingdomDetailResponse.self, from: data)
    }
    
    // MARK: - Quest Management
    
    func createQuest(_ questData: QuestCreationData) async throws -> QuestResponse {
        guard let url = URL(string: "\(baseURL)/api/quests") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(questData)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 201 else {
            throw APIError.serverError("Failed to create quest")
        }
        
        return try JSONDecoder().decode(QuestResponse.self, from: data)
    }
    
    func submitPrediction(questId: String, prediction: String) async throws -> PredictionResponse {
        guard let url = URL(string: "\(baseURL)/api/quests/\(questId)/predict") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let predictionData = ["prediction": prediction]
        request.httpBody = try JSONSerialization.data(withJSONObject: predictionData)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError("Failed to submit prediction")
        }
        
        return try JSONDecoder().decode(PredictionResponse.self, from: data)
    }
}

// MARK: - Response Models

struct BossListResponse: Codable {
    let bosses: [BossResponse]
    let total: Int
}

struct BossResponse: Codable {
    let id: String
    let name: String
    let creator: String
    let health: Int
    let damage: Int
    let speed: Int
    let specialAbility: String?
    let stats: BossStats
    let revenue: BossRevenue
    let createdAt: Date
    let kingdom: String?
}

struct BossStats: Codable {
    let totalBattles: Int
    let wins: Int
    let losses: Int
    let winRate: Double
}

struct BossRevenue: Codable {
    let total: Double
    let creatorEarnings: Double
    let platformEarnings: Double
}

struct BossDetailResponse: Codable {
    let boss: BossResponse
    let recentBattles: [BattleHistoryItem]
    let topPlayers: [PlayerStats]
}

struct BattleHistoryItem: Codable {
    let id: String
    let timestamp: Date
    let result: String
    let duration: Int
    let players: Int
}

struct PlayerStats: Codable {
    let username: String
    let battles: Int
    let wins: Int
}

struct ActiveBattleResponse: Codable {
    let id: String
    let bossId: String
    let bossName: String
    let players: [String]
    let startTime: Date
    let status: String
}

struct JoinBattleResponse: Codable {
    let success: Bool
    let battleId: String
    let position: GridPosition
}

struct GridPosition: Codable {
    let x: Int
    let y: Int
}

struct KingdomResponse: Codable {
    let id: String
    let name: String
    let ruler: String
    let members: Int
    let totalReputation: Int
    let bossId: String
}

struct KingdomDetailResponse: Codable {
    let kingdom: KingdomResponse
    let hierarchy: [HierarchyMember]
    let activeQuests: [QuestResponse]
}

struct HierarchyMember: Codable {
    let username: String
    let level: String
    let reputation: Int
    let joinedAt: Date
}

struct QuestResponse: Codable {
    let id: String
    let question: String
    let creator: String
    let deadline: Date
    let status: String
    let reward: Int
}

struct QuestCreationData: Codable {
    let question: String
    let correctAnswer: String
    let deadline: Date
    let reward: Int
}

struct PredictionResponse: Codable {
    let success: Bool
    let correct: Bool?
    let reputationChange: Int?
    let newReputation: Int?
}

// MARK: - Preview
struct BossAPIClient_Previews {
    static let client = BossAPIClient()
}