from typing import Dict, Any
import logging
from ..api.schemas import SASGenerationRequest

# Import the core generator
try:
    from sas_randomizer.core_refactored.sas_generator import SASRandomizationGenerator
except ImportError as e:
    logging.error(f"Failed to import SASRandomizationGenerator. Ensure project root is in sys.path. Error: {e}")
    raise

class SASService:
    @staticmethod
    def generate_sas_code(request: SASGenerationRequest) -> str:
        """
        Invokes the SASRandomizationGenerator to produce SAS code string.
        """
        # Convert Pydantic model to dictionary compatible with __init__ arguments
        # explicit exclude_unset might be safer if we want defaults from the class, 
        # but the schema defaults match the class defaults mostly.
        # However, passing 'None' for Optional fields might be issue if class expects default?
        # The class has defaults for most things.
        
        data = request.model_dump()
        
        try:
            generator = SASRandomizationGenerator(**data)
            code = generator.generate_sas_code()
            return code
        except ValueError:
            # Business validation errors — pass through to endpoints for 400 response
            raise
        except Exception as e:
            logging.error(f"Unexpected error generating SAS code: {e}", exc_info=True)
            raise RuntimeError("SAS Code Generation Failed") from e
