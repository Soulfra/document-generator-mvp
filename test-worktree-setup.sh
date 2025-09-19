#!/bin/bash

# Test script for Git worktrees setup
# Validates the worktree configuration and functionality

echo "🧪 Testing Document Generator Worktree Setup"
echo "=============================================="
echo

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

echo -e "${BLUE}📋 Test 1: Worktree manager script exists and is executable${NC}"
if [ -x "./worktree-manager.sh" ]; then
    test_result 0 "Worktree manager script is executable"
else
    test_result 1 "Worktree manager script missing or not executable"
fi

echo

echo -e "${BLUE}📋 Test 2: All expected worktrees exist${NC}"
EXPECTED_WORKTREES=("oss-release" "private-data" "experimental")

for wt in "${EXPECTED_WORKTREES[@]}"; do
    if [ -d "worktrees/$wt" ]; then
        test_result 0 "Worktree directory exists: worktrees/$wt"
    else
        test_result 1 "Worktree directory missing: worktrees/$wt"
    fi
done

echo

echo -e "${BLUE}📋 Test 3: Git recognizes all worktrees${NC}"
git worktree list | grep -q "worktrees/oss-release"
test_result $? "OSS-release worktree recognized by Git"

git worktree list | grep -q "worktrees/private-data"
test_result $? "Private-data worktree recognized by Git"

git worktree list | grep -q "worktrees/experimental"
test_result $? "Experimental worktree recognized by Git"

echo

echo -e "${BLUE}📋 Test 4: Environment files exist${NC}"
for wt in "${EXPECTED_WORKTREES[@]}"; do
    if [ -f "worktrees/$wt/.env" ]; then
        test_result 0 "Environment file exists: worktrees/$wt/.env"
    else
        test_result 1 "Environment file missing: worktrees/$wt/.env"
    fi
done

echo

echo -e "${BLUE}📋 Test 5: Worktree manager functionality${NC}"
# Test help command
./worktree-manager.sh help >/dev/null 2>&1
test_result $? "Worktree manager help command works"

# Test list command
./worktree-manager.sh list >/dev/null 2>&1
test_result $? "Worktree manager list command works"

# Test status command
./worktree-manager.sh status >/dev/null 2>&1
test_result $? "Worktree manager status command works"

echo

echo -e "${BLUE}📋 Test 6: Docker configuration files${NC}"
if [ -f "docker-compose.worktree.yml" ]; then
    test_result 0 "Worktree-optimized Docker Compose file exists"
else
    test_result 1 "Worktree-optimized Docker Compose file missing"
fi

if [ -f "worktree.env.example" ]; then
    test_result 0 "Environment template file exists"
else
    test_result 1 "Environment template file missing"
fi

echo

echo -e "${BLUE}📋 Test 7: Basic Git functionality in worktrees${NC}"
# Check if we can navigate to each worktree and get git status
for wt in "${EXPECTED_WORKTREES[@]}"; do
    (cd "worktrees/$wt" && git status >/dev/null 2>&1)
    test_result $? "Git status works in worktree: $wt"
done

echo

echo -e "${BLUE}📋 Test 8: Branch isolation${NC}"
MAIN_BRANCH=$(git branch --show-current)
OSS_BRANCH=$(cd worktrees/oss-release && git branch --show-current)
PRIVATE_BRANCH=$(cd worktrees/private-data && git branch --show-current)
EXPERIMENTAL_BRANCH=$(cd worktrees/experimental && git branch --show-current)

if [ "$MAIN_BRANCH" = "main" ]; then
    test_result 0 "Main worktree on correct branch: $MAIN_BRANCH"
else
    test_result 1 "Main worktree on wrong branch: $MAIN_BRANCH"
fi

if [ "$OSS_BRANCH" = "oss-release" ]; then
    test_result 0 "OSS worktree on correct branch: $OSS_BRANCH"
else
    test_result 1 "OSS worktree on wrong branch: $OSS_BRANCH"
fi

if [ "$PRIVATE_BRANCH" = "private-data" ]; then
    test_result 0 "Private worktree on correct branch: $PRIVATE_BRANCH"
else
    test_result 1 "Private worktree on wrong branch: $PRIVATE_BRANCH"
fi

if [ "$EXPERIMENTAL_BRANCH" = "experimental" ]; then
    test_result 0 "Experimental worktree on correct branch: $EXPERIMENTAL_BRANCH"
else
    test_result 1 "Experimental worktree on wrong branch: $EXPERIMENTAL_BRANCH"
fi

echo

echo "=============================================="
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo "=============================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your worktree setup is ready to use.${NC}"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Try: ./worktree-manager.sh create-feature test-feature"
    echo "2. Navigate: cd worktrees/feature-test-feature"
    echo "3. Start development with isolated environment"
    echo "4. Clean up: ./worktree-manager.sh remove feature-test-feature"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the setup.${NC}"
    exit 1
fi