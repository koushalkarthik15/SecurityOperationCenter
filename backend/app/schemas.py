from pydantic import BaseModel


class LogInput(BaseModel):
    failed_login_count: int
    login_success_ratio: float
    privilege_target: int
    hour_of_day: int
    is_off_hours: int
    action_frequency: float
    connection_rate: float
    bytes_transferred: float
    is_new_ip: int
    source_ip: str = "0.0.0.0"


class SettingsInput(BaseModel):
    admin_email: str | None = None
    alert_threshold: int | None = None
