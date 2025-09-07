from enum import StrEnum

from pydantic import BaseModel, Field


class Role(StrEnum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"

class Event(BaseModel):
    role: Role = Field(
        ...,
        description="The role of the event sender",
        examples=[Role.SYSTEM, Role.USER, Role.ASSISTANT],
    )
    content: str = Field(
        ...,
        description="Text content from system, user, or assistant"
    )

class ChatRequest(BaseModel):
    messages: list[Event] = Field(
        ...,
        description="List of events to send to the chatbot",
        examples=[
            [
                Event(role=Role.ASSISTANT, content="Hello, how are you?"),
                Event(role=Role.USER, content="I'm fine, thanks.")
            ]
        ]
    )
