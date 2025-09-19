#!/bin/bash

# Document Generator - Stripe Integration Setup Script
# This script helps you set up Stripe payment integration

echo "🔒 Document Generator - Stripe Integration Setup"
echo "================================================"
echo

# Check if .env.stripe exists
if [ ! -f ".env.stripe" ]; then
    echo "📝 Creating .env.stripe from template..."
    cp .env.stripe.example .env.stripe
    echo "✅ Created .env.stripe file"
    echo
fi

echo "🔧 To complete Stripe setup:"
echo
echo "1. 📋 Get your Stripe API keys:"
echo "   - Go to https://dashboard.stripe.com/apikeys"
echo "   - Copy your Publishable key (pk_test_...)"
echo "   - Copy your Secret key (sk_test_...)"
echo
echo "2. 🎯 Create products in Stripe Dashboard:"
echo "   - Go to https://dashboard.stripe.com/products"
echo "   - Create 'Premium Monthly' subscription ($29.99/month)"
echo "   - Create 'Premium Yearly' subscription ($299.99/year)"
echo "   - Create 'Founder Lifetime' one-time payment ($299.99)"
echo "   - Create credit packages (small: $9.99, medium: $24.99, large: $49.99)"
echo
echo "3. 🔗 Set up webhooks:"
echo "   - Go to https://dashboard.stripe.com/webhooks"
echo "   - Add endpoint: http://your-domain.com/webhook/stripe"
echo "   - Select events: checkout.session.completed, invoice.payment_succeeded"
echo "   - Copy webhook signing secret"
echo
echo "4. ✏️  Edit .env.stripe with your actual keys:"
echo "   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here"
echo "   STRIPE_SECRET_KEY=sk_test_your_key_here"
echo "   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here"
echo "   [Add all product/price IDs]"
echo
echo "5. 🚀 Start the services:"
echo "   docker-compose up stripe-api"
echo "   # Or start all services:"
echo "   docker-compose up"
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker is not running. Please start Docker first."
    echo
fi

# Check if we can access Stripe test keys
echo "🧪 Testing Stripe connectivity..."
if [ -f ".env.stripe" ]; then
    # Source the env file
    export $(cat .env.stripe | grep -v '^#' | xargs)
    
    if [[ "$STRIPE_SECRET_KEY" == *"sk_test_"* ]] && [[ "$STRIPE_SECRET_KEY" != *"your_"* ]]; then
        echo "✅ Stripe test key detected"
        
        # Test basic Stripe API call (requires curl and API key)
        if command -v curl &> /dev/null; then
            echo "🔍 Testing Stripe API..."
            RESULT=$(curl -s -u "$STRIPE_SECRET_KEY": https://api.stripe.com/v1/balance)
            
            if echo "$RESULT" | grep -q "object.*balance"; then
                echo "✅ Stripe API connection successful!"
            else
                echo "❌ Stripe API test failed. Check your secret key."
            fi
        fi
    else
        echo "⚠️  Please update your Stripe keys in .env.stripe"
    fi
else
    echo "⚠️  .env.stripe file not found"
fi

echo
echo "💡 Next Steps:"
echo "   1. Update your Stripe keys in .env.stripe"
echo "   2. Test locally: docker-compose up"
echo "   3. Deploy to production: Railway, Vercel, or your preferred platform"
echo "   4. Update webhook endpoints in Stripe Dashboard"
echo
echo "📚 For detailed setup guide:"
echo "   https://github.com/Soulfra/document-generator-mvp#stripe-setup"
echo
echo "🎯 After setup, users can:"
echo "   • Connect Arweave wallets for authentication"
echo "   • Upgrade to premium features via Stripe"
echo "   • Purchase credits for document processing"
echo "   • Access founder tier with lifetime benefits"
echo
echo "✨ Integration complete! The Cal character will now offer premium features to authenticated Soulfra wallet users."