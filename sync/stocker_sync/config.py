"""Configuration from environment variables only. See .env.example."""

import os
from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path


class ConfigError(Exception):
    pass


@dataclass(frozen=True)
class DbConfig:
    host: str
    port: int
    database: str
    user: str
    # repr=False keeps the password out of logs and tracebacks.
    password: str = field(repr=False)


@dataclass(frozen=True)
class Config:
    source: DbConfig
    target: DbConfig
    # CA certificate for verifying Supabase's server certificate.
    target_ssl_root_cert: Path


def load(env: Mapping[str, str] = os.environ) -> Config:
    missing: list[str] = []

    def get(name: str) -> str:
        value = env.get(name, "")
        if not value:
            missing.append(name)
        return value

    def db(prefix: str) -> DbConfig:
        port = get(f"{prefix}_PGPORT")
        return DbConfig(
            host=get(f"{prefix}_PGHOST"),
            port=int(port) if port.isdigit() else 0,
            database=get(f"{prefix}_PGDATABASE"),
            user=get(f"{prefix}_PGUSER"),
            password=get(f"{prefix}_PGPASSWORD"),
        )

    config = Config(
        source=db("SOURCE"),
        target=db("TARGET"),
        target_ssl_root_cert=Path(get("TARGET_SSLROOTCERT")),
    )

    # Names only, never values.
    if missing:
        raise ConfigError(f"missing environment variables: {', '.join(missing)}")
    for name, port in (
        ("SOURCE_PGPORT", config.source.port),
        ("TARGET_PGPORT", config.target.port),
    ):
        if not 0 < port < 65536:
            raise ConfigError(f"{name} must be a port number")
    if not config.target_ssl_root_cert.is_file():
        raise ConfigError(
            f"TARGET_SSLROOTCERT is not a file: {config.target_ssl_root_cert}"
        )
    return config
