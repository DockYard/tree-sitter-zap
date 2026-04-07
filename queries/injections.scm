; Inject markdown into @doc and @moduledoc heredoc content
((attribute_declaration
  name: (identifier) @_attr_name
  value: (heredoc) @injection.content)
  (#any-of? @_attr_name "doc" "moduledoc")
  (#set! injection.language "markdown")
  (#set! injection.combined))
