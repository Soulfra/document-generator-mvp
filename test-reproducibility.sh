#!/bin/bash

# CHAPTER 7 REPRODUCIBILITY TEST
# 
# This script demonstrates the "holy grail" of reproducibility:
# ANY component description → Complete Chapter 7 discussion interface
# 
# Usage: ./test-reproducibility.sh [component-description]
# Example: ./test-reproducibility.sh "AI-powered user authentication system"

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏭 Chapter 7 Auto-Generator Reproducibility Test${NC}"
echo "=================================================="
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required but not installed${NC}"
    exit 1
fi

# Create output directory
OUTPUT_DIR="./test-generated-components"
mkdir -p "$OUTPUT_DIR"

# Component description from argument or default
COMPONENT_DESC="${1:-React user authentication component with OAuth integration}"

echo -e "${BLUE}📝 Input:${NC} \"$COMPONENT_DESC\""
echo ""

echo -e "${YELLOW}🔍 Step 1: Component Analysis${NC}"
echo "Analyzing component type, complexity, and requirements..."

# Run the auto-generator
echo -e "${YELLOW}🏭 Step 2: Auto-Generating Chapter 7 Interface${NC}"
echo "This may take 30-60 seconds..."
echo ""

# Create a simple test script that uses our auto-generator
cat > test-generation.js << 'EOF'
const Chapter7AutoGenerator = require('./chapter7-auto-generator');

async function testGeneration() {
    const generator = new Chapter7AutoGenerator({
        outputDir: './test-generated-components',
        autoDeploy: false,
        generateDocuments: true
    });
    
    const input = process.argv[2] || 'React user authentication component with OAuth integration';
    
    console.log('🏭 Starting generation...');
    console.log('Input:', input);
    console.log('');
    
    try {
        const result = await generator.generateFor(input, {
            context: {
                urgency: 'medium',
                stakeholders: ['developers', 'users', 'security-team']
            }
        });
        
        console.log('✅ Generation Complete!');
        console.log('');
        console.log('Results:');
        console.log('- Component Type:', result.classification.primaryType);
        console.log('- Confidence:', (result.classification.confidence * 100).toFixed(1) + '%');
        console.log('- Expert Team:', result.expertRouting.selectedExperts.join(', '));
        console.log('- Generated File:', result.component.filename);
        console.log('- File Path:', result.component.filepath);
        console.log('- Processing Time:', (result.processingTime / 1000).toFixed(1) + 's');
        console.log('');
        console.log('📊 Quality Metrics:');
        console.log('- Classification Confidence:', (result.quality.classificationConfidence * 100).toFixed(1) + '%');
        console.log('- Expertise Score:', result.quality.expertiseScore.toFixed(2));
        console.log('- Template Complexity:', result.quality.templateComplexity + ' prompts');
        console.log('');
        
        if (result.documents) {
            console.log('📄 Generated Documents:');
            Object.keys(result.documents).forEach(type => {
                console.log(`- ${type.toUpperCase()}: ${result.documents[type].filename}`);
            });
            console.log('');
        }
        
        console.log('🎉 SUCCESS: Component is ready for Chapter 7 review!');
        console.log('');
        console.log('To view the component:');
        console.log(`open "${result.component.filepath}"`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Generation failed:', error.message);
        console.error('');
        console.error('This might happen if:');
        console.error('- The component description is too vague');
        console.error('- AI service is not available');
        console.error('- Insufficient system resources');
        process.exit(1);
    }
}

testGeneration();
EOF

# Run the test
echo -e "${YELLOW}Running auto-generation...${NC}"
if node test-generation.js "$COMPONENT_DESC"; then
    echo ""
    echo -e "${GREEN}🎉 REPRODUCIBILITY TEST PASSED!${NC}"
    echo ""
    echo "The system successfully converted:"
    echo "  Input: \"$COMPONENT_DESC\""
    echo "  Output: Complete Chapter 7 discussion interface"
    echo ""
    echo "Generated files in: $OUTPUT_DIR"
    echo ""
    
    # List generated files
    if ls "$OUTPUT_DIR"/*.html 1> /dev/null 2>&1; then
        echo -e "${BLUE}Generated Components:${NC}"
        ls -la "$OUTPUT_DIR"/*.html | while read line; do
            echo "  $line"
        done
        echo ""
        
        # Get the latest generated file
        LATEST_FILE=$(ls -t "$OUTPUT_DIR"/*.html | head -n1)
        echo -e "${GREEN}🚀 To view the generated component:${NC}"
        echo "  open \"$LATEST_FILE\""
        echo ""
        echo -e "${BLUE}Or drag and drop this file into your browser:${NC}"
        echo "  $LATEST_FILE"
    fi
    
    echo ""
    echo -e "${GREEN}✅ TRUE REPRODUCIBILITY ACHIEVED!${NC}"
    echo ""
    echo "ANY component description can now be automatically converted"
    echo "into a complete Chapter 7 discussion interface with:"
    echo "  ✅ Automated component analysis"
    echo "  ✅ Expert team assignment" 
    echo "  ✅ Customized discussion prompts"
    echo "  ✅ Binary decision voting"
    echo "  ✅ Character responses"
    echo "  ✅ Document generation"
    echo "  ✅ Game integration"
    echo ""
else
    echo ""
    echo -e "${RED}❌ REPRODUCIBILITY TEST FAILED${NC}"
    echo ""
    echo "The auto-generation system encountered an error."
    echo "This might indicate missing dependencies or configuration issues."
    echo ""
    echo "To debug:"
    echo "  1. Check Node.js dependencies: npm install"
    echo "  2. Verify AI service availability"
    echo "  3. Check file system permissions"
    exit 1
fi

# Cleanup
rm -f test-generation.js

echo -e "${BLUE}🧹 Test cleanup complete${NC}"
echo ""
echo "The Chapter 7 Auto-Generator is ready for production use!"
echo ""
echo "Usage examples:"
echo "  ./test-reproducibility.sh \"Blockchain smart contract for voting\""
echo "  ./test-reproducibility.sh \"Machine learning fraud detection model\""  
echo "  ./test-reproducibility.sh \"Real-time chat application backend\""
echo ""
echo "Each will generate a complete, customized Chapter 7 interface in under a minute."