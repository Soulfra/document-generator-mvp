#!/bin/bash

# 🔐 API KEY SETUP SCRIPT
# Sets up environment variables for Multi-LLM Engine

echo "🔐 =========================================="
echo "🔐   MULTI-LLM ENGINE API KEY SETUP"
echo "🔐 =========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    touch .env
fi

echo -e "${BLUE}🤖 SUPPORTED PROVIDERS${NC}"
echo "======================="
echo "1. 🧠 Anthropic Claude (claude-3-5-sonnet, claude-3-opus)"
echo "2. 🤖 OpenAI GPT (gpt-4, gpt-4-turbo, gpt-3.5-turbo)"
echo "3. 🧮 DeepSeek (deepseek-chat, deepseek-coder)"
echo "4. 💬 Cohere (command, command-light)"
echo "5. 🏠 Local Ollama (mistral, codellama, deepseek-coder)"
echo ""

echo -e "${YELLOW}📋 CURRENT API KEY STATUS${NC}"
echo "=========================="

# Check current API keys
providers=("ANTHROPIC" "OPENAI" "DEEPSEEK" "COHERE")
provider_names=("Anthropic Claude" "OpenAI GPT" "DeepSeek" "Cohere")

for i in "${!providers[@]}"; do
    provider=${providers[$i]}
    name=${provider_names[$i]}
    env_var="${provider}_API_KEY"
    
    if [ -n "${!env_var}" ] || grep -q "^${env_var}=" .env 2>/dev/null; then
        echo -e "  ✅ ${name}: ${GREEN}Configured${NC}"
    else
        echo -e "  ❌ ${name}: ${RED}Not configured${NC}"
    fi
done

# Check local Ollama
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "  ✅ Local Ollama: ${GREEN}Running${NC}"
else
    echo -e "  ⚠️  Local Ollama: ${YELLOW}Not running${NC}"
fi

echo ""
echo -e "${BLUE}🔧 SETUP OPTIONS${NC}"
echo "================"
echo "1. Add/Update API keys interactively"
echo "2. Show example .env configuration"
echo "3. Test current configuration"
echo "4. Exit"
echo ""

