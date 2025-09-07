import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient

from pluto.app import app


@pytest.mark.asyncio
async def test_chat_endpoint_streams_response():
    """Test that the /chat endpoint returns a streaming response."""
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Prepare test message
        test_message = {
            "role": "user",
            "content": "Hello, this is a test message"
        }
        
        # Make async request to the chat endpoint
        response = await client.post(
            "/chat",
            json=test_message,
            headers={"Content-Type": "application/json"}
        )
        
        # Check that the response is successful
        assert response.status_code == 200
        
        # Check that the response has the correct content type for streaming
        assert response.headers["content-type"] == "text/event-stream"
        
        # Check that we received some content
        content = response.content
        assert len(content) > 0
        
        # Optionally, decode and check the streamed content structure
        # Since it's SSE format, we expect data: prefixed lines
        decoded_content = content.decode('utf-8')
        assert "data:" in decoded_content or decoded_content.strip() != ""


def test_chat_endpoint_with_sync_client():
    """Test the /chat endpoint using synchronous TestClient."""
    
    with TestClient(app) as client:
        # Prepare test message
        test_message = {
            "role": "user", 
            "content": "Hello, this is a test message"
        }
        
        # Make request to the chat endpoint
        with client.stream("POST", "/chat", json=test_message) as response:
            # Check that the response is successful
            assert response.status_code == 200
            
            # Check that the response has the correct content type
            assert response.headers["content-type"] == "text/event-stream"
            
            # Collect some streamed data
            chunks = []
            for chunk in response.iter_bytes(chunk_size=1024):
                chunks.append(chunk)
                if len(chunks) >= 1:  # Just check we get at least one chunk
                    break
            
            # Verify we received something
            assert len(chunks) > 0
