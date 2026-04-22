; Punctuation
[
  ","
  "."
  ":"
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  "<<"
  ">>"
] @punctuation.bracket

[
  "%{"
  "%"
] @punctuation.special

; Identifiers
(identifier) @variable

; Unused identifiers
((identifier) @comment
  (#lua-match? @comment "^_"))

; Comments
(comment) @comment @spell

; Strings
(string) @string
(string_content) @string
(heredoc) @string
(heredoc_content) @string
(escape_sequence) @string.escape

; Interpolation
(string_interpolation
  "#{" @string.special
  "}" @string.special)

; Modules
(module_name) @module
(module_path (module_name) @module)

; Atoms
(atom) @string.special.symbol

; Integers
(integer) @number

; Floats
(float) @number.float

; Booleans
(boolean) @boolean

; Nil
(nil) @constant.builtin

; Operators
[
  "="
  "|>"
  "~>"
  "<>"
  "<-"
  "::"
  "->"
  "!"
  "^"
  "&"
  "|"
] @operator

(comparison_operator) @operator
(additive_operator) @operator
(multiplicative_operator) @operator

; Operator keywords
[
  "and"
  "or"
  "not"
  "rem"
] @keyword.operator

; Definition keywords
[
  "fn"
  "macro"
] @keyword.function

; Reserved keywords
[
  "module"
  "protocol"
  "impl"
  "for"
  "struct"
  "union"
  "extends"
  "if"
  "else"
  "case"
  "cond"
  "use"
  "quote"
  "unquote"
  "unquote_splicing"
  "import"
  "alias"
  "type"
  "opaque"
  "panic"
  "shared"
  "unique"
  "borrowed"
] @keyword

; Import/alias filter tokens
[
  "only:"
  "except:"
  "as:"
  "type:"
] @keyword

; Visibility
(visibility_modifier) @keyword

; Ownership
(ownership_modifier) @keyword

; Function definitions
(function_definition
  name: (identifier) @function)
(macro_definition
  name: (identifier) @function.macro)
(macro_definition
  name: _ @function.macro)

; Protocol function signatures
(protocol_function_signature
  name: (identifier) @function)

; Function calls
(function_call
  name: (identifier) @function.call)
(qualified_call
  name: (identifier) @function.call)
(qualified_call
  name: (module_name) @function.call)

; Test framework — describe/test as keywords, assert/reject/setup/teardown as builtins
(function_call
  name: ((identifier) @keyword
    (#any-of? @keyword "describe" "test")))

(function_call
  name: ((identifier) @function.builtin
    (#any-of? @function.builtin "assert" "reject" "setup" "teardown")))

; Type annotations
(type_name) @type.builtin

; Parameters
(parameter
  pattern: (identifier) @variable.parameter)

; Struct fields
(struct_field
  name: (identifier) @property)
(struct_field_value
  key: (identifier) @property)
(field_access
  field: (identifier) @property)
(field_access
  field: (module_name) @module)

; Union variants
(union_variant
  name: (module_name) @constant)

; Module attributes — general (@timeout, @max_retries, etc.)
(attribute_declaration
  "@" @constant
  name: (identifier) @constant)

; Documentation attributes — @doc, @moduledoc, @typedoc
(attribute_declaration
  "@" @comment.documentation
  name: ((identifier) @comment.documentation
    (#any-of? @comment.documentation "doc" "moduledoc" "typedoc" "shortdoc"))
  value: (_) @comment.documentation)

; Attribute references in expressions
(attribute_reference
  "@" @constant
  name: (identifier) @constant)

; Intrinsic calls
(intrinsic_call
  name: (identifier) @function.builtin)

; Function references
(function_reference
  name: (identifier) @function)

; Capture operator
(capture_expression
  "&" @operator)

; Sigils — string sigils
(sigil
  (sigil_name) @string @_sigil_name
  (#any-of? @_sigil_name "~s" "~S"))

; Sigils — non-string
(sigil
  (sigil_name) @string.special @_sigil_name
  (#not-any-of? @_sigil_name "~s" "~S"))

; For comprehension variable
(for_expression
  variable: (identifier) @variable)

; Anonymous function keyword
(anonymous_function
  "fn" @keyword.function)

; Wildcard
(wildcard) @variable.builtin
