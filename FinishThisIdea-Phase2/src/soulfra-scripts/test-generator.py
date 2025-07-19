#!/usr/bin/env python3
"""
TEST MAXED SYSTEM - Simple test without threading
"""

from MAXED_OUT_INTEGRATION import MaxedOutSoulfraSystem
import time

def test_system():
    print("🌟 Testing Maxed Out Soulfra System...")
    print("=" * 60)
    
    # Create system (without background threads)
    system = MaxedOutSoulfraSystem()
    
    # Stop background threads for testing
    system.whisper_thread = None
    system.build_thread = None
    system.handoff_thread = None
    
    # Test whisper
    idea = "create a magical emotion tracker"
    print(f"\n🌬️ Whispering: '{idea}'")
    
    whisper_id = system.whisper(idea, tone="creative")
    print(f"✓ Whisper ID: {whisper_id}")
    
    # Manually process the whisper
    print("\n📊 Processing whisper through pipeline...")
    result = system.full_pipeline(whisper_id, idea, "creative")
    
    # Show results
    print("\n🎯 Pipeline Results:")
    print(f"Success: {result['success']}")
    
    if 'decomposition' in result['stages']:
        print(f"\n📦 Decomposed into {result['stages']['decomposition']['metadata']['total_modules']} modules")
        
    if 'cost_analysis' in result['stages']:
        cost = result['stages']['cost_analysis']
        print(f"\n💰 Build Cost Analysis:")
        print(f"  - Loop cost: {cost['loop_cost']} units")
        print(f"  - Feasibility: {cost['feasibility_score']:.0%}")
        print(f"  - Assessment: {cost['mythic_assessment']}")
        
    if 'routing' in result['stages']:
        routing = result['stages']['routing']
        print(f"\n🧭 Routing Decision: {routing['chosen_path']}")
        print(f"  - Reasoning: {routing['reasoning'][0]}")
        print(f"  - Guidance: {routing['mythic_guidance']}")
        
    if 'execution' in result['stages']:
        execution = result['stages']['execution']
        if execution.get('artifacts'):
            print(f"\n🔨 Created: {execution['artifacts'][0]}")
            
            # Show the generated code
            with open(execution['artifacts'][0], 'r') as f:
                code = f.read()
            print("\n📝 Generated Code Preview:")
            print("-" * 40)
            print(code[:500] + "..." if len(code) > 500 else code)
            print("-" * 40)

if __name__ == "__main__":
    test_system()