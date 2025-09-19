// SIMP TAG COMPACTOR ROUTES
// Auto-generated symlinks to master menu

app.get('/', (req, res) => res.redirect('/master?from=root'));
app.get('/go', (req, res) => res.redirect('/master?from=go'));
app.get('/start', (req, res) => res.redirect('/master?from=start'));
app.get('/hub', (req, res) => res.redirect('/master?from=hub'));
app.get('/control', (req, res) => res.redirect('/master?from=control'));
app.get('/command', (req, res) => res.redirect('/master?from=command'));
app.get('/c', (req, res) => res.redirect('/master?quick=coord'));
app.get('/a', (req, res) => res.redirect('/master?quick=ai'));
app.get('/t', (req, res) => res.redirect('/master?quick=tools'));
app.get('/g', (req, res) => res.redirect('/master?quick=games'));
app.get('/s', (req, res) => res.redirect('/master?quick=status'));
app.get('/m', (req, res) => res.redirect('/master'));
app.get('/main', (req, res) => res.redirect('/master?from=main'));
app.get('/home', (req, res) => res.redirect('/master?from=home'));
app.get('/dashboard', (req, res) => res.redirect('/master?from=dashboard'));
app.get('/portal', (req, res) => res.redirect('/master?from=portal'));
app.get('/console', (req, res) => res.redirect('/master?from=console'));

// SIMP tag API endpoint
app.get('/api/simp-tags', (req, res) => {
  res.json({
    tags: {
      "coord": {
        "url": "/master",
        "description": "System coordination hub"
      },
      "flags": {
        "url": "/master",
        "description": "Flag & tag management"
      },
      "status": {
        "url": "/master",
        "description": "System status monitoring"
      },
      "ai": {
        "url": "/master",
        "description": "AI economy and network"
      },
      "brain": {
        "url": "/master",
        "description": "AI intelligence systems"
      },
      "network": {
        "url": "/master",
        "description": "AI communication network"
      },
      "tools": {
        "url": "/master",
        "description": "Platform utilities"
      },
      "revive": {
        "url": "/master",
        "description": "System revival tools"
      },
      "vanity": {
        "url": "/master",
        "description": "Achievement displays"
      },
      "games": {
        "url": "/master",
        "description": "Interactive experiences"
      },
      "vc": {
        "url": "/master",
        "description": "VC billion game"
      },
      "flex": {
        "url": "/master",
        "description": "Vanity flex rooms"
      },
      "advanced": {
        "url": "/master",
        "description": "Advanced platform features"
      },
      "stripe": {
        "url": "/master",
        "description": "Payment processing"
      },
      "deploy": {
        "url": "/master",
        "description": "Deployment tools"
      },
      "admin": {
        "url": "/master",
        "description": "System administration"
      },
      "test": {
        "url": "/master",
        "description": "System testing"
      },
      "monitor": {
        "url": "/master",
        "description": "Real-time monitoring"
      }
    },
    symlinks: {
      "/": "/master?from=root",
      "/go": "/master?from=go",
      "/start": "/master?from=start",
      "/hub": "/master?from=hub",
      "/control": "/master?from=control",
      "/command": "/master?from=command",
      "/c": "/master?quick=coord",
      "/a": "/master?quick=ai",
      "/t": "/master?quick=tools",
      "/g": "/master?quick=games",
      "/s": "/master?quick=status",
      "/m": "/master",
      "/main": "/master?from=main",
      "/home": "/master?from=home",
      "/dashboard": "/master?from=dashboard",
      "/portal": "/master?from=portal",
      "/console": "/master?from=console"
    },
    upc_code: 'SLF-MST-CMP-100',
    master_entry: '/master',
    total_compaction: '25:1'
  });
});

// Quick tag lookup
app.get('/simp/:tag', (req, res) => {
  const tag = req.params.tag;
  const config = simpTags.get(tag);
  if (config) {
    res.redirect(config.url + '?simp=' + tag);
  } else {
    res.redirect('/master?simp=unknown');
  }
});