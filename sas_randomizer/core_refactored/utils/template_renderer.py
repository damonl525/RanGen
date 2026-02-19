import os
from typing import Any, Dict
from jinja2 import Environment, FileSystemLoader

class TemplateRenderer:
    def __init__(self):
        # Determine the path to valid templates
        # Assuming this file is at sas_randomizer/core_refactored/utils/template_renderer.py
        # Templates are at sas_randomizer/core_refactored/templates/
        current_dir = os.path.dirname(os.path.abspath(__file__))
        template_dir = os.path.join(os.path.dirname(current_dir), 'templates')
        
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            trim_blocks=True,
            lstrip_blocks=True,
            extensions=['jinja2.ext.do']
        )
        
    def render(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Render a template with the specific context.
        
        Args:
            template_name: e.g., 'drug_randomization.sas.j2'
            context: Variables to inject (e.g., {'study': ...})
        """
        template = self.env.get_template(template_name)
        return template.render(**context)
