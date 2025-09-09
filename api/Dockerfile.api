FROM python:3.13-slim-bookworm as builder

LABEL maintainer="aurelio"
LABEL vendor="aurelio"

ARG DOCKER_IMAGE_TAG
ENV PATH="/root/.cargo/bin/:$PATH" \
    PATH="/root/.local/bin/:$PATH" \
    PYTHONPATH=/app \
    PYTHONFAULTHANDLER=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    PIP_ROOT_USER_ACTION=ignore \
    LANG=C.UTF-8 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never \
    UV_PYTHON=python3.13

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        build-essential \
        linux-headers-generic \
        curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    ln -sf /root/.cargo/bin/uv /usr/local/bin/uv && \
    uv --version

WORKDIR /app

# Copy package files
COPY pyproject.toml uv.lock ./
COPY README.md ./

# Install dependencies first (without the package itself)
RUN uv sync --frozen --no-dev

# Copy the package source code
COPY pluto ./pluto
COPY main.py ./

# Install the package itself
RUN uv sync --frozen --no-dev

FROM builder as runtime

ENV PATH="/app/.venv/bin:$PATH"

WORKDIR /app

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "uvloop", "--reload"]
