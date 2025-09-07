from graphai import Graph, node, router
from graphai.callback import EventCallback


# define simple nodes
@node(start=True)
async def start(input: dict) -> dict:
    return {"input": input}

@router(stream=True)
async def llm(input: dict, state: dict, callback: EventCallback) -> dict:
    # get client initialized in lifespan
    client = state["client"]
    # call openai (or another provider as preferred)
    stream = await client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=state["events"],
        stream=True,
    )
    direct_answer: str = ""
    tool_call: dict = {}
    tool_call_args = ""
    async for chunk in stream:
        if (token := chunk.choices[0].delta.content) is not None:
            # this handles direct text output
            direct_answer += token
            await callback.acall(token)
        # no tools are setup in this template, but we add handling for
        # them nonetheless
        tool_calls_out = chunk.choices[0].delta.tool_calls
        if tool_calls_out and (tool_name := tool_calls_out[0].function.name) is not None:
            # this handles the initial tokens of a tool call
            tool_call["id"] = tool_calls_out[0].id
            tool_call["name"] = tool_name
            # we can return the tool name
            await callback.acall({"tool_name": tool_name})
        elif tool_calls_out and (tool_args := tool_calls_out[0].function.arguments) is not None:
            # this handles the arguments of a tool call
            tool_call_args += tool_args
            # we can output these too
            await callback.acall({"tool_args": tool_args})
    if direct_answer:
        # if we got a direct answer we create a standard assistant message
        state["events"].append(
            {
                "role": "assistant",
                "content": direct_answer,
            }
        )
        # choice controls the next node destination
        choice = "end"
    elif tool_call:
        # if we got a tool call we create an assistant tool call message
        state["events"].append(
            {
                "role": "assistant",
                "tool_calls": [{
                    "id": tool_call["id"],
                    "type": "function",
                    "function": {
                        "name": tool_call["name"],
                        "arguments": tool_call_args,
                    }
                }]
            }
        )
        choice = tool_call["name"]
    return {"input": input, "choice": choice}

@node(end=True)
async def end(input: dict, state: dict) -> dict:
    return {"output": state["events"]}

def get_graph() -> Graph:
    # setup system message
    dev_message = {
        "role": "developer",
        "content": (
            "You are a helpful assistant that uses the various tools and to "
            "answer the user's questions."
            "\n"
            "When answering questions, you may use the various tools "
            "multiple times before answering to the user. You should aim "
            "aim to have all of the information you need from the tools "
            "before answering the user."
            "\n"
            "There is a limit of 10 steps to each interaction, measured "
            "as the number of tool calls made between the user's most "
            "recent message and your response to the user. Keep that limit "
            "in mind but ensure you are still thorough in your analysis."
        )
    }
    # create simple graph
    graph = (
        Graph(max_steps=10)
        .set_state({"events": [dev_message]})
        .add_node(start)
        .add_node(llm)
        .add_node(end)
        .add_router(
            sources=[start],
            router=llm,
            destinations=[end],
        )
        .add_edge(start, llm)
        .add_edge(llm, end)
        .compile()
    )
    return graph

