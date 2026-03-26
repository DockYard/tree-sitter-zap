# tree-sitter-zap

A [tree-sitter](https://tree-sitter.github.io/) grammar for the [Zap](https://github.com/bcardarella/zap) programming language.

## Supported Syntax

- **Modules** &mdash; `defmodule`, module inheritance with `extends`, nested module paths
- **Functions** &mdash; `def` / `defp` with typed parameters, pattern matching, guards, default values
- **Macros** &mdash; `defmacro` with `quote` / `unquote`
- **Structs** &mdash; `defstruct` with field types, defaults, and inheritance
- **Enums** &mdash; `defenum` with named variants
- **Type system** &mdash; primitives (`i8`&ndash;`i64`, `u8`&ndash;`u64`, `f16`&ndash;`f64`, `Bool`, `String`, `Atom`, `Nil`, `Never`), user-defined types, union types, tuple/list/map/function types, parameterized types, `type` and `opaque` aliases
- **Expressions** &mdash; arithmetic, comparison, logical (`and`/`or`/`not`), string concatenation (`<>`), pipe (`|>`), unwrap (`!`), type annotations (`::`)
- **Control flow** &mdash; `if`/`else`, `case` with pattern matching, `cond`, `with`/`<-`
- **Literals** &mdash; integers (decimal, hex, binary, octal, underscores), floats, strings with `#{}` interpolation, atoms (`:name`), booleans, `nil`, tuples, lists (with cons `|`), maps (`%{}`), binaries (`<<>>`)
- **Patterns** &mdash; wildcard (`_`), pin (`^var`), tuple/list/map destructuring
- **Module system** &mdash; `import` (with `only:` / `except:`), `alias`
- **Comments** &mdash; `# ...`

## Usage

### Requirements

- [Node.js](https://nodejs.org/)
- [tree-sitter CLI](https://github.com/tree-sitter/tree-sitter/blob/master/cli/README.md)

### Install

```sh
git clone https://github.com/bcardarella/tree-sitter-zap.git
cd tree-sitter-zap
npm install
```

### Generate the parser

```sh
npx tree-sitter generate
```

### Parse a file

```sh
npx tree-sitter parse path/to/file.zap
```

### Run tests

```sh
npx tree-sitter test
```

### Syntax highlighting

```sh
npx tree-sitter highlight path/to/file.zap
```

## Example

Given this Zap source:

```zap
defmodule Factorial do
  def factorial(0 :: i64) :: i64 do
    1
  end

  def factorial(n :: i64) :: i64 do
    n * factorial(n - 1)
  end

  def main() do
    factorial(10)
  end
end
```

The parser produces:

```
(source_file
  (module_definition
    name: (module_path (module_name))
    (function_definition
      name: (identifier)
      (parameter_list
        (parameter
          name: (integer)
          type: (type_expression (type_name))))
      return_type: (type_expression (type_name))
      body: (body (integer)))
    (function_definition
      name: (identifier)
      (parameter_list
        (parameter
          name: (identifier)
          type: (type_expression (type_name))))
      return_type: (type_expression (type_name))
      body: (body
        (binary_expression
          (identifier)
          (multiplicative_operator)
          (function_call
            name: (identifier)
            (argument_list
              (binary_expression
                (identifier)
                (additive_operator)
                (integer)))))))
    (function_definition
      name: (identifier)
      body: (body
        (function_call
          name: (identifier)
          (argument_list (integer)))))))
```

## Project Structure

```
tree-sitter-zap/
  grammar.js             # Grammar definition
  queries/highlights.scm # Syntax highlighting queries
  test/corpus/           # Test cases
  src/                   # Generated parser (C)
  tree-sitter.json       # Parser metadata
```
