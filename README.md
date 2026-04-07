# tree-sitter-zap

A [tree-sitter](https://tree-sitter.github.io/) grammar for the [Zap](https://github.com/bcardarella/zap) programming language.

## Supported Syntax

- **Modules** &mdash; `pub module` / `module`, module inheritance with `extends`, dotted module paths
- **Functions** &mdash; `pub fn` / `fn` with typed parameters, pattern matching, guard clauses (`if`), default values, return types (`->`)
- **Macros** &mdash; `pub macro` / `macro` with `quote` / `unquote` / `unquote_splicing`
- **Structs** &mdash; `pub struct` with field types, defaults, inheritance (`extends`), dotted names
- **Unions** &mdash; `pub union` with named variants and optional typed payloads
- **Type system** &mdash; primitives (`i8`&ndash;`i64`, `u8`&ndash;`u64`, `f16`&ndash;`f64`, `Bool`, `String`, `Atom`, `Nil`, `Never`), user-defined types, union types (`A | B`), tuple/list/map/function types, parameterized types, `type` and `opaque` aliases
- **Expressions** &mdash; arithmetic, comparison, logical (`and`/`or`/`not`), string concatenation (`<>`), pipe (`|>`), error pipe (`~>`), unwrap (`!`), type annotations (`::`)
- **Control flow** &mdash; `if`/`else`, `case` with pattern matching, `cond`, `for` comprehensions, `with`/`<-`
- **Literals** &mdash; integers (decimal, hex, binary, octal, underscores), floats, strings with `#{}` interpolation, heredocs (`"""`), sigils (`~s"..."`, `~w"""..."""`), atoms (`:name`), booleans, `nil`, tuples, lists (with cons `|`), maps (`%{}`), struct expressions (`%Module{}`), binaries (`<<>>`)
- **Patterns** &mdash; wildcard (`_`), pin (`^var`), tuple/list/map/struct destructuring
- **Attributes** &mdash; `@name :: Type = value` and `@name = value` declarations, `@name` references, `@name()` intrinsic calls
- **Documentation** &mdash; `@doc` / `@moduledoc` with heredoc content, markdown injection for editor highlighting
- **Ownership** &mdash; `shared`, `unique`, `borrowed` parameter modifiers
- **Module system** &mdash; `import` (with `only:` / `except:`), `alias` (with `as:`), `use`
- **Comments** &mdash; `# ...`

## Neovim

### Setup

Add to your nvim-treesitter config:

```lua
{
  "nvim-treesitter/nvim-treesitter",
  opts = function(_, opts)
    local parser_configs = require("nvim-treesitter.parsers").get_parser_configs()

    parser_configs.zap = {
      install_info = {
        url = "https://github.com/DockYard/tree-sitter-zap",
        files = { "src/parser.c" },
        branch = "main",
      },
      filetype = "zap",
    }

    opts.ensure_installed = opts.ensure_installed or {}
    vim.list_extend(opts.ensure_installed, { "zap" })
  end,
}
```

Add filetype detection in `ftdetect/zap.lua`:

```lua
vim.filetype.add({ extension = { zap = "zap" } })
```

Copy the query files to your neovim config:

```sh
mkdir -p ~/.config/nvim/queries/zap
cp queries/highlights.scm ~/.config/nvim/queries/zap/
cp queries/injections.scm ~/.config/nvim/queries/zap/
```

The injections query enables markdown syntax highlighting inside `@doc` and `@moduledoc` heredocs.

### Install the parser

```vim
:TSInstall zap
```

## Usage

### Requirements

- [Node.js](https://nodejs.org/)
- [tree-sitter CLI](https://github.com/tree-sitter/tree-sitter/blob/master/cli/README.md)

### Install

```sh
git clone https://github.com/DockYard/tree-sitter-zap.git
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
pub module Greeter {
  @moduledoc = """
    A simple greeter module.
    """

  @doc = """
    Returns a greeting string for the given name.
    """
  pub fn greet(name :: String) -> String {
    "Hello, " <> name <> "!"
  }

  pub fn main(_args :: [String]) -> String {
    greet("World")
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
    (attribute_declaration
      name: (identifier)
      value: (heredoc (heredoc_content)))
    (attribute_declaration
      name: (identifier)
      value: (heredoc (heredoc_content)))
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
          (binary_expression
            (string (string_content))
            (identifier))
          (string (string_content)))))
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
          (function_call
            name: (identifier)
            (argument_list (string (string_content))))
          (qualified_call
            module: (module_path (module_name))
            name: (identifier)))))))
```

## Project Structure

```
tree-sitter-zap/
  grammar.js               # Grammar definition
  queries/highlights.scm    # Syntax highlighting queries
  queries/injections.scm    # Language injection queries (markdown in docs)
  test/corpus/              # Test cases
  src/                      # Generated parser (C)
  tree-sitter.json          # Parser metadata
```