read -p "Choose option (1-4): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}🔐 INTERACTIVE API KEY SETUP${NC}"
        echo "============================="
        echo ""
        echo -e "${BLUE}💡 TIP:${NC} Leave blank to skip a provider"
        echo -e "${BLUE}💡 TIP:${NC} Enter 'remove' to remove existing key"
        echo ""
        
        # Anthropic
        echo -e "${BLUE}1. Anthropic Claude API Key${NC}"
        echo "   Get yours at: https://console.anthropic.com/"
        read -p "   Enter API key (or press Enter to skip): " anthropic_key
        
        if [ "$anthropic_key" = "remove" ]; then
            sed -i '' '/^ANTHROPIC_API_KEY=/d' .env
            echo -e "   ${GREEN}✅ Removed Anthropic API key${NC}"
        elif [ -n "$anthropic_key" ]; then
            sed -i '' '/^ANTHROPIC_API_KEY=/d' .env
            echo "ANTHROPIC_API_KEY=$anthropic_key" >> .env
            echo -e "   ${GREEN}✅ Added Anthropic API key${NC}"
        fi
        echo ""
        
        # OpenAI
        echo -e "${BLUE}2. OpenAI API Key${NC}"
        echo "   Get yours at: https://platform.openai.com/api-keys"
        read -p "   Enter API key (or press Enter to skip): " openai_key
        
        if [ "$openai_key" = "remove" ]; then
            sed -i '' '/^OPENAI_API_KEY=/d' .env
            echo -e "   ${GREEN}✅ Removed OpenAI API key${NC}"
        elif [ -n "$openai_key" ]; then
            sed -i '' '/^OPENAI_API_KEY=/d' .env
            echo "OPENAI_API_KEY=$openai_key" >> .env
            echo -e "   ${GREEN}✅ Added OpenAI API key${NC}"
        fi
        echo ""
        
        # DeepSeek
        echo -e "${BLUE}3. DeepSeek API Key${NC}"
        echo "   Get yours at: https://platform.deepseek.com/"
        read -p "   Enter API key (or press Enter to skip): " deepseek_key
        
        if [ "$deepseek_key" = "remove" ]; then
            sed -i '' '/^DEEPSEEK_API_KEY=/d' .env
            echo -e "   ${GREEN}✅ Removed DeepSeek API key${NC}"
        elif [ -n "$deepseek_key" ]; then
            sed -i '' '/^DEEPSEEK_API_KEY=/d' .env
            echo "DEEPSEEK_API_KEY=$deepseek_key" >> .env
            echo -e "   ${GREEN}✅ Added DeepSeek API key${NC}"
        fi
        echo ""
        
        # Cohere
        echo -e "${BLUE}4. Cohere API Key${NC}"
        echo "   Get yours at: https://dashboard.cohere.ai/"
        read -p "   Enter API key (or press Enter to skip): " cohere_key
        
        if [ "$cohere_key" = "remove" ]; then
            sed -i '' '/^COHERE_API_KEY=/d' .env
            echo -e "   ${GREEN}✅ Removed Cohere API key${NC}"
        elif [ -n "$cohere_key" ]; then
            sed -i '' '/^COHERE_API_KEY=/d' .env
            echo "COHERE_API_KEY=$cohere_key" >> .env
            echo -e "   ${GREEN}✅ Added Cohere API key${NC}"
        fi
        echo ""
        
        echo -e "${GREEN}🎉 API key setup completed!${NC}"
        echo ""
        echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
        echo "1. Source the environment: source .env"
        echo "2. Test the configuration: ./setup-api-keys.sh → Option 3"
        echo "3. Run the Multi-LLM Engine: node FORUM-MULTI-LLM-ENGINE.js test"
        ;;
        
    2)
        echo ""
        echo -e "${YELLOW}📋 EXAMPLE .env CONFIGURATION${NC}"
        echo "============================="
        echo ""
        cat << 'EOF'
# Multi-LLM Engine API Keys
# =========================

# Anthropic Claude (Required for high-quality reasoning)
ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-key-here

# OpenAI GPT (Required for general intelligence)
OPENAI_API_KEY=sk-your-openai-key-here

# DeepSeek (Cost-effective reasoning and coding)
DEEPSEEK_API_KEY=your-deepseek-key-here

# Cohere (Conversational AI)
COHERE_API_KEY=your-cohere-key-here

# Encryption key for secure API key storage
ENCRYPTION_PASSWORD=your-secure-encryption-password-here

# Optional: Budget limits (USD)
DAILY_BUDGET_LIMIT=50.00
HOURLY_BUDGET_LIMIT=10.00
REQUEST_BUDGET_LIMIT=0.50

# Optional: Default hop pattern
DEFAULT_HOP_PATTERN=standard

EOF
        echo -e "${BLUE}💾 Save this as .env in your project directory${NC}"
        ;;
        
    3)
        echo ""
        echo -e "${YELLOW}🧪 TESTING CURRENT CONFIGURATION${NC}"
        echo "================================="
        echo ""
        
        # Source .env file if it exists
        if [ -f .env ]; then
            echo "📁 Loading .env file..."
            set -a
            source .env
            set +a
        fi
        
        # Test Multi-LLM Engine
        if [ -f "FORUM-MULTI-LLM-ENGINE.js" ]; then
            echo "🤖 Testing Multi-LLM Engine..."
            echo ""
            node FORUM-MULTI-LLM-ENGINE.js test
        else
            echo -e "${RED}❌ FORUM-MULTI-LLM-ENGINE.js not found${NC}"
        fi
        ;;
        
    4)
        echo -e "${BLUE}👋 Goodbye!${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Setup script completed successfully!${NC}"