from graphai import Graph, node, router
from graphai.callback import EventCallback

from pluto.tools import (
    get_tool_schemas,
    predict_any,
    predict_customer_purchase,
    predict_product_demand,
    query_dataframes,
)


# define simple nodes
@node(start=True)
async def start(input: dict) -> dict:
    return {"input": input}

@router(stream=True)
async def llm(input: dict, state: dict, callback: EventCallback) -> dict:
    # get client initialized in lifespan
    client = state["client"]
    # get tool schemas
    tools = get_tool_schemas()
    # call openai (or another provider as preferred)
    stream = await client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=state["events"],
        tools=[x.to_openai(api="completions") for x in tools],
        stream=True,
        seed=9000,  # keep consistent results
        parallel_tool_calls=False,
    )
    direct_answer: str = ""
    tool_call: dict = {}
    tool_call_args = ""
    async for chunk in stream:
        if (token := chunk.choices[0].delta.content) is not None:
            # this handles direct text output
            direct_answer += token
            await callback.acall(token=token)
        # handle tool calls
        tool_calls_out = chunk.choices[0].delta.tool_calls
        if tool_calls_out and (tool_name := tool_calls_out[0].function.name) is not None:
            # this handles the initial tokens of a tool call
            tool_call["id"] = tool_calls_out[0].id
            tool_call["name"] = tool_name
            # we can return the tool name
            await callback.acall(
                type="tool_call",
                params=tool_call
            )
        elif tool_calls_out and (tool_args := tool_calls_out[0].function.arguments) is not None:
            # this handles the arguments of a tool call
            tool_call_args += tool_args
            # we can output these too
            await callback.acall(
                type="tool_args",
                params={
                    **tool_call,
                    "arguments": tool_args
                }
            )
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
            "You are a helpful assistant that uses the various tools and "
            "KumoRFM integration to answer the user's analytics questions "
            "about our H&M ecommerce dataset."
            "\n"
            "When answering questions, you may use the various tools "
            "multiple times before answering to the user. You should aim "
            "to have all of the information you need from the tools "
            "before answering the user."
            "\n"
            "There is a limit of 30 steps to each interaction, measured "
            "as the number of tool calls made between the user's most "
            "recent message and your response to the user. Keep that limit "
            "in mind but ensure you are still thorough in your analysis."
            "\n\n"
            "## PQL (Predictive Query Language) Reference\n"
            "Use this syntax when working with KumoRFM predictions:\n"
            "\n"
            "**Basic Structure:**\n"
            "PREDICT [target] FOR EACH [entity]\n"
            "\n"
            "**Task Types:**\n"
            "- Regression: SUM(TRANSACTIONS.PRICE, 0, 30)\n"
            "- Binary Classification: COUNT(TRANSACTIONS.*, 0, 30) = 0\n"
            "- Link Prediction: LIST_DISTINCT(TRANSACTIONS.ARTICLE_ID, 0, 30) RANK TOP 10\n"
            "\n"
            "**Time Windows:**\n"
            "- Format: (start, end, unit)\n"
            "- Units: days, months, hours\n"
            "- Example: (0, 30, days) = next 30 days\n"
            "\n"
            "**Commands:**\n"
            "- PREDICT: defines target value\n"
            "- FOR EACH: specifies entity (primary key)\n"
            "- WHERE: adds filters\n"
            "- ASSUMING: hypothetical scenarios\n"
            "- RANK TOP K: limits results to top K\n"
            "\n"
            "**Example Queries:**\n"
            "- Customer purchase prediction: PREDICT SUM(TRANSACTIONS.PRICE, 0, 30) FOR EACH CUSTOMERS.CUSTOMER_ID\n"
            "- Churn prediction: PREDICT COUNT(TRANSACTIONS.*, 0, 30) = 0 FOR EACH CUSTOMERS.CUSTOMER_ID\n"
            "- Product recommendations: PREDICT LIST_DISTINCT(TRANSACTIONS.ARTICLE_ID, 0, 30) RANK TOP 10 FOR EACH CUSTOMERS.CUSTOMER_ID"
        )
    }
    
    # Initialize KumoRFM service
    from pluto.kumo_integration import kumo_service
    kumo_service.initialize()
    
    # create graph with ecommerce tools
    graph = (
        Graph(max_steps=30)
        .set_state({
            "events": [dev_message],
            "kumorfm": kumo_service.model,
            "transactions_df": kumo_service.transactions_df,
            "articles_df": kumo_service.articles_df,
            "customers_df": kumo_service.customers_df
        })
        .add_node(start)
        .add_node(llm)
        .add_node(predict_customer_purchase)
        .add_node(predict_product_demand)
        .add_node(predict_any)
        .add_node(query_dataframes)
        .add_node(end)
        .add_router(
            sources=[start],
            router=llm,
            destinations=[
                predict_customer_purchase,
                predict_product_demand,
                predict_any,
                query_dataframes,
                end
            ]
        )
        .add_edge(predict_customer_purchase, llm)
        .add_edge(predict_product_demand, llm)
        .add_edge(predict_any, llm)
        .add_edge(query_dataframes, llm)
        .add_edge(llm, end)
        .compile()
    )
    return graph

