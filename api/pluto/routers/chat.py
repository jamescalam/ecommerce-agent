import asyncio

from fastapi import APIRouter, Body, Request
from graphai.callback import EventCallback
from starlette.responses import StreamingResponse

from pluto.schemas import ChatRequest

router = APIRouter()

async def gen(callback: EventCallback):
    async for token in callback.aiter():
        yield token

@router.post("/chat")
async def chat(request: Request, turn: ChatRequest = Body(...)):
    # init new callback
    callback = EventCallback()
    graph = request.app.state.graph
    # add new events/messages to graph state events
    graph.update_state({
        "events": [
            *graph.state["events"],
            *[x.dict() for x in turn.messages]
        ],
        "client": request.app.state.client
    })
    _ = asyncio.create_task(
        graph.execute(input={"input": {}}, callback=callback)
    )
    return StreamingResponse(
        gen(callback), media_type="text/event-stream"
    )

