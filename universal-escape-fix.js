
// Universal Escape Fix - Add this to any file displaying dynamic content
function safeDisplay(element, text, isCode = false) {
    // Clear existing content
    element.innerHTML = '';
    
    if (isCode) {
        const codeEl = document.createElement('code');
        codeEl.style.color = '#0f0'; // Green for code, not blue
        codeEl.textContent = text; // Automatically escapes HTML
        element.appendChild(codeEl);
    } else {
        element.textContent = text; // Automatically escapes HTML
    }
}

// Fix for status bars showing blue />
function monitorStatusBar() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const text = mutation.target.textContent || '';
                if (text.includes('/>') && mutation.target.style.color === 'blue') {
                    console.warn('Blue /> detected in status bar!', mutation.target);
                    // Auto-fix by changing color
                    mutation.target.style.color = '#0f0'; // Change blue to green
                }
            }
        });
    });
    
    // Monitor all potential status displays
    document.querySelectorAll('[class*="status"], [id*="status"], [class*="ticker"]').forEach(el => {
        observer.observe(el, { childList: true, characterData: true, subtree: true });
    });
}

// Auto-run on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', monitorStatusBar);
}
