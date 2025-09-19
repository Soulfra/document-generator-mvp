addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const agentWallet = '0x1234567890abcdef1234567890abcdef12345678'
  const referralId = url.searchParams.get('cf_ref')
  
  // Track Cloudflare referral
  if (referralId && referralId.startsWith('agent_')) {
    console.log('☁️ Cloudflare referral tracked:', {
      wallet: agentWallet,
      referral: referralId,
      commission: '25%'
    })
  }
  
  const response = {
    platform: 'Cloudflare Workers',
    agent_wallet: agentWallet,
    affiliate_commission: '25%',
    deployment_status: 'active',
    worker_timestamp: Date.now()
  }
  
  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}