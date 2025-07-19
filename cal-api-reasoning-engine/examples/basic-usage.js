// Example usage for GitHub agents
const response = await fetch('/api/reason', {
  method: 'POST',
  body: JSON.stringify({ input: 'test' })
});