#!/bin/bash

# Create a new template for the Document Generator
# Usage: ./create-template.sh template-name category

set -e

# Check arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <template-name> <category>"
    echo "Categories: business-ideas, technical-architecture, ux-ui-design, marketing-growth"
    echo "Example: $0 mobile-app-pitch business-ideas"
    exit 1
fi

TEMPLATE_NAME="$1"
CATEGORY="$2"

# Validate category
valid_categories=("business-ideas" "technical-architecture" "ux-ui-design" "marketing-growth" "product-roadmaps" "process-optimization" "data-analytics" "content-strategy")
if [[ ! " ${valid_categories[@]} " =~ " ${CATEGORY} " ]]; then
    echo "Error: Invalid category '$CATEGORY'"
    echo "Valid categories: ${valid_categories[*]}"
    exit 1
fi

echo "🎨 Creating new template: $TEMPLATE_NAME"
echo "📁 Category: $CATEGORY"
echo ""

# Create template directory
template_dir="templates/$CATEGORY/$TEMPLATE_NAME"
mkdir -p "$template_dir"

# Create template configuration
cat > "$template_dir/template.yaml" << EOF
# Template Configuration
id: $TEMPLATE_NAME
name: $(echo $TEMPLATE_NAME | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')
category: $CATEGORY
description: Template for $TEMPLATE_NAME
version: 1.0.0
author: Document Generator CLI

# Template sections
sections:
  - id: overview
    name: Overview
    description: High-level overview of the project
    required: true
    
  - id: problem
    name: Problem Statement
    description: The problem being solved
    required: true
    
  - id: solution
    name: Proposed Solution
    description: How the solution addresses the problem
    required: true
    
  - id: implementation
    name: Implementation Details
    description: Technical implementation approach
    required: false
    
  - id: timeline
    name: Timeline
    description: Project timeline and milestones
    required: false

# AI prompts for each section
prompts:
  overview: |
    Extract the high-level overview from the document.
    Focus on: vision, mission, and key objectives.
    
  problem: |
    Identify the core problem being addressed.
    Include: pain points, current solutions, and market gap.
    
  solution: |
    Extract the proposed solution details.
    Include: approach, unique value proposition, and benefits.
    
  implementation: |
    Extract technical implementation details if present.
    Include: architecture, technology choices, and key features.
    
  timeline: |
    Extract timeline information if available.
    Include: phases, milestones, and deliverables.

# Export formats supported
exportFormats:
  - pdf
  - markdown
  - html
  - powerpoint
  - notion

# Styling options
styling:
  theme: modern
  primaryColor: "#4ECDC4"
  secondaryColor: "#FF6B6B"
  fontFamily: "Inter, sans-serif"

# Validation rules
validation:
  minSections: 3
  maxSections: 10
  requiredFields:
    - title
    - description
EOF

# Create sample content
cat > "$template_dir/sample.md" << EOF
# $TEMPLATE_NAME Sample

This is a sample document for the $TEMPLATE_NAME template.

## Overview
Brief overview of the project or idea.

## Problem Statement
Description of the problem being solved.

## Proposed Solution
How the solution addresses the problem.

## Implementation Details
Technical approach and architecture.

## Timeline
Project phases and milestones.
EOF

# Create README
cat > "$template_dir/README.md" << EOF
# $TEMPLATE_NAME Template

## Description
This template is designed for $TEMPLATE_NAME in the $CATEGORY category.

## Sections
1. **Overview** - High-level project overview
2. **Problem Statement** - Core problem being addressed
3. **Proposed Solution** - Solution approach
4. **Implementation Details** - Technical details (optional)
5. **Timeline** - Project timeline (optional)

## Usage
\`\`\`bash
# Process a document with this template
curl -X POST http://localhost:3000/api/process-document \\
  -F "document=@mydoc.pdf" \\
  -F "template=$TEMPLATE_NAME" \\
  -F "exportFormat=pdf"
\`\`\`

## Customization
Edit \`template.yaml\` to customize:
- Sections
- AI prompts
- Export formats
- Styling options

## Examples
See \`sample.md\` for an example document structure.
EOF

# Register template with the system
echo "📝 Registering template..."

registration_response=$(curl -s -X POST http://localhost:3000/api/templates/register \
  -H "Content-Type: application/json" \
  -d "{
    \"path\": \"$template_dir/template.yaml\",
    \"category\": \"$CATEGORY\",
    \"name\": \"$TEMPLATE_NAME\"
  }")

if echo "$registration_response" | grep -q "success"; then
    echo "✅ Template registered successfully!"
else
    echo "⚠️  Template created but registration failed. Register manually later."
fi

echo ""
echo "✅ Template created at: $template_dir"
echo ""
echo "📁 Files created:"
echo "  - template.yaml    (configuration)"
echo "  - sample.md       (example document)"
echo "  - README.md       (documentation)"
echo ""
echo "🎯 Next steps:"
echo "  1. Edit $template_dir/template.yaml to customize"
echo "  2. Test with: ./scripts/test-template.sh $TEMPLATE_NAME sample.pdf"
echo "  3. Share template: ./scripts/export-template.sh $TEMPLATE_NAME"