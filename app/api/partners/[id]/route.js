export async function PATCH(request, { params }) {
  // Only allow proxy in development environment
  if (process.env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({ 
      error: 'Proxy API not available in production' 
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { id } = params;
    const body = await request.json();
    
    // Proxy the request to the external API (development only)
    const response = await fetch(`https://battein-onboard-brown.vercel.app/api/partners/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      return new Response(errorData, { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error updating partner:', error);
    return new Response(JSON.stringify({ error: 'Failed to update partner' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 