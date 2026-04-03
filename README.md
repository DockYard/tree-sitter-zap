# tree-sitter-zap

A [tree-sitter](https://tree-sitter.github.io/) grammar for the [Zap](https://github.com/bcardarella/zap) programming language.

## Supported Syntax

- **Modules** &mdash; `pub module` / `module`, module inheritance with `extends`, dotted module paths
- **Functions** &mdash; `pub fn` / `fn` with typed parameters, pattern matching, guard clauses (`if`), default values, return types (`->`)
- **Macros** &mdash; `pub macro` / `macro` with `quote` / `unquote`
- **Structs** &mdash; `pub struct` with field types, defaults, inheritance (`extends`), dotted names
- **Unions** &mdash; `pub union` with named variants and optional typed payloads
- **Type system** &mdash; primitives (`i8`&ndash;`i64`, `u8`&ndash;`u64`, `f16`&ndash;`f64`, `Bool`, `String`, `Atom`, `Nil`, `Never`), user-defined types, union types (`A | B`), tuple/list/map/function types, parameterized types, `type` and `opaque` aliases
- **Expressions** &mdash; arithmetic, comparison, logical (`and`/`or`/`not`), string concatenation (`<>`), pipe (`|>`), error pipe (`~>`), unwrap (`!`), type annotations (`::`)
- **Control flow** &mdash; `if`/`else`, `case` with pattern matching, `cond`, `with`/`<-`
- **Literals** &mdash; integers (decimal, hex, binary, octal, underscores), floats, strings with `#{}` interpolation, atoms (`:name`), booleans, `nil`, tuples, lists (with cons `|`), maps (`%{}`), struct expressions (`%Module{}`), binaries (`<<>>`)
- **Patterns** &mdash; wildcard (`_`), pin (`^var`), tuple/list/map/struct destructuring
- **Attributes** &mdash; `@name :: Type = value` declarations, `@name` references, `@name()` intrinsic calls
- **Ownership** &mdash; `shared`, `unique`, `borrowed` parameter modifiers
- **Module system** &mdash; `import` (with `only:` / `except:`), `alias` (with `as:`)
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
pub module Factorial {
  pub fn factorial(0 :: i64) -> i64 {
    1
  }

  pub fn factorial(n :: i64) -> i64 {
    n * factorial(n - 1)
  }

  pub fn main(_args :: [String]) -> String {
    Factorial.factorial(10)
    |> Integer.to_string()
    |> IO.puts()
  }
}
```

The parser produces:

```
(source_file
  (module_definition
    (visibility_modifier)
    name: (module_path (module_name))
    (function_definition
      (visibility_modifier)
      name: (identifier)
      (parameter_list
        (parameter
          pattern: (integer)
          type: (type_expression (type_name))))
      return_type: (type_expression (type_name))
      body: (body (integer)))
    (function_definition
      (visibility_modifier)
      name: (identifier)
      (parameter_list
        (parameter
          pattern: (identifier)
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
      (visibility_modifier)
      name: (identifier)
      (parameter_list
        (parameter
          pattern: (identifier)
          type: (type_expression
            (list_type (type_expression (type_name))))))
      return_type: (type_expression (type_name))
      body: (body
        (pipe_expression
          (pipe_expression
            (qualified_call
              module: (module_path (module_name))
              name: (identifier)
              (argument_list (integer)))
            (qualified_call
              module: (module_path (module_name))
              name: (identifier)))
          (qualified_call
            module: (module_path (module_name))
            name: (identifier)))))))
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
