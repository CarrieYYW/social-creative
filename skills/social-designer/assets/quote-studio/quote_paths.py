"""Keep client output outside the editor and its distributed skill/plugin trees."""
from pathlib import Path


def validate_output(output, source=None):
 output=Path(output).resolve()
 source=Path(source or __file__).resolve()
 if source.is_file():source=source.parent
 protected=[source]
 for ancestor in source.parents:
  if (ancestor/'SKILL.md').is_file():protected.append(ancestor)
  if (ancestor/'.codex-plugin/plugin.json').is_file() or (ancestor/'.claude-plugin/plugin.json').is_file() or ((ancestor/'plugin.json').is_file() and (ancestor/'skills').is_dir()):protected.append(ancestor)
 if any(output.is_relative_to(root) for root in protected):
  raise ValueError('Choose a client output folder outside the editor and packaged skill/plugin source.')
 return output
