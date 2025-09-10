import json

import pandas as pd
from graphai import node
from graphai.callback import EventCallback
from graphai.utils import FunctionSchema
from pydantic import BaseModel, Field


class PredictCustomerPurchase(BaseModel):
    """This tool will predict the number of purchases a customer will make over a
    given time period. This tool can be used to identify our most valuable customers,
    or customers that are likely to churn. The tool uses the PQL:

    ```
    PREDICT COUNT(transactions.*, 0, {days}, days) FOR customers.customer_id IN ({customer_ids})
    ```

    Where days is the number of days to predict and customer_ids is a list of customer IDs.
    As such, you MUST provide both the number of days to predict for AND an array of
    customer IDs - do NOT forget to include `customer_ids`.

    The format returned is a list of dictionaries, with a 1-to-1 mapping to the number
    of customers in the input like so:

    ```
    [{'customer_id': '00000dba...',
      'prediction': 0.0029}]
    ```
    """
    days: int = Field(..., description="The number of days to predict for")
    customer_ids: list[str] = Field(..., description="The list of user IDs to predict for")


class PredictProductDemand(BaseModel):
    """This tool will predict the demand for a given product over a given time period
    using the PQL:
    
    ```
    PREDICT SUM(transactions.price, 0, {days}, days) FOR articles.article_id IN ({article_ids})
    ```

    Where days is the number of days to predict and article_ids is a list of article IDs.
    """
    days: int = Field(..., description="The number of days to predict for")
    article_ids: list[str] = Field(..., description="The list of article IDs to predict for")


class PredictAny(BaseModel):
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
async def predict_customer_purchase(input: dict, state: dict, callback: EventCallback) -> dict:
    try:
        tool_call_args = json.loads(state["events"][-1]["tool_calls"][0]["function"]["arguments"])
        days = tool_call_args.get("days")
        customer_ids = tool_call_args.get("customer_ids")
        if days is None or customer_ids is None:
            raise ValueError("`days` or `customer_ids` parameter is missing")
        
        # Make query with kumorfm
        stmt = f"PREDICT COUNT(transactions.*, 0, {days}, days) "
        if len(customer_ids) > 1:
            ids_string = ", ".join([f"'{id}'" for id in customer_ids])
            stmt += f"FOR customers.customer_id IN ({ids_string})"
        else:
            stmt += f"FOR customers.customer_id = '{customer_ids[0]}'"
        
        df = state["kumorfm"].predict(stmt)
        # Clean up the dataframe
        df = df.drop(columns=["ANCHOR_TIMESTAMP"]).rename(columns={
            "ENTITY": "customer_id",
            "TARGET_PRED": "prediction"
        })
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
    # Add tool call event to state
    event = {
        "role": "tool",
        "content": content,
        "tool_call_id": state["events"][-1]["tool_calls"][0]["id"]
    }
    state["events"].append(event)
    return {"input": {}}


@node(stream=True)
async def predict_product_demand(input: dict, state: dict, callback: EventCallback) -> dict:
    try:
        tool_call_args = json.loads(state["events"][-1]["tool_calls"][0]["function"]["arguments"])
        days = tool_call_args.get("days")
        article_ids = tool_call_args.get("article_ids")
        
        if days is None or article_ids is None:
            raise ValueError("`days` or `article_ids` parameter is missing")
        
        if len(article_ids) > 1:
            ids_string = ", ".join([f"'{id}'" for id in article_ids])
            pql = f"PREDICT SUM(transactions.price, 0, {days}, days) FOR articles.article_id IN ({ids_string})"
        else:
            pql = f"PREDICT SUM(transactions.price, 0, {days}, days) FOR articles.article_id={article_ids[0]}"
        
        df = state["kumorfm"].predict(pql)
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
async def predict_any(input: dict, state: dict, callback: EventCallback) -> dict:
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
        # Get the dataframes from state
        namespace = {
            "transactions_df": state["transactions_df"],
            "articles_df": state["articles_df"],
            "customers_df": state["customers_df"],
            "pd": pd,
            "out": None,
        }
        
        # Get the query to be executed
        query = tool_call_args.get("query")
        if not query:
            raise ValueError("No query provided")
        
        # Clean the query
        query = query.replace("\\n", "\n")
        
        # Execute the query
        exec(query, namespace)
        
        # Get the out variable
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
    churn_schema = FunctionSchema.from_pydantic(PredictCustomerPurchase)
    churn_schema.name = "predict_customer_purchase"
    
    demand_schema = FunctionSchema.from_pydantic(PredictProductDemand)
    demand_schema.name = "predict_product_demand"
    
    any_schema = FunctionSchema.from_pydantic(PredictAny)
    any_schema.name = "predict_any"
    
    query_df_schema = FunctionSchema.from_pydantic(QueryDataframes)
    query_df_schema.name = "query_dataframes"
    
    return [churn_schema, demand_schema, any_schema, query_df_schema]

