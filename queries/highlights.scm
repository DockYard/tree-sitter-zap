; Keywords
[
  "defmodule"
  "def"
  "defp"
  "defmacro"
  "defstruct"
  "defenum"
  "do"
  "end"
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
  "extends"
  "when"
  "and"
  "or"
  "not"
  "rem"
  "panic"
] @keyword

; Operators
[
  "="
  "|>"
  "<>"
  "<-"
  "::"
  "->"
  "!"
  "^"
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
(private_function_definition
  name: (identifier) @function)
(macro_definition
  name: (identifier) @function.macro)

; Function calls
(function_call
  name: (identifier) @function.call)
(qualified_call
  name: (identifier) @function.call)

; Type annotations
(type_name) @type.builtin

; Parameters
(parameter
  name: (identifier) @variable.parameter)

; Struct fields
(struct_field
  name: (identifier) @property)
(struct_field_value
  key: (identifier) @property)
(field_access
  field: (identifier) @property)

; Enum variants
(enum_variant
  (module_name) @constant)

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
