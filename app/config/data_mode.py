import os

REAL_DATA_MODE = "REAL_DATA_MODE"
DEMO_MODE = "DEMO_MODE"
TEST_MODE = "TEST_MODE"

def get_data_mode() -> str:
    """
    Returns the active data mode from environment config.
    Defaults to REAL_DATA_MODE.
    """
    mode = os.getenv("TERRAMIND_DATA_MODE", REAL_DATA_MODE).strip().upper()
    if mode in (REAL_DATA_MODE, DEMO_MODE, TEST_MODE):
        return mode
    return REAL_DATA_MODE
