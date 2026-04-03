; Keywords
[
  "module"
  "fn"
  "macro"
  "struct"
  "union"
  "extends"
  "if"
  "else"
  "case"
  "cond"
  "with"
  "quote"
  "unquote"
  "import"
  "alias"
  "type"
  "opaque"
  "and"
  "or"
  "not"
  "rem"
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
  "@"
] @operator

(comparison_operator) @operator
(additive_operator) @operator
(multiplicative_operator) @operator

; Literals
(integer) @number
(float) @number.float
(string) @string
(string_content) @string
(escape_sequence) @string.escape
(string_interpolation
  "#{" @punctuation.special
  "}" @punctuation.special)
(atom) @string.special.symbol
(boolean) @constant.builtin
(nil) @constant.builtin

; Comments
(comment) @comment

; Module names
(module_name) @type
(module_path (module_name) @type)

; Function definitions
(function_definition
  name: (identifier) @function)
(macro_definition
  name: (identifier) @function.macro)
(macro_definition
  name: _ @function.macro)

; Function calls
(function_call
  name: (identifier) @function.call)
(qualified_call
  name: (identifier) @function.call)

; Type annotations
(type_name) @type.builtin

; Visibility
(visibility_modifier) @keyword

; Ownership
(ownership_modifier) @keyword

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

; Union variants
(union_variant
  name: (module_name) @constant)

; Attributes
(attribute_declaration
  name: (identifier) @attribute)
(attribute_reference
  name: (identifier) @attribute)
(intrinsic_call
  name: (identifier) @function.builtin)

; Function references
(function_reference
  name: (identifier) @function)

; Wildcard
(wildcard) @variable.builtin

; Punctuation
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
  ","
  "."
  ":"
] @punctuation.delimiter

"%{" @punctuation.bracket
"%" @punctuation.bracket
