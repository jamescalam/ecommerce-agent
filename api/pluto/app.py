from contextlib import asynccontextmanager

from dotenv import find_dotenv, load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI

from pluto.agent import get_graph
from pluto.routers.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # add anything you need in API lifespan here
        app.state.client = AsyncOpenAI()
        app.state.graph = get_graph()
        yield
    finally:
        # cleanup anything you need cleaning up
        pass

load_dotenv(find_dotenv())

app = FastAPI(lifespan=lifespan)

ALLOW_ORIGINS = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

