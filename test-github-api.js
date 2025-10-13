// Quick test script to verify GitHub API access
// Run with: node test-github-api.js

const testGitHubAPI = async () => {
  const owner = 'torvalds';
  const repo = 'linux';
  const path = 'README';
  
  // Test without token
  console.log('\n=== Testing GitHub API (no token) ===');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'RepoRadar-Test'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const content = await response.text();
      console.log('Content length:', content.length);
      console.log('First 100 chars:', content.substring(0, 100));
      console.log('\n✅ SUCCESS: GitHub API is working!');
    } else {
      const errorText = await response.text();
      console.log('Error body:', errorText);
      console.log('\n❌ FAILED: GitHub API returned error');
    }
  } catch (error) {
    console.error('Exception:', error);
    console.log('\n❌ FAILED: Network error');
  }
  
  // Test with token if provided
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    console.log('\n=== Testing GitHub API (with token) ===');
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'RepoRadar-Test',
          'Authorization': `token ${token}`
        }
      });
      
      console.log('Status:', response.status);
      console.log('Rate Limit Remaining:', response.headers.get('x-ratelimit-remaining'));
      
      if (response.ok) {
        const content = await response.text();
        console.log('Content length:', content.length);
        console.log('\n✅ SUCCESS: GitHub API with token is working!');
      } else {
        const errorText = await response.text();
        console.log('Error body:', errorText);
        console.log('\n❌ FAILED: GitHub API with token returned error');
      }
    } catch (error) {
      console.error('Exception:', error);
      console.log('\n❌ FAILED: Network error with token');
    }
  } else {
    console.log('\n💡 TIP: Set GITHUB_TOKEN environment variable to test with authentication');
  }
};

testGitHubAPI();
