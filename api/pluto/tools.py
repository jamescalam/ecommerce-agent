import json

import pandas as pd
from graphai import node
from graphai.callback import EventCallback
from graphai.utils import FunctionSchema
from pydantic import BaseModel, Field


class KumoRFM(BaseModel):
    """This tool allows you to write any PQL query you want to the KumoRFM model.
    """
    query: str = Field(..., description="The PQL query to predict")


class QueryDataframes(BaseModel):
    """Execute simple filtered queries on the ecommerce dataframes. Will execute code in
    a namespace with the following dataframes:
    
    - transactions_df
    - articles_df
    - customers_df
    
    You can also access pandas library via `pd` for dataframe operations. Ensure you use
    assign the results you need to the `out` variable, otherwise nothing will be returned
    as this will be run with `exec()`. After execution we access the `out` variable and
    return it to you.

    If outputting a dataframe, you must use the .to_markdown() method to output an easily
    readable markdown table.
    """
    query: str = Field(..., description="The python code to execute")

@node(stream=True)
async def kumorfm(input: dict, state: dict, callback: EventCallback) -> dict:
    try:
        tool_call_args = json.loads(state["events"][-1]["tool_calls"][0]["function"]["arguments"])
        query = tool_call_args.get("query")
        if not query:
            raise ValueError("No query provided")
        
        df = state["kumorfm"].predict(query)
        out = df.to_dict(orient="records")
        content = [{"type": "text", "text": json.dumps(out)}]
    except Exception as e:
        content = [{"type": "text", "text": str(e)}]
    # stream tool output
    await callback.acall(
        type="tool_output",
        params={
            "id": state["events"][-1]["tool_calls"][0]["id"],
            "name": "predict_customer_purchase",
            "arguments": tool_call_args,
            "output": content[0]["text"]
        }
    )
    event = {
        "role": "tool",
        "content": content,
        "tool_call_id": state["events"][-1]["tool_calls"][0]["id"]
    }
    state["events"].append(event)
    return {"input": {}}


@node(stream=True)
async def query_dataframes(input: dict, state: dict, callback: EventCallback) -> dict:
    try:
        tool_call_args = json.loads(state["events"][-1]["tool_calls"][0]["function"]["arguments"])
        # get dataframes, pandas, and set `out` to None
        namespace = {
            "transactions_df": state["transactions_df"],
            "articles_df": state["articles_df"],
            "customers_df": state["customers_df"],
            "pd": pd,
            "out": None,
        }
        # grab query from LLM to be executed
        query = tool_call_args.get("query")
        if not query:
            raise ValueError("No query provided")
        # remove escaped newlines as it frequently breaks the query
        query = query.replace("\\n", "\n")
        # execute query within predefined namespace
        exec(query, namespace)
        # pull out the `out` value
        out = namespace.get("out")
        if out is None:
            out = "No result returned via the `out` variable"
        content = [{"type": "text", "text": json.dumps(out, default=str)}]
    except Exception as e:
        content = [{
            "type": "text",
            "text": (
                f"Error executing query: {str(e)}. "
                "Please fix your query and trying again."
            )
        }]
    # stream tool output
    await callback.acall(
        type="tool_output",
        params={
            "id": state["events"][-1]["tool_calls"][0]["id"],
            "name": "predict_customer_purchase",
            "arguments": tool_call_args,
            "output": content[0]["text"]
        }
    )
    # Add tool call event to state
    event = {
        "role": "tool",
        "content": content,
        "tool_call_id": state["events"][-1]["tool_calls"][0]["id"]
    }
    state["events"].append(event)
    return {"input": {}}


def get_tool_schemas():
    """Get all tool schemas for the agent"""
    kumorfm_schema = FunctionSchema.from_pydantic(KumoRFM)
    kumorfm_schema.name = "kumorfm"
    
    query_df_schema = FunctionSchema.from_pydantic(QueryDataframes)
    query_df_schema.name = "query_dataframes"
    
    return [kumorfm_schema, query_df_schema]

