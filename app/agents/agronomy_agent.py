from typing import Dict, Any
import asyncio
import threading
from app.agents.state import CouncilState
from agents.agronomy.agent import agronomy_agent_node

def run_coroutine_sync(coro):
    """
    Safely runs a coroutine synchronously, whether called from a running event loop or a sync context.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None
        
    if loop and loop.is_running():
        # Event loop is running (e.g. inside FastAPI request thread). Run in a separate thread.
        result = []
        exception = []
        def target():
            try:
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
                res = new_loop.run_until_complete(coro)
                result.append(res)
            except Exception as e:
                exception.append(e)
            finally:
                new_loop.close()
                
        t = threading.Thread(target=target)
        t.start()
        t.join()
        if exception:
            raise exception[0]
        return result[0]
    else:
        # Event loop is not running. Run using standard asyncio.run.
        return asyncio.run(coro)

def agronomy_agent(state: CouncilState) -> Dict[str, Any]:
    """
    Agronomy intelligence node: delegates to the new modular agents.agronomy package
    to compute recommended sowing, crop predictions, yield models, and safety checks.
    """
    print("Executing Agronomy Intelligence Agent via modular agents.agronomy package...")
    
    # Run the modular agronomy_agent_node synchronously
    result = run_coroutine_sync(agronomy_agent_node(state))
    return result

